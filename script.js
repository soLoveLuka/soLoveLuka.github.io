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

// Smooth scrolling animation for sections with background color shift and particles
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const sections = document.querySelectorAll('section');
        const sectionParticles = document.querySelector('.section-particles');
        let lastScrollTop = 0;
        let currentSectionIndex = 0;

        function updateSections(scrollDirection, targetIndex = null) {
            sections.forEach((section, index) => {
                section.classList.remove('in-view', 'out-of-view-up', 'out-of-view-down', 'zoom-down');
            });

            const oldIndex = currentSectionIndex;
            if (targetIndex !== null) {
                currentSectionIndex = targetIndex;
            } else {
                if (scrollDirection === 'down' && currentSectionIndex < sections.length - 1) {
                    currentSectionIndex++;
                } else if (scrollDirection === 'up' && currentSectionIndex > 0) {
                    currentSectionIndex--;
                }
            }

            sections.forEach((section, index) => {
                if (index < currentSectionIndex) {
                    section.classList.add(scrollDirection === 'down' || (targetIndex !== null && targetIndex > oldIndex) ? 'out-of-view-up' : 'zoom-down');
                } else if (index === currentSectionIndex) {
                    section.classList.add('in-view');
                } else {
                    section.classList.add(scrollDirection === 'down' || (targetIndex !== null && targetIndex > oldIndex) ? 'out-of-view-down' : 'out-of-view-up');
                }
            });

            const isMobile = window.innerWidth <= 768;
            if (!isMobile) {
                const sectionId = sections[currentSectionIndex].id;
                document.body.className = '';
                document.body.classList.add(`${sectionId}-bg`);
            }

            if (sectionParticles) {
                sectionParticles.innerHTML = '';
                const particleCount = isMobile ? 5 : 20;
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.classList.add('section-particle');
                    const side = Math.random() < 0.5 ? 'left' : 'right';
                    const x = side === 'left' ? 0 : window.innerWidth - 5;
                    const y = Math.random() * window.innerHeight;
                    particle.style.left = `${x}px`;
                    particle.style.top = `${y}px`;
                    sectionParticles.appendChild(particle);

                    setTimeout(() => {
                        particle.classList.add('active');
                        particle.style.transform = `translateX(${side === 'left' ? 100 : -100}px)`;
                    }, i * 50);
                }
            }
        }

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
                updateSections(scrollDirection);
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

            const nav = document.querySelector('.retro-nav');
            if (scrollTop > 50 || isMobile) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            const backToTop = document.querySelector('.back-to-top');
            if (scrollTop > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }

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

        document.querySelectorAll('.retro-nav a, .neon-button').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                const sectionIndex = Array.from(sections).indexOf(targetSection);
                updateSections(sectionIndex > currentSectionIndex ? 'down' : 'up', sectionIndex);
                targetSection.scrollIntoView({ behavior: 'smooth' });

                if (targetId === 'mixes') {
                    setTimeout(() => {
                        const mixGrid = document.querySelector('.mix-grid');
                        const mixDescription = document.querySelector('.mix-description');
                        if (mixGrid) mixGrid.classList.add('active');
                        if (mixDescription) mixDescription.classList.add('active');
                    }, 500);
                }
            });
        });
    }, () => console.log('Failed to initialize smooth scrolling'));
});

