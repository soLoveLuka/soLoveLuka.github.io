// Function to handle image loading errors
function handleImageError(imageElement) {
  console.warn(`Image failed to load: ${imageElement.src}. Hiding element.`);
  imageElement.style.display = 'none';
}

/* =========================
   Error Handling Service
   ========================= */
class ErrorHandler {
  constructor() {
    this.errorNotification = null;
    this.errorMessage = null;
    this.errorClose = null;
    this.errorLog = [];
    this.maxErrors = 50;
    this.domReady = false;

    document.addEventListener('DOMContentLoaded', () => {
      this.errorNotification = document.querySelector('.error-notification');
      this.errorMessage = document.querySelector('.error-message');
      this.errorClose = document.querySelector('.error-close');
      this.domReady = true;

      if (this.errorClose) {
        this.errorClose.addEventListener('click', () => this.hideError());
      }
    });

    this.setupErrorListeners();
  }

  setupErrorListeners() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError({ message, source, lineno, colno, error: error || new Error(message) });
      this.displayError(`Script Error: ${message} at ${source}:${lineno}`);
      return true;
    };

    window.addEventListener('unhandledrejection', (event) => {
      this.logError({ message: 'Unhandled Promise Rejection', reason: event.reason });
      const reasonMsg = (event.reason instanceof Error) ? event.reason.message : String(event.reason);
      this.displayError(`Async Error: ${reasonMsg || 'Promise rejected without reason'}`);
    });
  }

  logError(errorInfo) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: errorInfo.message || 'Unknown error',
      source: errorInfo.source,
      lineno: errorInfo.lineno,
      colno: errorInfo.colno,
      stack: (errorInfo.error instanceof Error) ? errorInfo.error.stack : (errorInfo.reason instanceof Error ? errorInfo.reason.stack : undefined),
      details: errorInfo
    };
    this.errorLog.push(errorEntry);
    if (this.errorLog.length > this.maxErrors) this.errorLog.shift();
    console.error('ErrorHandler Log:', errorEntry);
  }

  displayError(message) {
    if (!this.domReady || !this.errorNotification || !this.errorMessage) return;
    try {
      this.errorMessage.textContent = message;
      this.errorNotification.classList.add('visible');
      setTimeout(() => this.hideError(), 6000);
    } catch (e) {
      console.error("ErrorHandler: Failed to display error message.", e);
    }
  }

  hideError() {
    if (this.errorNotification) {
      try { this.errorNotification.classList.remove('visible'); }
      catch (e) { console.error("ErrorHandler: Failed to hide error notification.", e); }
    }
  }

  attemptRecovery(func, context = null, fallback = null) {
    try { return func.call(context); }
    catch (error) {
      this.logError({ message: `Execution failed in ${func.name || 'anonymous'}`, error });
      this.displayError(`Operation failed: ${error.message}`);
      if (typeof fallback === 'function') {
        try { return fallback.call(context); }
        catch (fallbackError) { this.logError({ message: `Fallback failed for ${func.name || 'anonymous'}`, error: fallbackError }); }
      }
      return undefined;
    }
  }
}
const errorHandler = new ErrorHandler();

/* =========================
   Cookie Manager (unchanged)
   ========================= */
const CookieManager = {
  setCookie(name, value, hours) {
    errorHandler.attemptRecovery(() => {
      let expires = "";
      if (hours) {
        const date = new Date();
        date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
        expires = `expires=${date.toUTCString()}`;
      }
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      document.cookie = `${name}=${encodeURIComponent(stringValue)};${expires};path=/;SameSite=Lax`;
    });
  },
  getCookie(name) {
    return errorHandler.attemptRecovery(() => {
      const nameEQ = `${name}=`;
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) === 0) {
          const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
          try { return JSON.parse(value); } catch (e) { return value; }
        }
      }
      return null;
    }, null, () => null);
  },
  deleteCookie(name) {
    errorHandler.attemptRecovery(() => {
      document.cookie = `${name}=;Max-Age=-99999999;path=/;SameSite=Lax`;
    });
  }
};

