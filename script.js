```javascript
// Function to handle image loading errors (Define globally or within DOMContentLoaded)
function handleImageError(imageElement) {
    console.warn(`Image failed to load: ${imageElement.src}. Hiding element.`);
    // Optional: Replace with a placeholder
    // imageElement.src = 'path/to/placeholder.jpg';
    // Or hide the image
    imageElement.style.display = 'none';
    // Or potentially hide the whole card front:
    // if (imageElement.closest('.mix-card-front')) {
    //   imageElement.closest('.mix-card-front').style.backgroundColor = '#333'; // Fallback bg
    // }
}

// Error Handling Service
class ErrorHandler {
    constructor() {
        // Ensure elements are selected after DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.errorNotification = document.querySelector('.error-notification');
            this.errorMessage = document.querySelector('.error-message');
            this.errorClose = document.querySelector('.error-close');

            if (!this.errorNotification || !this.errorMessage || !this.errorClose) {
                console.error('Error notification elements not found!');
                // Optionally disable error display if elements are missing
                this.displayError = () => {}; // No-op
                this.hideError = () => {}; // No-op
            } else if (this.errorClose) {
                this.errorClose.addEventListener('click', () => {
                    this.hideError();
                });
            }
        });

        this.errorLog = [];
        this.maxErrors = 50;
        this.setupErrorListeners();
    }

    setupErrorListeners() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.logError({ message, source, lineno, colno, error });
            // Display error only if elements exist
            if (this.errorNotification) {
                this.displayError(`Error: ${message} at ${source}:${lineno}`);
            }
            return true; // Prevents default browser error handling
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.logError({ message: 'Unhandled Promise Rejection', reason: event.reason });
            // Display error only if elements exist
            if (this.errorNotification) {
                this.displayError(`Unhandled Promise Rejection: ${event.reason || 'No reason provided'}`);
            }
        });
    }

    logError(error) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || 'Unknown error',
            details: error // Store the full error object/details
        };
        this.errorLog.push(errorEntry);
        if (this.errorLog.length > this.maxErrors) {
            this.errorLog.shift();
        }
        console.error('Error logged by ErrorHandler:', errorEntry);
    }

    displayError(message) {
        // Check again in case DOM wasn't ready during constructor
        if (!this.errorNotification || !this.errorMessage) {
            this.errorNotification = document.querySelector('.error-notification');
            this.errorMessage = document.querySelector('.error-message');
        }

        if (this.errorNotification && this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorNotification.classList.add('visible');
            // Ensure hideError is called even if timeout fails
            try {
                 setTimeout(() => this.hideError(), 5000);
            } catch(e){
                 console.error("Failed to set timeout for hiding error", e);
                 // Attempt to hide immediately if timeout fails
                 this.hideError();
            }
        } else {
            console.error("Cannot display error message - notification elements missing.");
        }
    }

    hideError() {
        if (this.errorNotification) {
            this.errorNotification.classList.remove('visible');
        }
    }

    attemptRecovery(func, fallback) {
        try {
            return func();
        } catch (error) {
            this.logError(error);
            this.displayError(`Recovery triggered due to: ${error.message}`);
            console.error("Recovery Fallback executed for:", func.name || 'anonymous function', error);
            return typeof fallback === 'function' ? fallback() : fallback;
        }
    }
}

// Instantiate the error handler globally
const errorHandler = new ErrorHandler();

// Cookie Utility Functions
const CookieManager = {
    setCookie(name, value, hours) {
        errorHandler.attemptRecovery(() => {
            const date = new Date();
            date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
            const expires = `expires=${date.toUTCString()}`;
            document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`; // Added encodeURIComponent and SameSite
        }, () => console.error(`Failed to set cookie: ${name}`));
    },

    getCookie(name) {
        return errorHandler.attemptRecovery(() => {
            const nameEQ = `${name}=`;
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1);
                if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length)); // Added decodeURIComponent
            }
            return null;
        }, () => {
            console.error(`Failed to get cookie: ${name}`);
            return null; // Fallback value
        });
    },

    deleteCookie(name) {
         errorHandler.attemptRecovery(() => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`; // Added SameSite
         }, () => console.error(`Failed to delete cookie: ${name}`));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Wrap the entire DOMContentLoaded in attemptRecovery
    errorHandler.attemptRecovery(() => {
        console.log("DOM Loaded, initializing page...");

        // Preloader
        const preloader = document.querySelector('.preloader');
        const progressBar = document.querySelector('.progress-bar .progress-bar'); // Target inner bar for width
        const progressText = document.querySelector('.progress-text');
        const preloaderText = document.querySelector('.preloader-text');

        if (preloader && progressBar && progressText && preloaderText) {
            const text = "LOADING...";
            preloaderText.innerHTML = text.split('').map((char, i) => `<span class="preloader-char" style="--char-index: ${i}">${char}</span>`).join('');
            const preloaderChars = preloaderText.querySelectorAll('.preloader-char');

            let progress = 0;
            // Ensure the ::after pseudo-element exists for animation
            progressBar.parentElement.classList.add('active'); // Add active to parent

            const interval = setInterval(() => {
                progress += 1; // Increment progress
                const displayProgress = Math.min(progress, 100); // Cap at 100
                progressText.textContent = `${displayProgress}%`;

                 // Animate chars briefly
                 if (displayProgress > 20 && displayProgress < 80) {
                    preloaderChars.forEach((char, index) => {
                       char.style.setProperty('--char-index', index);
                       char.classList.add('wave');
                    });
                 } else {
                     preloaderChars.forEach(char => char.classList.remove('wave'));
                 }


                if (displayProgress >= 100) {
                    clearInterval(interval);
                    // Ensure fade out happens after progress bar reaches 100% visually
                    setTimeout(() => {
                        preloader.classList.add('hidden');
                         console.log("Preloader hidden, initializing page content...");
                        initializePage(); // Initialize the rest of the page *after* preloader is gone
                    }, 500); // Short delay for visual completion
                }
            }, 40); // Adjust timing as needed (e.g., 40ms for 4 seconds total)
        } else {
            console.error('Preloader elements not found, attempting to initialize page directly.');
             initializePage(); // Attempt to initialize anyway if preloader is broken
        }

        // Page Initialization Function
        function initializePage() {
            errorHandler.attemptRecovery(() => {
                console.log("Running initializePage function...");

                // Particles (If needed - this was simplified in new version, kept minimal)
                const particleContainer = document.querySelector('.section-particles');
                if (particleContainer) {
                    // Simplified particle effect on section change (or keep the old complex one if desired)
                } else {
                     console.warn("Particle container '.section-particles' not found.");
                }


                // Intersection Observer for Sections
                const sections = document.querySelectorAll('section');
                let currentSectionIndex = 0; // Default to first section
                 const observerOptions = { root: null, threshold: 0.2 }; // Adjust threshold as needed

                if (sections.length > 0) {
                    const sectionObserver = new IntersectionObserver((entries) => {
                         entries.forEach(entry => {
                            const targetId = entry.target.id;
                            if (entry.isIntersecting) {
                                console.log(`Section ${targetId} intersecting.`);
                                entry.target.classList.add('in-view', 'active'); // Use 'active' consistent with CSS animations
                                entry.target.classList.remove('out-of-view-up', 'out-of-view-down', 'zoom-down');

                                // Update current index
                                currentSectionIndex = Array.from(sections).indexOf(entry.target);

                                // Update body background class
                                const sectionBgClass = `${targetId}-bg`;
                                // Remove other bg classes before adding the new one
                                document.body.classList.remove('hero-bg', 'mixes-bg', 'artist-bg', 'booking-bg');
                                document.body.classList.add(sectionBgClass);
                                console.log(`Body class set to: ${sectionBgClass}`);


                                // Trigger animations for specific sections when they become active
                                if (targetId === 'mixes') {
                                    const mixGrid = document.querySelector('.mix-grid');
                                    const mixDescription = document.querySelector('.mix-description');
                                    if (mixGrid) mixGrid.classList.add('active');
                                    if (mixDescription) mixDescription.classList.add('active');
                                }
                                if (targetId === 'artist') {
                                    // Artist section already uses .active via observer
                                }
                                 if (targetId === 'booking') {
                                    const neonGrid = document.querySelector('.neon-grid');
                                    if (neonGrid) neonGrid.classList.add('active');
                                }

                            } else {
                                // Optional: Add classes for out-of-view state if needed for animations
                                 // entry.target.classList.remove('in-view', 'active');
                                // Determine if scrolling up or down to apply correct out-of-view class
                                // This simplified version doesn't use the complex up/down scroll transitions
                                 console.log(`Section ${targetId} NOT intersecting.`);
                                // Remove active classes when not intersecting? Decide based on desired animation persistence.
                                // entry.target.classList.remove('active');
                                // if (targetId === 'mixes') {
                                //     const mixGrid = document.querySelector('.mix-grid');
                                //     const mixDescription = document.querySelector('.mix-description');
                                //     if (mixGrid) mixGrid.classList.remove('active');
                                //     if (mixDescription) mixDescription.classList.remove('active');
                                // }
                                // if (targetId === 'booking') {
                                //      const neonGrid = document.querySelector('.neon-grid');
                                //     if (neonGrid) neonGrid.classList.remove('active');
                                // }

                            }
                         });
                    }, observerOptions);

                    sections.forEach(section => sectionObserver.observe(section));
                } else {
                    console.warn("No <section> elements found to observe.");
                }


                // Smooth Scrolling & Nav/Back-to-Top Visibility
                let lastScrollTop = 0;
                const debounce = (func, wait) => {
                    let timeout;
                    return (...args) => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => func.apply(this, args), wait);
                    };
                };

                window.addEventListener('scroll', debounce(() => {
                    errorHandler.attemptRecovery(() => {
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        const isMobile = window.innerWidth <= 768;

                        // Back to Top button visibility
                        const backToTop = document.querySelector('.back-to-top');
                        if (backToTop) {
                            backToTop.classList.toggle('visible', scrollTop > 300);
                        }

                         // Scrolled Nav Class (optional, keep if desired)
                        const nav = document.querySelector('.retro-nav');
                        if (nav) {
                             if (scrollTop > 50 || isMobile) {
                                nav.classList.add('scrolled');
                             } else {
                                nav.classList.remove('scrolled');
                             }
                        }


                        // Flip back mix cards when scrolling mixes section out of view
                        const mixesSection = document.querySelector('#mixes');
                        const mixCards = document.querySelectorAll('.mix-card');
                        if (mixesSection && mixCards.length > 0) {
                            const mixesRect = mixesSection.getBoundingClientRect();
                            const threshold = window.innerHeight * 0.2; // Smaller threshold
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

                        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                    });
                }, 50)); // Adjust debounce timing if needed

                // Navigation Links (Standard Smooth Scroll)
                document.querySelectorAll('.retro-nav a, .neon-button[href^="#"], .back-to-top[href^="#"]').forEach(anchor => {
                    anchor.addEventListener('click', (e) => {
                         errorHandler.attemptRecovery(() => {
                            const href = anchor.getAttribute('href');
                            if (href && href.startsWith('#')) {
                                e.preventDefault();
                                const targetId = href.substring(1);
                                const targetElement = document.getElementById(targetId);
                                if (targetElement) {
                                    targetElement.scrollIntoView({ behavior: 'smooth' });
                                     console.log(`Scrolling to: #${targetId}`);
                                    // Optional: Manually trigger observer logic if scrollIntoView doesn't fire it reliably
                                    // updateSections(null, Array.from(sections).indexOf(targetElement));
                                } else {
                                    console.warn(`Target element #${targetId} not found for link.`);
                                }
                            }
                         });
                    });
                });

                // Mix Card Flipper with Audio Previews
                const mixCards = document.querySelectorAll('.mix-card');
                let currentlyFlippedCard = null;
                let touchStartTime = 0;
                const longPressDuration = 500;

                if (mixCards.length > 0) {
                     mixCards.forEach(card => {
                        const audio = card.querySelector('.mix-audio');
                        if (!audio) {
                            console.warn("Mix card found without an audio element:", card);
                            return; // Skip if no audio
                        }
                        let previewTimeout = null;

                        // Desktop hover preview
                        card.addEventListener('mouseenter', () => {
                            errorHandler.attemptRecovery(() => {
                                if (!card.classList.contains('flipped') && !audio.paused) { audio.pause();} // Pause if already playing from another interaction
                                if (!card.classList.contains('flipped')) {
                                    audio.currentTime = 0;
                                    audio.play().catch(e => console.warn("Audio play interrupted or failed:", e)); // Play and catch errors
                                    previewTimeout = setTimeout(() => audio.pause(), 5000); // 5-second preview
                                }
                            });
                        });

                        card.addEventListener('mouseleave', () => {
                            errorHandler.attemptRecovery(() => {
                                if (!card.classList.contains('flipped')) {
                                    audio.pause();
                                    clearTimeout(previewTimeout);
                                }
                            });
                        });

                        // Mobile tap/long press & Desktop click unified logic
                        let clickTimeout = null;
                        card.addEventListener('click', (e) => {
                             errorHandler.attemptRecovery(() => {
                                // Prevent interference with audio controls inside the card back
                                if (e.target.closest('audio')) {
                                    return;
                                }

                                clearTimeout(clickTimeout); // Clear any pending short tap action
                                clickTimeout = setTimeout(() => {
                                     // --- Flip Logic ---
                                    if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                                        currentlyFlippedCard.classList.remove('flipped');
                                        const previousAudio = currentlyFlippedCard.querySelector('.mix-audio');
                                        if (previousAudio) previousAudio.pause();
                                    }

                                    card.classList.toggle('flipped');
                                    currentlyFlippedCard = card.classList.contains('flipped') ? card : null;

                                    // Pause audio if card is flipped back OR play if flipped to back (optional)
                                    if (!card.classList.contains('flipped')) {
                                        audio.pause();
                                    } else {
                                        // Optional: Play audio when flipped to back
                                        // audio.currentTime = 0;
                                        // audio.play().catch(e => console.warn("Audio play interrupted or failed:", e));
                                    }
                                }, 250); // Adjust delay to differentiate tap vs long press/accidental clicks
                            });
                        });

                        // Optional: Add touchstart/touchend for mobile-specific preview if click isn't enough
                        // card.addEventListener('touchstart', ...)
                        // card.addEventListener('touchend', ...)

                    });
                } else {
                    console.warn("No '.mix-card' elements found.");
                }


                // Form Handling
                const bookingForm = document.getElementById('booking-form');
                const formFlipper = document.querySelector('.form-flipper');
                const inputs = bookingForm ? bookingForm.querySelectorAll('input, select') : [];
                const finishButtonFront = document.querySelector('.finish-button-front');
                // const bookNowButton = document.querySelector('.book-now-button'); // No longer used to flip
                const formGroups = document.querySelectorAll('.form-group');
                const finishGroup = document.querySelector('.form-group.finish-group');
                let filledFields = new Set();

                if (bookingForm && formFlipper && inputs.length > 0 && finishButtonFront && finishGroup) {

                    const checkAllRequiredFields = () => {
                        let allValid = true;
                        inputs.forEach(input => {
                            if (input.hasAttribute('required') && !input.value.trim()) {
                                allValid = false;
                            }
                             // Check validity state for types like email, date, etc.
                            if (!input.checkValidity()) {
                                allValid = false;
                            }
                        });
                        return allValid;
                    };

                    inputs.forEach((input, index) => {
                        const wrapper = input.closest('.input-wrapper');
                        const label = wrapper ? wrapper.querySelector('.input-label') : null;
                        const checkmark = wrapper ? wrapper.querySelector('.checkmark') : null;
                        const formGroup = input.closest('.form-group');
                        const fieldName = formGroup ? formGroup.dataset.field : null;

                        if (!wrapper || !label || !checkmark || !fieldName) {
                            console.warn("Form input missing wrapper, label, checkmark or data-field:", input);
                            return; // Skip this input if structure is wrong
                        }

                         // Hide label on focus, show if empty on blur
                        input.addEventListener('focus', () => label.classList.add('hidden'));
                        input.addEventListener('blur', () => {
                             if (!input.value.trim()) {
                                label.classList.remove('hidden');
                             }
                        });

                        // Flip on valid input
                        input.addEventListener('input', () => { // Use 'input' for immediate feedback
                             errorHandler.attemptRecovery(() => {
                                if (input.checkValidity() && input.value.trim()) {
                                    if (!wrapper.classList.contains('flipped')) {
                                        wrapper.classList.add('flipped');
                                        checkmark.classList.add('glowing');
                                        filledFields.add(fieldName);
                                        // Check if all fields are now valid to show Finish button
                                        if (checkAllRequiredFields()) {
                                            finishGroup.classList.add('active');
                                        }
                                    }
                                } else {
                                     // If input becomes invalid/empty, unflip? (Optional)
                                    // wrapper.classList.remove('flipped');
                                    // checkmark.classList.remove('glowing');
                                    // filledFields.delete(fieldName);
                                    // finishGroup.classList.remove('active');
                                }
                            });
                        });

                        // Allow unflipping by clicking the checkmark
                        checkmark.addEventListener('click', () => {
                             errorHandler.attemptRecovery(() => {
                                wrapper.classList.remove('flipped');
                                checkmark.classList.remove('glowing');
                                filledFields.delete(fieldName);
                                label.classList.remove('hidden'); // Show label again
                                finishGroup.classList.remove('active'); // Hide finish button
                                input.focus(); // Focus the input for editing
                            });
                        });
                    });

                    // Finish button flips the form (if all fields valid)
                    finishButtonFront.addEventListener('click', (e) => {
                        e.preventDefault(); // Prevent default button action
                         errorHandler.attemptRecovery(() => {
                            if (checkAllRequiredFields()) {
                                formFlipper.classList.add('flipped');
                                console.log("Form fields valid, flipping to back.");
                            } else {
                                errorHandler.displayError('Please fill out all required fields correctly.');
                                // Optional: Highlight invalid fields
                                inputs.forEach(input => {
                                     if (!input.checkValidity() || (input.hasAttribute('required') && !input.value.trim())) {
                                         // Add an error class or style
                                         input.style.borderColor = 'red'; // Simple example
                                         setTimeout(()=> input.style.borderColor = '', 2000); // Reset after delay
                                     }
                                });
                            }
                        });
                    });

                    // Handle actual form submission (triggered by Book Now button type="submit")
                    bookingForm.addEventListener('submit', (e) => {
                        // Formspree handles the submission, just reset UI after a delay
                         console.log("Form submitted via Formspree.");
                         // Optional: Add a loading indicator here
                        setTimeout(() => {
                            errorHandler.attemptRecovery(() => {
                                alert('Booking submitted successfully!'); // Or use a custom notification
                                bookingForm.reset();
                                formFlipper.classList.remove('flipped'); // Flip back to front
                                filledFields.clear();
                                inputs.forEach(input => {
                                    const wrapper = input.closest('.input-wrapper');
                                    const checkmark = wrapper ? wrapper.querySelector('.checkmark') : null;
                                    const label = wrapper ? wrapper.querySelector('.input-label') : null;
                                    if (wrapper) wrapper.classList.remove('flipped');
                                    if (checkmark) checkmark.classList.remove('glowing');
                                    if (label) label.classList.remove('hidden');
                                });
                                if (finishGroup) finishGroup.classList.remove('active'); // Hide finish button
                                 console.log("Form reset after submission.");
                            });
                        }, 1000); // Increase delay slightly to ensure formspree processes
                    });

                } else {
                    console.error("Booking form or its essential elements not found.");
                }


                // Sound Wave Animation (Interactive)
                const heroSection = document.querySelector('.hero');
                const soundWaveContainer = document.querySelector('.sound-wave-container');
                const soundBars = soundWaveContainer ? soundWaveContainer.querySelectorAll('.sound-bar') : [];

                if (heroSection && soundWaveContainer && soundBars.length > 0) {
                    const updateBars = (x, y) => {
                         errorHandler.attemptRecovery(() => {
                            const containerRect = soundWaveContainer.getBoundingClientRect();
                            // Ensure container has dimensions
                            if (!containerRect || containerRect.width === 0 || containerRect.height === 0) return;

                            const relativeX = x - containerRect.left;
                            const relativeY = y - containerRect.top; // Include Y for more interaction
                            const maxDistance = Math.max(containerRect.width, containerRect.height) * 0.7; // Adjust sensitivity
                            const maxHeight = 80;
                            const minHeight = 10;

                            soundBars.forEach((bar) => {
                                const barRect = bar.getBoundingClientRect();
                                const barCenterX = barRect.left - containerRect.left + barRect.width / 2;
                                const barCenterY = barRect.top - containerRect.top + barRect.height / 2; // Use Y center

                                const distanceX = Math.abs(relativeX - barCenterX);
                                const distanceY = Math.abs(relativeY - barCenterY); // Use Y distance
                                const distance = Math.sqrt(distanceX * distanceX + distanceY*distanceY); // Pythagorean theorem

                                const influence = Math.max(0, (maxDistance - distance) / maxDistance);
                                const height = minHeight + (maxHeight - minHeight) * influence; // Removed * 1.5, adjust if needed

                                bar.style.height = `${Math.min(maxHeight, Math.max(minHeight, height))}px`;
                            });
                         });
                    };

                    const resetBars = () => {
                        soundBars.forEach(bar => bar.style.height = '10px');
                    };

                    heroSection.addEventListener('mousemove', (e) => updateBars(e.clientX, e.clientY));
                    heroSection.addEventListener('touchmove', (e) => {
                         errorHandler.attemptRecovery(() => {
                            const touch = e.touches[0];
                            const containerRect = soundWaveContainer.getBoundingClientRect();
                            // Check if touch is within the sound wave container bounds
                            if (touch.clientX >= containerRect.left && touch.clientX <= containerRect.right &&
                                touch.clientY >= containerRect.top && touch.clientY <= containerRect.bottom) {
                                e.preventDefault(); // Prevent page scroll only when interacting with wave
                                updateBars(touch.clientX, touch.clientY);
                            }
                         });
                    }, { passive: false }); // passive: false needed for preventDefault

                    heroSection.addEventListener('mouseleave', resetBars);
                    heroSection.addEventListener('touchend', resetBars);
                    heroSection.addEventListener('touchcancel', resetBars); // Handle cancellation

                } else {
                    console.warn("Hero section, sound wave container, or sound bars not found.");
                }


                // Retro Cube and Timer (Simplified Update Logic)
                const cubeContainer = document.querySelector('.retro-cube-container');
                const cube = document.querySelector('.retro-cube');
                const countdownTimer = document.querySelector('.countdown-timer');
                const closeButtons = document.querySelectorAll('.cube-close'); // Use querySelectorAll
                const timerDigits = {
                    // Add hours back if needed & HTML exists
                    // hours1: document.querySelector('.timer-digit.hours-1'),
                    // hours2: document.querySelector('.timer-digit.hours-2'),
                    minutes1: document.querySelector('.timer-digit.minutes-1'),
                    minutes2: document.querySelector('.timer-digit.minutes-2'),
                    seconds1: document.querySelector('.timer-digit.seconds-1'),
                    seconds2: document.querySelector('.timer-digit.seconds-2')
                };

                if (cubeContainer && cube && countdownTimer && closeButtons.length > 0 && !Object.values(timerDigits).some(d => !d)) {

                    const totalSeconds = 5 * 60; // 5 minutes (adjust as needed)
                    let remainingSeconds;
                    const timerEndCookie = CookieManager.getCookie('timerEnd');
                    let countdownInterval = null; // Store interval ID

                    if (timerEndCookie) {
                        const endTime = parseInt(timerEndCookie, 10);
                        const currentTime = Math.floor(Date.now() / 1000);
                        remainingSeconds = Math.max(0, endTime - currentTime);
                         console.log(`Timer cookie found. End time: ${endTime}, Current time: ${currentTime}, Remaining: ${remainingSeconds}`);
                    } else {
                        remainingSeconds = totalSeconds;
                        // Don't set cookie until timer starts
                         console.log(`No timer cookie found. Initial duration: ${totalSeconds}`);
                    }

                    // Show cube container (it's positioned bottom-left now)
                    cubeContainer.classList.add('visible');


                    closeButtons.forEach(button => {
                        button.addEventListener('click', () => {
                            errorHandler.attemptRecovery(() => {
                                console.log("Cube close clicked.");
                                // Only start if not already in timer mode
                                if (!cubeContainer.classList.contains('timer-mode')) {
                                    // Set cookie ONLY when timer starts via close button
                                    if (!CookieManager.getCookie('timerEnd')) {
                                        const endTime = Math.floor(Date.now() / 1000) + remainingSeconds;
                                        CookieManager.setCookie('timerEnd', endTime, 1); // Store for 1 hour
                                        console.log(`Timer starting, setting cookie. End time: ${endTime}`);
                                    }

                                    cube.classList.add('roll-to-timer'); // Optional animation
                                    setTimeout(() => {
                                        cubeContainer.classList.add('timer-mode');
                                        startCountdown();
                                    }, 500); // Shorter delay to match simpler animation/transition
                                }
                            });
                        });
                    });

                    function startCountdown() {
                        if (countdownInterval) clearInterval(countdownInterval); // Clear existing interval if any
                         console.log("Starting countdown...");
                        updateTimerDisplay(); // Initial display

                        countdownInterval = setInterval(() => {
                             errorHandler.attemptRecovery(() => {
                                if (remainingSeconds <= 0) {
                                    clearInterval(countdownInterval);
                                    countdownTimer.classList.add('expired');
                                    CookieManager.deleteCookie('timerEnd');
                                     console.log("Timer expired.");
                                    return;
                                }
                                remainingSeconds--;
                                updateTimerDisplay();
                             });
                        }, 1000);
                    }

                    function updateTimerDisplay() {
                         // const hours = Math.floor(remainingSeconds / 3600);
                         const minutes = Math.floor((remainingSeconds % 3600) / 60);
                         const seconds = remainingSeconds % 60;

                         // updateDigitSimple(timerDigits.hours1, Math.floor(hours / 10));
                         // updateDigitSimple(timerDigits.hours2, hours % 10);
                         updateDigitSimple(timerDigits.minutes1, Math.floor(minutes / 10));
                         updateDigitSimple(timerDigits.minutes2, minutes % 10);
                         updateDigitSimple(timerDigits.seconds1, Math.floor(seconds / 10));
                         updateDigitSimple(timerDigits.seconds2, seconds % 10);
                    }

                    // Simple digit update function (no complex flip needed)
                    function updateDigitSimple(digitElement, value) {
                        const valueStr = String(value);
                         if (digitElement && digitElement.textContent !== valueStr) {
                             digitElement.textContent = valueStr;
                         }
                    }

                    // Initialize timer display and start if cookie indicates it should be running
                    if (remainingSeconds > 0 && timerEndCookie) {
                        console.log("Timer should be running based on cookie, activating timer mode.");
                        cubeContainer.classList.add('timer-mode');
                        startCountdown();
                    } else if (remainingSeconds <= 0) {
                         console.log("Timer already expired based on cookie or initial state.");
                        cubeContainer.classList.add('timer-mode'); // Show expired timer
                        updateTimerDisplay(); // Show 00:00
                        countdownTimer.classList.add('expired');
                    }

                } else {
                    console.error("Retro cube/timer or its essential elements not found.");
                }


                // Stickman Animation
                const stickmanContainer = document.querySelector('.stickman-container');

                if (stickmanContainer) {
                     errorHandler.attemptRecovery(() => {
                        // Create stickman parts dynamically if they don't exist
                         let stickman = stickmanContainer.querySelector('.stickman');
                         if (!stickman) {
                            stickman = document.createElement('div');
                            stickman.classList.add('stickman');
                            stickman.innerHTML = `
                                <div class="stickman-head"></div>
                                <div class="stickman-body"></div>
                                <div class="stickman-arm-left"></div>
                                <div class="stickman-arm-right"></div>
                                <div class="stickman-leg-left"></div>
                                <div class="stickman-leg-right"></div>
                                <div class="stickman-speech-bubble">
                                    <span class="stickman-speech-text"></span>
                                </div>`;
                            stickmanContainer.appendChild(stickman);
                             console.log("Stickman element created dynamically.");
                        } else {
                             console.log("Stickman element found in HTML.");
                        }


                        const bookButton = document.querySelector('.neon-button[href="#booking"]'); // More specific selector
                        let position = 50; // Start position
                        let direction = 1; // 1 for right, -1 for left
                        let isWalking = false;
                        const speechBubble = stickman.querySelector('.stickman-speech-bubble');
                        const speechText = stickman.querySelector('.stickman-speech-text');

                        // Define stickman actions
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
                            // Add jumpOnButton conditionally if button exists
                        ];

                         if (bookButton) {
                             actions.push({ name: 'jumpOnButton', duration: 4000, message: 'Book a mix, huh?', action: () => {
                                 const buttonRect = bookButton.getBoundingClientRect();
                                 // Calculate target position based on button's position relative to viewport
                                 const targetX = buttonRect.left + window.scrollX + (buttonRect.width / 2) - (stickman.offsetWidth / 2);
                                 // Simple jump towards button - more complex pathfinding could be added
                                 position = targetX;
                                 stickman.style.transform = `translateX(${position}px)`; // Use translateX
                                 stickman.classList.add('jumping');
                                 console.log("Stickman jumping near button.");
                             }});
                         }


                        let currentActionTimeout = null;
                        let walkFrameId = null;

                        function performAction() {
                            clearTimeout(currentActionTimeout);
                            cancelAnimationFrame(walkFrameId); // Stop previous walk animation frame

                            const currentClasses = Array.from(stickman.classList).filter(cls => cls !== 'stickman');
                            stickman.classList.remove(...currentClasses); // Remove old action classes

                            const action = actions[Math.floor(Math.random() * actions.length)];
                            console.log(`Stickman performing: ${action.name}`);
                            stickman.classList.add(action.name);

                             if (speechBubble && speechText) {
                                speechText.textContent = action.message;
                                speechBubble.classList.add('visible');
                            }


                            isWalking = (action.name === 'walking'); // Set walking flag

                            if (action.action) {
                                action.action(); // Execute specific action code (like jumpOnButton)
                            }

                            if (isWalking) {
                                moveStickman(); // Start walk animation loop
                            }

                            // Schedule next action
                            currentActionTimeout = setTimeout(() => {
                                 if (speechBubble) speechBubble.classList.remove('visible');
                                // Add a short delay before starting the next action
                                setTimeout(performAction, 500);
                            }, action.duration);
                        }

                        function moveStickman() {
                            if (!isWalking) {
                                cancelAnimationFrame(walkFrameId);
                                return;
                            }

                            position += direction * 2; // Adjust speed as needed
                            const maxPos = window.innerWidth - stickman.offsetWidth - 10; // Max right position
                            const minPos = 10; // Min left position

                            if (position > maxPos) {
                                position = maxPos;
                                direction = -1;
                                stickman.style.transform = `translateX(${position}px) scaleX(-1)`; // Flip direction
                            } else if (position < minPos) {
                                position = minPos;
                                direction = 1;
                                stickman.style.transform = `translateX(${position}px) scaleX(1)`; // Face right
                            } else {
                                // Update position and direction facing
                                stickman.style.transform = `translateX(${position}px) scaleX(${direction})`;
                            }

                            walkFrameId = requestAnimationFrame(moveStickman); // Continue animation loop
                        }

                        // Initial placement and start actions
                         stickman.style.transform = `translateX(${position}px) scaleX(${direction})`;
                         performAction(); // Start the first action

                    }); // End attemptRecovery for Stickman
                } else {
                    console.warn("'.stickman-container' not found. Stickman animation disabled.");
                }

                console.log("initializePage function completed.");
            }, () => console.error("Major failure during initializePage execution.")); // Fallback for initializePage failure
        } // End of initializePage function

    }, () => console.error("Critical error during DOMContentLoaded event processing.")); // Fallback for DOMContentLoaded failure
}); // End of DOMContentLoaded listener

```
