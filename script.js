/*************************
 * Utils + Error Handling
 *************************/
function handleImageError(img) {
  try {
    console.warn(`Image failed: ${img.src}. Hiding.`);
    img.style.display = 'none';
  } catch (e) { console.error(e); }
}

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
      if (this.errorClose) this.errorClose.addEventListener('click', () => this.hideError());
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
      this.displayError(`Async Error: ${reasonMsg || 'Promise rejected'}`);
    });
  }
  logError(e) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: e.message || 'Unknown',
      source: e.source,
      lineno: e.lineno,
      colno: e.colno,
      stack: (e.error instanceof Error) ? e.error.stack : (e.reason instanceof Error ? e.reason.stack : undefined),
      details: e
    };
    this.errorLog.push(entry);
    if (this.errorLog.length > this.maxErrors) this.errorLog.shift();
    console.error('ErrorHandler Log:', entry);
  }
  displayError(message) {
    if (!this.domReady || !this.errorNotification || !this.errorMessage) return;
    try {
      this.errorMessage.textContent = message;
      this.errorNotification.classList.add('visible');
      setTimeout(() => this.hideError(), 6000);
    } catch (e) { console.error("Failed to display error", e); }
  }
  hideError() {
    try { this.errorNotification?.classList.remove('visible'); } catch(e){ console.error(e); }
  }
  attemptRecovery(fn, context = null, fallback = null) {
    try { return fn.call(context); }
    catch (error) {
      this.logError({ message: `Execution failed in ${fn.name || 'anon'}`, error });
      this.displayError(`Operation failed: ${error.message}`);
      if (typeof fallback === 'function') {
        try { return fallback.call(context); }
        catch (fallbackError) { this.logError({ message: `Fallback failed for ${fn.name || 'anon'}`, error: fallbackError }); }
      }
    }
  }
}
const errorHandler = new ErrorHandler();

const CookieManager = {
  setCookie(name, value, hours){
    errorHandler.attemptRecovery(() => {
      let expires = "";
      if(hours){ const d=new Date(); d.setTime(d.getTime() + hours*60*60*1000); expires=`expires=${d.toUTCString()}`; }
      const v = typeof value === 'string' ? value : JSON.stringify(value);
      document.cookie = `${name}=${encodeURIComponent(v)};${expires};path=/;SameSite=Lax`;
    });
  },
  getCookie(name){
    return errorHandler.attemptRecovery(() => {
      const nameEQ=`${name}=`;
      const ca=document.cookie.split(';');
      for(let c of ca){ c=c.trim(); if(c.indexOf(nameEQ)===0){
        const value=decodeURIComponent(c.substring(nameEQ.length));
        try { return JSON.parse(value); } catch { return value; }
      }}
      return null;
    }, null, () => null);
  },
  deleteCookie(name){
    errorHandler.attemptRecovery(() => {
      document.cookie=`${name}=;Max-Age=-99999999;path=/;SameSite=Lax`;
    });
  }
};

/*******************
 * Main Boot
 *******************/
