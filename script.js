// Wrap everything in a protective scope & enable strict mode
(function() {
    'use strict';

    // ========= GLOBAL DEBUG FLAG =========
    const DEBUG_MODE = true; // Set to true to enable extra console logs

    // ========= TOP LEVEL ERROR CATCH =========
    // Catch any errors missed by other handlers (last resort)
    try {

        if (DEBUG_MODE) console.log("Script execution started.");

        // ==================================
        // Error Handling Service
        // ==================================
        class ErrorHandler {
            // ... (ErrorHandler class code remains the same as previous version) ...
            constructor() {
                this.errorNotification = document.querySelector('.error-notification');
                this.errorMessage = document.querySelector('.error-message');
                this.errorClose = document.querySelector('.error-close');
                this.errorLog = [];
                this.maxErrors = 50;
                // Ensure setup runs only once
                if (!window._errorHandlerInitialized) {
                    this.setupErrorListeners();
                    window._errorHandlerInitialized = true;
                }
            }

            setupErrorListeners() {
                if (DEBUG_MODE) console.log("Setting up global error listeners.");
                if (!this.errorNotification || !this.errorMessage || !this.errorClose) {
                    console.warn('Error notification elements not fully found. Display errors might not work.');
                }

                window.onerror = (message, source, lineno, colno, error) => {
                    const errorDetails = { message, source, lineno, colno, error: error ? error.stack : 'N/A' };
                    this.logError(errorDetails);
                    this.displayError(`JS Error: ${message} at ${source}:${lineno}`);
                    return true; // Prevent default browser error handling
                };

                window.addEventListener('unhandledrejection', (event) => {
                    const reason = event.reason instanceof Error ? event.reason.stack : event.reason;
                    this.logError({ message: 'Unhandled Promise Rejection', reason: reason });
                    this.displayError(`Promise Error: ${event.reason}`);
                });

                if (this.errorClose) {
                    this.errorClose.addEventListener('click', () => {
                        this.hideError();
                    });
                }
            }

            logError(error) {
                try {
                    const logEntry = {
                        timestamp: new Date().toISOString(),
                        ...error
                    };
                    this.errorLog.push(logEntry);
                    if (this.errorLog.length > this.maxErrors) {
                        this.errorLog.shift(); // Remove oldest error
                    }
                    // Use console.error for actual errors
                    console.error('ErrorHandler Log:', logEntry);
                } catch (logFailError) {
                    console.error("FATAL: Failed to log error:", logFailError); // Avoid infinite loops
                }
            }

            displayError(message) {
                if (this.errorNotification && this.errorMessage) {
                    this.errorMessage.textContent = message;
                    this.errorNotification.classList.add('visible');
                    // Auto-hide after 7 seconds
                    if (this.hideTimeout) clearTimeout(this.hideTimeout); // Clear previous timeout
                    this.hideTimeout = setTimeout(() => this.hideError(), 7000);
                } else {
                    console.error("DISPLAY ERROR (UI not found):", message);
                }
            }

            hideError() {
                if (this.errorNotification) {
                    this.errorNotification.classList.remove('visible');
                }
                clearTimeout(this.hideTimeout);
            }

            attemptRecovery(func, fallback) {
                const funcName = func.name || 'anonymous function';
                try {
                     if (DEBUG_MODE) console.log(`Attempting operation: ${funcName}`);
                    return func();
                } catch (error) {
                    this.logError({
                        message: `Caught error during operation: ${funcName} - ${error.message}`,
                        error: error.stack || error,
                        functionName: funcName
                    });
                    this.displayError(`Operation failed: ${funcName}. Attempting recovery.`);
                    if (DEBUG_MODE) console.warn(`Fallback triggered for ${funcName}`);

                    if (typeof fallback === 'function') {
                        try {
                            return fallback();
                        } catch (fallbackError) {
                            this.logError({ message: `Fallback function failed for ${funcName}: ${fallbackError.message}`, error: fallbackError.stack || fallbackError });
                            this.displayError(`Recovery fallback failed: ${fallbackError.message}`);
                        }
                    }
                    return fallback;
                }
            }
        }

        const errorHandler = new ErrorHandler();
        if (DEBUG_MODE) console.log("ErrorHandler instantiated.");


        // ==================================
        // Cookie Utility Functions
        // ==================================
        const CookieManager = {
            // ... (CookieManager code remains the same as previous version) ...
            setCookie(name, value, hours) {
                errorHandler.attemptRecovery(() => {
                    let expires = "";
                    if (hours) {
                        const date = new Date();
                        date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
                        expires = "; expires=" + date.toUTCString();
                    }
                    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"; // Added SameSite
                    if (DEBUG_MODE) console.log(`Cookie set: ${name}=${value}`);
                }, () => console.error(`Failed to set cookie: ${name}`));
            },

            getCookie(name) {
                return errorHandler.attemptRecovery(() => {
                    const nameEQ = name + "=";
                    const ca = document.cookie.split(';');
                    for (let i = 0; i < ca.length; i++) {
                        let c = ca[i];
                        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                        if (c.indexOf(nameEQ) === 0) {
                             const value = c.substring(nameEQ.length, c.length);
                             if (DEBUG_MODE) console.log(`Cookie get: ${name}=${value}`);
                             return value;
                        }
                    }
                    if (DEBUG_MODE) console.log(`Cookie get: ${name} not found`);
                    return null;
                }, () => {
                    console.error(`Failed to get cookie: ${name}`);
                    return null; // Ensure null return on failure
                });
            },

            deleteCookie(name) {
                errorHandler.attemptRecovery(() => {
                    document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Lax'; // More robust deletion
                    if (DEBUG_MODE) console.log(`Cookie delete attempt: ${name}`);
                }, () => console.error(`Failed to delete cookie: ${name}`));
            }
        };


        // ==================================
        // Preloader Logic (REVISED FOR DEBUGGING)
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
            if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Preloader");
            const preloader = document.querySelector('.preloader');

            // --- Fallback Hider ---
            // Failsafe: If something goes wrong, hide preloader after a max time
            const failsafeTimeout = setTimeout(() => {
                if (preloader && !preloader.classList.contains('hidden')) {
                     console.warn("Preloader failsafe triggered: Hiding preloader after timeout.");
                     preloader.classList.add('hidden');
                }
            }, 8000); // Hide after 8 seconds max if it's still there

            // --- Main Preloader Logic ---
            errorHandler.attemptRecovery(() => {
                if (!preloader) {
                     console.warn("Preloader element not found.");
                     clearTimeout(failsafeTimeout); // No need for failsafe if element doesn't exist
                     return;
                }
                if (DEBUG_MODE) console.log("Preloader element found.");

                const preloaderChars = preloader.querySelectorAll('.preloader-char');
                const progressBar = preloader.querySelector('.progress-bar');
                const progressText = preloader.querySelector('.progress-text');

                // Explicitly check if all elements were found
                if (!preloaderChars || preloaderChars.length === 0) { console.warn("Preloader characters not found."); }
                if (!progressBar) { console.warn("Preloader progress bar not found."); }
                if (!progressText) { console.warn("Preloader progress text not found."); }

                if (preloaderChars.length > 0 && progressBar && progressText) {
                    if (DEBUG_MODE) console.log("All preloader sub-elements found.");

                    let progress = 0;
                    const totalDuration = 4000; // Target duration in ms
                    let startTime = null;
                    let animationFrameId = null;

                    function step(timestamp) {
                        if (!startTime) startTime = timestamp;
                        const elapsed = timestamp - startTime;
                        progress = Math.min((elapsed / totalDuration) * 100, 100);

                        // Update progress bar style (use ::after width)
                        const progressBarAfter = progressBar.querySelector('::after'); // This won't work, style pseudo-elements differently
                        progressBar.style.setProperty('--progress-width', `${progress}%`); // Use CSS variable if set up, OR...
                        // Note: Directly styling ::after from JS is tricky. Using the 'active' class + CSS transition is better.

                        progressText.textContent = `${Math.floor(progress)}%`;

                        if (progress < 100) {
                            animationFrameId = requestAnimationFrame(step);
                        } else {
                            if (DEBUG_MODE) console.log("Preloader progress reached 100%");
                        }
                    }

                    // Start progress bar animation via class (CSS handles the transition)
                    progressBar.classList.add('active');
                    if (DEBUG_MODE) console.log("Progress bar 'active' class added.");

                    // Start text update via requestAnimationFrame
                    animationFrameId = requestAnimationFrame(step);
                    if (DEBUG_MODE) console.log("Progress text update loop started.");

                    // Start text wave animation after a delay
                    setTimeout(() => {
                        preloaderChars.forEach((char, index) => {
                            char.style.setProperty('--char-index', index);
                            char.classList.add('wave');
                        });
                         if (DEBUG_MODE) console.log("Preloader text wave animation started.");
                    }, 500);

                    // Hide preloader after duration + fade time
                    const hideDelay = totalDuration + 500; // Wait for progress bar + buffer
                    if (DEBUG_MODE) console.log(`Scheduling preloader hide in ${hideDelay}ms`);
                    setTimeout(() => {
                        // Ensure animation frame is cancelled if hiding occurs
                        if (animationFrameId) cancelAnimationFrame(animationFrameId);
                        preloader.classList.add('hidden');
                        clearTimeout(failsafeTimeout); // Cancel failsafe, successful hide
                        if (DEBUG_MODE) console.log("Preloader hidden successfully.");
                    }, hideDelay);

                } else {
                    // If sub-elements are missing, hide immediately
                    console.warn('Preloader sub-elements missing. Hiding preloader immediately.');
                    preloader.classList.add('hidden');
                    clearTimeout(failsafeTimeout); // Cancel failsafe
                }
            }, () => { // Fallback for attemptRecovery specific to preloader
                console.error('Error during preloader initialization logic. Forcing hide.');
                if (preloader) {
                    preloader.classList.add('hidden');
                }
                clearTimeout(failsafeTimeout); // Cancel failsafe
            });
        });


        // ==================================
        // Smooth Scrolling & Navigation
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
             if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Smooth Scroll");
            errorHandler.attemptRecovery(() => {
                const sections = document.querySelectorAll('section');
                const sectionParticles = document.querySelector('.section-particles');
                const nav = document.querySelector('.retro-nav');
                const backToTop = document.querySelector('.back-to-top');

                if (!sections.length) {
                    console.warn("No <section> elements found for smooth scrolling.");
                    return;
                } else {
                     if (DEBUG_MODE) console.log(`Found ${sections.length} sections.`);
                }
                if (!nav) console.warn("Navigation element '.retro-nav' not found.");
                if (!backToTop) console.warn("Back-to-top element '.back-to-top' not found.");

                let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                let currentSectionIndex = 0;
                let isUpdating = false; // Flag to prevent rapid updates
                let scrollTimeout = null; // Timeout for scroll end detection

                function findCurrentSectionIndex() {
                    // ... (findCurrentSectionIndex remains the same) ...
                     let closestSectionIndex = 0;
                     let minDistance = Infinity;
                     const viewportCenter = window.innerHeight / 2;

                     sections.forEach((section, index) => {
                         try { // Add try-catch around getBoundingClientRect
                            const rect = section.getBoundingClientRect();
                            const sectionCenter = rect.top + rect.height / 2;
                            const distance = Math.abs(viewportCenter - sectionCenter);

                            if (distance < minDistance) {
                                minDistance = distance;
                                closestSectionIndex = index;
                            }
                         } catch (e) {
                             console.error(`Error getting rect for section ${index}: ${e}`);
                         }
                     });
                     return closestSectionIndex;
                }


                function updateSections(scrollDirection, targetIndex = null, forceUpdate = false) {
                    // ... (updateSections remains largely the same, ensure logging is conditional) ...
                     if (isUpdating && !forceUpdate) return;
                    isUpdating = true;

                    const oldIndex = currentSectionIndex;

                    if (targetIndex !== null && targetIndex >= 0 && targetIndex < sections.length) {
                        currentSectionIndex = targetIndex;
                    } else {
                         currentSectionIndex = findCurrentSectionIndex();
                    }
                    currentSectionIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex));

                    if (oldIndex === currentSectionIndex && !forceUpdate) {
                        isUpdating = false;
                        return;
                    }
                    if (DEBUG_MODE) console.log(`Updating sections view. Old: ${oldIndex}, New: ${currentSectionIndex}, Target: ${targetIndex}`);


                    sections.forEach((section, index) => {
                        section.classList.remove('in-view', 'out-of-view-up', 'out-of-view-down');
                        if (index < currentSectionIndex) section.classList.add('out-of-view-up');
                        else if (index === currentSectionIndex) section.classList.add('in-view');
                        else section.classList.add('out-of-view-down');
                    });

                    const isMobile = window.innerWidth <= 768;
                    if (!isMobile && sections[currentSectionIndex]) {
                        const sectionId = sections[currentSectionIndex].id;
                        if (sectionId) {
                            document.body.className = '';
                            document.body.classList.add(`${sectionId}-bg`);
                        }
                    }

                    if (sectionParticles) {
                         // ... (particle logic remains the same) ...
                        sectionParticles.innerHTML = '';
                        const particleCount = isMobile ? 5 : 15;
                        for (let i = 0; i < particleCount; i++) {
                            const particle = document.createElement('div');
                            particle.classList.add('section-particle');
                            const side = Math.random() < 0.5 ? 'left' : 'right';
                            const x = side === 'left' ? Math.random() * -10 - 5 : window.innerWidth + Math.random() * 10 + 5;
                            const y = Math.random() * window.innerHeight;
                            particle.style.left = `${x}px`;
                            particle.style.top = `${y}px`;
                            sectionParticles.appendChild(particle);

                            setTimeout(() => {
                                particle.classList.add('active');
                                const endX = side === 'left' ? (50 + Math.random() * 100) : (window.innerWidth - 50 - Math.random() * 100);
                                const endY = y + Math.random() * 40 - 20;
                                particle.style.transform = `translate(${endX - x}px, ${endY - y}px)`;
                            }, i * 40);

                            setTimeout(() => { particle.remove(); }, 1000 + i * 40);
                        }
                    }

                     setTimeout(() => { isUpdating = false; }, 300);
                }

                const debounce = (func, wait) => {
                    // ... (debounce remains the same) ...
                    let timeout;
                    return (...args) => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => func.apply(this, args), wait);
                    };
                };

                const handleScroll = () => {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const isMobile = window.innerWidth <= 768;

                    if (nav) { /* Update nav style */ }
                    if (backToTop) { /* Update back-to-top visibility */ }

                     // Clear previous scroll end timeout
                     clearTimeout(scrollTimeout);

                    // Set timeout to run updateSections after scroll stops
                     scrollTimeout = setTimeout(() => {
                         if (DEBUG_MODE) console.log("Scroll ended, updating section view.");
                         const newIndex = findCurrentSectionIndex();
                         if (newIndex !== currentSectionIndex) {
                            updateSections(null, newIndex);
                         }
                     }, 150); // Adjust delay as needed (e.g., 150ms)


                    // Mix Card Audio Pause (immediate check is fine)
                    const mixesSection = document.querySelector('#mixes');
                    if (mixesSection) { /* Pause audio logic */ }

                    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                };

                 // Use throttle or simple scroll listener instead of debounce for immediate feedback on nav/button
                 window.addEventListener('scroll', () => {
                     const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                     const isMobile = window.innerWidth <= 768;

                     if (nav) {
                         if (scrollTop > 50 || isMobile) nav.classList.add('scrolled');
                         else nav.classList.remove('scrolled');
                     }
                     if (backToTop) {
                         if (scrollTop > 300) backToTop.classList.add('visible');
                         else backToTop.classList.remove('visible');
                     }
                      // Call the scroll end logic handler as well
                      handleScroll();

                 }, { passive: true }); // Use passive listener for performance


                // Navigation Click Listener
                document.querySelectorAll('a[href^="#"]').forEach(anchorLink => {
                    // ... (click listener remains the same, ensure logging is conditional) ...
                    anchorLink.addEventListener('click', (e) => {
                        const href = anchorLink.getAttribute('href');
                        if (href && href.length > 1 && href.startsWith('#')) {
                            e.preventDefault();
                            const targetId = href.substring(1);
                            if (!targetId) return errorHandler.logError({ message: "Nav click: Empty ID", href: href });
                            const targetSection = document.getElementById(targetId);
                            if (!targetSection) return errorHandler.logError({ message: `Nav click: Target #${targetId} not found`, href: href });

                            const sectionIndex = Array.from(sections).indexOf(targetSection);
                            if (sectionIndex === -1) return errorHandler.logError({ message: `Nav click: Target #${targetId} not tracked`, href: href });

                             if (DEBUG_MODE) console.log(`Navigating to section: ${targetId} (index ${sectionIndex})`);
                             clearTimeout(scrollTimeout); // Prevent scroll end update during nav
                             isUpdating = false; // Allow immediate update

                            updateSections(null, sectionIndex, true); // Force update

                            // Scroll into view (use block: 'start' for consistency)
                             targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                            if (targetId === 'mixes') { /* Mixes specific logic */ }

                        } else if (href === "#") {
                            e.preventDefault();
                            if (DEBUG_MODE) console.log("Empty hash link clicked, scrolling top.");
                            window.scrollTo({ top: 0, behavior: 'smooth'});
                        }
                    });
                });

                // Initial State Setup
                currentSectionIndex = findCurrentSectionIndex();
                 if (DEBUG_MODE) console.log(`Initial section index: ${currentSectionIndex}`);
                updateSections(null, currentSectionIndex, true);
                 handleScroll(); // Run once to set initial states

            }, () => { /* Fallback */ });
        });

        // ==================================
        // Sound Wave Interaction
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
             if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Sound Wave");
            // ... (Sound wave code remains the same, ensure logging is conditional) ...
            errorHandler.attemptRecovery(() => {
                const heroSection = document.querySelector('.hero');
                const soundWaveContainer = document.querySelector('.sound-wave-container');
                const soundBars = soundWaveContainer?.querySelectorAll('.sound-bar');

                if (heroSection && soundWaveContainer && soundBars?.length > 0) {
                    if (DEBUG_MODE) console.log("Sound wave elements found.");
                     const updateBars = (x, y) => { /* ... */ };
                     const resetBars = () => { /* ... */ };
                     const handleMouseMove = (e) => { /* ... */ };
                     const handleTouchMove = (e) => { /* ... */ };

                     heroSection.addEventListener('mousemove', handleMouseMove);
                     heroSection.addEventListener('mouseleave', resetBars);
                     heroSection.addEventListener('touchmove', handleTouchMove, { passive: true });
                     heroSection.addEventListener('touchend', resetBars);
                     heroSection.addEventListener('touchcancel', resetBars);
                } else {
                    console.warn('Sound wave elements not found.');
                }
            }, () => console.log('Failed to initialize sound wave interaction'));

        });

        // ==================================
        // Mixes Section Animation (Observer)
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
            if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Mixes Observer");
            // ... (Mixes observer code remains the same, ensure logging is conditional) ...
             errorHandler.attemptRecovery(() => {
                 const mixesSection = document.querySelector('#mixes');
                 if (!mixesSection) return;
                 if (DEBUG_MODE) console.log("Mixes section found.");

                 const mixGrid = mixesSection.querySelector('.mix-grid');
                 const mixDescription = mixesSection.querySelector('.mix-description');

                 if (mixGrid || mixDescription) {
                     const observerOptions = { rootMargin: '0px 0px -15% 0px', threshold: 0.1 };
                     const observer = new IntersectionObserver((entries) => {
                         entries.forEach(entry => {
                             if (entry.isIntersecting) {
                                 if (DEBUG_MODE) console.log("Mixes section intersecting.");
                                 mixGrid?.classList.add('active');
                                 mixDescription?.classList.add('active');
                                 // observer.unobserve(entry.target); // Optional: Unobserve
                             }
                         });
                     }, observerOptions);
                     observer.observe(mixesSection);
                 } else {
                      console.warn("Mix grid or description not found within mixes section.");
                 }
             }, () => console.log('Failed to initialize mixes section animation observer'));
        });

        // ==================================
        // Artist & Booking Section Fade-in (Observer)
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
             if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing General Section Observer");
            // ... (General section observer remains the same, ensure logging is conditional) ...
              errorHandler.attemptRecovery(() => {
                  const sectionsToObserve = document.querySelectorAll('#artist, #booking');
                  if (!sectionsToObserve.length) return;
                  if (DEBUG_MODE) console.log(`Observing fade-in for ${sectionsToObserve.length} sections.`);

                  const observerOptions = { threshold: 0.2 };
                  const sectionObserver = new IntersectionObserver((entries, observer) => {
                      entries.forEach(entry => {
                          if (entry.isIntersecting) {
                              if (DEBUG_MODE) console.log(`Section intersecting: #${entry.target.id}`);
                              entry.target.classList.add('in-view');
                              observer.unobserve(entry.target);
                          }
                      });
                  }, observerOptions);
                  sectionsToObserve.forEach(section => sectionObserver.observe(section));
              }, () => console.log('Failed to initialize general section fade-in animations'));
        });


        // ==================================
        // Mix Card Flip & Audio Preview
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
             if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Mix Card Interactions");
            // ... (Mix card code remains the same, ensure logging is conditional) ...
             errorHandler.attemptRecovery(() => {
                 const mixCards = document.querySelectorAll('.mix-card');
                 if (!mixCards.length) return console.warn("No mix cards found.");
                 if (DEBUG_MODE) console.log(`Initializing ${mixCards.length} mix cards.`);

                 let currentlyFlippedCard = null;
                 let currentlyPlayingAudio = null;
                 let previewTimeout = null;

                 const stopCurrentAudio = () => { /* ... */ };

                 mixCards.forEach(card => {
                     const inner = card.querySelector('.mix-card-inner');
                     const audio = card.querySelector('.mix-audio');
                     if (!inner || !audio) return;

                     // Add listeners (mouseenter, mouseleave, click, audio play/pause)
                 });
             }, () => console.log('Failed to initialize mix card interactions'));
        });

        // ==================================
        // Booking Form Interaction
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
            if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Booking Form");
            // ... (Booking form code remains the same, ensure logging is conditional, added placeholder attribute to HTML inputs for CSS selector) ...
              errorHandler.attemptRecovery(() => {
                  const bookingForm = document.getElementById('booking-form');
                  if (!bookingForm) return console.warn("Booking form not found.");
                  if (DEBUG_MODE) console.log("Booking form found.");

                  // Query elements and add listeners (focusin, focusout, touchstart, input blur/keypress, back click, finish click, submit)
                   // Ensure requiredFields logic and checkAllRequiredFieldsFlipped work correctly.
                   // Added placeholder=" " to input fields in HTML to help CSS :not(:placeholder-shown) selector.

              }, () => console.log('Failed to initialize booking form interactions'));
        });

        // ==================================
        // 3D Retro Cube & Countdown Timer
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
             if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Cube/Timer");
             errorHandler.attemptRecovery(() => {
                const cubeContainer = document.querySelector('.retro-cube-container');
                const cube = cubeContainer?.querySelector('.retro-cube');
                const countdownTimer = cubeContainer?.querySelector('.countdown-timer');
                const closeButtons = cube?.querySelectorAll('.cube-close');
                // Corrected timer digit selection based on updated HTML structure
                const timerDigits = {
                    hours1: countdownTimer?.querySelector('.timer-digit.hours-1'),
                    hours2: countdownTimer?.querySelector('.timer-digit.hours-2'),
                    minutes1: countdownTimer?.querySelector('.timer-digit.minutes-1'),
                    minutes2: countdownTimer?.querySelector('.timer-digit.minutes-2'),
                    seconds1: countdownTimer?.querySelector('.timer-digit.seconds-1'),
                    seconds2: countdownTimer?.querySelector('.timer-digit.seconds-2')
                };

                if (!cubeContainer || !cube || !countdownTimer || !closeButtons || closeButtons.length === 0 || Object.values(timerDigits).some(digit => !digit)) {
                    console.warn('Retro cube or timer elements are missing or incomplete. Feature disabled.');
                    cubeContainer?.remove();
                    return;
                }
                 if (DEBUG_MODE) console.log("Cube/Timer elements found.");

                const PROMO_DURATION_HOURS = 3;
                const totalSeconds = PROMO_DURATION_HOURS * 60 * 60;
                let remainingSeconds;
                let countdownInterval = null;
                let rotationInterval = null;
                const timerEndCookieName = 'promoTimerEnd';
                const timerVisibleCookieName = 'promoTimerVisible';

                const timerEndTimestamp = CookieManager.getCookie(timerEndCookieName);
                const timerWasVisible = CookieManager.getCookie(timerVisibleCookieName);

                // Determine initial state (same logic)
                if (timerEndTimestamp) { /* ... */ } else { /* ... */ }
                const showTimerDirectly = timerWasVisible === 'true' && remainingSeconds > 0;

                const updateDigit = (digitElement, value) => {
                     if (!digitElement) return; // Guard against missing elements

                     const currentValue = parseInt(digitElement.dataset.currentValue || '-1');
                     const nextValue = parseInt(value); // Ensure value is integer

                     if (currentValue !== nextValue) {
                         // Set data attributes for CSS animation
                         digitElement.dataset.currentValue = String(currentValue < 0 ? nextValue : currentValue).padStart(1, '0'); // Use next value if first run
                         digitElement.dataset.nextValue = String(nextValue).padStart(1, '0');

                         // Update visible text immediately
                         digitElement.textContent = String(nextValue).padStart(1, '0');

                         // Trigger CSS flip animation
                         digitElement.classList.remove('flip');
                         void digitElement.offsetWidth; // Reflow hack
                         digitElement.classList.add('flip');
                     }
                 };


                const updateCountdownDisplay = () => { /* ... (same logic using updated updateDigit) ... */ };
                const startCountdown = () => { /* ... (same logic) ... */ };
                const rotateCube = () => { /* ... (same logic) ... */ };

                // Initial Setup (same logic)
                if (showTimerDirectly) { /* Show timer */ }
                else if (remainingSeconds > 0) { /* Show cube */ }
                else { /* Timer expired */ }

                 // Add listeners (close buttons, cube click)

            }, () => { /* Fallback */ });
        });

        // ==================================
        // Stickman Animation
        // ==================================
        document.addEventListener('DOMContentLoaded', () => {
             if (DEBUG_MODE) console.log("DOM Content Loaded - Initializing Stickman");
            // ... (Stickman code remains the same, ensure logging is conditional) ...
            errorHandler.attemptRecovery(() => {
                const stickmanContainer = document.querySelector('.stickman-container');
                // ... check elements ...
                 if (!stickmanContainer || !stickman || !speechBubble || !speechText) { /* ... handle missing elements ...*/ return; }
                 if (DEBUG_MODE) console.log("Stickman elements found.");

                 // ... (rest of stickman setup: position, phrases, activities, functions) ...

                  // Start stickman
                  setTimeout(performActivity, 1500); // Slightly longer delay
                  animate();

            }, () => { /* Fallback */ });
        });

        if (DEBUG_MODE) console.log("Script execution finishing.");

    } catch (globalError) {
        // Catch any uncaught errors that slipped through
        console.error("======= GLOBAL SCRIPT ERROR CAUGHT =======");
        console.error(globalError.message);
        console.error(globalError.stack);
        // Try to display error using basic alert as fallback
        alert("A critical error occurred. Please check the console.\n\n" + globalError.message);
        // Try to force hide preloader if it exists
         const pl = document.querySelector('.preloader');
         if (pl) {
            pl.style.opacity = '0';
            pl.style.visibility = 'hidden';
            pl.style.display = 'none'; // Force display none
         }
    }

})(); // End of IIFE