/* =========================
   DOM Ready
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  errorHandler.attemptRecovery(() => {
    // --- Preloader ---
    const preloader = document.querySelector('.preloader');
    const progressBarElement = document.querySelector('.preloader-progress .progress-bar');
    const progressText = document.querySelector('.progress-text');
    const preloaderText = document.querySelector('.preloader-text');
    let preloaderInterval = null;

    if (preloader && progressBarElement && progressText && preloaderText) {
      const text = "LOADING...";
      preloaderText.innerHTML = text.split('').map((char, i) => `<span class="preloader-char" style="--char-index:${i}">${char}</span>`).join('');
      const preloaderChars = preloaderText.querySelectorAll('.preloader-char');

      let progress = 0;
      progressBarElement.classList.add('active');

      preloaderInterval = setInterval(() => {
        try {
          progress += 1;
          const displayProgress = Math.min(progress, 100);
          progressText.textContent = `${displayProgress}%`;

          if (displayProgress > 20 && displayProgress < 80) {
            preloaderChars.forEach((char, index) => {
              char.style.setProperty('--char-index', index);
              char.classList.add('wave');
            });
          } else {
            preloaderChars.forEach(char => char.classList.remove('wave'));
          }

          if (displayProgress >= 100) {
            clearInterval(preloaderInterval);
            preloaderInterval = null;
            setTimeout(() => {
              errorHandler.attemptRecovery(() => {
                preloader.classList.add('hidden');
                initializePage();
              });
            }, 500);
          }
        } catch (intervalError) {
          console.error("Error inside preloader interval:", intervalError);
          if (preloaderInterval) clearInterval(preloaderInterval);
          preloaderInterval = null;
          preloader.classList.add('hidden');
          errorHandler.displayError("Loading failed. Please refresh.");
        }
      }, 40);
    } else {
      if (preloader) preloader.style.display = 'none';
      initializePage();
    }

    /* =========================
       Initialize Page
       ========================= */
    function initializePage() {
      errorHandler.attemptRecovery(() => {
        // Sections observer
        const sections = document.querySelectorAll('section');
        const observerOptions = { root: null, threshold: 0.2 };
        if (sections.length > 0) {
          const sectionObserver = new IntersectionObserver((entries) => {
            errorHandler.attemptRecovery(() => {
              entries.forEach(entry => {
                const targetId = entry.target.id;
                if (entry.isIntersecting) {
                  entry.target.classList.add('in-view', 'active');
                  entry.target.classList.remove('out-of-view-up', 'out-of-view-down', 'zoom-down');
                  const sectionBgClass = `${targetId}-bg`;
                  if (!document.body.classList.contains(sectionBgClass)) {
                    document.body.classList.remove('hero-bg', 'mixes-bg', 'artist-bg', 'booking-bg');
                    document.body.classList.add(sectionBgClass);
                  }
                  if (targetId === 'mixes') {
                    document.querySelector('.mix-grid')?.classList.add('active');
                    document.querySelector('.mix-description')?.classList.add('active');
                  }
                  if (targetId === 'booking') {
                    document.querySelector('.neon-grid')?.classList.add('active');
                  }
                }
              });
            });
          }, observerOptions);
          sections.forEach(section => sectionObserver.observe(section));
        }

        // Scroll handlers / UI toggles
        const debounce = (func, wait) => {
          let timeout;
          return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => errorHandler.attemptRecovery(func, this, () => {}), wait);
          };
        };
        window.addEventListener('scroll', debounce(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const isMobile = window.innerWidth <= 768;
          document.querySelector('.back-to-top')?.classList.toggle('visible', scrollTop > 300);
          document.querySelector('.retro-nav')?.classList.toggle('scrolled', scrollTop > 50 || isMobile);

          // Flip back mix cards if mix section out of view
          const mixesSection = document.querySelector('#mixes');
          const mixCards = document.querySelectorAll('.mix-card');
          if (mixesSection && mixCards.length > 0) {
            const mixesRect = mixesSection.getBoundingClientRect();
            const threshold = window.innerHeight * 0.2;
            if (mixesRect.top > window.innerHeight - threshold || mixesRect.bottom < threshold) {
              mixCards.forEach(card => {
                if (card.classList.contains('flipped')) {
                  card.classList.remove('flipped');
                  const audio = card.querySelector('.mix-audio');
                  if (audio) audio.pause();
                }
              });
            }
          }
        }, 50));

        // Smooth anchors
        document.querySelectorAll('.retro-nav a, .neon-button[href^="#"], .back-to-top[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', (e) => {
            errorHandler.attemptRecovery(() => {
              const href = anchor.getAttribute('href');
              if (href && href.startsWith('#')) {
                e.preventDefault();
                document.getElementById(href.substring(1))?.scrollIntoView({ behavior: 'smooth' });
              }
            });
          });
        });

        // Mix card behaviors (including clones)
        bindMixCardInteractions(document);

        // NEW: 3D Sphere for mixes (progressive enhancement)
        initMixSphere();

        // NEW: Advanced tab toggle + Mastering Lab init
        initAdvancedTab();

        // Form handling (unchanged)
        initBookingForm();

        // Stickman (kept; minor robustness)
        initStickman();

        // Optional: show cube after delay
        setTimeout(() => document.querySelector('.retro-cube-container')?.classList.add('visible'), 1200);
      }, null, () => {
        errorHandler.displayError("Page initialization failed. Please refresh.");
        const preloader = document.querySelector('.preloader');
        if (preloader && !preloader.classList.contains('hidden')) preloader.classList.add('hidden');
      });
    } // initializePage
  }, null, () => {
    console.error("CRITICAL ERROR: DOMContentLoaded listener failed.");
    document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Critical Error Loading Page. Please Refresh.</h1>';
  });
});

