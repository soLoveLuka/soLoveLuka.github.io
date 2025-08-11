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
        this.errorNotification = null;
        this.errorMessage = null;
        this.errorClose = null;
        this.errorLog = [];
        this.maxErrors = 50;
        this.domReady = false; // Flag to check if DOM is ready for UI updates

        // Defer DOM selections until DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.errorNotification = document.querySelector('.error-notification');
            this.errorMessage = document.querySelector('.error-message');
            this.errorClose = document.querySelector('.error-close');
            this.domReady = true; // Mark DOM as ready

            if (!this.errorNotification || !this.errorMessage || !this.errorClose) {
                console.error('ErrorHandler: Error notification elements not found in the DOM!');
            } else if (this.errorClose) {
                this.errorClose.addEventListener('click', () => {
                    this.hideError();
                });
            }
        });

        this.setupErrorListeners();
    }

    setupErrorListeners() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.logError({ message, source, lineno, colno, error: error || new Error(message) }); // Ensure error object exists
            this.displayError(`Script Error: ${message} at ${source}:${lineno}`);
            return true; // Prevents default browser error handling
        };

        window.addEventListener('unhandledrejection', (event) => {
            // Log the reason, which could be an Error object or something else
            this.logError({ message: 'Unhandled Promise Rejection', reason: event.reason });
            // Try to display a user-friendly message
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
            // Include stack trace if available
            stack: (errorInfo.error instanceof Error) ? errorInfo.error.stack : (errorInfo.reason instanceof Error ? errorInfo.reason.stack : undefined),
            details: errorInfo // Store the full context
        };
        this.errorLog.push(errorEntry);
        if (this.errorLog.length > this.maxErrors) {
            this.errorLog.shift();
        }
        console.error('ErrorHandler Log:', errorEntry); // Use console.error for visibility
    }

    displayError(message) {
        // Only display if DOM is ready and elements exist
        if (!this.domReady || !this.errorNotification || !this.errorMessage) {
            console.warn("ErrorHandler: Cannot display error UI - DOM not ready or elements missing.", message);
            return;
        }

        try {
            this.errorMessage.textContent = message;
            this.errorNotification.classList.add('visible');
            // Set timeout to hide the error
            setTimeout(() => this.hideError(), 6000); // Increased duration
        } catch (e) {
            // Catch errors during the display process itself
            console.error("ErrorHandler: Failed to display error message.", e);
        }
    }

    hideError() {
        if (this.errorNotification) {
            try {
                this.errorNotification.classList.remove('visible');
            } catch (e) {
                console.error("ErrorHandler: Failed to hide error notification.", e);
            }
        }
    }

    // Wrapper to execute functions safely
    attemptRecovery(func, context = null, fallback = null) {
        try {
            // Use .call or .apply if a specific 'this' context is needed
            return func.call(context);
        } catch (error) {
            // Log the error using the established system
            this.logError({ message: `Execution failed in ${func.name || 'anonymous function'}`, error: error });
            // Display a generic error or specific one if desired
            this.displayError(`Operation failed: ${error.message}`);
            console.error(`Recovery Fallback executed for: ${func.name || 'anonymous function'}`, error);
            // Execute fallback if provided
            if (typeof fallback === 'function') {
                try {
                    return fallback.call(context);
                } catch (fallbackError) {
                    this.logError({ message: `Fallback function failed for ${func.name || 'anonymous function'}`, error: fallbackError });
                    console.error(`Fallback function itself failed for: ${func.name || 'anonymous function'}`, fallbackError);
                }
            }
            // Return undefined or a default value if no fallback or fallback failed
            return undefined;
        }
    }
}

// Instantiate the error handler globally
const errorHandler = new ErrorHandler();

// Cookie Utility Functions (Wrapped with error handling)
const CookieManager = {
    setCookie(name, value, hours) {
        errorHandler.attemptRecovery(() => {
            let expires = "";
            if (hours) {
                const date = new Date();
                date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
                expires = `expires=${date.toUTCString()}`;
            }
            // Ensure value is string and encoded
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            document.cookie = `${name}=${encodeURIComponent(stringValue)};${expires};path=/;SameSite=Lax`;
            // console.log(`Cookie set: ${name}`);
        }, null, () => console.error(`Failed to set cookie: ${name}`));
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
                    // console.log(`Cookie get: ${name} = ${value}`);
                    // Try parsing if it looks like JSON
                    try { return JSON.parse(value); } catch (e) { return value; }
                }
            }
            // console.log(`Cookie get: ${name} not found`);
            return null;
        }, null, () => {
            console.error(`Failed to get cookie: ${name}`);
            return null; // Fallback value
        });
    },

    deleteCookie(name) {
        errorHandler.attemptRecovery(() => {
            document.cookie = `${name}=;Max-Age=-99999999;path=/;SameSite=Lax`; // Use Max-Age for deletion
            // console.log(`Cookie deleted: ${name}`);
        }, null, () => console.error(`Failed to delete cookie: ${name}`));
    }
};

