/* =========================
   Receipts — Artist Site Script
   Notes:
   1) Update the TRACKS array to add, remove, or reorder songs.
   2) Replace placeholder links in index.html when you are ready.
   3) This file is intentionally data-driven so future expansion is easy.
   ========================= */

(() => {
  "use strict";

  /* =========================
     DROP-IN SONG DATA START
     Replace these placeholder titles, audio files, descriptions, and lyrics.
     Add more objects to keep expanding the site over time.
     ========================= */
  const TRACKS = [
    {
      id: "track-01",
      title: "Track One",
      type: "Single",
      year: "2026",
      mood: "Soft ruin / lucid dream",
      src: "https://github.com/soLoveLuka/soLoveLuka.github.io/raw/refs/heads/main/THT%202.mp3",
      cover: "",
      description:
        "A placeholder for your first featured release. Quietly dramatic. Leave room for the vocal to feel close and a little haunted.",
      lyrics: `Put your first real lyrics here.

Line one.
Line two.
Line three.

Or leave a fragment.
Minimal works here too.`,
      credits: [
        "Written by Receipts",
        "Produced by Receipts",
        "Visual direction placeholder"
      ]
    },
    {
      id: "track-02",
      title: "Track Two",
      type: "Single",
      year: "2026",
      mood: "High contrast / night drive",
      src: "https://github.com/soLoveLuka/soLoveLuka.github.io/raw/refs/heads/main/audio/Silva.mp3",
      cover: "",
      description:
        "A sharper placeholder track slot for something with motion, edges, and a little pressure under the surface.",
      lyrics: `Another placeholder lyric window.

You can drop a full song in here,
or leave just the part that matters most.`,
      credits: [
        "Written by Receipts",
        "Produced by Receipts",
        "Master placeholder"
      ]
    },
    {
      id: "track-03",
      title: "Track Three",
      type: "Single",
      year: "2026",
      mood: "Warm static / dissolving room",
      src: "https://github.com/soLoveLuka/soLoveLuka.github.io/raw/refs/heads/main/audio/FNF.mp3",
      cover: "",
      description:
        "Use this slot for a softer or stranger cut. The site will build its cards and sharing links from this object automatically.",
      lyrics: `Use this field for lyrics,
fragments,
notes,
or alternate version text.`,
      credits: [
        "Written by Receipts",
        "Produced by Receipts",
        "Photography placeholder"
      ]
    }
  ];
  /* =========================
     DROP-IN SONG DATA END
     ========================= */

  const STORAGE_KEYS = {
    favorites: "receipts.favoriteTracks",
    focusMode: "receipts.focusMode"
  };

  const dom = {};
  const state = {
    currentIndex: 0,
    isPlaying: false,
    lyricsOpen: false,
    focusMode: false,
    favorites: new Set(),
    toastTimer: null,
    progressScrubbing: false,
    revealObserver: null,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  function safeQuery(selector, root = document) {
    return root.querySelector(selector);
  }

  function safeQueryAll(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function showError(message) {
    if (!dom.errorNotification || !dom.errorText) {
      console.error(message);
      return;
    }

    dom.errorText.textContent = message;
    dom.errorNotification.classList.add("is-visible");

    window.clearTimeout(showError._timer);
    showError._timer = window.setTimeout(() => {
      dom.errorNotification.classList.remove("is-visible");
    }, 5000);
  }

  function showToast(message) {
    if (!dom.toast) {
      return;
    }

    dom.toast.textContent = message;
    dom.toast.classList.add("is-visible");

    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
    }

    state.toastTimer = window.setTimeout(() => {
      dom.toast.classList.remove("is-visible");
    }, 2200);
  }

  function getStorageSet(key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return new Set();
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch (error) {
      console.warn("Could not read localStorage key:", key, error);
      return new Set();
    }
  }

  function saveStorageSet(key, values) {
    try {
      window.localStorage.setItem(key, JSON.stringify(Array.from(values)));
    } catch (error) {
      console.warn("Could not write localStorage key:", key, error);
    }
  }

  function getStorageBoolean(key) {
    try {
      return window.localStorage.getItem(key) === "true";
    } catch (error) {
      console.warn("Could not read boolean storage:", key, error);
      return false;
    }
  }

  function saveStorageBoolean(key, value) {
    try {
      window.localStorage.setItem(key, String(Boolean(value)));
    } catch (error) {
      console.warn("Could not write boolean storage:", key, error);
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function currentTrack() {
    return TRACKS[state.currentIndex];
  }

  function buildCoverDataUrl(track) {
    if (track.cover) {
      return track.cover;
    }

    const safeTitle = escapeHtml(track.title);
    const safeMeta = escapeHtml(`${track.year} / ${track.type}`);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f1ede7" />
          </linearGradient>
          <radialGradient id="p" cx="50%" cy="28%" r="60%">
            <stop offset="0%" stop-color="rgba(128,119,137,0.28)" />
            <stop offset="100%" stop-color="rgba(128,119,137,0)" />
          </radialGradient>
        </defs>
        <rect width="1200" height="1200" fill="url(#g)" />
        <rect x="58" y="58" width="1084" height="1084" rx="60" fill="none" stroke="rgba(0,0,0,0.08)" />
        <rect x="150" y="150" width="900" height="900" rx="40" fill="white" stroke="rgba(0,0,0,0.06)" />
        <rect x="190" y="190" width="820" height="820" rx="32" fill="none" stroke="rgba(0,0,0,0.05)" />
        <circle cx="600" cy="430" r="230" fill="black" />
        <circle cx="600" cy="430" r="236" fill="none" stroke="rgba(128,119,137,0.55)" stroke-width="4" />
        <circle cx="600" cy="430" r="72" fill="white" />
        <rect x="298" y="768" width="604" height="2" fill="rgba(0,0,0,0.2)" />
        <text x="600" y="862" fill="#050505" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="84" font-weight="800" letter-spacing="-3">${safeTitle}</text>
        <text x="600" y="926" fill="#656565" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="600" letter-spacing="8">${safeMeta}</text>
        <rect width="1200" height="1200" fill="url(#p)" />
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function escapeHtml(input) {
    return String(input)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function seededWaveHeights(seedText, count = 72) {
    let seed = 0;

    for (let index = 0; index < seedText.length; index += 1) {
      seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
    }

    const heights = [];

    for (let index = 0; index < count; index += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const value = 16 + (seed % 42);
      heights.push(value);
    }

    return heights;
  }

  function trackUrl(trackId) {
    const url = new URL(window.location.href);
    url.searchParams.set("track", trackId);
    return url.toString();
  }

  function readTrackFromUrl() {
    const url = new URL(window.location.href);
    const trackId = url.searchParams.get("track");
    const foundIndex = TRACKS.findIndex((track) => track.id === trackId);

    return foundIndex >= 0 ? foundIndex : 0;
  }

  function updateUrl(trackId) {
    const url = new URL(window.location.href);
    url.searchParams.set("track", trackId);
    window.history.replaceState({}, "", url);
  }

  function setFocusMode(nextValue, persist = true) {
    state.focusMode = Boolean(nextValue);
    document.body.classList.toggle("is-focus-mode", state.focusMode);

    if (dom.focusButton) {
      dom.focusButton.textContent = state.focusMode ? "Exit Focus" : "Deep Listen";
    }

    const headerFocusButton = safeQuery('[data-action="focus-toggle"]');
    if (headerFocusButton) {
      headerFocusButton.textContent = state.focusMode ? "Exit Focus" : "Focus Mode";
    }

    if (persist) {
      saveStorageBoolean(STORAGE_KEYS.focusMode, state.focusMode);
    }
  }

  function setFavorite(trackId) {
    if (state.favorites.has(trackId)) {
      state.favorites.delete(trackId);
      showToast("Removed from favorites.");
    } else {
      state.favorites.add(trackId);
      showToast("Added to favorites.");
    }

    saveStorageSet(STORAGE_KEYS.favorites, state.favorites);
    syncFavoriteUi();
  }

  function syncFavoriteUi() {
    const track = currentTrack();
    const isFavorite = state.favorites.has(track.id);

    if (dom.favoriteButton) {
      dom.favoriteButton.classList.toggle("is-active", isFavorite);
      dom.favoriteButton.textContent = isFavorite ? "Favorited" : "Favorite";
      dom.favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    }

    safeQueryAll("[data-favorite-track]").forEach((button) => {
      const favoriteState = state.favorites.has(button.dataset.favoriteTrack || "");
      button.classList.toggle("is-active", favoriteState);
      button.textContent = favoriteState ? "Favorited" : "Favorite";
      button.setAttribute("aria-pressed", String(favoriteState));
    });
  }

  function renderWaveform(track) {
    if (!dom.waveform) {
      return;
    }

    const heights = seededWaveHeights(track.id + track.title + track.mood);
    dom.waveform.innerHTML = heights
      .map((height, index) => {
        return `<span class="waveform__bar" data-bar-index="${index}" style="--h:${height}"></span>`;
      })
      .join("");
  }

  function updateWaveformProgress() {
    if (!dom.audio || !dom.waveform) {
      return;
    }

    const bars = safeQueryAll(".waveform__bar", dom.waveform);
    if (bars.length === 0) {
      return;
    }

    const progress =
      dom.audio.duration > 0 ? dom.audio.currentTime / dom.audio.duration : 0;
    const activeIndex = Math.floor(progress * (bars.length - 1));

    bars.forEach((bar, index) => {
      bar.classList.toggle("is-played", index <= activeIndex);
      bar.classList.toggle("is-current", index === activeIndex);
    });
  }

  function updateProgressUi() {
    if (!dom.audio || !dom.progressInput || !dom.currentTime || !dom.currentDuration) {
      return;
    }

    const current = dom.audio.currentTime || 0;
    const duration = dom.audio.duration || 0;
    const progress = duration > 0 ? (current / duration) * 100 : 0;

    dom.currentTime.textContent = formatTime(current);
    dom.currentDuration.textContent = formatTime(duration);

    if (!state.progressScrubbing) {
      dom.progressInput.value = String(progress);
    }

    dom.progressInput.style.setProperty("--progress", `${progress}%`);
    updateWaveformProgress();
  }

  function updateAdvancedPanel(track) {
    if (dom.deepTitle) {
      dom.deepTitle.textContent = track.title;
    }

    if (dom.deepDescription) {
      dom.deepDescription.textContent = track.description;
    }

    if (dom.creditList) {
      dom.creditList.innerHTML = track.credits
        .map((credit) => `<li>${escapeHtml(credit)}</li>`)
        .join("");
    }

    if (dom.sharePath) {
      dom.sharePath.value = trackUrl(track.id);
    }
  }

  function updateTrackUi(track, { updateAddressBar = true } = {}) {
    if (dom.currentIndexLabel) {
      dom.currentIndexLabel.textContent = `Current transmission / ${String(state.currentIndex + 1).padStart(2, "0")}`;
    }

    if (dom.currentTitle) {
      dom.currentTitle.textContent = track.title;
    }

    if (dom.currentSubtitle) {
      dom.currentSubtitle.textContent = `${track.year} • ${track.type} • ${track.mood}`;
    }

    if (dom.currentCover) {
      dom.currentCover.src = buildCoverDataUrl(track);
      dom.currentCover.alt = `${track.title} cover art`;
    }

    if (dom.lyricsBody) {
      dom.lyricsBody.textContent = track.lyrics || "Lyrics coming soon.";
    }

    if (dom.audio) {
      dom.audio.src = track.src;
      dom.audio.load();
    }

    if (updateAddressBar) {
      updateUrl(track.id);
    }

    renderWaveform(track);
    renderRail();
    renderCatalog();
    updateAdvancedPanel(track);
    syncFavoriteUi();
    updateProgressUi();
  }

  function animateTrackSwitch() {
    if (!dom.cylinderCard) {
      return;
    }

    dom.cylinderCard.classList.remove("is-switching");

    if (state.reducedMotion) {
      return;
    }

    // Force reflow so the animation can restart cleanly.
    void dom.cylinderCard.offsetWidth;
    dom.cylinderCard.classList.add("is-switching");

    window.clearTimeout(animateTrackSwitch._timer);
    animateTrackSwitch._timer = window.setTimeout(() => {
      dom.cylinderCard.classList.remove("is-switching");
    }, 1000);
  }

  function setTrack(nextIndex, options = {}) {
    const {
      autoplay = false,
      updateAddressBar = true,
      animate = true
    } = options;

    state.currentIndex = ((nextIndex % TRACKS.length) + TRACKS.length) % TRACKS.length;
    const track = currentTrack();

    updateTrackUi(track, { updateAddressBar });

    if (animate) {
      animateTrackSwitch();
    }

    if (autoplay && dom.audio) {
      dom.audio
        .play()
        .then(() => {
          state.isPlaying = true;
          syncPlayButton();
        })
        .catch((error) => {
          console.warn("Autoplay was blocked:", error);
          state.isPlaying = false;
          syncPlayButton();
        });
    } else {
      state.isPlaying = false;
      syncPlayButton();
    }
  }

  function syncPlayButton() {
    const playing = state.isPlaying;

    if (dom.playPauseText) {
      dom.playPauseText.textContent = playing ? "Pause" : "Play";
    }

    const heroPlayButton = safeQuery('[data-action="play-current"]');
    if (heroPlayButton) {
      heroPlayButton.textContent = playing ? "Pause" : "Play";
    }
  }

  function togglePlayback() {
    if (!dom.audio) {
      return;
    }

    if (dom.audio.paused) {
      dom.audio
        .play()
        .then(() => {
          state.isPlaying = true;
          syncPlayButton();
        })
        .catch((error) => {
          console.warn("Audio playback failed:", error);
          showError("The audio could not start. Check the file path for this track.");
        });
    } else {
      dom.audio.pause();
      state.isPlaying = false;
      syncPlayButton();
    }
  }

  async function copyText(text) {
    if (!text) {
      showError("Nothing to copy.");
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("Clipboard copy failed:", error);

      const helperInput = document.createElement("input");
      helperInput.value = text;
      document.body.appendChild(helperInput);
      helperInput.select();

      try {
        document.execCommand("copy");
        document.body.removeChild(helperInput);
        return true;
      } catch (legacyError) {
        document.body.removeChild(helperInput);
        return false;
      }
    }
  }

  async function shareCurrentTrack() {
    const track = currentTrack();
    const url = trackUrl(track.id);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Receipts — ${track.title}`,
          text: `Listen to ${track.title} by Receipts`,
          url
        });
        showToast("Shared.");
        return;
      }

      const copied = await copyText(url);
      if (copied) {
        showToast("Track link copied.");
      } else {
        showError("Could not copy the track link.");
      }
    } catch (error) {
      console.warn("Share action cancelled or failed:", error);
    }
  }

  function toggleLyrics(forceOpen) {
    if (!dom.lyricsPanel || !dom.lyricsButton) {
      return;
    }

    state.lyricsOpen = typeof forceOpen === "boolean" ? forceOpen : !state.lyricsOpen;
    dom.lyricsPanel.hidden = !state.lyricsOpen;
    dom.lyricsButton.setAttribute("aria-expanded", String(state.lyricsOpen));
    dom.lyricsButton.textContent = state.lyricsOpen ? "Close Lyrics" : "Open Lyrics";
  }

  function renderRail() {
    if (!dom.trackRail) {
      return;
    }

    dom.trackRail.innerHTML = TRACKS.map((track, index) => {
      const active = index === state.currentIndex;
      return `
        <button
          class="track-pill blackhole-hover ${active ? "is-active" : ""}"
          type="button"
          data-track-index="${index}"
          aria-label="Select ${escapeHtml(track.title)}"
        >
          <span class="track-pill__index">Track ${String(index + 1).padStart(2, "0")}</span>
          <span class="track-pill__title">${escapeHtml(track.title)}</span>
          <span class="track-pill__meta">${escapeHtml(track.year)} • ${escapeHtml(track.mood)}</span>
        </button>
      `;
    }).join("");
  }

  function renderCatalog() {
    if (!dom.catalogGrid) {
      return;
    }

    dom.catalogGrid.innerHTML = TRACKS.map((track, index) => {
      const active = index === state.currentIndex;
      const favorite = state.favorites.has(track.id);

      return `
        <article class="catalog-card ${active ? "is-active" : ""}" data-catalog-track="${escapeHtml(track.id)}">
          <div class="catalog-card__cover">
            <img src="${buildCoverDataUrl(track)}" alt="${escapeHtml(track.title)} cover art" />
          </div>

          <div>
            <p class="catalog-card__eyebrow">${escapeHtml(track.year)} • ${escapeHtml(track.type)}</p>
            <h3 class="catalog-card__title">${escapeHtml(track.title)}</h3>
          </div>

          <p class="catalog-card__description">${escapeHtml(track.description)}</p>

          <div class="catalog-card__buttons">
            <button class="catalog-card__button blackhole-hover" type="button" data-track-index="${index}">
              ${active ? "Current" : "Play"}
            </button>
            <button class="catalog-card__button catalog-card__button--ghost blackhole-hover" type="button" data-share-track="${escapeHtml(track.id)}">
              Share
            </button>
            <button class="catalog-card__button catalog-card__button--ghost blackhole-hover ${favorite ? "is-active" : ""}" type="button" data-favorite-track="${escapeHtml(track.id)}">
              ${favorite ? "Favorited" : "Favorite"}
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function bindDelegatedActions() {
    document.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("[data-action]");
      const trackButton = event.target.closest("[data-track-index]");
      const shareTrackButton = event.target.closest("[data-share-track]");
      const favoriteTrackButton = event.target.closest("[data-favorite-track]");

      if (trackButton) {
        const index = Number(trackButton.dataset.trackIndex);
        if (Number.isFinite(index)) {
          setTrack(index, { autoplay: true, animate: true });
        }
      }

      if (shareTrackButton) {
        const trackId = shareTrackButton.dataset.shareTrack;
        const matchedTrack = TRACKS.find((track) => track.id === trackId);

        if (matchedTrack) {
          const copied = await copyText(trackUrl(matchedTrack.id));
          if (copied) {
            showToast(`Link copied for ${matchedTrack.title}.`);
          } else {
            showError("Could not copy the track link.");
          }
        }
      }

      if (favoriteTrackButton) {
        const trackId = favoriteTrackButton.dataset.favoriteTrack;
        if (trackId) {
          setFavorite(trackId);
        }
      }

      if (!actionButton) {
        return;
      }

      const action = actionButton.dataset.action;

      switch (action) {
        case "play-current":
          togglePlayback();
          break;

        case "lyrics-toggle":
          toggleLyrics();
          break;

        case "scroll-music":
          safeQuery("#music")?.scrollIntoView({ behavior: "smooth", block: "start" });
          break;

        case "prev-track":
          setTrack(state.currentIndex - 1, { autoplay: true, animate: true });
          break;

        case "next-track":
          setTrack(state.currentIndex + 1, { autoplay: true, animate: true });
          break;

        case "focus-toggle":
          setFocusMode(!state.focusMode);
          break;

        case "share-current":
          await shareCurrentTrack();
          break;

        default:
          break;
      }
    });
  }

  function bindAudioEvents() {
    if (!dom.audio) {
      return;
    }

    dom.audio.addEventListener("timeupdate", updateProgressUi);
    dom.audio.addEventListener("loadedmetadata", updateProgressUi);

    dom.audio.addEventListener("play", () => {
      state.isPlaying = true;
      syncPlayButton();
    });

    dom.audio.addEventListener("pause", () => {
      state.isPlaying = false;
      syncPlayButton();
    });

    dom.audio.addEventListener("ended", () => {
      state.isPlaying = false;
      syncPlayButton();
      setTrack(state.currentIndex + 1, { autoplay: false, animate: true });
    });

    dom.audio.addEventListener("error", () => {
      showError("This track could not load. Check the audio file URL in script.js.");
    });

    if (dom.progressInput) {
      dom.progressInput.addEventListener("input", () => {
        state.progressScrubbing = true;
        const progress = Number(dom.progressInput.value) || 0;
        dom.progressInput.style.setProperty("--progress", `${progress}%`);
      });

      const commitProgressChange = () => {
        if (!dom.audio || !Number.isFinite(dom.audio.duration) || dom.audio.duration <= 0) {
          state.progressScrubbing = false;
          return;
        }

        const progress = Number(dom.progressInput.value) || 0;
        dom.audio.currentTime = dom.audio.duration * (progress / 100);
        state.progressScrubbing = false;
        updateProgressUi();
      };

      dom.progressInput.addEventListener("change", commitProgressChange);
      dom.progressInput.addEventListener("mouseup", commitProgressChange);
      dom.progressInput.addEventListener("touchend", commitProgressChange, { passive: true });
    }
  }

  function bindUiEvents() {
    if (dom.playPauseButton) {
      dom.playPauseButton.addEventListener("click", togglePlayback);
    }

    if (dom.focusButton) {
      dom.focusButton.addEventListener("click", () => {
        setFocusMode(!state.focusMode);
      });
    }

    if (dom.shareButton) {
      dom.shareButton.addEventListener("click", shareCurrentTrack);
    }

    if (dom.favoriteButton) {
      dom.favoriteButton.addEventListener("click", () => {
        setFavorite(currentTrack().id);
      });
    }

    if (dom.lyricsButton) {
      dom.lyricsButton.addEventListener("click", () => toggleLyrics());
    }

    if (dom.backToTop) {
      dom.backToTop.addEventListener("click", () => {
        safeQuery("#top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (dom.advancedToggle && dom.advancedPanel) {
      dom.advancedToggle.addEventListener("click", () => {
        const isExpanded = dom.advancedToggle.getAttribute("aria-expanded") === "true";
        dom.advancedToggle.setAttribute("aria-expanded", String(!isExpanded));
        dom.advancedPanel.hidden = isExpanded;
      });
    }

    if (dom.errorClose && dom.errorNotification) {
      dom.errorClose.addEventListener("click", () => {
        dom.errorNotification.classList.remove("is-visible");
      });
    }

    window.addEventListener("scroll", () => {
      const shouldShow = window.scrollY > 420;
      dom.backToTop?.classList.toggle("is-visible", shouldShow);
    });

    window.addEventListener("popstate", () => {
      const index = readTrackFromUrl();
      setTrack(index, { autoplay: false, updateAddressBar: false, animate: false });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === " " && event.target === document.body) {
        event.preventDefault();
        togglePlayback();
      }

      if (event.key === "ArrowRight") {
        setTrack(state.currentIndex + 1, { autoplay: true, animate: true });
      }

      if (event.key === "ArrowLeft") {
        setTrack(state.currentIndex - 1, { autoplay: true, animate: true });
      }

      if (event.key.toLowerCase() === "l") {
        toggleLyrics();
      }
    });
  }

  function setupRevealObserver() {
    if (state.reducedMotion || !("IntersectionObserver" in window)) {
      safeQueryAll(".reveal").forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    state.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            state.revealObserver?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -4% 0px"
      }
    );

    safeQueryAll(".reveal").forEach((element) => {
      state.revealObserver?.observe(element);
    });
  }

  function initializePreloader() {
    const fill = safeQuery(".preloader__meter-fill");
    if (!fill) {
      document.body.classList.add("is-loaded");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let progress = 0;
      const interval = window.setInterval(() => {
        progress += 5;
        fill.style.width = `${clamp(progress, 0, 100)}%`;

        if (progress >= 100) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            document.body.classList.add("is-loaded");
            resolve();
          }, 220);
        }
      }, 42);
    });
  }

  function cacheDom() {
    dom.audio = safeQuery("#mainAudio");
    dom.currentCover = safeQuery("#currentCover");
    dom.currentTitle = safeQuery("#currentTitle");
    dom.currentSubtitle = safeQuery("#currentSubtitle");
    dom.currentIndexLabel = safeQuery("#currentIndexLabel");
    dom.playPauseButton = safeQuery("#playPauseButton");
    dom.playPauseText = safeQuery("#playPauseText");
    dom.progressInput = safeQuery("#progressInput");
    dom.currentTime = safeQuery("#currentTime");
    dom.currentDuration = safeQuery("#currentDuration");
    dom.waveform = safeQuery("#waveform");
    dom.trackRail = safeQuery("#trackRail");
    dom.catalogGrid = safeQuery("#catalogGrid");
    dom.lyricsButton = safeQuery("#lyricsButton");
    dom.lyricsPanel = safeQuery("#lyricsPanel");
    dom.lyricsBody = safeQuery("#lyricsBody");
    dom.favoriteButton = safeQuery("#favoriteButton");
    dom.shareButton = safeQuery("#shareButton");
    dom.focusButton = safeQuery("#focusButton");
    dom.backToTop = safeQuery("#backToTop");
    dom.advancedToggle = safeQuery("#advancedToggle");
    dom.advancedPanel = safeQuery("#advancedPanel");
    dom.deepTitle = safeQuery("#deepTitle");
    dom.deepDescription = safeQuery("#deepDescription");
    dom.creditList = safeQuery("#creditList");
    dom.sharePath = safeQuery("#sharePath");
    dom.cylinderCard = safeQuery("#cylinderCard");
    dom.toast = safeQuery("#toast");
    dom.errorNotification = safeQuery("#errorNotification");
    dom.errorText = safeQuery("#errorText");
    dom.errorClose = safeQuery("#errorClose");
  }

  function validateTrackData() {
    if (!Array.isArray(TRACKS) || TRACKS.length === 0) {
      throw new Error("TRACKS must contain at least one song object.");
    }

    TRACKS.forEach((track, index) => {
      const requiredKeys = ["id", "title", "type", "year", "mood", "src", "description", "lyrics", "credits"];

      requiredKeys.forEach((key) => {
        if (!(key in track)) {
          throw new Error(`Track at index ${index} is missing "${key}".`);
        }
      });

      if (!Array.isArray(track.credits)) {
        throw new Error(`Track "${track.title}" must have a credits array.`);
      }
    });
  }

  async function initialize() {
    try {
      validateTrackData();
      cacheDom();

      state.favorites = getStorageSet(STORAGE_KEYS.favorites);
      setFocusMode(getStorageBoolean(STORAGE_KEYS.focusMode), false);
      state.currentIndex = readTrackFromUrl();

      renderRail();
      renderCatalog();
      setTrack(state.currentIndex, { autoplay: false, updateAddressBar: false, animate: false });

      bindDelegatedActions();
      bindAudioEvents();
      bindUiEvents();
      setupRevealObserver();
      await initializePreloader();
      updateProgressUi();
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error.message : "Initialization failed.");
      document.body.classList.add("is-loaded");
    }
  }

  window.addEventListener("error", (event) => {
    console.error("Unhandled window error:", event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });

  document.addEventListener("DOMContentLoaded", initialize);
})();