/* =========================
   Mix Card Interactions (refactor)
   ========================= */
function bindMixCardInteractions(root = document) {
  const mixCards = root.querySelectorAll('.mix-card');
  let currentlyFlippedCard = null;
  mixCards.forEach(card => {
    if (card.dataset.initialized === '1') return;
    card.dataset.initialized = '1';
    const audio = card.querySelector('.mix-audio');
    if (!audio) return;
    let previewTimeout = null;

    card.addEventListener('mouseenter', () => {
      errorHandler.attemptRecovery(() => {
        if (!card.classList.contains('flipped')) {
          if (!audio.paused) audio.pause();
          audio.currentTime = 0;
          audio.play().catch(() => {});
          previewTimeout = setTimeout(() => { if (!audio.paused) audio.pause(); }, 5000);
        }
      });
    });

    card.addEventListener('mouseleave', () => {
      errorHandler.attemptRecovery(() => {
        if (!card.classList.contains('flipped')) {
          if (!audio.paused) audio.pause();
          clearTimeout(previewTimeout);
        }
      });
    });

    card.addEventListener('click', (e) => {
      errorHandler.attemptRecovery(() => {
        if (e.target.closest('audio')) return;
        if (currentlyFlippedCard && currentlyFlippedCard !== card) {
          currentlyFlippedCard.classList.remove('flipped');
          const previousAudio = currentlyFlippedCard.querySelector('.mix-audio');
          if (previousAudio) previousAudio.pause();
        }
        card.classList.toggle('flipped');
        currentlyFlippedCard = card.classList.contains('flipped') ? card : null;

        if (!card.classList.contains('flipped')) {
          if (!audio.paused) audio.pause();
          clearTimeout(previewTimeout);
        }
      });
    });
  });
}

/* =========================
   3D Sphere: Featured Mixes
   ========================= */