// Main execution flow starts here
document.addEventListener('DOMContentLoaded', () => {
    // Wrap the *entire* DOMContentLoaded logic in attemptRecovery
    errorHandler.attemptRecovery(() => {
        console.log("DOM Loaded, initializing page...");

        // --- Preloader Logic ---
        const preloader = document.querySelector('.preloader');
        // *** CORRECTED SELECTOR FOR PROGRESS BAR ***
        const progressBarElement = document.querySelector('.preloader-progress .progress-bar');
        const progressText = document.querySelector('.progress-text');
        const preloaderText = document.querySelector('.preloader-text');
        let preloaderInterval = null; // To store the interval ID

        if (preloader && progressBarElement && progressText && preloaderText) {
            console.log("Preloader elements found.");
            const text = "LOADING...";
            preloaderText.innerHTML = text.split('').map((char, i) => `<span class="preloader-char" style="--char-index: ${i}">${char}</span>`).join('');
            const preloaderChars = preloaderText.querySelectorAll('.preloader-char');

            let progress = 0;
            // *** ADD ACTIVE CLASS TO PROGRESS BAR ITSELF FOR CSS ANIMATION ***
            progressBarElement.classList.add('active');

            preloaderInterval = setInterval(() => {
                // Wrap interval logic in try...catch
                try {
                    progress += 1; // Increment progress
                    const displayProgress = Math.min(progress, 100); // Cap at 100
                    progressText.textContent = `${displayProgress}%`;

                    // Animate chars briefly (optional)
                    if (displayProgress > 20 && displayProgress < 80) {
                        preloaderChars.forEach((char, index) => {
                            char.style.setProperty('--char-index', index);
                            char.classList.add('wave');
                        });
                    } else {
                        preloaderChars.forEach(char => char.classList.remove('wave'));
                    }

                    // --- Check for completion ---
                    if (displayProgress >= 100) {
                        console.log("Preloader progress reached 100.");
                        clearInterval(preloaderInterval); // Stop the interval
                        preloaderInterval = null; // Clear the interval ID variable

                        // Use setTimeout to allow CSS animation to potentially finish and then hide/initialize
                        setTimeout(() => {
                             errorHandler.attemptRecovery(() => {
                                preloader.classList.add('hidden');
                                console.log("Preloader hidden via class.");
                                // Call initializePage *only after* hiding the preloader
                                console.log("Calling initializePage...");
                                initializePage();
                             }, null, () => console.error("Error occurred during preloader hiding or calling initializePage."));
                        }, 500); // Delay (adjust if needed)
                    }
                } catch (intervalError) {
                     console.error("Error inside preloader interval:", intervalError);
                     if (preloaderInterval) clearInterval(preloaderInterval); // Attempt to clear interval on error
                     preloaderInterval = null;
                     // Decide how to handle: hide preloader immediately and try initializing?
                     preloader.classList.add('hidden'); // Force hide
                     errorHandler.displayError("Loading failed. Please refresh.");
                     // Optionally try to initialize anyway, or just stop
                     // initializePage();
                }
            }, 40); // Adjust timing (40ms * 100 = 4 seconds)

        } else {
            // If preloader elements are missing, log error and try to initialize directly
            console.error('Preloader elements missing! Attempting to initialize page directly.');
            if (preloader) preloader.style.display = 'none'; // Force hide if preloader div exists but others dont
            initializePage();
        }

        // --- Page Initialization Function ---
        // This function will ONLY be called if the preloader logic completes successfully
        function initializePage() {
            // Wrap the main initialization logic
            errorHandler.attemptRecovery(() => {
                console.log("Running initializePage function...");

                // Particles (Minimal placeholder)
                const particleContainer = document.querySelector('.section-particles');
                if (!particleContainer) {
                     console.warn("Particle container '.section-particles' not found.");
                }

                // Intersection Observer for Sections
                const sections = document.querySelectorAll('section');
                let currentSectionIndex = 0;
                const observerOptions = { root: null, threshold: 0.2 };

                if (sections.length > 0) {
                    const sectionObserver = new IntersectionObserver((entries) => {
                       errorHandler.attemptRecovery(() => { // Wrap observer callback
                            entries.forEach(entry => {
                                const targetId = entry.target.id;
                                if (entry.isIntersecting) {
                                    // console.log(`Section ${targetId} intersecting.`);
                                    entry.target.classList.add('in-view', 'active');
                                    entry.target.classList.remove('out-of-view-up', 'out-of-view-down', 'zoom-down');
                                    currentSectionIndex = Array.from(sections).indexOf(entry.target);

                                    const sectionBgClass = `${targetId}-bg`;
                                    if (!document.body.classList.contains(sectionBgClass)) {
                                        document.body.classList.remove('hero-bg', 'mixes-bg', 'artist-bg', 'booking-bg');
                                        document.body.classList.add(sectionBgClass);
                                        // console.log(`Body class set to: ${sectionBgClass}`);
                                    }

                                    // Trigger specific section animations
                                    if (targetId === 'mixes') {
                                        const mixGrid = document.querySelector('.mix-grid');
                                        const mixDescription = document.querySelector('.mix-description');
                                        if (mixGrid) mixGrid.classList.add('active');
                                        if (mixDescription) mixDescription.classList.add('active');
                                    }
                                    if (targetId === 'booking') {
                                        const neonGrid = document.querySelector('.neon-grid');
                                        if (neonGrid) neonGrid.classList.add('active');
                                    }
                                    // Add more section-specific triggers if needed

                                } else {
                                    // console.log(`Section ${targetId} NOT intersecting.`);
                                    // Decide if sections should lose 'active' state when out of view
                                    // entry.target.classList.remove('active');
                                }
                            });
                       }); // End observer callback attemptRecovery
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
                        timeout = setTimeout(() => errorHandler.attemptRecovery(func, this, () => console.warn("Debounced function failed.")), wait);
                    };
                };

                window.addEventListener('scroll', debounce(() => {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const isMobile = window.innerWidth <= 768;

                    const backToTop = document.querySelector('.back-to-top');
                    if (backToTop) backToTop.classList.toggle('visible', scrollTop > 300);

                    const nav = document.querySelector('.retro-nav');
                    if (nav) nav.classList.toggle('scrolled', scrollTop > 50 || isMobile);

                    // Flip back mix cards (Keep this logic)
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
                    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                }, 50));


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
                // Removed touchStartTime, longPressDuration, clickTimeout - simplified click/hover logic

                if (mixCards.length > 0) {
                     mixCards.forEach(card => {
                        const audio = card.querySelector('.mix-audio');
                        if (!audio) return; // Skip if no audio

                        let previewTimeout = null;

                        card.addEventListener('mouseenter', () => {
                             errorHandler.attemptRecovery(() => {
                                if (!card.classList.contains('flipped')) {
                                    if (!audio.paused) audio.pause(); // Ensure paused before playing preview
                                    audio.currentTime = 0;
                                    audio.play().catch(e => console.warn("Audio play interrupted:", e));
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
                                // Prevent flip if clicking on audio controls
                                if (e.target.closest('audio')) return;

                                // Simple toggle flip on click
                                if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                                    currentlyFlippedCard.classList.remove('flipped');
                                    const previousAudio = currentlyFlippedCard.querySelector('.mix-audio');
                                    if (previousAudio) previousAudio.pause();
                                }

                                card.classList.toggle('flipped');
                                currentlyFlippedCard = card.classList.contains('flipped') ? card : null;

                                // Pause audio if card is flipped back
                                if (!card.classList.contains('flipped')) {
                                     if (!audio.paused) audio.pause();
                                     clearTimeout(previewTimeout); // Clear any pending preview pause
                                } else {
                                    // Optional: Auto-play when flipped TO back?
                                    // audio.currentTime = 0;
                                    // audio.play().catch(e => console.warn("Audio play interrupted:", e));
                                }
                            });
                        });
                    });
                } else {
                    console.warn("No '.mix-card' elements found.");
                }


                // Form Handling
                const bookingForm = document.getElementById('booking-form');
                const formFlipper = document.querySelector('.form-flipper');
                const inputs = bookingForm ? Array.from(bookingForm.querySelectorAll('input, select')) : []; // Use Array.from
                const finishButtonFront = document.querySelector('.finish-button-front');
                const finishGroup = document.querySelector('.form-group.finish-group');
                let filledFields = new Set(); // Keep track of fields marked as valid

                if (bookingForm && formFlipper && inputs.length > 0 && finishButtonFront && finishGroup) {

                    const checkAllRequiredFieldsValidity = () => {
                        // Check validity state and required attribute
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

                        if (!wrapper || !label || !checkmark || !fieldName) return; // Skip malformed inputs

                        // Label visibility based on placeholder trick + focus
                        input.addEventListener('focus', () => label.classList.add('has-focus')); // Use a class for focus state
                        input.addEventListener('blur', () => {
                            label.classList.remove('has-focus');
                             // Label float based on value exists - CSS handles this with :not(:placeholder-shown)
                        });

                        // Flip logic on valid input using 'input' event
                        input.addEventListener('input', () => {
                            errorHandler.attemptRecovery(() => {
                                const isValid = input.checkValidity() && (input.value.trim() !== '' || !input.hasAttribute('required'));
                                if (isValid) {
                                    if (!wrapper.classList.contains('flipped')) {
                                        wrapper.classList.add('flipped');
                                        checkmark.classList.add('glowing');
                                        filledFields.add(fieldName);
                                        if (checkAllRequiredFieldsValidity()) {
                                            finishGroup.classList.add('active');
                                        }
                                    }
                                } else {
                                    // If input becomes invalid, UNFLIP it
                                    if (wrapper.classList.contains('flipped')) {
                                        wrapper.classList.remove('flipped');
                                        checkmark.classList.remove('glowing');
                                        filledFields.delete(fieldName);
                                        finishGroup.classList.remove('active'); // Hide finish button if any field is un-flipped
                                    }
                                }
                            });
                        });

                        // Allow unflipping by clicking the checkmark
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

                    // Finish button flips the form (only if all required fields are valid)
                    finishButtonFront.addEventListener('click', (e) => {
                        e.preventDefault();
                        errorHandler.attemptRecovery(() => {
                            // Trigger validation check on all fields before flipping
                            inputs.forEach(input => input.dispatchEvent(new Event('input'))); // Re-evaluate flip state

                            if (checkAllRequiredFieldsValidity()) {
                                formFlipper.classList.add('flipped');
                            } else {
                                errorHandler.displayError('Please correct the invalid fields.');
                                // Highlight invalid fields
                                inputs.forEach(input => {
                                     if (!input.checkValidity()) {
                                        input.style.outline = '2px solid red'; // Simple highlight
                                        setTimeout(() => input.style.outline = '', 3000);
                                     }
                                });
                            }
                        });
                    });

                    // Handle actual form submission (triggered by Book Now button type="submit")
                    bookingForm.addEventListener('submit', (e) => {
                        console.log("Form submit event triggered.");
                        // Optional: Add final validation before allowing Formspree
                        // if (!checkAllRequiredFieldsValidity()) {
                        //     e.preventDefault();
                        //     errorHandler.displayError("Please correct errors before submitting.");
                        //     return;
                        // }

                        // Add a visual cue that submission is happening
                        const submitButton = bookingForm.querySelector('button[type="submit"]');
                        if (submitButton) submitButton.textContent = "Booking..."; submitButton.disabled = true;

                        // Reset UI after a delay (Formspree redirects anyway, this is mostly fallback)
                        setTimeout(() => {
                            errorHandler.attemptRecovery(() => {
                                // Check if still on the page before alerting/resetting
                                if (document.getElementById('booking-form')) {
                                    console.log("Resetting form UI after submission delay.");
                                    // alert('Booking submitted successfully!'); // Avoid alert if redirecting
                                    bookingForm.reset(); // Reset native form fields
                                     if (submitButton) submitButton.textContent = "Book Now!"; submitButton.disabled = false;
                                    formFlipper.classList.remove('flipped');
                                    filledFields.clear();
                                    inputs.forEach(input => {
                                        const wrapper = input.closest('.input-wrapper');
                                        const checkmark = wrapper?.querySelector('.checkmark');
                                        const label = wrapper?.querySelector('.input-label');
                                        wrapper?.classList.remove('flipped');
                                        checkmark?.classList.remove('glowing');
                                        // CSS should handle label position on reset via :not(:placeholder-shown)
                                    });
                                    finishGroup?.classList.remove('active');
                                }
                            });
                        }, 1500); // Slightly longer delay
                    });

                } else {
                    console.error("Booking form or its essential elements not found.");
                }


                // Sound Wave Animation (Interactive) - No changes needed here from previous version


                // Retro Cube and Timer (Simplified Update Logic) - No changes needed here from previous version


                 // Stickman Animation
                const stickmanContainer = document.querySelector('.stickman-container');

                if (stickmanContainer) {
                     errorHandler.attemptRecovery(() => {
                        let stickman = stickmanContainer.querySelector('.stickman');
                         if (!stickman) { // Dynamically create if missing
                            stickman = document.createElement('div');
                            stickman.classList.add('stickman');
                            // Add innerHTML for parts
                            stickman.innerHTML = `
                                <div class="stickman-head"></div><div class="stickman-body"></div>
                                <div class="stickman-arm-left"></div><div class="stickman-arm-right"></div>
                                <div class="stickman-leg-left"></div><div class="stickman-leg-right"></div>
                                <div class="stickman-speech-bubble"><span class="stickman-speech-text"></span></div>`;
                            stickmanContainer.appendChild(stickman);
                            console.log("Stickman element created dynamically.");
                         }

                        const bookButton = document.querySelector('.neon-button[href="#booking"]');
                        let position = 50;
                        let direction = 1;
                        let isWalking = false;
                        const speechBubble = stickman.querySelector('.stickman-speech-bubble');
                        const speechText = stickman.querySelector('.stickman-speech-text');

                        const actions = [ /* Keep actions array as defined before */
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
                         if (bookButton) { /* Add jumpOnButton if button exists */
                              actions.push({ name: 'jumpOnButton', duration: 4000, message: 'Book a mix, huh?', action: () => {
                                 const buttonRect = bookButton.getBoundingClientRect();
                                 const targetX = buttonRect.left + window.scrollX + (buttonRect.width / 2) - (stickman.offsetWidth / 2);
                                 position = targetX; // Update target position
                                 stickman.style.transform = `translateX(${position}px) scaleX(${direction})`; // Move towards target
                                 stickman.classList.add('jumping'); // Trigger jump animation
                             }});
                         }

                        let currentActionTimeout = null;
                        let walkFrameId = null;

                        function performAction() {
                            // Wrap action logic in recovery block
                            errorHandler.attemptRecovery(() => {
                                clearTimeout(currentActionTimeout);
                                cancelAnimationFrame(walkFrameId);

                                const currentClasses = Array.from(stickman.classList).filter(cls => cls !== 'stickman');
                                stickman.classList.remove(...currentClasses);

                                const action = actions[Math.floor(Math.random() * actions.length)];
                                // console.log(`Stickman performing: ${action.name}`);
                                stickman.classList.add(action.name);

                                if (speechBubble && speechText) {
                                    speechText.textContent = action.message;
                                    speechBubble.classList.add('visible');
                                }

                                isWalking = (action.name === 'walking');

                                if (action.action) action.action();
                                if (isWalking) moveStickman();

                                currentActionTimeout = setTimeout(() => {
                                    if (speechBubble) speechBubble.classList.remove('visible');
                                    setTimeout(performAction, 500);
                                }, action.duration);
                            }, null, () => console.error("Stickman action failed."));
                        }

                        function moveStickman() {
                            walkFrameId = requestAnimationFrame(() => {
                                errorHandler.attemptRecovery(() => { // Wrap animation frame logic
                                    if (!isWalking) return; // Double check walking state

                                    position += direction * 1.5; // Slightly slower walk
                                    const maxPos = window.innerWidth - stickman.offsetWidth - 10;
                                    const minPos = 10;

                                    if (position >= maxPos) { direction = -1; position = maxPos; }
                                    else if (position <= minPos) { direction = 1; position = minPos; }

                                    stickman.style.transform = `translateX(${position}px) scaleX(${direction})`;
                                    moveStickman(); // Continue the loop
                                }, null, () => {
                                     console.error("Stickman movement frame failed.");
                                     isWalking = false; // Stop walking on error
                                });
                            });
                        }

                        // Initial placement and start
                        stickman.style.transform = `translateX(${position}px) scaleX(${direction})`;
                        performAction();

                    }); // End stickman attemptRecovery
                } else {
                    console.warn("'.stickman-container' not found. Stickman animation disabled.");
                }

                console.log("initializePage function completed successfully.");

            }, null, () => {
                 console.error("Critical failure during initializePage execution.");
                 errorHandler.displayError("Page initialization failed. Please refresh.");
                 // Optionally hide preloader if it's still visible after init failure
                 const preloader = document.querySelector('.preloader');
                 if (preloader && !preloader.classList.contains('hidden')) {
                    preloader.classList.add('hidden');
                 }
            }); // End initializePage attemptRecovery
        } // End of initializePage function

    }, null, () => {
        // Fallback for the *entire* DOMContentLoaded listener failing
        console.error("CRITICAL ERROR: DOMContentLoaded event listener failed execution.");
        // Attempt to notify user, maybe by manipulating body directly if possible
         document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Critical Error Loading Page. Please Refresh.</h1>';
    }); // End DOMContentLoaded attemptRecovery
}); // End of DOMContentLoaded listener
