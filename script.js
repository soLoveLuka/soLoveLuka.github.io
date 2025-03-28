// Error Handling Service
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
        window.onerror = (message, source, lineno, colno, error) => {
            this.logError({ message, source, lineno, colno, error });
            this.displayError(`Error: ${message} at ${source}:${lineno}`);
            return true;
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.logError({ message: 'Unhandled Promise Rejection', reason: event.reason });
            this.displayError(`Unhandled Promise Rejection: ${event.reason}`);
        });

        if (this.errorClose) {
            this.errorClose.addEventListener('click', () => {
                this.hideError();
            });
        }
    }

    logError(error) {
        this.errorLog.push({
            timestamp: new Date().toISOString(),
            ...error
        });
        if (this.errorLog.length > this.maxErrors) {
            this.errorLog.shift();
        }
        console.error('Error logged:', error);
    }

    displayError(message) {
        if (this.errorNotification && this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorNotification.classList.add('visible');
            setTimeout(() => this.hideError(), 5000);
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
            this.displayError(`Recovery triggered: ${error.message}`);
            return typeof fallback === 'function' ? fallback() : fallback;
        }
    }
}

const errorHandler = new ErrorHandler();

// Cookie Utility Functions
const CookieManager = {
    setCookie(name, value, hours) {
        try {
            const date = new Date();
            date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
            const expires = `expires=${date.toUTCString()}`;
            document.cookie = `${name}=${value};${expires};path=/`;
        } catch (error) {
            errorHandler.logError({ message: 'Failed to set cookie', error });
        }
    },

    getCookie(name) {
        try {
            const nameEQ = `${name}=`;
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        } catch (error) {
            errorHandler.logError({ message: 'Failed to get cookie', error });
            return null;
        }
    },

    deleteCookie(name) {
        try {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        } catch (error) {
            errorHandler.logError({ message: 'Failed to delete cookie', error });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        // Preloader
        const preloader = document.querySelector('.preloader');
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        const preloaderText = document.querySelector('.preloader-text');
        const text = "LOADING...";
        preloaderText.innerHTML = text.split('').map((char, i) => `<span class="preloader-char" style="--char-index: ${i}">${char}</span>`).join('');

        let progress = 0;
        progressBar.classList.add('active');
        const interval = setInterval(() => {
            progress += 1;
            progressText.textContent = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
                preloader.classList.add('hidden');
                initializePage();
            }
        }, 40);

        // Page Initialization
        function initializePage() {
            // Particles
            const particleContainer = document.querySelector('.section-particles');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.classList.add('section-particle');
                particle.style.left = `${Math.random() * 100}vw`;
                particle.style.top = `${Math.random() * 100}vh`;
                particle.style.animationDelay = `${Math.random() * 5}s`;
                particleContainer.appendChild(particle);
            }

            // Intersection Observer for Sections
            const sections = document.querySelectorAll('section');
            let currentSectionIndex = 0;
            const observerOptions = { root: null, threshold: 0.1 };
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        entry.target.classList.remove('out-of-view-up', 'out-of-view-down');
                        currentSectionIndex = Array.from(sections).indexOf(entry.target);
                        document.body.classList.remove('hero-bg', 'mixes-bg', 'artist-bg', 'booking-bg');
                        document.body.classList.add(`${entry.target.id}-bg`);
                        if (entry.target.id === 'mixes') {
                            const mixGrid = document.querySelector('.mix-grid');
                            const mixDescription = document.querySelector('.mix-description');
                            const mixImages = document.querySelectorAll('.mix-card-front img');
                            Promise.all(
                                Array.from(mixImages).map(img => {
                                    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
                                    return new Promise(resolve => {
                                        img.addEventListener('load', resolve);
                                        img.addEventListener('error', resolve);
                                    });
                                })
                            ).then(() => {
                                mixGrid.classList.add('active');
                                mixDescription.classList.add('active');
                            });
                        }
                        if (entry.target.id === 'booking') {
                            document.querySelector('.neon-grid').classList.add('active');
                        }
                    } else {
                        const rect = entry.target.getBoundingClientRect();
                        if (rect.top < 0) {
                            entry.target.classList.add('out-of-view-up');
                        } else {
                            entry.target.classList.add('out-of-view-down');
                        }
                    }
                    const particles = document.querySelectorAll('.section-particle');
                    particles.forEach(p => p.classList.toggle('active', entry.isIntersecting));
                });
            }, observerOptions);

            sections.forEach(section => sectionObserver.observe(section));

            // Smooth Scrolling with Mouse Wheel/Touch
            let lastScrollTop = 0;
            const debounce = (func, wait) => {
                let timeout;
                return (...args) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            };

            window.addEventListener('scroll', debounce(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
                const sectionHeight = window.innerHeight;
                const isMobile = window.innerWidth <= 768;
                const scrollThreshold = sectionHeight * (isMobile ? 0.7 : 0.5);

                if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
                    if (scrollDirection === 'down' && currentSectionIndex < sections.length - 1) {
                        currentSectionIndex++;
                    } else if (scrollDirection === 'up' && currentSectionIndex > 0) {
                        currentSectionIndex--;
                    }
                    sections[currentSectionIndex].scrollIntoView({ behavior: 'smooth' });
                }

                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

                const backToTop = document.querySelector('.back-to-top');
                backToTop.classList.toggle('visible', scrollTop > 300);

                const mixesSection = document.querySelector('#mixes');
                const mixCards = document.querySelectorAll('.mix-card');
                const mixesRect = mixesSection.getBoundingClientRect();
                const threshold = window.innerHeight * 0.5;
                if (mixesRect.top > window.innerHeight - threshold || mixesRect.bottom < threshold) {
                    mixCards.forEach(card => {
                        if (card.classList.contains('flipped')) {
                            card.classList.remove('flipped');
                            const audio = card.querySelector('.mix-audio');
                            if (audio) audio.pause();
                        }
                    });
                }
            }, 10));

            // Navigation Links
            document.querySelectorAll('.retro-nav a, .neon-button').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href').substring(1);
                    const targetSection = document.getElementById(targetId);
                    const sectionIndex = Array.from(sections).indexOf(targetSection);
                    currentSectionIndex = sectionIndex;
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                });
            });

            // Mix Card Flipper with Audio Previews
            const mixCards = document.querySelectorAll('.mix-card');
            let currentlyFlippedCard = null;
            let touchStartTime = 0;
            const longPressDuration = 500;

            mixCards.forEach(card => {
                const audio = card.querySelector('.mix-audio');
                let previewTimeout = null;

                card.addEventListener('mouseenter', () => {
                    if (!card.classList.contains('flipped')) {
                        audio.currentTime = 0;
                        audio.play();
                        previewTimeout = setTimeout(() => audio.pause(), 5000);
                    }
                });

                card.addEventListener('mouseleave', () => {
                    if (!card.classList.contains('flipped')) {
                        audio.pause();
                        clearTimeout(previewTimeout);
                    }
                });

                card.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    previewTimeout = setTimeout(() => {
                        if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                            currentlyFlippedCard.classList.remove('flipped');
                            const previousAudio = currentlyFlippedCard.querySelector('.mix-audio');
                            if (previousAudio) previousAudio.pause();
                        }
                        card.classList.toggle('flipped');
                        currentlyFlippedCard = card.classList.contains('flipped') ? card : null;
                        if (!card.classList.contains('flipped') && audio) audio.pause();
                    }, longPressDuration);
                });

                card.addEventListener('touchend', (e) => {
                    const touchDuration = Date.now() - touchStartTime;
                    if (touchDuration < longPressDuration) {
                        clearTimeout(previewTimeout);
                        if (!card.classList.contains('flipped')) {
                            audio.currentTime = 0;
                            audio.play();
                            previewTimeout = setTimeout(() => audio.pause(), 5000);
                        }
                    }
                });

                card.addEventListener('click', (e) => {
                    if (window.innerWidth > 768) {
                        if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                            currentlyFlippedCard.classList.remove('flipped');
                            const previousAudio = currentlyFlippedCard.querySelector('.mix-audio');
                            if (previousAudio) previousAudio.pause();
                        }
                        card.classList.toggle('flipped');
                        currentlyFlippedCard = card.classList.contains('flipped') ? card : null;
                        if (!card.classList.contains('flipped') && audio) audio.pause();
                    }
                });
            });

            // Form Handling
            const bookingForm = document.getElementById('booking-form');
            const formFlipper = document.querySelector('.form-flipper');
            const inputs = bookingForm.querySelectorAll('input, select');
            const finishButton = document.querySelector('.finish-button-front');
            const bookNowButton = document.querySelector('.book-now-button');
            const formGroups = document.querySelectorAll('.form-group');
            const finishGroup = document.querySelector('.form-group.finish-group');
            let filledFields = new Set();

            bookNowButton.addEventListener('click', () => {
                formFlipper.classList.add('flipped');
            });

            inputs.forEach((input, index) => {
                const wrapper = input.closest('.input-wrapper');
                const label = wrapper.querySelector('.input-label');
                const checkmark = wrapper.querySelector('.checkmark');
                const fieldName = input.closest('.form-group').dataset.field;

                input.addEventListener('input', () => {
                    if (input.checkValidity() && input.value.trim()) {
                        wrapper.classList.add('flipped');
                        filledFields.add(fieldName);
                        checkmark.classList.add('glowing');
                        if (checkAllFields()) finishGroup.classList.add('active');
                    }
                });

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && input.checkValidity() && input.value.trim()) {
                        const nextInput = inputs[index + 1];
                        if (nextInput) setTimeout(() => nextInput.focus(), 500);
                    }
                });

                document.addEventListener('touchend', (e) => {
                    if (!wrapper.contains(e.target) && input === document.activeElement && input.checkValidity() && input.value.trim()) {
                        const nextInput = inputs[index + 1];
                        if (nextInput) setTimeout(() => nextInput.focus(), 500);
                    }
                });

                checkmark.addEventListener('click', () => {
                    wrapper.classList.remove('flipped');
                    checkmark.classList.remove('glowing');
                    filledFields.delete(fieldName);
                    label.classList.remove('hidden');
                    finishGroup.classList.remove('active');
                    input.focus();
                });
            });

            function checkAllFields() {
                return Array.from(inputs).every(input => input.checkValidity() && input.value.trim());
            }

            finishButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (checkAllFields()) {
                    formGroups.forEach(group => group.classList.remove('active'));
                    finishGroup.classList.add('active');
                    setTimeout(() => {
                        alert('Booking submitted successfully!');
                        bookingForm.reset();
                        formFlipper.classList.remove('flipped');
                        filledFields.clear();
                        inputs.forEach(input => {
                            const wrapper = input.closest('.input-wrapper');
                            const checkmark = wrapper.querySelector('.checkmark');
                            const label = wrapper.querySelector('.input-label');
                            wrapper.classList.remove('flipped');
                            checkmark.classList.remove('glowing');
                            label.classList.remove('hidden');
                        });
                        finishGroup.classList.remove('active');
                    }, 500);
                } else {
                    errorHandler.displayError('Please fill out all fields correctly.');
                }
            });

            // Sound Wave Animation (Interactive)
            const heroSection = document.querySelector('.hero');
            const soundWaveContainer = document.querySelector('.sound-wave-container');
            const soundBars = document.querySelectorAll('.sound-bar');

            const updateBars = (x, y) => {
                const containerRect = soundWaveContainer.getBoundingClientRect();
                const relativeX = x - containerRect.left;
                const relativeY = y - containerRect.top;
                const maxDistance = Math.max(containerRect.width, containerRect.height) * 0.6;
                const maxHeight = 80;
                const minHeight = 10;

                soundBars.forEach((bar, index) => {
                    const barRect = bar.getBoundingClientRect();
                    const barCenterX = barRect.left - containerRect.left + barRect.width / 2;
                    const distanceX = Math.abs(relativeX - barCenterX);
                    const distance = Math.sqrt(distanceX * distanceX);
                    const influence = Math.max(0, (maxDistance - distance) / maxDistance);
                    const height = minHeight + (maxHeight - minHeight) * influence * 1.5;
                    bar.style.height = `${Math.min(maxHeight, Math.max(minHeight, height))}px`;
                });
            };

            heroSection.addEventListener('mousemove', (e) => updateBars(e.clientX, e.clientY));
            heroSection.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                const containerRect = soundWaveContainer.getBoundingClientRect();
                if (touch.clientX >= containerRect.left && touch.clientX <= containerRect.right &&
                    touch.clientY >= containerRect.top && touch.clientY <= containerRect.bottom) {
                    e.preventDefault();
                    updateBars(touch.clientX, touch.clientY);
                }
            }, { passive: false });
            heroSection.addEventListener('mouseleave', () => soundBars.forEach(bar => bar.style.height = '10px'));
            heroSection.addEventListener('touchend', () => soundBars.forEach(bar => bar.style.height = '10px'));

            // Retro Cube and Timer with Cookie Support
            const cubeContainer = document.querySelector('.retro-cube-container');
            const cube = document.querySelector('.retro-cube');
            const countdownTimer = document.querySelector('.countdown-timer');
            const timerDigits = {
                minutes1: document.querySelector('.timer-digit.minutes-1'),
                minutes2: document.querySelector('.timer-digit.minutes-2'),
                seconds1: document.querySelector('.timer-digit.seconds-1'),
                seconds2: document.querySelector('.timer-digit.seconds-2')
            };
            const totalSeconds = 5 * 60; // 5 minutes
            let remainingSeconds;
            const timerEndCookie = CookieManager.getCookie('timerEnd');

            if (timerEndCookie) {
                const endTime = parseInt(timerEndCookie, 10);
                const currentTime = Math.floor(Date.now() / 1000);
                remainingSeconds = Math.max(0, endTime - currentTime);
            } else {
                remainingSeconds = totalSeconds;
                const endTime = Math.floor(Date.now() / 1000) + totalSeconds;
                CookieManager.setCookie('timerEnd', endTime, 1);
            }

            cubeContainer.classList.add('visible');

            const cubeClose = document.querySelector('.cube-close');
            cubeClose.addEventListener('click', () => {
                cube.classList.add('roll-to-timer');
                setTimeout(() => {
                    cubeContainer.classList.add('timer-mode');
                    startCountdown();
                }, 1000);
            });

            function startCountdown() {
                const countdownInterval = setInterval(() => {
                    if (remainingSeconds <= 0) {
                        clearInterval(countdownInterval);
                        countdownTimer.classList.add('expired');
                        CookieManager.deleteCookie('timerEnd');
                        return;
                    }

                    remainingSeconds--;
                    const minutes = Math.floor(remainingSeconds / 60);
                    const seconds = remainingSeconds % 60;
                    updateDigit(timerDigits.minutes1, Math.floor(minutes / 10));
                    updateDigit(timerDigits.minutes2, minutes % 10);
                    updateDigit(timerDigits.seconds1, Math.floor(seconds / 10));
                    updateDigit(timerDigits.seconds2, seconds % 10);
                }, 1000);
            }

            function updateDigit(digitElement, value) {
                const currentValue = parseInt(digitElement.dataset.currentValue || '0');
                if (currentValue !== value) {
                    digitElement.setAttribute('data-current-value', value);
                    digitElement.setAttribute('data-next-value', value);
                    digitElement.classList.add('flip');
                }
            }

            if (remainingSeconds > 0 && CookieManager.getCookie('timerEnd')) {
                cubeContainer.classList.add('timer-mode');
                startCountdown();
            }

            // Stickman Animation
            const stickmanContainer = document.querySelector('.stickman-container');
            const stickman = document.createElement('div');
            stickman.classList.add('stickman');
            stickman.innerHTML = `
                <div class="stickman-head"></div>
                <div class="stickman-body"></div>
                <div class="stickman-arm-left"></div>
                <div class="stickman-arm-right"></div>
                <div class="stickman-leg-left"></div>
                <div class="stickman-leg-right"></div>
                <div class="stickman-speech-bubble">
                    <div class="stickman-speech-text"></div>
                </div>
            `;
            stickmanContainer.appendChild(stickman);

            const bookButton = document.querySelector('.neon-button');
            let position = 0;
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
                { name: 'jumpOnButton', duration: 4000, message: 'Book a mix, huh?', action: () => {
                    const buttonRect = bookButton.getBoundingClientRect();
                    position = buttonRect.left + buttonRect.width / 2 - 25;
                    stickman.style.left = `${position}px`;
                    stickman.classList.add('jumping');
                }}
            ];

            function performAction() {
                const action = actions[Math.floor(Math.random() * actions.length)];
                stickman.classList.remove(...actions.map(a => a.name));
                stickman.classList.add(action.name);
                speechText.textContent = action.message;
                speechBubble.classList.add('visible');
                if (action.name === 'walking') {
                    isWalking = true;
                    moveStickman();
                } else if (action.name === 'jumpOnButton' && action.action) {
                    isWalking = false;
                    action.action();
                } else {
                    isWalking = false;
                }
                setTimeout(() => {
                    speechBubble.classList.remove('visible');
                    setTimeout(performAction, 500);
                }, action.duration);
            }

            function moveStickman() {
                if (!isWalking) return;
                position += direction * 2;
                stickman.style.left = `${position}px`;
                if (position > window.innerWidth - 50) {
                    direction = -1;
                    stickman.style.transform = 'scaleX(-1)';
                } else if (position < 0) {
                    direction = 1;
                    stickman.style.transform = 'scaleX(1)';
                }
                requestAnimationFrame(moveStickman);
            }

            performAction();
        }
    }, () => console.log('Failed to initialize page'));
});