function initMixSphere() {
  const scene = document.querySelector('.mix-sphere-scene');
  const sphere = document.getElementById('mixSphere');
  if (!scene || !sphere) return;

  // Respect reduced motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sourceCards = document.querySelectorAll('.mix-grid .mix-card');
  if (sourceCards.length === 0) return;

  const N = Math.max(12, sourceCards.length * 4);           // number of items around sphere
  const radius = Math.min(360, Math.max(220, scene.clientWidth * 0.32)); // responsive radius
  sphere.style.setProperty('--sphere-rot-x', '-10deg');
  sphere.style.setProperty('--sphere-rot-y', '0deg');

  // Build items (clone existing cards)
  const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < N; i++) {
    const baseCard = sourceCards[i % sourceCards.length].cloneNode(true);
    baseCard.classList.add('sphere-card');
    baseCard.dataset.initialized = '0'; // rebind audio events on clones
    const wrapper = document.createElement('div');
    wrapper.className = 'sphere-item';

    // spherical distribution
    const phi = Math.acos(1 - 2 * (i + 0.5) / N); // [0, pi]
    const theta = golden * i;                     // spiral
    const phiDeg = (phi * 180 / Math.PI);
    const thetaDeg = (theta * 180 / Math.PI) % 360;

    // position & face camera: rotate to place, translate outward, rotate back
    wrapper.style.transform =
      `rotateY(${thetaDeg}deg) rotateX(${phiDeg - 90}deg) translateZ(${radius}px)
       rotateX(${-phiDeg + 90}deg) rotateY(${-thetaDeg}deg)`;

    wrapper.appendChild(baseCard);
    sphere.appendChild(wrapper);
  }

  // Bind interactions for cloned cards
  bindMixCardInteractions(sphere);

  // Interactivity: drag / inertia
  let rotX = -10, rotY = 0, velX = 0, velY = 0;
  const friction = 0.96;
  let dragging = false, lastX = 0, lastY = 0;
  let rafId = null;
  let autoY = reduceMotion ? 0 : 0.06; // gentle auto spin

  const update = () => {
    rotY += autoY + velY;
    rotX += velX;
    rotX = Math.max(-60, Math.min(60, rotX)); // clamp tilt
    sphere.style.setProperty('--sphere-rot-x', `${rotX}deg`);
    sphere.style.setProperty('--sphere-rot-y', `${rotY}deg`);
    velX *= friction; velY *= friction;
    rafId = requestAnimationFrame(update);
  };
  rafId = requestAnimationFrame(update);

  const onPointerDown = (e) => {
    dragging = true;
    lastX = e.clientX || e.touches?.[0]?.clientX || 0;
    lastY = e.clientY || e.touches?.[0]?.clientY || 0;
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const y = e.clientY || e.touches?.[0]?.clientY || 0;
    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x; lastY = y;
    velY = dx * 0.08;
    velX = dy * -0.08;
  };
  const onPointerUp = () => { dragging = false; };

  scene.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  scene.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp, { passive: true });

  // Pause rotation if scene out of view to save battery
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        if (rafId) cancelAnimationFrame(rafId), rafId = null;
      } else if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    });
  }, { threshold: 0.05 });
  io.observe(scene);
}

/* =========================
   Advanced Tab + Mastering Lab
   ========================= */
function initAdvancedTab() {
  const toggle = document.querySelector('.advanced-toggle');
  const panel = document.getElementById('advanced-tab');
  if (!toggle || !panel) return;

  let labInitialized = false;

  toggle.addEventListener('click', () => {
    errorHandler.attemptRecovery(() => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.querySelector('.arrow').textContent = expanded ? '▸' : '▾';
      if (expanded) {
        panel.setAttribute('hidden', '');
        panel.classList.remove('open');
      } else {
        panel.removeAttribute('hidden');
        panel.classList.add('open');
        if (!labInitialized) {
          initMasteringLab(panel);
          labInitialized = true;
        }
      }
    });
  });
}