// Sound wave interaction with mouse movement and touch support
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const heroSection = document.querySelector('.hero');
        const soundWaveContainer = document.querySelector('.sound-wave-container');
        const soundBars = document.querySelectorAll('.sound-bar');

        if (heroSection && soundWaveContainer && soundBars.length > 0) {
            const updateBars = (x, y) => {
                const containerRect = soundWaveContainer.getBoundingClientRect();
                const containerCenterX = containerRect.left + containerRect.width / 2;
                const containerCenterY = containerRect.top + containerRect.height / 2;

                const relativeX = x - containerRect.left;
                const relativeY = y - containerRect.top;

                const maxDistance = Math.max(containerRect.width, containerRect.height) * 0.6;
                const maxHeight = 80;
                const minHeight = 10;

                soundBars.forEach((bar, index) => {
                    const barRect = bar.getBoundingClientRect();
                    const barCenterX = barRect.left - containerRect.left + barRect.width / 2;
                    const barCenterY = barRect.top - containerRect.top + barRect.height / 2;

                    const distanceX = Math.abs(relativeX - barCenterX);
                    const distanceY = Math.abs(relativeY - barCenterY);
                    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                    const influence = Math.max(0, (maxDistance - distance) / maxDistance);
                    const height = minHeight + (maxHeight - minHeight) * influence * 1.5;

                    bar.style.height = `${Math.min(maxHeight, Math.max(minHeight, height))}px`;
                });
            };

            const handleMouseMove = (e) => {
                const x = e.clientX;
                const y = e.clientY;
                updateBars(x, y);
            };

            const handleTouchMove = (e) => {
                const touch = e.touches[0];
                const x = touch.clientX;
                const y = touch.clientY;

                const containerRect = soundWaveContainer.getBoundingClientRect();
                if (
                    x >= containerRect.left &&
                    x <= containerRect.right &&
                    y >= containerRect.top &&
                    y <= containerRect.bottom
                ) {
                    e.preventDefault();
                    updateBars(x, y);
                }
            };

            const handleMouseLeave = () => {
                soundBars.forEach((bar) => {
                    bar.style.height = '10px';
                });
            };

            const handleTouchEnd = () => {
                soundBars.forEach((bar) => {
                    bar.style.height = '10px';
                });
            };

            heroSection.addEventListener('mousemove', handleMouseMove);
            heroSection.addEventListener('mouseleave', handleMouseLeave);
            heroSection.addEventListener('touchmove', handleTouchMove, { passive: false });
            heroSection.addEventListener('touchend', handleTouchEnd);
        }
    }, () => console.log('Failed to initialize sound wave interaction'));
});

// Mixes section animation with IntersectionObserver
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const mixesSection = document.querySelector('#mixes');
        const mixGrid = document.querySelector('.mix-grid');
        const mixDescription = document.querySelector('.mix-description');
        const mixImages = document.querySelectorAll('.mix-card-front img');

        if (mixesSection && mixGrid && mixDescription && mixImages.length > 0) {
            const checkImagesLoaded = () => {
                return Promise.all(
                    Array.from(mixImages).map(img => {
                        if (img.complete && img.naturalHeight !== 0) {
                            return Promise.resolve();
                        }
                        return new Promise(resolve => {
                            img.addEventListener('load', resolve);
                            img.addEventListener('error', resolve);
                        });
                    })
                );
            };

            checkImagesLoaded().then(() => {
                const observerOptions = {
                    threshold: window.innerWidth <= 768 ? 0.1 : 0.3,
                    rootMargin: '0px 0px -10% 0px'
                };

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            mixGrid.classList.add('active');
                            mixDescription.classList.add('active');
                        } else if (entry.boundingClientRect.top > 0) {
                            mixGrid.classList.remove('active');
                            mixDescription.classList.remove('active');
                        }
                    });
                }, observerOptions);

                observer.observe(mixesSection);
            });
        }
    }, () => console.log('Failed to initialize mixes section animation'));
});

// Fade-in animations for artist and booking sections
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const artistSection = document.querySelector('#artist');
        const bookingSection = document.querySelector('#booking');

        const observerOptions = { threshold: 0.3 };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        if (artistSection) sectionObserver.observe(artistSection);
        if (bookingSection) sectionObserver.observe(bookingSection);
    }, () => console.log('Failed to initialize section fade-in animations'));
});

// Preloader with waveform and progress indicator
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const preloader = document.querySelector('.preloader');
        const preloaderText = document.querySelector('.preloader-text');
        const preloaderChars = document.querySelectorAll('.preloader-char');
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');

        if (preloader && preloaderText && preloaderChars.length > 0 && progressBar && progressText) {
            progressBar.classList.add('active');

            let progress = 0;
            const totalDuration = 4000;
            const interval = setInterval(() => {
                progress = Math.min(progress + (100 / (totalDuration / 50)), 100);
                progressText.textContent = `${Math.round(progress)}%`;
                if (progress >= 100) clearInterval(interval);
            }, 50);

            setTimeout(() => {
                preloaderChars.forEach((char, index) => {
                    char.style.setProperty('--char-index', index);
                    char.classList.add('wave');
                });

                setTimeout(() => {
                    preloader.classList.add('hidden');
                }, 2000);
            }, 1000);
        }
    }, () => console.log('Failed to initialize preloader'));
});

