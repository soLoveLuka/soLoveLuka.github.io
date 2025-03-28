// Wrap everything in a protective scope
(function() {
    'use strict'; // Enable strict mode

    // ==================================
    // Error Handling Service
    // ==================================
    class ErrorHandler {
        constructor() {
            this.errorNotification = document.querySelector('.error-notification');
            this.errorMessage = document.querySelector('.error-message');
            this.errorClose = document.querySelector('.error-close');
            this.errorLog = [];
            this.maxErrors = 50;
            this.setupErrorListeners();
        }

        setupErrorListeners() {
            if (!this.errorNotification || !this.errorMessage || !this.errorClose) {
                console.warn('Error notification elements not fully found. Display errors might not work.');
            }

            window.onerror = (message, source, lineno, colno, error) => {
                const errorDetails = { message, source, lineno, colno, error: error ? error.stack : 'N/A' };
                this.logError(errorDetails);
                this.displayError(`Error: ${message} at ${source}:${lineno}`);
                return true; // Prevent default browser error handling
            };

            window.addEventListener('unhandledrejection', (event) => {
                const reason = event.reason instanceof Error ? event.reason.stack : event.reason;
                this.logError({ message: 'Unhandled Promise Rejection', reason: reason });
                this.displayError(`Unhandled Promise Rejection: ${event.reason}`);
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
                console.error('Error logged:', logEntry);
            } catch (logFailError) {
                console.error("Failed to log error:", logFailError); // Avoid infinite loops
            }
        }

        displayError(message) {
            if (this.errorNotification && this.errorMessage) {
                this.errorMessage.textContent = message;
                this.errorNotification.classList.add('visible');
                // Auto-hide after 7 seconds
                setTimeout(() => this.hideError(), 7000);
            } else {
                // Fallback if UI elements aren't there
                console.error("DISPLAY ERROR (UI not found):", message);
                // alert("An error occurred. Please check the console.");
            }
        }

        hideError() {
            if (this.errorNotification) {
                this.errorNotification.classList.remove('visible');
            }
        }

        // Wraps a function call in a try-catch block
        attemptRecovery(func, fallback) {
            try {
                return func();
            } catch (error) {
                this.logError({
                    message: `Caught error during operation: ${error.message}`,
                    error: error.stack || error,
                    functionName: func.name || 'anonymous'
                });
                this.displayError(`Operation failed: ${error.message}. Attempting recovery.`);
                // Execute fallback if provided
                if (typeof fallback === 'function') {
                    try {
                        return fallback();
                    } catch (fallbackError) {
                        this.logError({ message: `Fallback function failed: ${fallbackError.message}`, error: fallbackError.stack || fallbackError });
                        this.displayError(`Recovery fallback failed: ${fallbackError.message}`);
                    }
                }
                return fallback; // Return non-function fallback or undefined
            }
        }
    }

    const errorHandler = new ErrorHandler();

    // ==================================
    // Cookie Utility Functions
    // ==================================
    const CookieManager = {
        setCookie(name, value, hours) {
            errorHandler.attemptRecovery(() => {
                let expires = "";
                if (hours) {
                    const date = new Date();
                    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"; // Added SameSite
            }, () => console.error(`Failed to set cookie: ${name}`));
        },

        getCookie(name) {
            return errorHandler.attemptRecovery(() => {
                const nameEQ = name + "=";
                const ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            }, () => {
                console.error(`Failed to get cookie: ${name}`);
                return null; // Ensure null return on failure
            });
        },

        deleteCookie(name) {
            errorHandler.attemptRecovery(() => {
                document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Lax'; // More robust deletion
            }, () => console.error(`Failed to delete cookie: ${name}`));
        }
    };

    // ==================================
    // Smooth Scrolling & Navigation (REVISED)
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const sections = document.querySelectorAll('section');
            const sectionParticles = document.querySelector('.section-particles');
            const nav = document.querySelector('.retro-nav');
            const backToTop = document.querySelector('.back-to-top');

            if (!sections.length) {
                console.warn("No <section> elements found for smooth scrolling.");
                return;
            }
            if (!nav) console.warn("Navigation element '.retro-nav' not found.");
            if (!backToTop) console.warn("Back-to-top element '.back-to-top' not found.");

            let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
            let currentSectionIndex = 0;
            let isUpdating = false; // Flag to prevent rapid updates

            function findCurrentSectionIndex() {
                 let closestSectionIndex = 0;
                 let minDistance = Infinity;
                 const viewportCenter = window.innerHeight / 2;

                 sections.forEach((section, index) => {
                     const rect = section.getBoundingClientRect();
                     const sectionCenter = rect.top + rect.height / 2;
                     const distance = Math.abs(viewportCenter - sectionCenter);

                     if (distance < minDistance) {
                         minDistance = distance;
                         closestSectionIndex = index;
                     }
                 });
                 return closestSectionIndex;
            }


            function updateSections(scrollDirection, targetIndex = null, forceUpdate = false) {
                if (isUpdating && !forceUpdate) return;
                isUpdating = true;

                const oldIndex = currentSectionIndex;

                if (targetIndex !== null && targetIndex >= 0 && targetIndex < sections.length) {
                    currentSectionIndex = targetIndex;
                } else {
                     // If not navigating directly, determine current section based on scroll position
                     currentSectionIndex = findCurrentSectionIndex();
                }

                // Ensure index is within bounds
                 currentSectionIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex));


                if (oldIndex === currentSectionIndex && !forceUpdate) {
                    isUpdating = false;
                    return; // No change needed
                }
                 // console.log(`Updating sections. Old: ${oldIndex}, New: ${currentSectionIndex}, Target: ${targetIndex}`); // Debug log


                sections.forEach((section, index) => {
                    section.classList.remove('in-view', 'out-of-view-up', 'out-of-view-down');

                    if (index < currentSectionIndex) {
                        section.classList.add('out-of-view-up');
                    } else if (index === currentSectionIndex) {
                        section.classList.add('in-view');
                    } else {
                        section.classList.add('out-of-view-down');
                    }
                });

                const isMobile = window.innerWidth <= 768;
                if (!isMobile && sections[currentSectionIndex]) {
                    const sectionId = sections[currentSectionIndex].id;
                    if (sectionId) {
                        // Smoother background transition needs CSS transition on body background
                        document.body.className = ''; // Clear previous classes first
                        document.body.classList.add(`${sectionId}-bg`);
                    }
                }

                if (sectionParticles) {
                    sectionParticles.innerHTML = ''; // Clear old particles
                    const particleCount = isMobile ? 5 : 15;
                    for (let i = 0; i < particleCount; i++) {
                        const particle = document.createElement('div');
                        particle.classList.add('section-particle');
                        const side = Math.random() < 0.5 ? 'left' : 'right';
                        const x = side === 'left' ? Math.random() * -10 - 5 : window.innerWidth + Math.random() * 10 + 5; // Start slightly off-screen
                        const y = Math.random() * window.innerHeight;
                        particle.style.left = `${x}px`;
                        particle.style.top = `${y}px`;
                        sectionParticles.appendChild(particle);

                        setTimeout(() => {
                            particle.classList.add('active');
                            // Move towards the center slightly
                            const endX = side === 'left' ? (50 + Math.random() * 100) : (window.innerWidth - 50 - Math.random() * 100);
                             const endY = y + Math.random() * 40 - 20;
                             particle.style.transform = `translate(${endX - x}px, ${endY - y}px)`;
                        }, i * 40); // Stagger appearance

                        setTimeout(() => {
                            particle.remove();
                        }, 1000 + i * 40); // Remove after animation
                    }
                }

                 // Allow next update after a short delay
                 setTimeout(() => { isUpdating = false; }, 300);
            }

            const debounce = (func, wait) => {
                let timeout;
                return (...args) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            };

            const handleScroll = debounce(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const isMobile = window.innerWidth <= 768;

                if (nav) {
                    if (scrollTop > 50 || isMobile) {
                        nav.classList.add('scrolled');
                    } else {
                        nav.classList.remove('scrolled');
                    }
                }

                if (backToTop) {
                    if (scrollTop > 300) {
                        backToTop.classList.add('visible');
                    } else {
                        backToTop.classList.remove('visible');
                    }
                }

                 // Update section state based on scroll position (less aggressive than full transition)
                 const newIndex = findCurrentSectionIndex();
                 if (newIndex !== currentSectionIndex) {
                     updateSections(null, newIndex); // Update visuals based on scroll
                 }

                // Mix Card Audio Pause
                const mixesSection = document.querySelector('#mixes');
                if (mixesSection) {
                    const mixCards = mixesSection.querySelectorAll('.mix-card.flipped');
                    const mixesRect = mixesSection.getBoundingClientRect();
                     // Pause if the section is mostly out of the top or bottom of the viewport
                    const threshold = window.innerHeight * 0.1;
                    if (mixesRect.bottom < threshold || mixesRect.top > window.innerHeight - threshold) {
                        mixCards.forEach(card => {
                            card.classList.remove('flipped');
                            const audio = card.querySelector('.mix-audio');
                            if (audio && !audio.paused) {
                                audio.pause();
                                audio.currentTime = 0; // Reset audio
                            }
                        });
                    }
                }

                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

            }, 100); // Increased debounce time

            window.addEventListener('scroll', handleScroll, { passive: true }); // Use passive listener

            // Navigation Click Listener (Targets all internal hash links)
            document.querySelectorAll('a[href^="#"]').forEach(anchorLink => {
                anchorLink.addEventListener('click', (e) => {
                    const href = anchorLink.getAttribute('href');

                    if (href && href.length > 1 && href.startsWith('#')) {
                        e.preventDefault(); // Prevent default jump

                        const targetId = href.substring(1);
                        if (!targetId) {
                            errorHandler.logError({ message: "Navigation click: Target ID is empty.", href: href });
                            return;
                        }

                        const targetSection = document.getElementById(targetId);
                        if (!targetSection) {
                            errorHandler.logError({ message: `Navigation click: Target section #${targetId} not found.`, href: href });
                            return;
                        }

                        const sectionIndex = Array.from(sections).indexOf(targetSection);
                        if (sectionIndex === -1) {
                            errorHandler.logError({ message: `Navigation click: Target section #${targetId} not in tracked sections.`, href: href });
                            return;
                        }

                        // Update Sections & Scroll
                        const scrollDirection = sectionIndex > currentSectionIndex ? 'down' : 'up';
                        updateSections(scrollDirection, sectionIndex, true); // Force update for direct navigation

                        // Smooth scroll to the section
                         targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Scroll to top of section

                        // Special logic for #mixes
                        if (targetId === 'mixes') {
                            setTimeout(() => {
                                const mixGrid = document.querySelector('#mixes .mix-grid');
                                const mixDescription = document.querySelector('#mixes .mix-description');
                                mixGrid?.classList.add('active');
                                mixDescription?.classList.add('active');
                            }, 600); // Delay to allow scroll to start
                        }
                    } else if (href === "#") {
                        e.preventDefault();
                        console.warn("Clicked on an empty hash link ('#'). Scrolling to top.");
                         window.scrollTo({ top: 0, behavior: 'smooth'}); // Scroll to top for empty hash
                    }
                });
            });

            // Initial State Setup
             currentSectionIndex = findCurrentSectionIndex(); // Find starting section
            updateSections(null, currentSectionIndex, true); // Force initial setup
            handleScroll(); // Run scroll handler once initially

        }, () => {
            console.error('Major failure during smooth scrolling/navigation setup.');
            const errorMsg = "Page navigation might not work correctly.";
            errorHandler.displayError(errorMsg);
        });
    });

    // ==================================
    // Sound Wave Interaction
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const heroSection = document.querySelector('.hero');
            const soundWaveContainer = document.querySelector('.sound-wave-container');
            const soundBars = soundWaveContainer?.querySelectorAll('.sound-bar'); // Use optional chaining

            if (heroSection && soundWaveContainer && soundBars?.length > 0) {
                const updateBars = (x, y) => {
                    const containerRect = soundWaveContainer.getBoundingClientRect();
                    const relativeX = x - containerRect.left;
                    const relativeY = y - containerRect.top;
                    const maxDistance = Math.sqrt(Math.pow(containerRect.width / 2, 2) + Math.pow(containerRect.height / 2, 2)); // Distance from center
                    const maxHeight = 60; // Reduced max height
                    const minHeight = 5;  // Reduced min height

                    soundBars.forEach((bar, index) => {
                        const barRect = bar.getBoundingClientRect();
                        // Calculate distance from pointer to center of the bar
                        const barCenterX = barRect.left - containerRect.left + barRect.width / 2;
                        const barCenterY = barRect.top - containerRect.top + barRect.height / 2; // Use center Y
                        const distance = Math.sqrt(Math.pow(relativeX - barCenterX, 2) + Math.pow(relativeY - barCenterY, 2));

                        // Influence falls off quadratically
                        const influence = Math.max(0, 1 - Math.pow(distance / maxDistance, 2));
                        const height = minHeight + (maxHeight - minHeight) * influence;

                        // Apply height smoothly (CSS transition handles this)
                        bar.style.height = `${Math.min(maxHeight, Math.max(minHeight, height))}px`;
                    });
                };

                // Reset bars function
                 const resetBars = () => {
                     soundBars.forEach(bar => {
                         bar.style.height = '5px'; // Back to minHeight
                     });
                 };


                const handleMouseMove = (e) => {
                    updateBars(e.clientX, e.clientY);
                };

                const handleTouchMove = (e) => {
                    if (e.touches.length > 0) {
                        const touch = e.touches[0];
                         // Check if touch is within the hero section to avoid hijacking scroll elsewhere
                         const heroRect = heroSection.getBoundingClientRect();
                         if (touch.clientX >= heroRect.left && touch.clientX <= heroRect.right &&
                             touch.clientY >= heroRect.top && touch.clientY <= heroRect.bottom) {
                             // e.preventDefault(); // Only prevent if needed, test scrolling behavior
                             updateBars(touch.clientX, touch.clientY);
                         } else {
                             resetBars(); // Reset if touch moves out
                         }
                    }
                };

                // Add listeners
                heroSection.addEventListener('mousemove', handleMouseMove);
                heroSection.addEventListener('mouseleave', resetBars); // Reset on mouse leave
                heroSection.addEventListener('touchmove', handleTouchMove, { passive: true }); // Use passive for touchmove
                heroSection.addEventListener('touchend', resetBars); // Reset on touch end
                heroSection.addEventListener('touchcancel', resetBars); // Reset on touch cancel


            } else {
                console.warn('Sound wave elements not found.');
            }
        }, () => console.log('Failed to initialize sound wave interaction'));
    });

    // ==================================
    // Mixes Section Animation (Observer)
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const mixesSection = document.querySelector('#mixes');
            if (!mixesSection) return; // Exit if section not found

            const mixGrid = mixesSection.querySelector('.mix-grid');
            const mixDescription = mixesSection.querySelector('.mix-description');

            if (mixGrid || mixDescription) {
                const observerOptions = {
                    rootMargin: '0px 0px -15% 0px', // Trigger when 15% from bottom enters view
                    threshold: 0.1 // Need at least 10% visible
                };

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            mixGrid?.classList.add('active');
                            mixDescription?.classList.add('active');
                            // Optional: Unobserve after first intersection if animation only runs once
                            // observer.unobserve(entry.target);
                        } else {
                            // Optional: Remove 'active' if you want the animation to replay on scroll back in
                            // mixGrid?.classList.remove('active');
                            // mixDescription?.classList.remove('active');
                        }
                    });
                }, observerOptions);

                observer.observe(mixesSection);
            }
        }, () => console.log('Failed to initialize mixes section animation observer'));
    });

    // ==================================
    // Artist & Booking Section Fade-in (Observer)
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const sectionsToObserve = document.querySelectorAll('#artist, #booking');
            if (!sectionsToObserve.length) return;

            const observerOptions = {
                 threshold: 0.2 // Trigger when 20% is visible
            };

            const sectionObserver = new IntersectionObserver((entries, observer) => { // Pass observer
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view'); // Use the 'in-view' class for consistency
                        observer.unobserve(entry.target); // Unobserve after animating in once
                    }
                });
            }, observerOptions);

            sectionsToObserve.forEach(section => {
                sectionObserver.observe(section);
            });
        }, () => console.log('Failed to initialize general section fade-in animations'));
    });

    // ==================================
    // Preloader Logic
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const preloader = document.querySelector('.preloader');
            const preloaderChars = preloader?.querySelectorAll('.preloader-char');
            const progressBar = preloader?.querySelector('.progress-bar');
            const progressText = preloader?.querySelector('.progress-text');

            if (preloader && preloaderChars?.length > 0 && progressBar && progressText) {
                let progress = 0;
                const totalDuration = 4000; // Target duration in ms
                const intervalTime = 50; // Update interval in ms
                const steps = totalDuration / intervalTime;
                const increment = 100 / steps;
                let startTime = null;

                function step(timestamp) {
                    if (!startTime) startTime = timestamp;
                    const elapsed = timestamp - startTime;
                    progress = Math.min((elapsed / totalDuration) * 100, 100);

                    progressBar.style.setProperty('--progress-width', `${progress}%`); // Update CSS variable if using one
                    progressBar.querySelector('::after')?.style.width = `${progress}%`; // Or directly style pseudo-element
                    progressText.textContent = `${Math.floor(progress)}%`;

                    if (progress < 100) {
                        requestAnimationFrame(step);
                    }
                }

                 // Start progress bar animation via class
                progressBar.classList.add('active');
                // Start text update via requestAnimationFrame
                 requestAnimationFrame(step);


                // Start text wave animation after a delay
                setTimeout(() => {
                    preloaderChars.forEach((char, index) => {
                        char.style.setProperty('--char-index', index);
                        char.classList.add('wave');
                    });
                }, 500); // Start wave sooner

                // Hide preloader after duration + fade time
                 const hideDelay = totalDuration + 500; // Wait for progress bar + extra time
                 setTimeout(() => {
                     preloader.classList.add('hidden');
                 }, hideDelay);

            } else {
                 // If preloader elements are missing, hide it immediately
                 preloader?.classList.add('hidden');
                console.warn('Preloader elements missing or incomplete.');
            }
        }, () => {
            console.error('Failed to initialize preloader. Hiding it.');
            document.querySelector('.preloader')?.classList.add('hidden'); // Ensure it hides on error
        });
    });

    // ==================================
    // Mix Card Flip & Audio Preview
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const mixCards = document.querySelectorAll('.mix-card');
            let currentlyFlippedCard = null;
            let currentlyPlayingAudio = null;
            let previewTimeout = null;
            let touchStartTime = 0;
            const longPressDuration = 400; // Shorter duration for flip

            const stopCurrentAudio = () => {
                 if (currentlyPlayingAudio && !currentlyPlayingAudio.paused) {
                     currentlyPlayingAudio.pause();
                     currentlyPlayingAudio.currentTime = 0;
                 }
                 currentlyPlayingAudio = null;
                 clearTimeout(previewTimeout);
            };

            mixCards.forEach(card => {
                const inner = card.querySelector('.mix-card-inner');
                const audio = card.querySelector('.mix-audio');
                if (!inner || !audio) return; // Skip if elements are missing

                // --- Desktop Hover Preview ---
                card.addEventListener('mouseenter', () => {
                    if (window.innerWidth <= 768 || card.classList.contains('flipped')) return; // No hover preview on mobile or when flipped
                    stopCurrentAudio(); // Stop any other preview
                    audio.currentTime = 0;
                    audio.play().catch(e => console.warn("Audio play interrupted or failed:", e)); // Catch potential errors
                    currentlyPlayingAudio = audio;
                    previewTimeout = setTimeout(stopCurrentAudio, 5000); // Play for 5 seconds max
                });

                card.addEventListener('mouseleave', () => {
                    if (window.innerWidth <= 768 || card.classList.contains('flipped')) return;
                    // Only stop if this card's audio is the one playing
                     if (currentlyPlayingAudio === audio) {
                         stopCurrentAudio();
                     }
                });

                // --- Click/Tap to Flip (Handles both desktop click and short tap) ---
                 const handleFlip = (event) => {
                     // Don't flip if clicking on the audio controls themselves inside the back card
                     if (event.target.closest('.mix-card-back audio')) {
                         return;
                     }

                     stopCurrentAudio(); // Stop preview audio on flip

                     if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                         currentlyFlippedCard.classList.remove('flipped');
                         // No need to pause audio here, stopCurrentAudio already did
                     }

                     card.classList.toggle('flipped');

                     if (card.classList.contains('flipped')) {
                         currentlyFlippedCard = card;
                         // Optional: Start playing audio when flipped (user initiated)
                         // audio.currentTime = 0;
                         // audio.play().catch(e => console.warn("Audio play interrupted or failed:", e));
                         // currentlyPlayingAudio = audio;
                     } else {
                         currentlyFlippedCard = null;
                         // Audio already stopped by stopCurrentAudio
                     }
                 };

                 card.addEventListener('click', handleFlip);

                // --- Prevent default audio behavior interfering ---
                 audio.addEventListener('play', () => {
                     // If audio starts playing and isn't the intended 'currentlyPlayingAudio'
                     // (e.g., user manually clicks play), update the state.
                     if (currentlyPlayingAudio !== audio) {
                        stopCurrentAudio(); // Stop any other audio
                        currentlyPlayingAudio = audio;
                     }
                 });
                 audio.addEventListener('pause', () => {
                    // If the currently tracked audio pauses, clear the tracker
                    if (currentlyPlayingAudio === audio) {
                        currentlyPlayingAudio = null;
                        clearTimeout(previewTimeout);
                    }
                 });

            });
        }, () => console.log('Failed to initialize mix card interactions'));
    });

    // ==================================
    // Booking Form Interaction
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const bookingForm = document.getElementById('booking-form');
            if (!bookingForm) return;

            const formFlipper = bookingForm.querySelector('.form-flipper');
            const formFront = bookingForm.querySelector('.form-front');
            const formBack = bookingForm.querySelector('.form-back');
            const inputs = Array.from(bookingForm.querySelectorAll('.input-wrapper input, .input-wrapper select'));
            const finishGroup = bookingForm.querySelector('.form-group.finish-group');
            const finishButtonWrapper = bookingForm.querySelector('.finish-button-wrapper');
            const neonGrid = document.querySelector('.neon-grid');
            const bookNowButton = bookingForm.querySelector('.book-now-button');

             if (!formFlipper || !formFront || !formBack || !inputs.length || !finishGroup || !finishButtonWrapper || !neonGrid || !bookNowButton) {
                 console.warn("Booking form elements incomplete. Interactions might fail.");
                 return;
             }

            let requiredFields = new Set();
            inputs.forEach(input => {
                if(input.hasAttribute('required')) {
                    requiredFields.add(input.closest('.form-group').dataset.field);
                }
            });

            // Activate neon grid on interaction
            bookingForm.addEventListener('focusin', () => neonGrid.classList.add('active'), true); // Capture focus on children
            bookingForm.addEventListener('focusout', () => { // Deactivate if focus leaves form
                if (!bookingForm.contains(document.activeElement)) {
                    neonGrid.classList.remove('active');
                }
            }, true);
            bookingForm.addEventListener('touchstart', () => neonGrid.classList.add('active'), { passive: true });

            const checkAllRequiredFieldsFlipped = () => {
                for (const fieldName of requiredFields) {
                    const group = formFront.querySelector(`.form-group[data-field="${fieldName}"]`);
                    const wrapper = group?.querySelector('.input-wrapper');
                    if (!wrapper || !wrapper.classList.contains('flipped')) {
                        return false; // Found a required field not flipped
                    }
                }
                return true; // All required fields are flipped
            };

            const updateFinishButtonState = () => {
                 if (checkAllRequiredFieldsFlipped()) {
                     finishGroup.classList.add('active');
                 } else {
                     finishGroup.classList.remove('active');
                 }
            };


            inputs.forEach((input) => {
                const wrapper = input.closest('.input-wrapper');
                const back = wrapper.querySelector('.input-back');
                const checkmark = back?.querySelector('.checkmark');
                const fieldName = input.closest('.form-group').dataset.field;

                const handleValidationAndFlip = () => {
                    if (input.checkValidity() && (input.value.trim() || input.type === 'select-one')) { // Allow flip if valid & has value (or is a select)
                        if (!wrapper.classList.contains('flipped')) {
                             wrapper.classList.add('flipped');
                             checkmark?.classList.add('glowing'); // Use optional chaining
                             updateFinishButtonState(); // Check if finish button should appear
                             // Auto-focus next input (optional, can be annoying)
                             // const currentIndex = inputs.indexOf(input);
                             // if (currentIndex < inputs.length - 1) {
                             //     inputs[currentIndex + 1].focus();
                             // }
                        }
                    } else {
                         // Optional: Indicate error state visually if invalid on blur
                         // input.classList.add('invalid');
                    }
                };

                input.addEventListener('blur', handleValidationAndFlip);

                 // Update label state based on input presence (for browsers without :placeholder-shown support if needed)
                input.addEventListener('input', () => {
                     // The CSS handles label movement with :not(:placeholder-shown) and :focus mostly
                     // input.classList.remove('invalid'); // Remove invalid state on input
                 });

                // Allow Enter key to validate and potentially flip/move next
                 input.addEventListener('keypress', (e) => {
                     if (e.key === 'Enter') {
                         e.preventDefault(); // Prevent potential form submission on Enter
                         handleValidationAndFlip();
                         // Move focus if valid
                          if (input.checkValidity() && input.value.trim()) {
                               const currentIndex = inputs.indexOf(input);
                               if (currentIndex < inputs.length - 1) {
                                    inputs[currentIndex + 1].focus();
                                } else {
                                     // If last input, maybe focus the finish button if active
                                     if(finishGroup.classList.contains('active')) {
                                         finishButtonWrapper.querySelector('button')?.focus();
                                     }
                                }
                           }
                     }
                 });

                // Click on checkmark (in the back) to flip back
                back?.addEventListener('click', () => {
                    if (wrapper.classList.contains('flipped')) {
                        wrapper.classList.remove('flipped');
                        checkmark?.classList.remove('glowing');
                        updateFinishButtonState();
                        input.focus(); // Focus the input again
                    }
                });
            });

            // Click Finish button to flip the whole form
            finishButtonWrapper?.querySelector('button')?.addEventListener('click', (e) => {
                e.preventDefault(); // It's type="button", but good practice
                 if (checkAllRequiredFieldsFlipped()) { // Double check before flipping
                     formFlipper.classList.add('flipped');
                     bookNowButton.focus(); // Focus the final submit button
                 } else {
                     errorHandler.displayError("Please fill out all required fields first.");
                     // Maybe highlight missing required fields
                 }
            });

             // Handle form submission
            bookingForm.addEventListener('submit', (e) => {
                 console.log('Form submit event triggered.'); // Confirm event fires

                 // Prevent flickering: Briefly show a submitting state? (Optional)
                 bookNowButton.textContent = "Submitting...";
                 bookNowButton.disabled = true;


                 // Let Formspree handle the actual submission.
                 // The timeout resets the form *after* the browser likely started submission.
                 // Formspree redirects, so this reset might only be visible briefly or if redirect fails.
                setTimeout(() => {
                    // Reset button text/state regardless of submission success for UX
                    bookNowButton.textContent = "Book Now!";
                    bookNowButton.disabled = false;

                    // Consider using Formspree's AJAX submission for better control
                    // and showing success/error messages without redirect.
                    // For now, keeping the basic alert:
                    // alert('Booking submitted successfully! Form will reset.'); // Alert can be disruptive

                    bookingForm.reset(); // Reset form fields
                    formFlipper.classList.remove('flipped'); // Flip back to front

                    // Unflip all input wrappers
                    inputs.forEach(input => {
                        const wrapper = input.closest('.input-wrapper');
                        wrapper?.classList.remove('flipped');
                        wrapper?.querySelector('.checkmark')?.classList.remove('glowing');
                    });
                    finishGroup.classList.remove('active'); // Hide finish button again

                    // Potentially show a custom success message overlay instead of alert

                }, 1500); // Increased delay to allow more time for submission/redirect
            });

        }, () => console.log('Failed to initialize booking form interactions'));
    });

    // ==================================
    // 3D Retro Cube & Countdown Timer
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const cubeContainer = document.querySelector('.retro-cube-container');
            const cube = cubeContainer?.querySelector('.retro-cube');
            const countdownTimer = cubeContainer?.querySelector('.countdown-timer');
            const closeButtons = cube?.querySelectorAll('.cube-close');
            const timerDigits = {
                hours1: countdownTimer?.querySelector('.timer-digit.hours-1'),
                hours2: countdownTimer?.querySelector('.timer-digit.hours-2'),
                minutes1: countdownTimer?.querySelector('.timer-digit.minutes-1'),
                minutes2: countdownTimer?.querySelector('.timer-digit.minutes-2'),
                seconds1: countdownTimer?.querySelector('.timer-digit.seconds-1'),
                seconds2: countdownTimer?.querySelector('.timer-digit.seconds-2')
            };

            // Check if all essential elements are present
            if (!cubeContainer || !cube || !countdownTimer || !closeButtons || closeButtons.length === 0 || Object.values(timerDigits).some(digit => !digit)) {
                console.warn('Retro cube or timer elements are missing or incomplete. Feature disabled.');
                 cubeContainer?.remove(); // Remove the container if incomplete
                return;
            }

            const PROMO_DURATION_HOURS = 3;
            const totalSeconds = PROMO_DURATION_HOURS * 60 * 60;
            let remainingSeconds;
            let countdownInterval = null;
            let rotationInterval = null;
            const timerEndCookieName = 'promoTimerEnd';
            const timerVisibleCookieName = 'promoTimerVisible'; // Track if user closed cube

            const timerEndTimestamp = CookieManager.getCookie(timerEndCookieName);
            const timerWasVisible = CookieManager.getCookie(timerVisibleCookieName);

            // Determine initial state
            if (timerEndTimestamp) {
                const endTime = parseInt(timerEndTimestamp, 10);
                const currentTime = Math.floor(Date.now() / 1000);
                remainingSeconds = Math.max(0, endTime - currentTime);
            } else {
                // Timer not started before, start it now
                remainingSeconds = totalSeconds;
                const newEndTime = Math.floor(Date.now() / 1000) + totalSeconds;
                CookieManager.setCookie(timerEndCookieName, newEndTime, PROMO_DURATION_HOURS + 1); // Cookie lasts slightly longer
            }

            // Decide whether to show cube or timer initially
             const showTimerDirectly = timerWasVisible === 'true' && remainingSeconds > 0;

            // Function to update timer display
            const updateDigit = (digitElement, value) => {
                 const currentValue = parseInt(digitElement.dataset.value || '-1'); // Use -1 to force initial update
                 if (currentValue !== value) {
                     const formattedValue = String(value).padStart(1, '0'); // Ensure single digit
                     digitElement.dataset.value = formattedValue; // Store the value

                     // Trigger CSS flip animation
                     digitElement.classList.remove('flip');
                     void digitElement.offsetWidth; // Reflow hack
                     digitElement.classList.add('flip');

                     // Update text content (can be done within pseudo-elements in CSS using attr())
                     // digitElement.textContent = formattedValue; // If not using CSS attr()
                 }
             };

            const updateCountdownDisplay = () => {
                 if (remainingSeconds <= 0) {
                     countdownTimer.classList.add('expired');
                      updateDigit(timerDigits.hours1, 0);
                      updateDigit(timerDigits.hours2, 0);
                      updateDigit(timerDigits.minutes1, 0);
                      updateDigit(timerDigits.minutes2, 0);
                      updateDigit(timerDigits.seconds1, 0);
                      updateDigit(timerDigits.seconds2, 0);
                     return false; // Indicates timer finished
                 }

                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = remainingSeconds % 60;

                updateDigit(timerDigits.hours1, Math.floor(hours / 10));
                updateDigit(timerDigits.hours2, hours % 10);
                updateDigit(timerDigits.minutes1, Math.floor(minutes / 10));
                updateDigit(timerDigits.minutes2, minutes % 10);
                updateDigit(timerDigits.seconds1, Math.floor(seconds / 10));
                updateDigit(timerDigits.seconds2, seconds % 10);
                return true; // Indicates timer running
            };

            const startCountdown = () => {
                clearInterval(countdownInterval); // Clear existing interval if any
                 if (updateCountdownDisplay()) { // Update display immediately and check if running
                    countdownInterval = setInterval(() => {
                        remainingSeconds--;
                        if (!updateCountdownDisplay()) { // Update and check if finished
                             clearInterval(countdownInterval);
                             CookieManager.deleteCookie(timerEndCookieName); // Clean up cookies on expiry
                             CookieManager.deleteCookie(timerVisibleCookieName);
                        }
                    }, 1000);
                 }
            };

            // --- Cube Rotation Logic ---
            let currentFace = 0;
            const faces = ['front', 'right', 'back', 'left', 'top', 'bottom']; // Order matters for rotation logic
            const rotateCube = () => {
                currentFace = (currentFace + 1) % 4; // Only rotate Y-axis for simplicity now (0-3)
                 let yRotate = currentFace * -90; // Rotate clockwise
                 cube.style.transform = `rotateY(${yRotate}deg)`;

                 // // More complex rotation (like original)
                 // currentFace = (currentFace + 1) % faces.length;
                 // let xRot = 0, yRot = 0;
                 // if (currentFace < 4) yRot = currentFace * 90; // Front, Right, Back, Left
                 // else if (currentFace === 4) xRot = -90;      // Top
                 // else if (currentFace === 5) xRot = 90;       // Bottom
                 // cube.style.transform = `rotateX(${xRot}deg) rotateY(${yRot}deg)`;
            };


            // --- Initial Setup ---
            if (showTimerDirectly) {
                 // Show timer immediately
                 cubeContainer.classList.add('visible', 'timer-mode');
                 startCountdown();
            } else if (remainingSeconds > 0) {
                 // Show cube after a delay
                setTimeout(() => {
                    cubeContainer.classList.add('visible');
                     rotationInterval = setInterval(rotateCube, 4000); // Start rotation
                 }, 30000); // Show cube after 30 seconds
            } else {
                // Timer expired, don't show anything
                cubeContainer.remove();
                return;
            }

             // Add listeners to cube close buttons
            closeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent cube click listener if any
                    clearInterval(rotationInterval); // Stop rotation
                    cube.classList.add('roll-to-timer'); // Start animation
                     CookieManager.setCookie(timerVisibleCookieName, 'true', PROMO_DURATION_HOURS + 1); // Remember user chose timer

                    // After animation, switch to timer mode
                    setTimeout(() => {
                        cubeContainer.classList.add('timer-mode');
                        startCountdown();
                    }, 900); // Match animation duration (slightly less)
                });
            });

             // Optional: Click on cube itself triggers close/switch
             cube.addEventListener('click', (e) => {
                 // Ensure not clicking on a close button
                 if (!e.target.classList.contains('cube-close')) {
                     // Simulate clicking the close button on the current face (or just pick one)
                     const firstCloseButton = cube.querySelector('.cube-close');
                     firstCloseButton?.click();
                 }
             });


        }, () => {
            console.log('Failed to initialize retro cube and timer');
             document.querySelector('.retro-cube-container')?.remove(); // Remove on error
        });
    });

    // ==================================
    // Stickman Animation (REVISED & ENHANCED)
    // ==================================
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler.attemptRecovery(() => {
            const stickmanContainer = document.querySelector('.stickman-container');
            const stickman = stickmanContainer?.querySelector('.stickman');
            const speechBubble = stickman?.querySelector('.stickman-speech-bubble');
            const speechText = speechBubble?.querySelector('.stickman-speech-text');
            // Find a reliable element to interact with, e.g., hero button
             const interactElement = document.querySelector('#hero .neon-button') || document.body; // Fallback to body


            if (!stickmanContainer || !stickman || !speechBubble || !speechText) {
                console.warn('Stickman elements not found. Skipping animation.');
                stickmanContainer?.remove(); // Remove container if incomplete
                return;
            }

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const groundY = windowHeight - stickman.offsetHeight - 10; // Floor level
            let posX = 50;
            let posY = groundY;
            let direction = 1; // 1 for right, -1 for left
            let currentActivity = { name: 'idle', duration: 1000 }; // Start idle
            let activityTimeout = null;
            let animationFrameId = null;

             // Store globally to prevent duplicates if script runs multiple times
             if (window.stickmanRAFId) cancelAnimationFrame(window.stickmanRAFId);
             if (window.stickmanActivityTimeout) clearTimeout(window.stickmanActivityTimeout);


            const updatePosition = (newX, newY, newDirection = direction) => {
                 // Keep stickman roughly within viewport bounds
                 posX = Math.max(10, Math.min(windowWidth - stickman.offsetWidth - 10, newX));
                 posY = Math.max(10, Math.min(windowHeight - stickman.offsetHeight - 10, newY)); // Keep on screen vertically too
                 posY = Math.min(posY, groundY); // Don't go below ground
                 direction = newDirection;
                 stickman.style.transform = `translateX(${posX}px) translateY(${posY}px) scaleX(${direction})`;
            };

            updatePosition(posX, posY); // Set initial position


            const phrases = [
                "Nice site, eh?", "Keep scrolling!", "What's Luka mixing today?",
                "Go on, book 'em!", "These mixes sound great!", "Just a humble stickman...",
                "Animation is tiring!", "Hope I'm not too buggy.", "Engage warp drive!",
                "Needs more neon!", "Scanning for aliens...", "Did you see that cube?",
                "Click me! (Just kidding)", "Is this the real life?", "Or is this just fantasy?",
                "Boop!", "Zzz... huh? Oh, hi!", "I wonder what that button does.",
                "Retro vibes incoming!", "Space... the final frontier.", "Pew pew!",
                "Don't mind me.", "Just passing through.", "Have you heard 'Obvious'?",
                "Such pixels, much wow.", "Loading... still loading...", "Error 404: Motivation not found.",
                "SYNTAX ERROR... just kidding.", "I should get some coffee.", "This CSS is complex!",
                "Look, a user!", "Is it time for a break yet?", "Let's dance!",
                "Waving is fun!", "Thinking about stickman things.", "Whoa, smooth scroll!",
                "Check out those neon lights!", "I feel... glitchy.", "Watch out for that bug!",
                "Get your tracks LeveledByLuka!", "Top quality mixes here.", "Professional sound.",
                "Making beats or breaking beats?", "To mix or not to mix?", "That is the question.",
                "Do a barrel roll! (Maybe later)", "Stick figures have feelings too.",
                "Is this responsive?", "Looks good on my tiny screen!", "Can't touch this!",
                "Stayin' alive, stayin' alive.", "Hello from the other side (of the screen)!",
                "Beam me up, Scotty!", "My code is impeccable. Mostly.", "Where am I?",
                "Follow the white rabbit...", "These gradients are trippy.", "10 PRINT 'LUKA ROCKS'; 20 GOTO 10",
                 "Are you not entertained?!", "I'm melting... melting!", "Just kidding.",
                 "Need... input...", "This is my domain!", "Check the console? Nah.",
                 "Feeling pixelated today.", "Binary solo! 01010101", "Achievement Unlocked: Exist"
                 // Add 50+ more here!
            ];

            const getRandomPhrase = () => phrases[Math.floor(Math.random() * phrases.length)];

            const showSpeech = (text = getRandomPhrase(), duration = 2500) => {
                 if (speechText && speechBubble) {
                     // If bubble already visible, quickly hide then show new text
                     if (speechBubble.classList.contains('visible')) {
                         speechBubble.classList.remove('visible');
                         setTimeout(() => {
                             speechText.textContent = text;
                             speechBubble.classList.add('visible');
                         }, 150); // Brief delay
                     } else {
                         speechText.textContent = text;
                         speechBubble.classList.add('visible');
                     }

                     // Auto-hide
                      clearTimeout(speechBubble.hideTimeout); // Clear previous hide timeout
                      speechBubble.hideTimeout = setTimeout(() => {
                          speechBubble?.classList.remove('visible');
                      }, duration);
                 }
            };

             // Activity Definitions
             const activities = [
                 { name: 'idle', duration: () => 2000 + Math.random() * 4000, action: () => { if (Math.random() < 0.3) showSpeech(); } },
                 { name: 'walk', duration: () => 4000 + Math.random() * 5000, action: () => { stickman.classList.add('walking'); if (Math.random() < 0.1) showSpeech("Strollin'...", 1500); } },
                 { name: 'jump', duration: 800, action: () => { stickman.classList.add('jumping'); showSpeech("Whee!", 700); } },
                 { name: 'wave', duration: 1800, action: () => { stickman.classList.add('waving'); showSpeech("Hey there!", 1500); } },
                 { name: 'think', duration: 3500, action: () => { stickman.classList.add('thinking'); showSpeech("Hmm...", 3000); } },
                 { name: 'lookAround', duration: 3000, action: () => { stickman.classList.add('looking'); showSpeech("Whoa...", 2500); } },
                 { name: 'dance', duration: 4500, action: () => { stickman.classList.add('dancing'); showSpeech("Groovy!", 4000); } },
                 { name: 'fight', duration: 3000, action: () => { stickman.classList.add('fighting'); showSpeech("Take that!", 2500); } },
                 { name: 'trip', duration: 2500, action: () => { stickman.classList.add('tripping'); showSpeech("Whoa!", 1000); setTimeout(() => showSpeech("Oof.", 1000), 800); } }, // Fall, then "Oof"
                 { name: 'point', duration: 2500, action: () => { stickman.classList.add('pointing'); showSpeech("Look!", 2000); } },
                 { name: 'shrug', duration: 2000, action: () => { stickman.classList.add('shrugging'); showSpeech("¯\\_(ツ)_/¯", 1800); } }, // Use shrug emoji
                 { name: 'facepalm', duration: 2500, action: () => { stickman.classList.add('facepalming'); showSpeech("D'oh!", 2000); } },
                 { name: 'layDown', duration: 6000, action: () => { stickman.classList.add('laying'); updatePosition(posX, groundY); showSpeech("Chillin'", 5000); } }, // Ensure on ground before laying
                 { name: 'sleep', duration: 8000, action: () => { stickman.classList.add('sleeping'); updatePosition(posX, groundY); showSpeech("Zzz...", 7000); } },
                  { name: 'checkButton', duration: 4000, action: () => { // Move towards an element
                       const elemRect = interactElement.getBoundingClientRect();
                       const targetX = elemRect.left + elemRect.width / 2 - stickman.offsetWidth / 2 + window.scrollX;
                       const targetY = elemRect.top - stickman.offsetHeight - 5 + window.scrollY; // Above element
                       updatePosition(targetX, Math.max(0, targetY), targetX > posX ? 1 : -1); // Move towards it
                       stickman.classList.add('pointing'); // Point at it
                       showSpeech("What's this?", 3500);
                   }},
                   { name: 'moonwalk', duration: 5000, action: () => { // Walk backwards visually
                       stickman.classList.add('walking'); // Use walk animation
                       direction *= -1; // Reverse logical direction for movement loop
                       stickman.style.transform = `translateX(${posX}px) translateY(${posY}px) scaleX(${-direction})`; // Flip visual direction
                       showSpeech("Hee hee!", 1500);
                   }}
                 // Add more varied activities here
             ];
            const activityClassNames = activities.map(act => act.name);

            const getRandomActivity = () => {
                 // Weighting: More idle/walk, less sleep/trip
                 const rand = Math.random();
                 if (rand < 0.35) return activities.find(a => a.name === 'idle');
                 if (rand < 0.65) return activities.find(a => a.name === 'walk');
                 if (rand < 0.70) return activities.find(a => a.name === 'jump');
                 if (rand < 0.75) return activities.find(a => a.name === 'wave');
                 if (rand < 0.80) return activities.find(a => a.name === 'think');
                 if (rand < 0.85) return activities.find(a => a.name === 'lookAround');
                 if (rand < 0.89) return activities.find(a => a.name === 'dance');
                 // Select randomly from the remaining less frequent actions
                 const lessFrequent = activities.filter(a => !['idle', 'walk', 'jump', 'wave', 'think', 'lookAround', 'dance'].includes(a.name));
                 return lessFrequent[Math.floor(Math.random() * lessFrequent.length)] || activities[0]; // Fallback to first activity
            };

            const performActivity = () => {
                clearTimeout(activityTimeout);
                if (!stickman) return; // Stop if stickman removed

                 // Reset state before starting new activity
                 stickman.style.animation = ''; // Clear inline animation styles if any
                 activityClassNames.forEach(className => stickman.classList.remove(className));
                 speechBubble?.classList.remove('visible'); // Hide speech bubble initially

                // Reset walk direction visually if previous was moonwalk
                if (currentActivity.name === 'moonwalk') {
                    stickman.style.transform = `translateX(${posX}px) translateY(${posY}px) scaleX(${direction})`;
                }


                currentActivity = getRandomActivity();
                console.log("Stickman performing:", currentActivity.name); // Debug

                try {
                    if (currentActivity && typeof currentActivity.action === 'function') {
                        currentActivity.action();
                    } else {
                        console.warn("Invalid activity action:", currentActivity?.name);
                         currentActivity = activities.find(a => a.name === 'idle') || activities[0]; // Fallback
                         currentActivity.action?.();
                    }
                } catch (error) {
                    errorHandler.logError({ message: `Error in stickman activity: ${currentActivity.name}`, error: error.stack || error });
                    activityClassNames.forEach(className => stickman.classList.remove(className)); // Cleanup failed state
                    currentActivity = activities.find(a => a.name === 'idle') || activities[0]; // Fallback to idle
                    currentActivity.action?.();
                }

                const duration = typeof currentActivity.duration === 'function'
                    ? currentActivity.duration()
                    : currentActivity.duration || 3000;

                activityTimeout = setTimeout(performActivity, duration);
                 window.stickmanActivityTimeout = activityTimeout; // Store globally
            };

            // Animation loop for continuous movement
            const animate = () => {
                if (currentActivity && (currentActivity.name === 'walk' || currentActivity.name === 'moonwalk')) {
                    const speed = 0.5 + Math.random() * 0.5; // Slower, steadier speed
                    let newX = posX + direction * speed;

                    // Boundary check
                    if (newX >= windowWidth - stickman.offsetWidth - 10 || newX <= 10) {
                         direction *= -1; // Change direction
                         newX = posX + direction * speed; // Recalculate
                         // Flip visual direction immediately for walk (moonwalk handles its own visual flip)
                         if (currentActivity.name === 'walk') {
                            stickman.style.transform = `translateX(${posX}px) translateY(${posY}px) scaleX(${direction})`;
                         } else if (currentActivity.name === 'moonwalk') {
                            stickman.style.transform = `translateX(${posX}px) translateY(${posY}px) scaleX(${-direction})`; // Moonwalk keeps visual opposite
                         }
                    }
                    // Update position (use groundY for Y)
                     updatePosition(newX, groundY, direction);
                }
                animationFrameId = requestAnimationFrame(animate);
                 window.stickmanRAFId = animationFrameId; // Store globally
            };

            // --- Stickman Interaction ---
             stickman.addEventListener('click', () => {
                 clearTimeout(activityTimeout); // Interrupt current activity
                 activityClassNames.forEach(className => stickman.classList.remove(className));
                 stickman.classList.add('jump'); // Reaction: jump
                 showSpeech("Hey!", 800);
                 activityTimeout = setTimeout(performActivity, 1000); // Schedule next activity sooner
                 window.stickmanActivityTimeout = activityTimeout;
             });

             // Start
            setTimeout(performActivity, 1000); // Start after a brief pause
            animate();

        }, () => {
            console.error('Failed to initialize stickman animation.');
            document.querySelector('.stickman-container')?.remove(); // Remove on error
        });
    });

// End of protective scope
})();