/* Mastering Lab: create A/B tiles, crossfade, visualizer, upload */
function initMasteringLab(panel) {
  // Build existing demo tiles
  panel.querySelectorAll('.ab-compare').forEach(tile => {
    if (tile.dataset.initialized === '1') return;
    buildABTile(tile);
  });

  // Uploader
  const uploader = panel.querySelector('.lab-uploader');
  if (uploader && uploader.dataset.initialized !== '1') {
    uploader.dataset.initialized = '1';
    const btn = uploader.querySelector('.create-ab');
    btn.addEventListener('click', () => {
      errorHandler.attemptRecovery(() => {
        const fa = uploader.querySelector('.file-a');
        const fb = uploader.querySelector('.file-b');
        const tt = uploader.querySelector('.file-title');
        if (!fa.files[0] || !fb.files[0]) {
          errorHandler.displayError('Please choose both files (A and B).');
          return;
        }
        const aURL = URL.createObjectURL(fa.files[0]);
        const bURL = URL.createObjectURL(fb.files[0]);
        const title = tt.value.trim() || 'Custom Comparison';
        const tile = document.createElement('div');
        tile.className = 'ab-compare';
        tile.dataset.title = title;
        tile.dataset.aSrc = aURL;
        tile.dataset.bSrc = bURL;
        panel.insertBefore(tile, uploader);
        buildABTile(tile);
        tt.value = '';
        fa.value = '';
        fb.value = '';
      });
    });
  }
}

