/* FILE: /script.js */
"use strict";

/* =========================
   Toast / Hardened Errors
   ========================= */
class Toast {
  constructor() {
    this.el = document.getElementById("toast");
    this.msg = document.getElementById("toastMsg");
    this.x = document.getElementById("toastX");
    this.t = null;

    this.x?.addEventListener("click", () => this.hide());

    window.addEventListener("error", (e) => this.show(`Error: ${e?.message || "script error"}`));
    window.addEventListener("unhandledrejection", (e) => {
      const r = e?.reason instanceof Error ? e.reason.message : String(e?.reason || "async error");
      this.show(`Async: ${r}`);
    });
  }

  show(m) {
    try {
      if (!this.el || !this.msg) return;
      this.msg.textContent = m;
      this.el.hidden = false;
      clearTimeout(this.t);
      this.t = setTimeout(() => this.hide(), 4200);
    } catch {
      /* no-op */
    }
  }

  hide() {
    try {
      if (!this.el) return;
      this.el.hidden = true;
    } catch {
      /* no-op */
    }
  }
}

const toast = new Toast();

/* =========================
   Tracks (DROP-IN READY)
   =========================
   Put files in:
   - /audio/*.mp3
   - /images/*.jpg
*/
const TRACKS = [
  {
    id: "ghost-room",
    title: "Ghost Room",
    subtitle: "White Room Demos · 2026",
    audioSrc: "audio/ghost-room.mp3",
    coverSrc: "images/cover-01.jpg",
    lyrics: ["Placeholder lyrics.", "Replace with your real words."],
  },
  {
    id: "violet-static",
    title: "Violet Static",
    subtitle: "White Room Demos · 2026",
    audioSrc: "audio/violet-static.mp3",
    coverSrc: "images/cover-02.jpg",
    lyrics: ["Placeholder lyrics.", "Keep each line as a separate string."],
  },
  {
    id: "receipt-iii",
    title: "Receipt III",
    subtitle: "Receipts (EP) · 2026",
    audioSrc: "audio/receipt-iii.mp3",
    coverSrc: "images/cover-03.jpg",
    lyrics: ["Placeholder lyrics.", "Add more tracks anytime."],
  },
];

/* =========================
   Helpers
   ========================= */