// Mix card flip interaction with audio preview
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
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
                    previewTimeout = setTimeout(() => {
                        audio.pause();
                    }, 5000);
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

                    const audio = card.querySelector('.mix-audio');
                    if (!card.classList.contains('flipped') && audio) {
                        audio.pause();
                    }
                }, longPressDuration);
            });

            card.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                if (touchDuration < longPressDuration) {
                    clearTimeout(previewTimeout);
                    if (!card.classList.contains('flipped')) {
                        audio.currentTime = 0;
                        audio.play();
                        previewTimeout = setTimeout(() => {
                            audio.pause();
                        }, 5000);
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

                    const audio = card.querySelector('.mix-audio');
                    if (!card.classList.contains('flipped') && audio) {
                        audio.pause();
                    }
                }
            });
        });
    }, () => console.log('Failed to initialize mix card interactions'));
});

// Booking form interaction with interactive neon grid and form flipping
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const bookingForm = document.getElementById('booking-form');
        const inputs = bookingForm.querySelectorAll('input, select');
        const formFlipper = bookingForm.querySelector('.form-flipper');
        const finishGroup = bookingForm.querySelector('.finish-group');
        const finishButtonWrapper = bookingForm.querySelector('.finish-button-wrapper');
        const finishButtonInner = bookingForm.querySelector('.finish-button-inner');
        const neonGrid = document.querySelector('.neon-grid');
        let filledFields = new Set();

        bookingForm.addEventListener('mouseover', () => {
            neonGrid.classList.add('active');
        });

        bookingForm.addEventListener('touchstart', () => {
            neonGrid.classList.add('active');
        });

        const checkAllFields = () => {
            const formGroups = bookingForm.querySelectorAll('.form-group:not(.finish-group)');
            let allFilled = true;

            formGroups.forEach(group => {
                const wrapper = group.querySelector('.input-wrapper');
                const input = group.querySelector('input, select');
                const isRequired = input.hasAttribute('required');

                if (isRequired && !input.value.trim()) {
                    allFilled = false;
                }

                if (!wrapper.classList.contains('flipped')) {
                    allFilled = false;
                }
            });

            return allFilled;
        };

        inputs.forEach((input, index) => {
            const wrapper = input.closest('.input-wrapper');
            const label = wrapper.querySelector('.input-label');
            const checkmark = wrapper.querySelector('.checkmark');
            const fieldName = input.closest('.form-group').dataset.field;

            input.addEventListener('focus', () => {
                label.classList.add('hidden');
            });

            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    label.classList.remove('hidden');
                } else if (input.checkValidity()) {
                    wrapper.classList.add('flipped');
                    filledFields.add(fieldName);

                    checkmark.classList.add('glowing');

                    if (checkAllFields()) {
                        finishGroup.classList.add('active');
                    }

                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        setTimeout(() => nextInput.focus(), 500);
                    }
                }
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.checkValidity() && input.value.trim()) {
                    wrapper.classList.add('flipped');
                    filledFields.add(fieldName);

                    checkmark.classList.add('glowing');

                    if (checkAllFields()) {
                        finishGroup.classList.add('active');
                    }

                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        setTimeout(() => nextInput.focus(), 500);
                    }
                }
            });

            document.addEventListener('touchend', (e) => {
                if (!wrapper.contains(e.target) && input === document.activeElement && input.checkValidity() && input.value.trim()) {
                    wrapper.classList.add('flipped');
                    filledFields.add(fieldName);

                    checkmark.classList.add('glowing');

                    if (checkAllFields()) {
                        finishGroup.classList.add('active');
                    }

                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        setTimeout(() => nextInput.focus(), 500);
                    }
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

        finishButtonWrapper.addEventListener('click', (e) => {
            e.preventDefault();
            formFlipper.classList.add('flipped');
        });

        bookingForm.addEventListener('submit', (e) => {
            setTimeout(() => {
                alert('Booking submitted successfully!');
                bookingForm.reset();
                formFlipper.classList.remove('flipped');
                filledFields.clear();
                inputs.forEach(input => {
                    const wrapper = input.closest('.input-wrapper');
                    const checkmark = wrapper.querySelector('.checkmark');
                    wrapper.classList.remove('flipped');
                    checkmark.classList.remove('glowing');
                    const label = wrapper.querySelector('.input-label');
                    label.classList.remove('hidden');
                });
                finishGroup.classList.remove('active');
            }, 500);
        });
    }, () => console.log('Failed to initialize booking form interactions'));
});

