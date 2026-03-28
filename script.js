const FALLBACK_DATA = {
  artist: {
    name: 'Receipts',
    genre: ['Indie Pop', 'Indie Alternative', 'Indie Dream']
  },
  projects: [
    {
      id: 'midnight-receiver',
      title: 'Midnight Receiver',
      year: '2026',
      type: 'Single set',
      cover: 'assets/covers/cover-equinox.svg',
      description: 'Bright-edge songs for after-hours motion, neon reflection, and wide awake dreaming.',
      tracks: [
        {
          id: 'northbound',
          title: 'Northbound Light',
          duration: '3:18',
          mood: ['awake', 'electric'],
          audioSrc: 'audio/01-northbound-light.mp3'
        },
        {
          id: 'paper-sky',
          title: 'Paper Sky',
          duration: '2:56',
          mood: ['open', 'late'],
          audioSrc: 'audio/02-paper-sky.mp3'
        },
        {
          id: 'receiver',
          title: 'Receiver Bloom',
          duration: '4:02',
          mood: ['dream', 'glow'],
          audioSrc: 'audio/03-receiver-bloom.mp3'
        }
      ]
    },
    {
      id: 'soft-machines',
      title: 'Soft Machines',
      year: '2025',
      type: 'Project',
      cover: 'assets/covers/cover-monolith.svg',
      description: 'A cleaner, colder body of work with distance, symmetry, and low-lit pulse.',
      tracks: [
        {
          id: 'silver-hall',
          title: 'Silver Hall',
          duration: '3:42',
          mood: ['cinematic', 'soft'],
          audioSrc: 'audio/04-silver-hall.mp3'
        },
        {
          id: 'clean-fiction',
          title: 'Clean Fiction',
          duration: '3:09',
          mood: ['minimal', 'glass'],
          audioSrc: 'audio/05-clean-fiction.mp3'
        }
      ]
    },
    {
      id: 'after-image',
      title: 'After Image Geometry',
      year: '2024',
      type: 'Demos',
      cover: 'assets/covers/cover-pulse.svg',
      description: 'Sketches, fragments, and drafts with enough shape to keep returning to.',
      tracks: [
        {
          id: 'haze-index',
          title: 'Haze Index',
          duration: '2:31',
          mood: ['restless', 'night'],
          audioSrc: 'audio/06-haze-index.mp3'
        },
        {
          id: 'open-purpose',
          title: 'Open Purpose',
          duration: '3:47',
          mood: ['lift', 'purpose'],
          audioSrc: 'audio/07-open-purpose.mp3'
        },
        {
          id: 'signal-veil',
          title: 'Signal Veil',
          duration: '4:14',
          mood: ['wide', 'mist'],
          audioSrc: 'audio/08-signal-veil.mp3'
        }
      ]
    }
  ]
};

const state = {
  data: FALLBACK_DATA,
  queue: [],
  currentIndex: -1,
  currentFilter: 'all',
  isSeeking: false,
  toastTimer: null
};

const dom = {
  audio: document.getElementById('audio'),
  playLatest: document.getElementById('play-latest'),
  playFeatured: document.getElementById('play-featured'),
  togglePlayback: document.getElementById('toggle-playback'),
  nextTrack: document.getElementById('next-track'),
  prevTrack: document.getElementById('prev-track'),
  seekbar: document.getElementById('seekbar'),
  currentTime: document.getElementById('current-time'),
  totalTime: document.getElementById('total-time'),
  playerTitle: document.getElementById('player-title'),
  playerProject: document.getElementById('player-project'),
  playerCover: document.getElementById('player-cover'),
  releaseGrid: document.getElementById('release-grid'),
  featuredCover: document.getElementById('featured-cover'),
  featuredType: document.getElementById('featured-type'),
  featuredYear: document.getElementById('featured-year'),
  featuredTitle: document.getElementById('featured-title'),
  featuredDescription: document.getElementById('featured-description'),
  featuredTracklist: document.getElementById('featured-tracklist'),
  filterRow: document.getElementById('filter-row'),
  toast: document.getElementById('toast'),
  heroStage: document.getElementById('hero-stage'),
  year: document.getElementById('year')
};