function $(s, r = document) { return r.querySelector(s); }
function $all(s, r = document) { return Array.from(r.querySelectorAll(s)); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function esc(x) {
  return String(x ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function safeUrl() {
  try { return new URL(window.location.href); }
  catch { return null; }
}

/* =========================
   Storage
   ========================= */
const Store = {
  k: "receipts_favs_v2",
  get() {
    try {
      const raw = localStorage.getItem(Store.k);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  },
  set(set) {
    try {
      localStorage.setItem(Store.k, JSON.stringify(Array.from(set)));
    } catch {
      /* no-op */
    }
  },
};

/* =========================
   Player (minimal, art-first)
   ========================= */
class Player {
  constructor() {
    this.audio = $("#audio");
    this.c = $("#waveC");
    this.g = this.c?.getContext("2d") || null;

    this.coverImg = $("#coverImg");
    this.title = $("#title");
    this.meta = $("#meta");
    this.nowText = $("#nowText");

    this.playBtn = $("#play");
    this.playLab = $("#playLab");
    this.prevBtn = $("#prev");
    this.nextBtn = $("#next");

    this.scrub = $("#scrub");
    this.tCur = $("#tCur");
    this.tDur = $("#tDur");

    this.rows = $("#rows");

    this.favBtn = $("#favBtn");
    this.shareBtn = $("#shareBtn");
    this.shareline = $("#shareline");
    this.copyLink = $("#copyLink");
    this.nativeShare = $("#nativeShare");

    this.lyricsBtn = $("#lyricsBtn");
    this.lyrics = $("#lyrics");
    this.lyricsBody = $("#lyricsBody");
    this.lyricsClose = $("#lyricsClose");

    this.deepBtn = $("#deepBtn");
    this.shareRoomBtn = $("#shareRoomBtn");
    this.shareSiteBtn = $("#shareSiteBtn");
    this.shareRoomBtn2 = $("#shareRoomBtn");
    this.shareSiteBtn2 = $("#shareSiteBtn");

    this.pre = $("#pre");
    this.prePct = $("#prePct");
    this.totem = $("#totem");

    this.favs = Store.get();
    this.filter = "all";
    this.idx = -1;

    this.ac = null;
    this.an = null;
    this.src = null;
    this.buf = null;

    this.raf = null;
    this.phase = 0;

    this._bind();
    this._renderList();
    this._preload().then(() => this._bootFromHash());
    $("#yr").textContent = String(new Date().getFullYear());
  }

  _bind() {
    this.playBtn?.addEventListener("click", () => this.toggle());
    this.prevBtn?.addEventListener("click", () => this.prev());
    this.nextBtn?.addEventListener("click", () => this.next());

    this.audio?.addEventListener("loadedmetadata", () => this._syncTime());
    this.audio?.addEventListener("timeupdate", () => this._syncTime());
    this.audio?.addEventListener("ended", () => this.next());

    this.scrub?.addEventListener("input", () => {
      if (!this.audio?.duration) return;
      const v = Number(this.scrub.value) / 1000;
      this.audio.currentTime = clamp(v * this.audio.duration, 0, this.audio.duration);
      this._syncTime();
    });

    $all("[data-filter]").forEach((b) => {
      b.addEventListener("click", () => {
        $all("[data-filter]").forEach((x) => x.classList.remove("is"));
        b.classList.add("is");
        this.filter = b.dataset.filter || "all";
        this._renderList();
      });
    });

    this.favBtn?.addEventListener("click", () => this.toggleFav());
    this.shareBtn?.addEventListener("click", () => this.toggleShare());
    this.copyLink?.addEventListener("click", () => this.copyTrackLink());
    this.nativeShare?.addEventListener("click", () => this.nativeShare());

    this.lyricsBtn?.addEventListener("click", () => this.toggleLyrics());
    this.lyricsClose?.addEventListener("click", () => this.closeLyrics());

    this.deepBtn?.addEventListener("click", () => {
      const on = document.body.classList.toggle("deep");
      this.deepBtn.setAttribute("aria-pressed", String(on));
      this._drawIdle();
    });

    const shareRoom = () => {
      const u = safeUrl();
      if (!u) return;
      u.hash = "#music";
      this._copy(u.toString(), "Copied room link.");
    };

    this.shareRoomBtn?.addEventListener("click", shareRoom);
    this.shareSiteBtn?.addEventListener("click", shareRoom);

    window.addEventListener("hashchange", () => this._bootFromHash());
  }

  async _preload() {
    if (!this.pre || !this.prePct) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const steps = reduce ? 30 : 70;

    for (let i = 0; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 16));
      this.prePct.textContent = `${Math.round((i / steps) * 100)}%`;
    }

    this.pre.classList.add("is-off");
    setTimeout(() => (this.pre.style.display = "none"), 560);
  }

  _bootFromHash() {
    const u = safeUrl();
    if (!u) return this._idleUI();

    const raw = u.hash.replace(/^#/, "");
    const p = new URLSearchParams(raw);
    const id = p.get("track");

    if (id) {
      const ok = this.loadById(id, { autoplay: false });
      if (ok) return;
    }

    this._idleUI();
  }

  _idleUI() {
    if (this.title) this.title.textContent = "—";
    if (this.meta) this.meta.textContent = "—";
    if (this.nowText) this.nowText.textContent = "select a track";
    if (this.playLab) this.playLab.textContent = "PLAY";
    if (this.tCur) this.tCur.textContent = "0:00";
    if (this.tDur) this.tDur.textContent = "0:00";
    if (this.scrub) this.scrub.value = "0";
    if (this.coverImg) this.coverImg.removeAttribute("src");
    this._drawIdle();
  }

  _renderList() {
    if (!this.rows) return;

    const items = TRACKS.filter((t) => (this.filter === "favorites" ? this.favs.has(t.id) : true));

    this.rows.innerHTML =
      items
        .map((t) => {
          const on = this.idx >= 0 && TRACKS[this.idx]?.id === t.id;
          const fav = this.favs.has(t.id);
          return `
            <div class="row hole ${on ? "on" : ""}" tabindex="0" role="button" data-id="${esc(t.id)}">
              <div class="thumb" aria-hidden="true">
                <img src="${esc(t.coverSrc)}" alt="" loading="lazy" />
              </div>
              <div>
                <div class="rname">${esc(t.title)}</div>
                <div class="rsub mono">${esc(t.subtitle)}</div>
              </div>
              <div class="actions">
                <button class="sbtn hole" type="button" data-fav="${esc(t.id)}" aria-pressed="${fav}">
                  <span class="mono">${fav ? "FAV✓" : "FAV"}</span>
                </button>
                <button class="sbtn hole" type="button" data-link="${esc(t.id)}">
                  <span class="mono">↗</span>
                </button>
              </div>
            </div>
          `;
        })
        .join("") || `<div class="mono muted" style="padding:0.6rem 0.4rem;">No tracks in this view.</div>`;

    $all(".row", this.rows).forEach((r) => {
      const id = r.dataset.id;
      r.addEventListener("click", () => this.loadById(id, { autoplay: true }));
      r.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.loadById(id, { autoplay: true });
        }
      });
    });

    $all("[data-fav]", this.rows).forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.dataset.fav;
        this._toggleFavId(id);
      });
    });

    $all("[data-link]", this.rows).forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.dataset.link;
        this._copyTrackLink(id);
      });
    });
  }

  loadById(id, { autoplay } = { autoplay: true }) {
    const i = TRACKS.findIndex((t) => t.id === id);
    if (i < 0) {
      toast.show("Track not found.");
      return false;
    }
    this.loadIndex(i, { autoplay });
    return true;
  }

  loadIndex(i, { autoplay } = { autoplay: true }) {
    if (!this.audio) return;

    this.idx = clamp(i, 0, TRACKS.length - 1);
    const t = TRACKS[this.idx];

    this.audio.src = t.audioSrc;
    this.audio.load();

    if (this.coverImg) {
      this.coverImg.src = t.coverSrc;
      this.coverImg.onerror = () => (this.coverImg.style.display = "none");
      this.coverImg.onload = () => (this.coverImg.style.display = "block");
    }

    if (this.title) this.title.textContent = t.title;
    if (this.meta) this.meta.textContent = t.subtitle;
    if (this.nowText) this.nowText.textContent = t.title;

    this._setLyrics(t);
    this._setHash(t.id);
    this._syncFavBtn();

    this._ensureAudioGraph();
    this._startDraw();

    this._renderList();

    if (autoplay) {
      this.play().catch(() => toast.show("Tap play to start audio."));
    } else {
      this.pause();
    }
  }

  _setHash(id) {
    const u = safeUrl();
    if (!u) return;
    const p = new URLSearchParams();
    p.set("track", id);
    u.hash = `#${p.toString()}`;
    history.replaceState(null, "", u.toString());
  }

  async play() {
    await this.audio.play();
    if (this.playLab) this.playLab.textContent = "PAUSE";
    this._startDraw();
  }

  pause() {
    this.audio.pause();
    if (this.playLab) this.playLab.textContent = "PLAY";
  }

  toggle() {
    if (this.idx < 0) return this.loadIndex(0, { autoplay: true });
    if (this.audio.paused) this.play().catch(() => toast.show("Tap play to start audio."));
    else this.pause();
  }

  prev() {
    if (this.idx < 0) return this.loadIndex(0, { autoplay: true });
    this.loadIndex((this.idx - 1 + TRACKS.length) % TRACKS.length, { autoplay: true });
  }

  next() {
    if (this.idx < 0) return this.loadIndex(0, { autoplay: true });
    this.loadIndex((this.idx + 1) % TRACKS.length, { autoplay: true });
  }

  _syncTime() {
    const dur = this.audio.duration || 0;
    const cur = this.audio.currentTime || 0;
    if (this.tCur) this.tCur.textContent = formatTime(cur);
    if (this.tDur) this.tDur.textContent = formatTime(dur);

    if (dur > 0 && this.scrub) {
      this.scrub.value = String(Math.round(clamp(cur / dur, 0, 1) * 1000));
    }
  }

  _ensureAudioGraph() {
    if (this.ac || !this.audio) return;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;

      this.ac = new Ctx();
      this.an = this.ac.createAnalyser();
      this.an.fftSize = 2048;
      this.an.smoothingTimeConstant = 0.86;

      this.src = this.ac.createMediaElementSource(this.audio);
      this.src.connect(this.an);
      this.an.connect(this.ac.destination);

      this.buf = new Uint8Array(this.an.frequencyBinCount);
    } catch {
      this.ac = null;
      this.an = null;
      this.src = null;
      this.buf = null;
    }
  }

  _startDraw() {
    if (!this.c || !this.g) return;
    if (this.raf) return;

    const loop = () => {
      this._draw();
      this._totemPulse();
      this.raf = requestAnimationFrame(loop);
    };

    this.raf = requestAnimationFrame(loop);
  }

  _resizeCanvas() {
    const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = this.c.clientWidth || 1;
    const cssH = Math.round(cssW * (260 / 1400));

    const w = Math.floor(cssW * ratio);
    const h = Math.floor(cssH * ratio);

    if (this.c.width !== w || this.c.height !== h) {
      this.c.width = w;
      this.c.height = h;
    }
  }

  _drawIdle() {
    if (!this.c || !this.g) return;
    this._resizeCanvas();

    const g = this.g;
    const w = this.c.width;
    const h = this.c.height;

    g.clearRect(0, 0, w, h);

    const deep = document.body.classList.contains("deep");
    const ink = deep ? "rgba(251,251,253,0.78)" : "rgba(10,10,14,0.78)";
    const vio = deep ? "rgba(123,115,255,0.22)" : "rgba(123,115,255,0.14)";

    const bg = g.createRadialGradient(w * 0.44, h * 0.32, 10, w * 0.44, h * 0.32, w * 0.95);
    bg.addColorStop(0, vio);
    bg.addColorStop(1, "rgba(10,10,14,0.00)");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    g.strokeStyle = "rgba(10,10,14,0.10)";
    g.lineWidth = 1;
    g.strokeRect(w * 0.02, h * 0.10, w * 0.96, h * 0.80);

    g.strokeStyle = ink;
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(w * 0.08, h * 0.52);
    g.quadraticCurveTo(w * 0.46, h * 0.38, w * 0.92, h * 0.50);
    g.stroke();
  }

  _draw() {
    if (!this.c || !this.g || !this.audio) return;
    this._resizeCanvas();

    const g = this.g;
    const w = this.c.width;
    const h = this.c.height;

    g.clearRect(0, 0, w, h);

    const deep = document.body.classList.contains("deep");
    const ink = deep ? "rgba(251,251,253,0.78)" : "rgba(10,10,14,0.82)";
    const inkSoft = deep ? "rgba(251,251,253,0.12)" : "rgba(10,10,14,0.10)";
    const vio = deep ? "rgba(123,115,255,0.30)" : "rgba(123,115,255,0.20)";

    const bg = g.createRadialGradient(w * 0.42, h * 0.30, 10, w * 0.42, h * 0.30, w * 0.95);
    bg.addColorStop(0, vio);
    bg.addColorStop(1, "rgba(10,10,14,0.00)");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const dur = this.audio.duration || 0;
    const cur = this.audio.currentTime || 0;
    const p = dur > 0 ? clamp(cur / dur, 0, 1) : 0;

    g.fillStyle = deep ? "rgba(251,251,253,0.02)" : "rgba(10,10,14,0.05)";
    g.fillRect(0, 0, w, h);

    g.fillStyle = deep ? "rgba(251,251,253,0.04)" : "rgba(10,10,14,0.09)";
    g.fillRect(0, 0, w * p, h);

    g.strokeStyle = inkSoft;
    g.lineWidth = 1;
    g.strokeRect(w * 0.02, h * 0.10, w * 0.96, h * 0.80);

    if (this.an && this.buf) this.an.getByteFrequencyData(this.buf);

    const mid = h * 0.48;
    const amp = h * 0.22;

    g.strokeStyle = ink;
    g.lineWidth = 2.4;
    g.beginPath();

    const steps = 260;
    this.phase += 0.9;

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const idx = this.buf ? Math.floor((i / steps) * (this.buf.length - 1)) : i;
      const v = this.buf ? this.buf[idx] / 255 : 0.12;

      const shaped = Math.pow(v, 1.12);
      const y = mid + Math.sin(i * 0.18 + this.phase * 0.02) * (amp * shaped);

      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }

    g.stroke();

    // progress line (violet whisper)
    g.strokeStyle = deep ? "rgba(123,115,255,0.55)" : "rgba(123,115,255,0.52)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w * p, h * 0.14);
    g.lineTo(w * p, h * 0.86);
    g.stroke();
  }

  _totemPulse() {
    if (!this.totem) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;
    const t = Date.now() * 0.001;
    const a = 0.85 + Math.sin(t * 0.9) * 0.05;
    this.totem.style.opacity = String(a);
  }

  toggleShare() {
    if (!this.shareline) return;
    this.shareline.hidden = !this.shareline.hidden;
  }

  copyTrackLink() {
    const t = TRACKS[this.idx];
    if (!t) return toast.show("Select a track first.");
    this._copyTrackLink(t.id);
  }

  _copyTrackLink(id) {
    const u = safeUrl();
    if (!u) return;
    const p = new URLSearchParams();
    p.set("track", id);
    u.hash = `#${p.toString()}`;
    this._copy(u.toString(), "Copied track link.");
  }

  async nativeShare() {
    const t = TRACKS[this.idx];
    if (!t) return toast.show("Select a track first.");

    const u = safeUrl();
    if (!u) return;

    const p = new URLSearchParams();
    p.set("track", t.id);
    u.hash = `#${p.toString()}`;

    const payload = { title: `Receipts — ${t.title}`, text: `Receipts — ${t.title}`, url: u.toString() };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        toast.show("Shared.");
      } catch {
        /* user canceled */
      }
      return;
    }

    this._copy(payload.url, "Share not supported — link copied.");
  }

  async _copy(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast.show(okMsg);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast.show(okMsg);
    }
  }

  _toggleFavId(id) {
    if (!id) return;
    if (this.favs.has(id)) this.favs.delete(id);
    else this.favs.add(id);
    Store.set(this.favs);

    if (TRACKS[this.idx]?.id === id) this._syncFavBtn();
    this._renderList();
    toast.show(this.favs.has(id) ? "Favorited." : "Unfavorited.");
  }

  toggleFav() {
    const t = TRACKS[this.idx];
    if (!t) return toast.show("Select a track first.");
    this._toggleFavId(t.id);
  }

  _syncFavBtn() {
    const t = TRACKS[this.idx];
    const on = t ? this.favs.has(t.id) : false;
    this.favBtn?.setAttribute("aria-pressed", String(on));
  }

  toggleLyrics() {
    const open = this.lyricsBtn?.getAttribute("aria-expanded") === "true";
    if (open) this.closeLyrics();
    else this.openLyrics();
  }

  openLyrics() {
    if (!this.lyrics) return;
    this.lyrics.hidden = false;
    this.lyricsBtn?.setAttribute("aria-expanded", "true");
  }

  closeLyrics() {
    if (!this.lyrics) return;
    this.lyrics.hidden = true;
    this.lyricsBtn?.setAttribute("aria-expanded", "false");
  }

  _setLyrics(t) {
    if (!this.lyricsBody) return;
    const lines = Array.isArray(t?.lyrics) ? t.lyrics : [];
    if (!lines.length) {
      this.lyricsBody.innerHTML = `<p class="muted">No lyrics yet.</p>`;
      return;
    }
    this.lyricsBody.innerHTML = lines.map((l) => `<p>${esc(l)}</p>`).join("");
  }
}

/* Boot */
document.addEventListener("DOMContentLoaded", () => {
  try {
    new Player();
  } catch (e) {
    toast.show(e instanceof Error ? e.message : "Failed to initialize.");
  }
});