function buildABTile(tile) {
  tile.dataset.initialized = '1';
  const title = tile.dataset.title || 'Untitled';
  const aSrc = tile.dataset.aSrc || '';
  const bSrc = tile.dataset.bSrc || '';

  tile.innerHTML = `
    <div class="ab-frame">
      <div class="ab-top">
        <h4>${title}</h4>
        <div class="ab-controls">
          <button class="ab-play">Play</button>
          <button class="ab-pause">Pause</button>
          <div class="ab-toggle">
            <span>A</span>
            <label class="switch">
              <input type="checkbox" class="ab-ab">
              <span class="slider round"></span>
            </label>
            <span>B</span>
          </div>
          <label class="linker">
            <input type="checkbox" class="ab-link" checked>
            Link timelines
          </label>
        </div>
      </div>
      <div class="ab-visual">
        <canvas class="ab-canvas" width="900" height="140"></canvas>
      </div>
      <div class="ab-xfade">
        <span>A</span>
        <input type="range" class="ab-cross" min="0" max="1" value="0.35" step="0.01">
        <span>B</span>
      </div>
      <div class="ab-audio">
        <audio class="ab-a" preload="metadata" src="${aSrc}"></audio>
        <audio class="ab-b" preload="metadata" src="${bSrc}"></audio>
      </div>
    </div>
  `;

  // WebAudio & crossfade
  const audioA = tile.querySelector('.ab-a');
  const audioB = tile.querySelector('.ab-b');
  const btnPlay = tile.querySelector('.ab-play');
  const btnPause = tile.querySelector('.ab-pause');
  const abSwitch = tile.querySelector('.ab-ab');
  const linkChk = tile.querySelector('.ab-link');
  const slider = tile.querySelector('.ab-cross');
  const canvas = tile.querySelector('.ab-canvas');
  const ctx2d = canvas.getContext('2d');

  let AC;
  let srcA, srcB, gA, gB, analyser, rafId;
  let linked = true;

  const ensureAC = () => {
    if (AC) return;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    srcA = AC.createMediaElementSource(audioA);
    srcB = AC.createMediaElementSource(audioB);
    gA = AC.createGain();
    gB = AC.createGain();
    analyser = AC.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.85;

    srcA.connect(gA).connect(analyser);
    srcB.connect(gB).connect(analyser);
    analyser.connect(AC.destination);

    setCrossfade(parseFloat(slider.value));
  };

  function setCrossfade(v) {
    // equal-power crossfade
    const gainA = Math.cos(v * 0.5 * Math.PI);
    const gainB = Math.cos((1.0 - v) * 0.5 * Math.PI);
    if (gA && gB) {
      gA.gain.setTargetAtTime(gainA, AC.currentTime, 0.01);
      gB.gain.setTargetAtTime(gainB, AC.currentTime, 0.01);
    } else {
      // fallback: element volume
      audioA.volume = gainA; audioB.volume = gainB;
    }
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.save();
    // neon grid background
    ctx2d.globalAlpha = 0.35;
    for (let x = 0; x < w; x += 24) {
      ctx2d.fillStyle = '#00f7ff22';
      ctx2d.fillRect(x, 0, 1, h);
    }
    for (let y = 0; y < h; y += 18) {
      ctx2d.fillStyle = '#ff00ff18';
      ctx2d.fillRect(0, y, w, 1);
    }
    ctx2d.restore();

    if (analyser) {
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      const barW = (w / buf.length) * 1.6;
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i] / 255;
        const barH = Math.pow(v, 1.2) * (h - 12);
        const x = i * barW;
        const grad = ctx2d.createLinearGradient(0, h - barH, 0, h);
        grad.addColorStop(0, '#00f7ff');
        grad.addColorStop(1, '#ff00ff');
        ctx2d.fillStyle = grad;
        ctx2d.shadowBlur = 8;
        ctx2d.shadowColor = '#00f7ff';
        ctx2d.fillRect(x, h - barH, Math.max(1, barW - 2), barH);
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  // controls
  btnPlay.addEventListener('click', async () => {
    errorHandler.attemptRecovery(async () => {
      ensureAC();
      await audioA.play().catch(()=>{});
      await audioB.play().catch(()=>{});
      if (AC.state === 'suspended') await AC.resume();
      if (!rafId) rafId = requestAnimationFrame(draw);
    });
  });

  btnPause.addEventListener('click', () => {
    errorHandler.attemptRecovery(() => {
      audioA.pause(); audioB.pause();
      if (rafId) cancelAnimationFrame(rafId), rafId = null;
    });
  });

  slider.addEventListener('input', () => {
    errorHandler.attemptRecovery(() => setCrossfade(parseFloat(slider.value)));
  });

  // AB toggle (snaps to A/B extremes)
  abSwitch.addEventListener('change', () => {
    errorHandler.attemptRecovery(() => {
      const v = abSwitch.checked ? 1 : 0;
      slider.value = String(v);
      setCrossfade(v);
    });
  });

  linkChk.addEventListener('change', () => linked = linkChk.checked);

  // keep timelines linked if enabled
  const syncInterval = setInterval(() => {
    if (!linked || audioA.paused || audioB.paused) return;
    const diff = Math.abs(audioA.currentTime - audioB.currentTime);
    if (diff > 0.075) {
      if (audioA.currentTime > audioB.currentTime) audioB.currentTime = audioA.currentTime;
      else audioA.currentTime = audioB.currentTime;
    }
  }, 200);

  // pause drawing when tile is offscreen
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting && rafId) { cancelAnimationFrame(rafId); rafId = null; }
      else if (e.isIntersecting && !rafId && (!audioA.paused || !audioB.paused)) {
        rafId = requestAnimationFrame(draw);
      }
    });
  }, { threshold: 0.1 });
  io.observe(tile);

  // Clean up on unload
  window.addEventListener('beforeunload', () => {
    clearInterval(syncInterval);
    if (rafId) cancelAnimationFrame(rafId);
    try { AC && AC.close && AC.close(); } catch {}
  });
}

/* =========================
   Booking Form (unchanged)
   ========================= */