init();

async function init() {
  dom.year.textContent = new Date().getFullYear();
  state.data = await loadTrackData();
  state.queue = flattenTracks(state.data.projects || []);

  renderFeatured(state.data.projects?.[0]);
  renderReleaseGrid();
  wireEvents();
  setupRevealAnimations();
  setupHeroParallax();

  if (state.queue.length > 0) {
    loadTrack(0, { autoplay: false });
  }
}

async function loadTrackData() {
  try {
    const response = await fetch('data/tracks.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (!json || !Array.isArray(json.projects)) throw new Error('Invalid track data');
    return json;
  } catch (error) {
    console.warn('Using fallback track data.', error);
    return FALLBACK_DATA;
  }
}

function flattenTracks(projects) {
  return projects.flatMap((project) =>
    (project.tracks || []).map((track, index) => ({
      ...track,
      queueKey: `${project.id}:${track.id}`,
      releaseId: project.id,
      releaseTitle: project.title,
      releaseYear: project.year,
      releaseType: project.type,
      releaseDescription: project.description,
      cover: project.cover,
      displayIndex: index + 1
    }))
  );
}

function renderFeatured(project) {
  if (!project) return;

  dom.featuredCover.src = project.cover;
  dom.featuredCover.alt = `${project.title} artwork`;
  dom.featuredType.textContent = project.type || 'Release';
  dom.featuredYear.textContent = project.year || '';
  dom.featuredTitle.textContent = project.title;
  dom.featuredDescription.textContent = project.description || '';

  dom.featuredTracklist.innerHTML = (project.tracks || [])
    .map((track, index) => {
      const queueIndex = state.queue.findIndex((item) => item.queueKey === `${project.id}:${track.id}`);
      const mood = Array.isArray(track.mood) ? track.mood.join(' · ') : '';

      return `
        <button
          class="featured-track-row"
          type="button"
          data-action="play-track"
          data-queue-index="${queueIndex}"
        >
          <span class="track-index-badge">${String(index + 1).padStart(2, '0')}</span>
          <span class="track-title-wrap">
            <span class="track-title">${escapeHtml(track.title)}</span>
            <span class="track-meta">${escapeHtml(mood || 'Receipts')}</span>
          </span>
          <span class="release-track-time">${escapeHtml(track.duration || '0:00')}</span>
        </button>
      `;
    })
    .join('');
}

function renderReleaseGrid() {
  const projects = Array.isArray(state.data.projects) ? state.data.projects : [];
  const activeFilter = state.currentFilter;
  const visibleProjects = activeFilter === 'all'
    ? projects
    : projects.filter((project) => normalizeFilterValue(project.type) === activeFilter);

  if (!visibleProjects.length) {
    dom.releaseGrid.innerHTML = '<p class="section-copy">No releases match that filter yet.</p>';
    return;
  }

  dom.releaseGrid.innerHTML = visibleProjects
    .map((project) => {
      const tracksMarkup = (project.tracks || [])
        .map((track, index) => {
          const queueIndex = state.queue.findIndex((item) => item.queueKey === `${project.id}:${track.id}`);
          const mood = Array.isArray(track.mood) ? track.mood.join(' · ') : '';
          return `
            <button
              class="release-track-row"
              type="button"
              data-action="play-track"
              data-queue-index="${queueIndex}"
            >
              <span class="track-index-badge">${String(index + 1).padStart(2, '0')}</span>
              <span class="track-title-wrap">
                <span class="track-title">${escapeHtml(track.title)}</span>
                <span class="release-track-mood">${escapeHtml(mood || project.type || 'Release')}</span>
              </span>
              <span class="release-track-time">${escapeHtml(track.duration || '0:00')}</span>
            </button>
          `;
        })
        .join('');

      const projectStartIndex = state.queue.findIndex((item) => item.releaseId === project.id);

      return `
        <article class="release-card" data-release-id="${escapeHtml(project.id)}">
          <div class="release-card-top">
            <div class="release-cover">
              <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)} artwork" />
            </div>

            <div class="release-copy">
              <div class="release-header">
                <span class="pill">${escapeHtml(project.type || 'Release')}</span>
                <span class="release-year">${escapeHtml(project.year || '')}</span>
              </div>
              <h3 class="release-title">${escapeHtml(project.title)}</h3>
              <p class="release-description">${escapeHtml(project.description || '')}</p>
              <div class="release-button-row">
                <button class="release-button" type="button" data-action="play-release" data-release-id="${escapeHtml(project.id)}">Play release</button>
                <button class="release-button" type="button" data-action="play-track" data-queue-index="${projectStartIndex}">Play first track</button>
              </div>
            </div>
          </div>

          <div class="release-tracklist">${tracksMarkup}</div>
        </article>
      `;
    })
    .join('');

  syncActiveTrackUI();
}

function wireEvents() {
  dom.playLatest.addEventListener('click', () => {
    if (!state.queue.length) {
      showToast('No tracks found yet. Add songs inside data/tracks.json.');
      return;
    }
    loadTrack(0, { autoplay: true });
  });

  dom.playFeatured.addEventListener('click', () => {
    const firstProject = state.data.projects?.[0];
    if (!firstProject) return;
    const queueIndex = state.queue.findIndex((item) => item.releaseId === firstProject.id);
    if (queueIndex >= 0) {
      loadTrack(queueIndex, { autoplay: true });
    }
  });

  dom.releaseGrid.addEventListener('click', handleGridClick);
  dom.featuredTracklist.addEventListener('click', handleGridClick);

  dom.filterRow.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const filterValue = target.dataset.filter;
    if (!filterValue) return;

    state.currentFilter = filterValue;
    dom.filterRow.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.classList.toggle('is-active', chip === target);
    });
    renderReleaseGrid();
  });

  dom.togglePlayback.addEventListener('click', () => {
    if (state.currentIndex < 0 && state.queue.length > 0) {
      loadTrack(0, { autoplay: true });
      return;
    }

    if (dom.audio.paused) {
      playCurrentTrack();
    } else {
      pauseCurrentTrack();
    }
  });

  dom.nextTrack.addEventListener('click', () => stepTrack(1));
  dom.prevTrack.addEventListener('click', () => stepTrack(-1));

  dom.audio.addEventListener('timeupdate', updateProgress);
  dom.audio.addEventListener('loadedmetadata', updateDuration);
  dom.audio.addEventListener('ended', () => stepTrack(1));
  dom.audio.addEventListener('error', () => {
    pauseCurrentTrack();
    showToast('Audio file missing. Add the track file to your /audio folder and keep the path matched in data/tracks.json.');
  });

  dom.seekbar.addEventListener('input', () => {
    state.isSeeking = true;
    if (!Number.isFinite(dom.audio.duration)) return;
    const nextTime = (Number(dom.seekbar.value) / 100) * dom.audio.duration;
    dom.currentTime.textContent = formatTime(nextTime);
  });

  dom.seekbar.addEventListener('change', () => {
    if (!Number.isFinite(dom.audio.duration)) {
      state.isSeeking = false;
      return;
    }
    dom.audio.currentTime = (Number(dom.seekbar.value) / 100) * dom.audio.duration;
    state.isSeeking = false;
  });

  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement) {
      const tagName = event.target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      dom.togglePlayback.click();
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault();
      stepTrack(1);
    }

    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      stepTrack(-1);
    }
  });
}

function handleGridClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const playTrackButton = target.closest('[data-action="play-track"]');
  if (playTrackButton instanceof HTMLButtonElement) {
    const queueIndex = Number(playTrackButton.dataset.queueIndex);
    if (!Number.isFinite(queueIndex) || queueIndex < 0) return;

    if (queueIndex === state.currentIndex) {
      dom.audio.paused ? playCurrentTrack() : pauseCurrentTrack();
    } else {
      loadTrack(queueIndex, { autoplay: true });
    }
    return;
  }

  const playReleaseButton = target.closest('[data-action="play-release"]');
  if (playReleaseButton instanceof HTMLButtonElement) {
    const releaseId = playReleaseButton.dataset.releaseId;
    const queueIndex = state.queue.findIndex((item) => item.releaseId === releaseId);
    if (queueIndex >= 0) {
      loadTrack(queueIndex, { autoplay: true });
    }
  }
}

function loadTrack(queueIndex, options = {}) {
  const track = state.queue[queueIndex];
  if (!track) return;

  state.currentIndex = queueIndex;
  dom.audio.src = track.audioSrc;
  dom.audio.load();

  dom.playerTitle.textContent = track.title;
  dom.playerProject.textContent = `${track.releaseTitle} · ${track.releaseType}`;
  dom.playerCover.src = track.cover;
  dom.playerCover.alt = `${track.releaseTitle} artwork`;
  dom.togglePlayback.textContent = options.autoplay ? '❚❚' : '▶';
  dom.currentTime.textContent = '0:00';
  dom.totalTime.textContent = track.duration || '0:00';
  dom.seekbar.value = 0;

  syncActiveTrackUI();

  if (options.autoplay) {
    playCurrentTrack();
  }
}