document.addEventListener('DOMContentLoaded', () => {
  errorHandler.attemptRecovery(() => {
    /* ---------- Preloader ---------- */
    const preloader = document.querySelector('.preloader');
    const progressBarEl = document.querySelector('.preloader-progress .progress-bar');
    const progressText = document.querySelector('.progress-text');
    const preloaderText = document.querySelector('.preloader-text');
    let preloaderInterval = null;

    if (preloader && progressBarEl && progressText && preloaderText) {
      const text = "LOADING...";
      preloaderText.innerHTML = text.split('').map((ch,i)=>`<span class="preloader-char" style="--char-index:${i}">${ch}</span>`).join('');
      const chars = preloaderText.querySelectorAll('.preloader-char');

      let progress = 0;
      progressBarEl.classList.add('active');
      preloaderInterval = setInterval(() => {
        try {
          progress += 1;
          const display = Math.min(progress, 100);
          progressText.textContent = `${display}%`;
          if (display > 20 && display < 80) chars.forEach((c,i)=>{ c.style.setProperty('--char-index', i); c.classList.add('wave'); });
          else chars.forEach(c=>c.classList.remove('wave'));
          if (display >= 100) {
            clearInterval(preloaderInterval);
            setTimeout(()=> {
              errorHandler.attemptRecovery(()=> {
                preloader.classList.add('hidden');
                initializePage();
              });
            }, 400);
          }
        } catch (e) {
          if (preloaderInterval) clearInterval(preloaderInterval);
          preloader.classList.add('hidden');
          errorHandler.displayError("Loading failed. Please refresh.");
        }
      }, 40);
    } else {
      preloader?.style && (preloader.style.display='none');
      initializePage();
    }

    /* ---------- Initialize Page ---------- */
    function initializePage(){

      /* ====== Cosmic Starfield Canvas ====== */
      const starCanvas = document.getElementById('bg-stars');
      if (starCanvas) {
        const ctx = starCanvas.getContext('2d');
        let w,h, stars=[], count=350, mx=0, my=0;
        function resize(){
          w = starCanvas.width = window.innerWidth;
          h = starCanvas.height = window.innerHeight;
          stars = Array.from({length:count}, () => ({
            x: Math.random()*w,
            y: Math.random()*h,
            z: Math.random()*1 + 0.2, // depth
            s: Math.random()*1.3 + .2 // size
          }));
        }
        function draw(){
          ctx.clearRect(0,0,w,h);
          ctx.globalCompositeOperation = 'lighter';
          for(const st of stars){
            const dx = (mx - w/2) * 0.00004;
            const dy = (my - h/2) * 0.00004;
            st.x += dx * (1.2/st.z);
            st.y += dy * (1.2/st.z);

            // drift
            st.x += 0.05 * (1.5 - st.z);
            if (st.x > w+10) st.x = -10;
            if (st.x < -10) st.x = w+10;

            const alpha = 0.6 * (2 - st.z);
            ctx.fillStyle = `rgba(0,247,255,${alpha})`;
            ctx.beginPath(); ctx.arc(st.x, st.y, st.s*(2-st.z), 0, Math.PI*2); ctx.fill();

            if (Math.random() < 0.003) { ctx.fillStyle = `rgba(255,0,255,0.4)`; ctx.fillRect(st.x, st.y, 1.5, 1.5); }
          }
          requestAnimationFrame(draw);
        }
        resize(); draw();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', (e)=>{ mx=e.clientX; my=e.clientY; }, {passive:true});
      }

      /* ====== Intersection Observer & Section theming ====== */
      const sections = document.querySelectorAll('section');
      const observer = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            e.target.classList.add('in-view','active');
            const id = e.target.id;
            const cls = `${id}-bg`;
            document.body.classList.remove('hero-bg','mixes-bg','artist-bg','booking-bg');
            document.body.classList.add(cls);
            if(id==='mixes'){
              document.querySelector('.mix-grid')?.classList.add('active');
              document.querySelector('.mix-description')?.classList.add('active');
            }
            if(id==='booking') document.querySelector('.neon-grid')?.classList.add('active');
          }
        });
      }, {threshold:0.2});
      sections.forEach(s=>observer.observe(s));

      /* ====== Scroll UI (Back-to-top, Sticky opacity, Progress) ====== */
      const backToTop = document.querySelector('.back-to-top');
      const nav = document.querySelector('.retro-nav');
      const progressBar = document.querySelector('.scroll-progress span');
      let lastScrollTop = 0;

      const onScroll = () => {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        backToTop?.classList.toggle('visible', st > 300);
        nav?.classList.toggle('scrolled', st > 50 || window.innerWidth <= 768);
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct = Math.max(0, Math.min(100, (st/docH)*100));
        if (progressBar) progressBar.style.width = pct + '%';

        // Flip back audio cards when mixes out of view
        const mixesSection = document.querySelector('#mixes');
        const mixCards = document.querySelectorAll('.mix-card');
        if (mixesSection && mixCards.length>0) {
          const r = mixesSection.getBoundingClientRect();
          const thresh = window.innerHeight * 0.2;
          if (r.top > window.innerHeight - thresh || r.bottom < thresh) {
            mixCards.forEach(card=>{
              if (card.classList.contains('flipped')){
                card.classList.remove('flipped');
                card.querySelector('.mix-audio')?.pause();
              }
            });
          }
        }
        lastScrollTop = st <= 0 ? 0 : st;
      };
      window.addEventListener('scroll', onScroll, {passive:true});
      onScroll();

      /* ====== Smooth scroll for anchor links ====== */
      document.querySelectorAll('.retro-nav a, .neon-button[href^="#"], .back-to-top[href^="#"]').forEach(a=>{
        a.addEventListener('click',(e)=>{
          const href = a.getAttribute('href');
          if (href && href.startsWith('#')){
            e.preventDefault();
            document.getElementById(href.substring(1))?.scrollIntoView({behavior:'smooth'});
          }
        });
      });

      /* ====== Mix Cards: flip + hover preview ====== */
      const mixCards = document.querySelectorAll('.mix-card');
      let flippedCard = null;
      mixCards.forEach(card=>{
        const audio = card.querySelector('.mix-audio');
        if (!audio) return;
        let previewTimeout = null;

        card.addEventListener('mouseenter', ()=>{
          if(!card.classList.contains('flipped')){
            try { audio.currentTime=0; audio.play(); } catch {}
            previewTimeout = setTimeout(()=>{ if(!audio.paused) audio.pause(); }, 5000);
          }
        });
        card.addEventListener('mouseleave', ()=>{
          if(!card.classList.contains('flipped')) { audio.pause(); clearTimeout(previewTimeout); }
        });
        card.addEventListener('click', (e)=>{
          if (e.target.closest('audio')) return;
          if (flippedCard && flippedCard !== card){
            flippedCard.classList.remove('flipped');
            flippedCard.querySelector('.mix-audio')?.pause();
          }
          card.classList.toggle('flipped');
          flippedCard = card.classList.contains('flipped') ? card : null;
          if (!card.classList.contains('flipped')) { audio.pause(); clearTimeout(previewTimeout); }
        });
      });

      /* ====== Form Flip + Validation ====== */
      const bookingForm = document.getElementById('booking-form');
      const formFlipper = document.querySelector('.form-flipper');
      const inputs = bookingForm ? Array.from(bookingForm.querySelectorAll('input, select')) : [];
      const finishButtonFront = document.querySelector('.finish-button-front');
      const finishGroup = document.querySelector('.form-group.finish-group');

      function allValid(){
        return inputs.every(input=>{
          const req = input.hasAttribute('required');
          const has = input.value.trim() !== '';
          return (!req || has) && input.checkValidity();
        });
      }

      if (bookingForm && formFlipper && inputs.length && finishButtonFront && finishGroup){
        const filled = new Set();
        inputs.forEach(input=>{
          const wrapper = input.closest('.input-wrapper');
          const label = wrapper?.querySelector('.input-label');
          const checkmark = wrapper?.querySelector('.checkmark');
          const group = input.closest('.form-group');
          const fieldName = group?.dataset.field;
          if (!wrapper || !label || !checkmark || !fieldName) return;

          input.addEventListener('focus', ()=> label.classList.add('has-focus'));
          input.addEventListener('blur', ()=> label.classList.remove('has-focus'));

          input.addEventListener('input', ()=>{
            const valid = input.checkValidity() && (input.value.trim() !== '' || !input.hasAttribute('required'));
            if (valid){
              if (!wrapper.classList.contains('flipped')){
                wrapper.classList.add('flipped');
                checkmark.classList.add('glowing');
                filled.add(fieldName);
                if (allValid()) finishGroup.classList.add('active');
              }
            } else {
              if (wrapper.classList.contains('flipped')){
                wrapper.classList.remove('flipped');
                checkmark.classList.remove('glowing');
                filled.delete(fieldName);
                finishGroup.classList.remove('active');
              }
            }
          });

          checkmark.addEventListener('click', ()=>{
            wrapper.classList.remove('flipped');
            checkmark.classList.remove('glowing');
            filled.delete(fieldName);
            finishGroup.classList.remove('active');
            input.focus();
          });
        });

        finishButtonFront.addEventListener('click', (e)=>{
          e.preventDefault();
          inputs.forEach(i=>i.dispatchEvent(new Event('input')));
          if (allValid()) formFlipper.classList.add('flipped');
          else {
            errorHandler.displayError('Please correct the invalid fields.');
            inputs.forEach(i=>{
              if(!i.checkValidity()){
                i.style.outline = '2px solid red';
                setTimeout(()=> i.style.outline='', 2000);
              }
            });
          }
        });

        bookingForm.addEventListener('submit',(e)=>{
          const submitBtn = bookingForm.querySelector('button[type="submit"]');
          if (submitBtn){ submitBtn.textContent = "Booking..."; submitBtn.disabled = true; }
          setTimeout(()=>{
            if (document.getElementById('booking-form')){
              bookingForm.reset();
              if (submitBtn){ submitBtn.textContent="Book Now!"; submitBtn.disabled=false; }
              formFlipper.classList.remove('flipped');
              inputs.forEach(i=>{
                const w = i.closest('.input-wrapper');
                const c = w?.querySelector('.checkmark');
                w?.classList.remove('flipped'); c?.classList.remove('glowing');
              });
              finishGroup?.classList.remove('active');
            }
          }, 1500);
        });
      }

      /* ====== Retro cube entrance ====== */
      document.querySelector('.retro-cube-container')?.classList.add('visible');

      /* ====== Tilt / Parallax on .tiltable ====== */
      const tiltables = document.querySelectorAll('[data-tilt]');
      tiltables.forEach(el=>{
        el.addEventListener('mousemove', (e)=>{
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          const rx = (py * -10).toFixed(2);
          const ry = (px * 10).toFixed(2);
          el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
          el.style.setProperty('--mx', `${e.clientX - r.left}px`);
          el.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
        el.addEventListener('mouseleave', ()=>{ el.style.transform=''; });
      });

      /* ====== Secret/Easter events ====== */
      const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
      let buffer = [];
      window.addEventListener('keydown', (e)=>{
        buffer.push(e.key);
        if (buffer.length > konami.length) buffer.shift();
        if (konami.every((k,i)=>buffer[i]===k)){
          buffer = [];
          partyMode();
        }
      });
      function partyMode(){
        document.body.classList.add('party-mode');
        confettiBurst(300);
        setTimeout(()=>document.body.classList.remove('party-mode'), 8000);
      }
      function confettiBurst(n=120){
        const cont = document.querySelector('.section-particles');
        const colors = ['#00f7ff','#ff00ff','#ffffff'];
        for (let i=0;i<n;i++){
          const p = document.createElement('div');
          p.className='section-particle active';
          p.style.left = Math.random()*100+'vw';
          p.style.top = '0px';
          p.style.background = colors[Math.floor(Math.random()*colors.length)];
          cont.appendChild(p);
          const dy = 80 + Math.random()*120;
          const dx = (Math.random()-0.5)*60;
          p.animate([
            { transform:`translate(0,0)`, opacity:1},
            { transform:`translate(${dx}vw, ${dy}vh)`, opacity:0}
          ], { duration: 1800+Math.random()*1200, easing:'cubic-bezier(.22,.61,.36,1)', fill:'forwards' });
          setTimeout(()=> p.remove(), 3200);
        }
      }

      /* ====== STICKMAN v2 (Stable) ====== */
      const stickmanContainer = document.querySelector('.stickman-container');
      (function initStickman(){
        if (!stickmanContainer) { console.warn('No stickman container'); return; }
        let wrap = document.createElement('div');
        wrap.className = 'stickman-wrap';
        let sm = document.createElement('div');
        sm.className = 'stickman';
        sm.innerHTML = `
          <div class="stickman-head"></div>
          <div class="stickman-body"></div>
          <div class="stickman-arm-left"></div>
          <div class="stickman-arm-right"></div>
          <div class="stickman-leg-left"></div>
          <div class="stickman-leg-right"></div>
          <div class="stickman-speech-bubble"><span class="stickman-speech-text"></span></div>
        `;
        wrap.appendChild(sm);
        stickmanContainer.appendChild(wrap);

        const speechBubble = sm.querySelector('.stickman-speech-bubble');
        const speechText = sm.querySelector('.stickman-speech-text');

        // Horizontal motion on WRAP
        let x = 50;
        let dir = 1; // 1 -> right, -1 -> left
        let walkRAF = null;
        let isWalking = false;

        function setWrapTransform(){ wrap.style.transform = `translateX(${x}px) scaleX(${dir})`; }

        function walk(speed=1.6){
          isWalking = true;
          sm.classList.add('walking');
          (function step(){
            if (!isWalking){ sm.classList.remove('walking'); return; }
            x += dir * speed;
            const max = window.innerWidth - wrap.offsetWidth - 10;
            const min = 10;
            if (x >= max) { dir = -1; x = max; }
            else if (x <= min) { dir = 1; x = min; }
            setWrapTransform();
            walkRAF = requestAnimationFrame(step);
          })();
        }
        function stopWalk(){ isWalking = false; if (walkRAF) cancelAnimationFrame(walkRAF); sm.classList.remove('walking'); }
        function say(msg='', dur=2200){ if (!speechBubble || !speechText) return;
          speechText.textContent = msg; speechBubble.classList.add('visible');
          setTimeout(()=>speechBubble.classList.remove('visible'), dur);
        }
        function jump(){ sm.classList.add('jumping'); setTimeout(()=>sm.classList.remove('jumping'), 650); }
        function spin(){ sm.classList.add('spin'); setTimeout(()=>sm.classList.remove('spin'), 1200); }
        function wave(){ sm.classList.add('waving'); setTimeout(()=>sm.classList.remove('waving'), 1600); }
        function pushups(ms=2000){ sm.classList.add('pushups'); setTimeout(()=>sm.classList.remove('pushups'), ms); }
        function sleep(ms=2500){ sm.classList.add('sleep'); setTimeout(()=>sm.classList.remove('sleep'), ms); }
        function peek(){ sm.classList.add('peek'); setTimeout(()=>sm.classList.remove('peek'), 1200); }
        function dance(style='a', ms=2500){ sm.classList.add(`dance-${style}`); setTimeout(()=>sm.classList.remove(`dance-${style}`), ms); }

        async function goToElementCenter(el, speed=2.0){
          const rect = el.getBoundingClientRect();
          const target = rect.left + window.scrollX + (rect.width/2) - (wrap.offsetWidth/2);
          return new Promise(resolve=>{
            stopWalk();
            const step = ()=>{
              const delta = target - x;
              if (Math.abs(delta) < 2){ x = target; setWrapTransform(); resolve(); return; }
              dir = delta > 0 ? 1 : -1;
              x += Math.sign(delta)*Math.min(Math.abs(delta), speed*2.4);
              setWrapTransform();
              requestAnimationFrame(step);
            };
            step();
          });
        }

        const baseSpeeches = [
          "Just strolling!", "Whee!", "Feel the beat!", "Hmm...", "What’s over there?",
          "Zzz...", "Whoops!", "Look at that!", "I don’t know!", "Oh no...", "Hey there!",
          "Take that!", "Break time!", "Moonwalk mode!", "Beat drop!", "Book a mix?!",
          "Clean that snare.", "Tighten the low end.", "Stereo vibe!", "Reverb in 3..2.."
        ];

        const actions = {
          walkRight: ()=>{ dir=1; walk(1.7); return wait(3000).then(stopWalk); },
          walkLeft: ()=>{ dir=-1; walk(1.7); return wait(3000).then(stopWalk); },
          randomWalk: ()=>{ dir = Math.random()>0.5?1:-1; walk(1.2 + Math.random()*1.2); return wait(2500+Math.random()*2500).then(stopWalk); },
          hop: ()=>{ jump(); say("Hop!"); return wait(700); },
          spin: ()=>{ spin(); say("Spin!"); return wait(1300); },
          wave: ()=>{ wave(); say("Hi!"); return wait(1700); },
          pushups: ()=>{ pushups(2000); say("Grinding."); return wait(2100); },
          sleep: ()=>{ sleep(2500); say("Zzz..."); return wait(2600); },
          dance: ()=>{ const st = Math.random()>0.5?'a':'a'; dance(st, 2500); say("Groove!"); return wait(2600); },
          peek: ()=>{ peek(); say("Peek."); return wait(1200); },
          bookJump: async ()=>{
            const btn = document.querySelector('a[href="#booking"]'); // FIXED selector
            if (!btn) return actions.hop();
            await goToElementCenter(btn, 2.2);
            dir = 1; setWrapTransform(); jump(); say("Book a mix, huh?");
            return wait(900);
          },
          cardTour: async ()=>{
            const cards = [...document.querySelectorAll('.mix-card')];
            if (!cards.length) return actions.randomWalk();
            const card = cards[Math.floor(Math.random()*cards.length)];
            await goToElementCenter(card, 2.0);
            say("Nice mix!"); peek(); return wait(1200);
          },
          moonwalk: ()=>{
            dir = -1; walk(0.8); wave();
            say("Moonwalk!");
            return wait(2500).then(stopWalk);
          }
        };

        const behaviorPool = [];
        const baseList = [ 'walkRight','walkLeft','randomWalk','hop','spin','wave','pushups','sleep','dance','peek','bookJump','cardTour','moonwalk' ];
        for (let i=0;i<220;i++){
          const key = baseList[Math.floor(Math.random()*baseList.length)];
          behaviorPool.push(async ()=> {
            const msg = baseSpeeches[Math.floor(Math.random()*baseSpeeches.length)];
            if (Math.random()<0.5) say(msg, 2000+Math.random()*1500);
            await actions[key]();
            if (key==='bookJump' && Math.random()<0.4) confettiBurst(60);
          });
        }

        const seenKey = 'stickman_seen';
        let seen = CookieManager.getCookie(seenKey) || 0;

        async function loop(){
          try {
            const idx = (seen++) % behaviorPool.length;
            CookieManager.setCookie(seenKey, seen, 24*30);
            await behaviorPool[idx]();
            setTimeout(loop, 300 + Math.random()*900);
          } catch(e){ console.error(e); setTimeout(loop, 1200); }
        }

        setWrapTransform();
        loop();

        const booking = document.getElementById('booking');
        if (booking){
          const bObs = new IntersectionObserver((entries)=>{
            if(entries.some(en=>en.isIntersecting)){
              say("Let’s lock a date!");
              setTimeout(()=> actions.bookJump(), 800);
            }
          }, {threshold:0.4});
          bObs.observe(booking);
        }
      })();

      /* ====== Retro Cube interactions ====== */
      const cubeContainer = document.querySelector('.retro-cube-container');
      const cube = document.querySelector('.retro-cube');
      const timer = document.querySelector('.countdown-timer');
      if (cube && cubeContainer && timer){
        const closeBtns = cube.querySelectorAll('.cube-close');
        closeBtns.forEach(btn => btn.addEventListener('click', (e)=>{ e.stopPropagation(); cubeContainer.classList.add('timer-mode'); startCountdown(9); }));
        cube.addEventListener('click', ()=>{ cube.classList.add('roll-to-timer'); setTimeout(()=>{ cubeContainer.classList.add('timer-mode'); startCountdown(12); }, 600); });
      }
      function startCountdown(minutes=10){
        const m1 = document.querySelector('.minutes-1');
        const m2 = document.querySelector('.minutes-2');
        const s1 = document.querySelector('.seconds-1');
        const s2 = document.querySelector('.seconds-2');
        let total = minutes*60;
        const t = setInterval(()=>{
          total--;
          const mm = Math.max(0, Math.floor(total/60));
          const ss = Math.max(0, total%60);
          const mmStr = String(mm).padStart(2,'0');
          const ssStr = String(ss).padStart(2,'0');
          if (m1) m1.textContent = mmStr[0];
          if (m2) m2.textContent = mmStr[1];
          if (s1) s1.textContent = ssStr[0];
          if (s2) s2.textContent = ssStr[1];
          if (total <= 0) {
            clearInterval(t);
            timer?.classList.add('expired');
          }
        }, 1000);
      }

      /* ====== Audio-reactive hero bars ====== */
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const bars = document.querySelectorAll('.sound-bar');

          function animateBars(){
            requestAnimationFrame(animateBars);
            analyser.getByteFrequencyData(dataArray);
            for (let i=0;i<bars.length;i++){
              const v = dataArray[i%dataArray.length]/255;
              bars[i].style.height = (10 + v*90) + 'px';
            }
          }

          document.querySelectorAll('audio').forEach(a=>{
            a.addEventListener('play', async ()=>{
              try {
                if (!a._connectedToAnalyser) {
                  const src = ctx.createMediaElementSource(a);
                  src.connect(analyser);
                  analyser.connect(ctx.destination);
                  a._connectedToAnalyser = true;
                }
                if (ctx.state === 'suspended') await ctx.resume();
              } catch(e){ /* ignore duplicate connect */ }
            });
          });
          animateBars();
        }
      } catch(e){ /* ignore */ }

    } // initializePage
  }, null, () => {
    console.error("CRITICAL ERROR: DOMContentLoaded failed.");
    document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Critical Error Loading Page. Please Refresh.</h1>';
  });
});

/*******************
 * Helpers
 *******************/
function wait(ms){ return new Promise(res=>setTimeout(res, ms)); }