function initBookingForm() {
  const bookingForm = document.getElementById('booking-form');
  const formFlipper = document.querySelector('.form-flipper');
  const inputs = bookingForm ? Array.from(bookingForm.querySelectorAll('input, select')) : [];
  const finishButtonFront = document.querySelector('.finish-button-front');
  const finishGroup = document.querySelector('.form-group.finish-group');
  let filledFields = new Set();

  if (bookingForm && formFlipper && inputs.length > 0 && finishButtonFront && finishGroup) {
    const checkAllRequiredFieldsValidity = () => {
      return inputs.every(input => {
        const isRequired = input.hasAttribute('required');
        const hasValue = input.value.trim() !== '';
        return (!isRequired || hasValue) && input.checkValidity();
      });
    };

    inputs.forEach((input) => {
      const wrapper = input.closest('.input-wrapper');
      const label = wrapper?.querySelector('.input-label');
      const checkmark = wrapper?.querySelector('.checkmark');
      const formGroup = input.closest('.form-group');
      const fieldName = formGroup?.dataset.field;
      if (!wrapper || !label || !checkmark || !fieldName) return;

      input.addEventListener('focus', () => label.classList.add('has-focus'));
      input.addEventListener('blur', () => label.classList.remove('has-focus'));

      input.addEventListener('input', () => {
        errorHandler.attemptRecovery(() => {
          const isValid = input.checkValidity() && (input.value.trim() !== '' || !input.hasAttribute('required'));
          if (isValid) {
            if (!wrapper.classList.contains('flipped')) {
              wrapper.classList.add('flipped');
              checkmark.classList.add('glowing');
              filledFields.add(fieldName);
              if (checkAllRequiredFieldsValidity()) finishGroup.classList.add('active');
            }
          } else {
            if (wrapper.classList.contains('flipped')) {
              wrapper.classList.remove('flipped');
              checkmark.classList.remove('glowing');
              filledFields.delete(fieldName);
              finishGroup.classList.remove('active');
            }
          }
        });
      });

      checkmark.addEventListener('click', () => {
        errorHandler.attemptRecovery(() => {
          wrapper.classList.remove('flipped');
          checkmark.classList.remove('glowing');
          filledFields.delete(fieldName);
          finishGroup.classList.remove('active');
          input.focus();
        });
      });
    });

    finishButtonFront.addEventListener('click', (e) => {
      e.preventDefault();
      errorHandler.attemptRecovery(() => {
        inputs.forEach(input => input.dispatchEvent(new Event('input')));
        if (checkAllRequiredFieldsValidity()) {
          formFlipper.classList.add('flipped');
        } else {
          errorHandler.displayError('Please correct the invalid fields.');
          inputs.forEach(input => {
            if (!input.checkValidity()) {
              input.style.outline = '2px solid red';
              setTimeout(() => input.style.outline = '', 3000);
            }
          });
        }
      });
    });

    bookingForm.addEventListener('submit', (e) => {
      const submitButton = bookingForm.querySelector('button[type="submit"]');
      if (submitButton) { submitButton.textContent = "Booking..."; submitButton.disabled = true; }
      setTimeout(() => {
        errorHandler.attemptRecovery(() => {
          if (document.getElementById('booking-form')) {
            bookingForm.reset();
            if (submitButton) { submitButton.textContent = "Book Now!"; submitButton.disabled = false; }
            formFlipper.classList.remove('flipped');
            filledFields.clear();
            inputs.forEach(input => {
              const wrapper = input.closest('.input-wrapper');
              const checkmark = wrapper?.querySelector('.checkmark');
              wrapper?.classList.remove('flipped');
              checkmark?.classList.remove('glowing');
            });
            finishGroup?.classList.remove('active');
          }
        });
      }, 1500);
    });
  } else {
    console.error("Booking form or essentials not found.");
  }
}

/* =========================
   Stickman (existing)
   ========================= */