async function playCurrentTrack() {
  if (state.currentIndex < 0) return;

  try {
    await dom.audio.play();
    dom.togglePlayback.textContent = '❚❚';
    syncActiveTrackUI();
  } catch (error) {
    console.warn('Playback failed.', error);
    showToast('Playback was blocked by the browser. Try pressing play again.');
    dom.togglePlayback.textContent = '▶';
  }
}

function pauseCurrentTrack() {
  dom.audio.pause();
  dom.togglePlayback.textContent = '▶';
  syncActiveTrackUI();
}

function stepTrack(direction) {
  if (!state.queue.length) return;
  const current = state.currentIndex < 0 ? 0 : state.currentIndex;
  const nextIndex = (current + direction + state.queue.length) % state.queue.length;
  loadTrack(nextIndex, { autoplay: true });
}

function updateProgress() {
  if (!Number.isFinite(dom.audio.duration)) return;

  if (!state.isSeeking) {
    dom.seekbar.value = ((dom.audio.currentTime / dom.audio.duration) * 100).toFixed(3);
    dom.currentTime.textContent = formatTime(dom.audio.currentTime);
  }
}

function updateDuration() {
  dom.totalTime.textContent = Number.isFinite(dom.audio.duration)
    ? formatTime(dom.audio.duration)
    : '0:00';
}

function syncActiveTrackUI() {
  const allTrackRows = document.querySelectorAll('[data-queue-index]');
  allTrackRows.forEach((row) => {
    const queueIndex = Number(row.getAttribute('data-queue-index'));
    const isActive = queueIndex === state.currentIndex;
    row.classList.toggle('is-active', isActive);
  });

  const isPlaying = !dom.audio.paused && state.currentIndex >= 0;
  dom.togglePlayback.textContent = isPlaying ? '❚❚' : '▶';
}

function setupRevealAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupHeroParallax() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !dom.heroStage) return;

  const frame = dom.heroStage.querySelector('.stage-frame');
  if (!frame) return;

  dom.heroStage.addEventListener('pointermove', (event) => {
    const rect = dom.heroStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    frame.style.transform = `perspective(1200px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`;
  });

  dom.heroStage.addEventListener('pointerleave', () => {
    frame.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  });
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('is-visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    dom.toast.classList.remove('is-visible');
  }, 3400);
}

function normalizeFilterValue(value) {
  return String(value || '').trim().toLowerCase();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
