/*
FILE: /script.js
Receipts — Player + Cylinder + Waveform + Share
*/

"use strict";

/* =========================
   Hardened Toast/Error Layer
   ========================= */
class ErrorHandler {
  constructor() {
    this.toastEl = document.getElementById("toast");
    this.toastMsgEl = document.getElementById("toastMsg");
    this.toastCloseEl = document.getElementById("toastClose");
    this.toastTimer = null;

    if (this.toastCloseEl) {
      this.toastCloseEl.addEventListener("click", () => this.hideToast());
    }

    window.addEventListener("error", (e) => {
      const msg = e?.message || "Unknown script error";
      this.showToast(`Error: ${msg}`);
    });

    window.addEventListener("unhandledrejection", (e) => {
      const msg = e?.reason instanceof Error ? e.reason.message : String(e?.reason || "Unknown async error");
      this.showToast(`Async: ${msg}`);
    });
  }

  showToast(message) {
    try {
      if (!this.toastEl || !this.toastMsgEl) return;
      this.toastMsgEl.textContent = message;
      this.toastEl.hidden = false;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.hideToast(), 4200);
    } catch {
      /* no-op */
    }
  }

  hideToast() {
    try {
      if (!this.toastEl) return;
      this.toastEl.hidden = true;
    } catch {
      /* no-op */
    }
  }

  attempt(fn, fallback) {
    try {
      return fn();
    } catch (err) {
      this.showToast(err instanceof Error ? err.message : "Operation failed");
      return typeof fallback === "function" ? fallback() : undefined;
    }
  }
}

const errorHandler = new ErrorHandler();

/* =========================
   Track Data (DROP-IN READY)
   =========================
   Add new songs by appending entries to TRACKS.
   - id must be unique (used for share URLs).
   - audioSrc can be a local file: "audio/my-song.mp3"
   - coverSrc can be local: "images/cover.jpg"
*/
const TRACKS = [
  {
    id: "ghost-room",
    title: "Ghost Room",
    album: "White Room Demos",
    year: "2026",
    audioSrc: "audio/ghost-room.mp3",
    coverSrc: "images/cover-01.jpg",
    lyrics: [
      "Placeholder lyrics.",
      "Replace this with your real words.",
      "Keep line breaks as separate strings for clean spacing.",
    ],
  },
  {
    id: "violet-static",
    title: "Violet Static",
    album: "White Room Demos",
    year: "2026",
    audioSrc: "audio/violet-static.mp3",
    coverSrc: "images/cover-02.jpg",
    lyrics: [
      "Placeholder lyrics.",
      "This drawer is intentionally minimal.",
    ],
  },
  {
    id: "receipt-iii",
    title: "Receipt III",
    album: "Receipts (EP) — Placeholder",
    year: "2026",
    audioSrc: "audio/receipt-iii.mp3",
    coverSrc: "images/cover-03.jpg",
    lyrics: [
      "Placeholder lyrics.",
      "Drop in future songs anytime.",
    ],
  },
];

/* =========================
   Small Utils
   ========================= */