function initStickman() {
  const stickmanContainer = document.querySelector('.stickman-container');
  if (!stickmanContainer) return;

  errorHandler.attemptRecovery(() => {
    let stickman = stickmanContainer.querySelector('.stickman');
    if (!stickman) {
      stickman = document.createElement('div');
      stickman.classList.add('stickman');
      stickman.innerHTML = `
        <div class="stickman-head"></div><div class="stickman-body"></div>
        <div class="stickman-arm-left"></div><div class="stickman-arm-right"></div>
        <div class="stickman-leg-left"></div><div class="stickman-leg-right"></div>
        <div class="stickman-speech-bubble"><span class="stickman-speech-text"></span></div>`;
      stickmanContainer.appendChild(stickman);
    }

    const bookButton = document.querySelector('.neon-button[href="#booking"]');
    let position = 50;
    let direction = 1;
    let isWalking = false;
    const speechBubble = stickman.querySelector('.stickman-speech-bubble');
    const speechText = stickman.querySelector('.stickman-speech-text');

    const actions = [
      { name: 'walking', duration: 5000, message: 'Just strolling around!' },
      { name: 'jumping', duration: 1000, message: 'Whee!' },
      { name: 'dancing', duration: 3000, message: 'Feel the beat!' },
      { name: 'thinking', duration: 2000, message: 'Hmm...' },
      { name: 'looking', duration: 3000, message: 'What’s over there?' },
      { name: 'sleeping', duration: 4000, message: 'Zzz...' },
      { name: 'tripping', duration: 1000, message: 'Whoops!' },
      { name: 'pointing', duration: 2000, message: 'Look at that!' },
      { name: 'shrugging', duration: 2000, message: 'I don’t know!' },
      { name: 'facepalming', duration: 2000, message: 'Oh no...' },
      { name: 'waving', duration: 2000, message: 'Hey there!' },
      { name: 'fighting', duration: 3000, message: 'Take that!' },
      { name: 'laying', duration: 3000, message: 'Time for a break!' },
    ];
    if (bookButton) {
      actions.push({
        name: 'jumpOnButton',
        duration: 4000,
        message: 'Book a mix, huh?',
        action: () => {
          const buttonRect = bookButton.getBoundingClientRect();
          const targetX = buttonRect.left + window.scrollX + (buttonRect.width / 2) - (stickman.offsetWidth / 2);
          position = targetX;
          stickman.style.transform = `translateX(${position}px) scaleX(${direction})`;
          stickman.classList.add('jumping');
        }
      });
    }

    let currentActionTimeout = null;
    let walkFrameId = null;

    function performAction() {
      errorHandler.attemptRecovery(() => {
        clearTimeout(currentActionTimeout);
        cancelAnimationFrame(walkFrameId);

        const currentClasses = Array.from(stickman.classList).filter(cls => cls !== 'stickman');
        stickman.classList.remove(...currentClasses);

        const action = actions[Math.floor(Math.random() * actions.length)];
        stickman.classList.add(action.name);

        if (speechText) { speechText.textContent = action.message; speechBubble?.classList.add('visible'); }

        isWalking = (action.name === 'walking');

        if (action.action) action.action();
        if (isWalking) moveStickman();

        currentActionTimeout = setTimeout(() => {
          speechBubble?.classList.remove('visible');
          setTimeout(performAction, 500);
        }, action.duration);
      });
    }

    function moveStickman() {
      walkFrameId = requestAnimationFrame(() => {
        errorHandler.attemptRecovery(() => {
          if (!isWalking) return;
          position += direction * 1.5;
          const maxPos = window.innerWidth - stickman.offsetWidth - 10;
          const minPos = 10;
          if (position >= maxPos) { direction = -1; position = maxPos; }
          else if (position <= minPos) { direction = 1; position = minPos; }
          stickman.style.transform = `translateX(${position}px) scaleX(${direction})`;
          moveStickman();
        }, null, () => { isWalking = false; });
      });
    }

    stickman.style.transform = `translateX(${position}px) scaleX(${direction})`;
    performAction();
  });
}