// 3D Retro Cube and Countdown Timer with Cookie Support
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const cubeContainer = document.querySelector('.retro-cube-container');
        const cube = document.querySelector('.retro-cube');
        const countdownTimer = document.querySelector('.countdown-timer');
        const closeButtons = document.querySelectorAll('.cube-close');
        const timerDigits = {
            hours1: document.querySelector('.timer-digit.hours-1'),
            hours2: document.querySelector('.timer-digit.hours-2'),
            minutes1: document.querySelector('.timer-digit.minutes-1'),
            minutes2: document.querySelector('.timer-digit.minutes-2'),
            seconds1: document.querySelector('.timer-digit.seconds-1'),
            seconds2: document.querySelector('.timer-digit.seconds-2')
        };

        if (!cubeContainer || !cube || !countdownTimer || closeButtons.length !== 6 || Object.values(timerDigits).some(digit => !digit)) {
            throw new Error('Required elements for retro cube or timer are missing.');
        }

        const totalSeconds = 3 * 60 * 60; // 3 hours
        let remainingSeconds;
        const timerEndCookie = CookieManager.getCookie('timerEnd');

        if (timerEndCookie) {
            const endTime = parseInt(timerEndCookie, 10);
            const currentTime = Math.floor(Date.now() / 1000);
            remainingSeconds = Math.max(0, endTime - currentTime);
        } else {
            remainingSeconds = totalSeconds;
            const endTime = Math.floor(Date.now() / 1000) + totalSeconds;
            CookieManager.setCookie('timerEnd', endTime, 3);
        }

        setTimeout(() => {
            cubeContainer.classList.add('visible');
        }, 45000);

        let currentFace = 0;
        const faces = ['front', 'right', 'back', 'left', 'top', 'bottom'];
        let rotationInterval;

        const rotateCube = () => {
            currentFace = (currentFace + 1) % faces.length;
            cube.style.transform = `rotateX(${currentFace === 4 ? -90 : currentFace === 5 ? 90 : 0}deg) rotateY(${currentFace < 4 ? currentFace * 90 : 0}deg)`;
        };

        rotationInterval = setInterval(rotateCube, 4000);

        cube.addEventListener('mouseenter', () => {
            cube.classList.add('interacted');
        });

        cube.addEventListener('touchstart', () => {
            cube.classList.add('interacted');
        });

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                clearInterval(rotationInterval);
                cube.classList.add('roll-to-timer');
                setTimeout(() => {
                    cubeContainer.classList.add('timer-mode');
                    startCountdown();
                }, 1000);
            });
        });

        const startCountdown = () => {
            const countdownInterval = setInterval(() => {
                if (remainingSeconds <= 0) {
                    clearInterval(countdownInterval);
                    countdownTimer.classList.add('expired');
                    CookieManager.deleteCookie('timerEnd');
                    return;
                }

                remainingSeconds--;

                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = remainingSeconds % 60;

                updateDigit(timerDigits.hours1, Math.floor(hours / 10));
                updateDigit(timerDigits.hours2, hours % 10);
                updateDigit(timerDigits.minutes1, Math.floor(minutes / 10));
                updateDigit(timerDigits.minutes2, minutes % 10);
                updateDigit(timerDigits.seconds1, Math.floor(seconds / 10));
                updateDigit(timerDigits.seconds2, seconds % 10);
            }, 1000);
        };

        const updateDigit = (digitElement, value) => {
            const currentValue = parseInt(digitElement.dataset.value || '0');
            if (currentValue !== value) {
                digitElement.dataset.value = value;
                digitElement.classList.remove('flip');
                void digitElement.offsetWidth;
                digitElement.classList.add('flip');
                digitElement.textContent = value;
            }
        };

        Object.values(timerDigits).forEach(digit => {
            digit.dataset.value = '0';
            digit.textContent = '0';
        });

        if (remainingSeconds > 0 && CookieManager.getCookie('timerStarted')) {
            cubeContainer.classList.add('timer-mode');
            startCountdown();
        }
    }, () => console.log('Failed to initialize retro cube and timer'));
});