function $(sel, root = document) {
  return root.querySelector(sel);
}
function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function safeUrlFromLocation() {
  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

/* =========================
   Storage
   ========================= */
const Storage = {
  key: "receipts_favs_v1",
  getFavs() {
    return errorHandler.attempt(() => {
      const raw = localStorage.getItem(Storage.key);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    }, () => new Set());
  },
  setFavs(set) {
    errorHandler.attempt(() => {
      localStorage.setItem(Storage.key, JSON.stringify(Array.from(set)));
    });
  },
};

/* =========================
   Audio Engine + Visuals
   ========================= */
class Player {
  constructor() {
    this.audio = $("#audio");
    this.canvas = $("#waveCanvas");
    this.ctx = this.canvas?.getContext("2d") || null;

    this.scrub = $("#scrubRange");
    this.timeCurrent = $("#timeCurrent");
    this.timeTotal = $("#timeTotal");

    this.playBtn = $("#playBtn");
    this.playLabel = $("#playLabel");
    this.prevBtn = $("#prevBtn");
    this.nextBtn = $("#nextBtn");

    this.trackTitle = $("#trackTitle");
    this.trackMeta = $("#trackMeta");
    this.nowHint = $("#nowHint");

    this.lyricsBtn = $("#lyricsBtn");
    this.lyricsDrawer = $("#lyricsDrawer");
    this.lyricsBody = $("#lyricsBody");
    this.lyricsClose = $("#lyricsClose");

    this.shareTrackBtn = $("#shareTrackBtn");
    this.shareRow = $("#shareRow");
    this.copyLinkBtn = $("#copyLinkBtn");
    this.nativeShareBtn = $("#nativeShareBtn");

    this.favBtn = $("#favBtn");

    this.cylinder = $("#cylinder");

    this.albumChips = $("#albumChips");
    this.tracklist = $("#tracklist");

    this.deepModeBtn = $("#deepModeBtn");
    this.toggleAmbient = $("#toggleAmbient");

    this.activeIndex = -1;

    this.favs = Storage.getFavs();
    this.filterMode = "all";
    this.albumMode = "all";

    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.freq = null;

    this.visualRaf = null;
    this.ambientOn = true;

    this.cylPanels = 14;
    this.cylIdle = 0;
    this.cylTargetDeg = 0;

    this._bind();
    this._renderAlbums();
    this._renderTracks();
    this._buildCylinder();

    this._preloaderBoot().then(() => {
      this._bootFromHash();
      $("#year").textContent = String(new Date().getFullYear());
    });
  }

  _bind() {
    if (!this.audio) return;

    this.playBtn?.addEventListener("click", () => this.togglePlay());
    this.prevBtn?.addEventListener("click", () => this.prev());
    this.nextBtn?.addEventListener("click", () => this.next());

    this.audio.addEventListener("loadedmetadata", () => this._syncTimes());
    this.audio.addEventListener("timeupdate", () => this._syncTimes());
    this.audio.addEventListener("ended", () => this.next());

    this.scrub?.addEventListener("input", () => {
      if (!this.audio.duration) return;
      const v = Number(this.scrub.value) / 1000;
      this.audio.currentTime = clamp(v * this.audio.duration, 0, this.audio.duration);
      this._syncTimes();
    });

    this.lyricsBtn?.addEventListener("click", () => this.toggleLyrics());
    this.lyricsClose?.addEventListener("click", () => this.closeLyrics());

    this.shareTrackBtn?.addEventListener("click", () => this.toggleShareRow());
    this.copyLinkBtn?.addEventListener("click", () => this.copyShareLink());
    this.nativeShareBtn?.addEventListener("click", () => this.nativeShare());

    this.favBtn?.addEventListener("click", () => this.toggleFavorite());

    this.deepModeBtn?.addEventListener("click", () => {
      const pressed = this.deepModeBtn.getAttribute("aria-pressed") === "true";
      this.deepModeBtn.setAttribute("aria-pressed", String(!pressed));
      document.body.classList.toggle("deep-mode", !pressed);
    });

    this.toggleAmbient?.addEventListener("click", () => {
      const pressed = this.toggleAmbient.getAttribute("aria-pressed") === "true";
      this.toggleAmbient.setAttribute("aria-pressed", String(!pressed));
      this.ambientOn = pressed;
      if (!this.ambientOn) this._setCylinderRotation(this.cylTargetDeg);
    });

    // smooth anchor, slight topbar fade
    $all(".nav-link").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        e.preventDefault();
        const el = document.getElementById(href.slice(1));
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // share site
    $("#shareSiteBtn")?.addEventListener("click", () => {
      const url = safeUrlFromLocation();
      if (!url) return;
      url.hash = "#music";
      this._copyText(url.toString(), "Copied room link.");
    });

    // contact form: placeholder (no network)
    $("#contactForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      errorHandler.showToast("Wire this to Formspree later (drop-in).");
    });
  }

  async _preloaderBoot() {
    const pre = $(".preloader");
    const pct = $("#preloaderPercent");
    if (!pre || !pct) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const steps = reduce ? 30 : 70;

    for (let i = 0; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 16));
      const n = Math.round((i / steps) * 100);
      pct.textContent = `${n}%`;
    }

    pre.classList.add("is-hidden");
    setTimeout(() => (pre.style.display = "none"), 560);
  }

  _renderAlbums() {
    if (!this.albumChips) return;

    const albums = Array.from(new Set(TRACKS.map((t) => t.album)));
    const all = ["all", ...albums];

    this.albumChips.innerHTML = all
      .map((a) => {
        const label = a === "all" ? "Albums" : a;
        return `<button class="chip hole-hover ${a === "all" ? "is-active" : ""}" type="button" data-album="${this._esc(
          a
        )}"><span class="mono">${this._esc(label)}</span></button>`;
      })
      .join("");

    $all("[data-album]", this.albumChips).forEach((btn) => {
      btn.addEventListener("click", () => {
        $all("[data-album]", this.albumChips).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        this.albumMode = btn.dataset.album || "all";
        this._renderTracks();
      });
    });

    // filter row
    $all("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $all("[data-filter]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        this.filterMode = btn.dataset.filter || "all";
        this._renderTracks();
      });
    });
  }

  _renderTracks() {
    if (!this.tracklist) return;

    const filtered = TRACKS.filter((t) => {
      if (this.filterMode === "favorites" && !this.favs.has(t.id)) return false;
      if (this.albumMode !== "all" && t.album !== this.albumMode) return false;
      return true;
    });

    this.tracklist.innerHTML =
      filtered
        .map((t) => {
          const playing = this.activeIndex >= 0 && TRACKS[this.activeIndex]?.id === t.id;
          const fav = this.favs.has(t.id);
          return `
            <div class="track-item hole-hover ${playing ? "is-playing" : ""}" role="button" tabindex="0" data-track="${this._esc(t.id)}">
              <div class="track-cover" aria-hidden="true">
                <img src="${this._esc(t.coverSrc)}" alt="" loading="lazy" />
              </div>
              <div>
                <div class="track-name">${this._esc(t.title)}</div>
                <div class="track-sub mono">${this._esc(t.album)} · ${this._esc(t.year)}</div>
              </div>
              <div class="track-actions">
                <button class="small hole-hover" type="button" data-fav="${this._esc(t.id)}" aria-pressed="${fav}">
                  <span class="mono">${fav ? "FAV✓" : "FAV"}</span>
                </button>
                <button class="small hole-hover" type="button" data-share="${this._esc(t.id)}">
                  <span class="mono">LINK</span>
                </button>
              </div>
            </div>
          `;
        })
        .join("") || `<div class="muted mono" style="padding: 0.6rem 0.4rem;">No tracks in this view.</div>`;

    $all(".track-item", this.tracklist).forEach((row) => {
      const tid = row.dataset.track;
      row.addEventListener("click", () => this.loadById(tid, { autoplay: true }));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.loadById(tid, { autoplay: true });
        }
      });
    });

    $all("[data-fav]", this.tracklist).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const tid = btn.dataset.fav;
        this._toggleFavId(tid);
      });
    });

    $all("[data-share]", this.tracklist).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const tid = btn.dataset.share;
        this._copyTrackLink(tid);
      });
    });
  }

  _buildCylinder() {
    if (!this.cylinder) return;

    const panels = this.cylPanels;
    const radius = 240;
    const step = 360 / panels;

    this.cylinder.innerHTML = "";

    for (let i = 0; i < panels; i++) {
      const t = TRACKS[i % TRACKS.length];
      const panel = document.createElement("div");
      panel.className = "cyl-panel";
      panel.style.transform = `translate(-50%, -50%) rotateY(${i * step}deg) translateZ(${radius}px)`;

      const img = document.createElement("img");
      img.className = "cyl-img";
      img.loading = "lazy";
      img.alt = "";
      img.src = t.coverSrc;

      img.addEventListener("error", () => {
        img.style.display = "none";
        panel.style.background = "rgba(10,10,14,0.94)";
      });

      panel.appendChild(img);
      this.cylinder.appendChild(panel);
    }
  }

  _setCylinderRotation(deg) {
    if (!this.cylinder) return;
    this.cylinder.style.setProperty("--cyl-rot", `${deg}deg`);
  }

  _tickCylinder() {
    if (!this.ambientOn) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    this.cylIdle += 0.15;
    const wobble = Math.sin(this.cylIdle * 0.015) * 6;
    const drift = this.cylIdle * 0.02;

    this._setCylinderRotation(this.cylTargetDeg + wobble + drift);
  }

  _bootFromHash() {
    const url = safeUrlFromLocation();
    const params = new URLSearchParams(url?.hash?.replace(/^#/, "") || "");
    const trackId = params.get("track");
    if (trackId) {
      const ok = this.loadById(trackId, { autoplay: false });
      if (ok) return;
    }
    this._syncUIEmpty();
  }

  _syncUIEmpty() {
    if (this.trackTitle) this.trackTitle.textContent = "—";
    if (this.trackMeta) this.trackMeta.textContent = "—";
    if (this.nowHint) this.nowHint.textContent = "select a song";
    if (this.playLabel) this.playLabel.textContent = "PLAY";
    if (this.timeCurrent) this.timeCurrent.textContent = "0:00";
    if (this.timeTotal) this.timeTotal.textContent = "0:00";
    if (this.scrub) this.scrub.value = "0";
    this._drawIdleCanvas();
  }

  loadById(id, { autoplay } = { autoplay: true }) {
    const idx = TRACKS.findIndex((t) => t.id === id);
    if (idx < 0) {
      errorHandler.showToast("Track not found.");
      return false;
    }
    this.loadIndex(idx, { autoplay });
    return true;
  }

  loadIndex(idx, { autoplay } = { autoplay: true }) {
    if (!this.audio) return;
    idx = clamp(idx, 0, TRACKS.length - 1);
    this.activeIndex = idx;

    const t = TRACKS[idx];

    this.audio.src = t.audioSrc;
    this.audio.load();

    if (this.trackTitle) this.trackTitle.textContent = t.title;
    if (this.trackMeta) this.trackMeta.textContent = `${t.album} · ${t.year}`;
    if (this.nowHint) this.nowHint.textContent = t.title;

    // cylinder “roll in”
    const step = 360 / this.cylPanels;
    this.cylTargetDeg = -(idx * step) - 30;
    this._setCylinderRotation(this.cylTargetDeg);

    // lyrics
    this._setLyrics(t);

    // share url hash
    this._setHashTrack(t.id);

    // favorites state
    this._syncFavBtn();

    // rerender highlights
    this._renderTracks();

    // start visuals
    this._ensureAudioGraph();
    this._startVisualLoop();

    if (autoplay) {
      this.play().catch(() => {
        errorHandler.showToast("Tap play to start audio.");
      });
    } else {
      this.pause();
    }
  }

  _setHashTrack(id) {
    const url = safeUrlFromLocation();
    if (!url) return;
    const p = new URLSearchParams();
    p.set("track", id);
    url.hash = `#${p.toString()}`;
    history.replaceState(null, "", url.toString());
  }

  _syncFavBtn() {
    const t = TRACKS[this.activeIndex];
    const on = t ? this.favs.has(t.id) : false;
    this.favBtn?.setAttribute("aria-pressed", String(on));
  }

  _toggleFavId(id) {
    if (!id) return;
    if (this.favs.has(id)) this.favs.delete(id);
    else this.favs.add(id);
    Storage.setFavs(this.favs);

    if (TRACKS[this.activeIndex]?.id === id) this._syncFavBtn();
    this._renderTracks();
    errorHandler.showToast(this.favs.has(id) ? "Favorited." : "Unfavorited.");
  }

  toggleFavorite() {
    const t = TRACKS[this.activeIndex];
    if (!t) {
      errorHandler.showToast("Select a track first.");
      return;
    }
    this._toggleFavId(t.id);
  }

  toggleLyrics() {
    const expanded = this.lyricsBtn?.getAttribute("aria-expanded") === "true";
    if (expanded) this.closeLyrics();
    else this.openLyrics();
  }

  openLyrics() {
    if (!this.lyricsDrawer) return;
    this.lyricsDrawer.hidden = false;
    this.lyricsBtn?.setAttribute("aria-expanded", "true");
  }

  closeLyrics() {
    if (!this.lyricsDrawer) return;
    this.lyricsDrawer.hidden = true;
    this.lyricsBtn?.setAttribute("aria-expanded", "false");
  }

  _setLyrics(track) {
    if (!this.lyricsBody) return;
    const lines = Array.isArray(track?.lyrics) ? track.lyrics : [];
    if (!lines.length) {
      this.lyricsBody.innerHTML = `<p class="muted">No lyrics added yet.</p>`;
      return;
    }
    this.lyricsBody.innerHTML = lines.map((l) => `<p>${this._esc(l)}</p>`).join("");
  }

  toggleShareRow() {
    if (!this.shareRow) return;
    this.shareRow.hidden = !this.shareRow.hidden;
  }

  copyShareLink() {
    const t = TRACKS[this.activeIndex];
    if (!t) {
      errorHandler.showToast("Select a track first.");
      return;
    }
    this._copyTrackLink(t.id);
  }

  _copyTrackLink(id) {
    const url = safeUrlFromLocation();
    if (!url) return;
    const p = new URLSearchParams();
    p.set("track", id);
    url.hash = `#${p.toString()}`;
    this._copyText(url.toString(), "Copied track link.");
  }

  async nativeShare() {
    const t = TRACKS[this.activeIndex];
    if (!t) {
      errorHandler.showToast("Select a track first.");
      return;
    }
    const url = safeUrlFromLocation();
    if (!url) return;
    const p = new URLSearchParams();
    p.set("track", t.id);
    url.hash = `#${p.toString()}`;

    const payload = {
      title: `Receipts — ${t.title}`,
      text: `Receipts — ${t.title}`,
      url: url.toString(),
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        errorHandler.showToast("Shared.");
      } catch {
        /* user cancelled */
      }
      return;
    }

    this._copyText(payload.url, "Share not supported here — link copied.");
  }

  async _copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      errorHandler.showToast(okMsg);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      errorHandler.showToast(okMsg);
    }
  }

  async play() {
    if (!this.audio) return;
    await this.audio.play();
    if (this.playLabel) this.playLabel.textContent = "PAUSE";
    this._startVisualLoop();
  }

  pause() {
    if (!this.audio) return;
    this.audio.pause();
    if (this.playLabel) this.playLabel.textContent = "PLAY";
  }

  togglePlay() {
    if (!this.audio) return;
    if (this.activeIndex < 0) {
      this.loadIndex(0, { autoplay: true });
      return;
    }
    if (this.audio.paused) this.play().catch(() => errorHandler.showToast("Tap play to start audio."));
    else this.pause();
  }

  prev() {
    if (this.activeIndex < 0) {
      this.loadIndex(0, { autoplay: true });
      return;
    }
    const i = (this.activeIndex - 1 + TRACKS.length) % TRACKS.length;
    this.loadIndex(i, { autoplay: true });
  }

  next() {
    if (this.activeIndex < 0) {
      this.loadIndex(0, { autoplay: true });
      return;
    }
    const i = (this.activeIndex + 1) % TRACKS.length;
    this.loadIndex(i, { autoplay: true });
  }

  _syncTimes() {
    if (!this.audio || !this.scrub) return;

    const dur = this.audio.duration || 0;
    const cur = this.audio.currentTime || 0;

    if (this.timeCurrent) this.timeCurrent.textContent = formatTime(cur);
    if (this.timeTotal) this.timeTotal.textContent = formatTime(dur);

    if (dur > 0) {
      const v = clamp(cur / dur, 0, 1);
      this.scrub.value = String(Math.round(v * 1000));
    }
  }

  _ensureAudioGraph() {
    if (this.audioCtx || !this.audio) return;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;

      this.audioCtx = new Ctx();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.84;

      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    } catch {
      this.audioCtx = null;
      this.analyser = null;
      this.sourceNode = null;
      this.freq = null;
    }
  }

  _startVisualLoop() {
    if (!this.canvas || !this.ctx) return;
    if (this.visualRaf) return;

    const loop = () => {
      this._draw();
      this._tickCylinder();
      this.visualRaf = requestAnimationFrame(loop);
    };

    this.visualRaf = requestAnimationFrame(loop);
  }

  _drawIdleCanvas() {
    if (!this.canvas || !this.ctx) return;
    this._resizeCanvasToDisplay();
    const { width: w, height: h } = this.canvas;
    const g = this.ctx;

    g.clearRect(0, 0, w, h);

    // faint “room pulse”
    g.globalAlpha = 0.7;
    const grad = g.createRadialGradient(w * 0.45, h * 0.35, 10, w * 0.45, h * 0.35, w * 0.9);
    grad.addColorStop(0, "rgba(123,115,255,0.10)");
    grad.addColorStop(1, "rgba(10,10,14,0.00)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    g.globalAlpha = 1;
    g.strokeStyle = "rgba(10,10,14,0.10)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w * 0.08, h * 0.55);
    g.quadraticCurveTo(w * 0.42, h * 0.42, w * 0.92, h * 0.52);
    g.stroke();
  }

  _draw() {
    if (!this.canvas || !this.ctx || !this.audio) return;

    this._resizeCanvasToDisplay();

    const g = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    g.clearRect(0, 0, w, h);

    // background glow
    const bg = g.createRadialGradient(w * 0.42, h * 0.35, 10, w * 0.42, h * 0.35, w * 0.95);
    bg.addColorStop(0, "rgba(123,115,255,0.11)");
    bg.addColorStop(1, "rgba(10,10,14,0.00)");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    // progress fill (as requested: “filling the waveform as it plays”)
    const dur = this.audio.duration || 0;
    const cur = this.audio.currentTime || 0;
    const p = dur > 0 ? clamp(cur / dur, 0, 1) : 0;

    g.fillStyle = "rgba(10,10,14,0.05)";
    g.fillRect(0, 0, w, h);

    g.fillStyle = "rgba(10,10,14,0.09)";
    g.fillRect(0, 0, w * p, h);

    // waveform-ish line derived from analyser (frequency bins)
    let bins = null;
    if (this.analyser && this.freq) {
      this.analyser.getByteFrequencyData(this.freq);
      bins = this.freq;
    }

    const mid = h * 0.46;
    const amp = h * 0.22;

    g.lineWidth = 2.3;
    g.strokeStyle = "rgba(10,10,14,0.82)";
    g.beginPath();

    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const idx = bins ? Math.floor((i / steps) * (bins.length - 1)) : i;
      const v = bins ? bins[idx] / 255 : 0.12 + 0.08 * Math.sin((Date.now() * 0.001) + i * 0.09);
      const shaped = Math.pow(v, 1.15);
      const y = mid + Math.sin(i * 0.19 + (Date.now() * 0.002)) * (amp * shaped);

      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();

    // violet highlight line at progress boundary
    g.strokeStyle = "rgba(123,115,255,0.55)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w * p, h * 0.12);
    g.lineTo(w * p, h * 0.88);
    g.stroke();

    // subtle corner ticks
    g.globalAlpha = 0.55;
    g.strokeStyle = "rgba(10,10,14,0.12)";
    g.lineWidth = 1;
    g.strokeRect(w * 0.02, h * 0.08, w * 0.96, h * 0.84);
    g.globalAlpha = 1;
  }

  _resizeCanvasToDisplay() {
    const c = this.canvas;
    if (!c) return;

    const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = c.clientWidth || 1;
    const cssH = Math.round(cssW * (240 / 1400));

    const wantW = Math.floor(cssW * ratio);
    const wantH = Math.floor(cssH * ratio);

    if (c.width !== wantW || c.height !== wantH) {
      c.width = wantW;
      c.height = wantH;
    }
  }

  _esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

/* =========================
   Boot
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  errorHandler.attempt(() => {
    // If you want to keep your old file URLs, just set TRACKS[*].audioSrc accordingly.
    // This build assumes you'll add: /audio/*.mp3 and /images/*.jpg later.
    new Player();
  });
});