// Stickman Animation with Activities
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.attemptRecovery(() => {
        const stickman = document.querySelector('.stickman');
        const speechBubble = document.querySelector('.stickman-speech-bubble');
        const speechText = document.querySelector('.stickman-speech-text');
        const bookButton = document.querySelector('.neon-button');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        let posX = 50;
        let posY = windowHeight - 100;
        let direction = 1;
        let isMoving = false;
        let currentActivity = null;

        const activities = [
            {
                name: 'walk',
                duration: 5000,
                action: () => {
                    stickman.classList.add('walking');
                    const speed = 2;
                    posX += direction * speed;
                    if (posX > windowWidth - 50 || posX < 0) {
                        direction *= -1;
                        stickman.style.transform = `translate(${posX}px, ${posY}px) scaleX(${direction})`;
                    } else {
                        stickman.style.transform = `translate(${posX}px, ${posY}px) scaleX(${direction})`;
                    }
                }
            },
            {
                name: 'jump',
                duration: 2000,
                action: () => {
                    stickman.classList.add('jumping');
                    speechText.textContent = 'Whee!';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'layDown',
                duration: 3000,
                action: () => {
                    stickman.classList.add('laying');
                    speechText.textContent = 'Just chilling...';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'jumpOnButton',
                duration: 4000,
                action: () => {
                    const buttonRect = bookButton.getBoundingClientRect();
                    posX = buttonRect.left + buttonRect.width / 2 - 25;
                    posY = buttonRect.top - 50;
                    stickman.style.transform = `translate(${posX}px, ${posY}px) scaleX(${direction})`;
                    stickman.classList.add('jumping');
                    speechText.textContent = 'Book a mix, huh?';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'fight',
                duration: 3000,
                action: () => {
                    stickman.classList.add('fighting');
                    speechText.textContent = 'Take that, invisible enemy!';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'wave',
                duration: 2000,
                action: () => {
                    stickman.classList.add('waving');
                    speechText.textContent = 'Hey there, user!';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'dance',
                duration: 4000,
                action: () => {
                    stickman.classList.add('dancing');
                    speechText.textContent = 'Feel the beat!';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'think',
                duration: 3000,
                action: () => {
                    stickman.classList.add('thinking');
                    speechText.textContent = 'I wonder what’s next...';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'lookAtScreen',
                duration: 3000,
                action: () => {
                    stickman.classList.add('looking');
                    speechText.textContent = 'I see you scrolling there!';
                    speechBubble.classList.add('visible');
                }
            },
            {
                name: 'sleep',
                duration: 5000,
                action: () => {
                    stickman.classList.add('sleeping');
                    speechText.textContent = 'Zzz...';
                    speechBubble.classList.add('visible');
                }
            }
        ];

        const getRandomActivity = () => {
            const randomIndex = Math.floor(Math.random() * activities.length);
            return activities[randomIndex];
        };

        const performActivity = () => {
            if (currentActivity) {
                stickman.classList.remove(currentActivity.name);
                speechBubble.classList.remove('visible');
            }

            currentActivity = getRandomActivity();
            currentActivity.action();

            setTimeout(performActivity, currentActivity.duration);
        };

        const animate = () => {
            if (currentActivity && currentActivity.name === 'walk') {
                currentActivity.action();
            }
            requestAnimationFrame(animate);
        };

        performActivity();
        animate();
    }, () => console.log('Failed to initialize stickman animation'));
});
