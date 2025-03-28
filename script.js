// Smooth scrolling animation for sections with background color shift and particles
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const sectionParticles = document.querySelector('.section-particles');
    let lastScrollTop = 0;
    let currentSectionIndex = 0;

    // Function to update section visibility based on scroll direction
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

        // Update background color based on section (disable on mobile)
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            const sectionId = sections[currentSectionIndex].id;
            document.body.className = ''; // Reset classes
            document.body.classList.add(`${sectionId}-bg`);
        }

        // Add section transition particles (fewer on mobile)
        if (sectionParticles) {
            sectionParticles.innerHTML = ''; // Clear previous particles
            const particleCount = isMobile ? 5 : 20; // Reduced particles on mobile
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

    // Debounced scroll handler
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // Scroll event listener
    window.addEventListener('scroll', debounce(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';

        const sectionHeight = window.innerHeight;
        const isMobile = window.innerWidth <= 768;
        const scrollThreshold = sectionHeight * (isMobile ? 0.7 : 0.5); // Higher threshold on mobile
        if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
            updateSections(scrollDirection);
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

        // Navigation fade-in (keep visible on mobile)
        const nav = document.querySelector('.retro-nav');
        if (scrollTop > 50 || isMobile) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Back to Top button visibility
        const backToTop = document.querySelector('.back-to-top');
        if (scrollTop > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        // Check if mix cards should flip back when scrolling out of view
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

    // Smooth scrolling for nav links and buttons
    document.querySelectorAll('.retro-nav a, .neon-button').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            const sectionIndex = Array.from(sections).indexOf(targetSection);
            updateSections(sectionIndex > currentSectionIndex ? 'down' : 'up', sectionIndex);
            targetSection.scrollIntoView({ behavior: 'smooth' });

            // Ensure mix grid and description are visible when navigating to mixes
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
});

// Sound wave interaction with mouse movement and touch support
document.addEventListener('DOMContentLoaded', () => {
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
});

// Mixes section animation with IntersectionObserver, delayed until images load
document.addEventListener('DOMContentLoaded', () => {
    const mixesSection = document.querySelector('#mixes');
    const mixGrid = document.querySelector('.mix-grid');
    const mixDescription = document.querySelector('.mix-description');
    const mixImages = document.querySelectorAll('.mix-card-front img');

    if (mixesSection && mixGrid && mixDescription && mixImages.length > 0) {
        // Function to check if all images are loaded
        const checkImagesLoaded = () => {
            return Promise.all(
                Array.from(mixImages).map(img => {
                    if (img.complete && img.naturalHeight !== 0) {
                        return Promise.resolve();
                    }
                    return new Promise(resolve => {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', resolve); // Resolve even if image fails to load
                    });
                })
            );
        };

        // Wait for images to load before setting up the observer
        checkImagesLoaded().then(() => {
            const observerOptions = {
                threshold: window.innerWidth <= 768 ? 0.1 : 0.3, // Adjust threshold for mobile
                rootMargin: '0px 0px -10% 0px' // Keep section visible slightly after leaving viewport
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        mixGrid.classList.add('active');
                        mixDescription.classList.add('active');
                    } else if (entry.boundingClientRect.top > 0) {
                        // Only remove 'active' if section is completely out of view below
                        mixGrid.classList.remove('active');
                        mixDescription.classList.remove('active');
                    }
                });
            }, observerOptions);

            observer.observe(mixesSection);
        });
    }
});

// Fade-in animations for artist and booking sections with IntersectionObserver
document.addEventListener('DOMContentLoaded', () => {
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
});

// Preloader with waveform and progress indicator
document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.querySelector('.preloader');
    const preloaderText = document.querySelector('.preloader-text');
    const preloaderChars = document.querySelectorAll('.preloader-char');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    if (preloader && preloaderText && preloaderChars.length > 0 && progressBar && progressText) {
        // Start progress bar animation
        progressBar.classList.add('active');

        // Update progress percentage
        let progress = 0;
        const totalDuration = 4000; // 4 seconds
        const interval = setInterval(() => {
            progress = Math.min(progress + (100 / (totalDuration / 50)), 100);
            progressText.textContent = `${Math.round(progress)}%`;
            if (progress >= 100) clearInterval(interval);
        }, 50);

        // Step 1: Show "Loading..." with glitch effect for 1 second
        setTimeout(() => {
            // Step 2: Transform "Loading..." into a waveform for 2 seconds
            preloaderChars.forEach((char, index) => {
                char.style.setProperty('--char-index', index);
                char.classList.add('wave');
            });

            // Step 3: Fade out the preloader after waveform animation
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 2000); // Waveform lasts 2 seconds, then fade out
        }, 1000);
    }
});

// Mix card flip interaction with audio preview
document.addEventListener('DOMContentLoaded', () => {
    const mixCards = document.querySelectorAll('.mix-card');
    let currentlyFlippedCard = null;
    let touchStartTime = 0;
    const longPressDuration = 500; // 500ms for long press to flip

    mixCards.forEach(card => {
        const audio = card.querySelector('.mix-audio');
        let previewTimeout = null;

        // Desktop: Hover to preview
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('flipped')) {
                audio.currentTime = 0;
                audio.play();
                previewTimeout = setTimeout(() => {
                    audio.pause();
                }, 5000); // 5-second preview
            }
        });

        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('flipped')) {
                audio.pause();
                clearTimeout(previewTimeout);
            }
        });

        // Mobile: Tap for preview, long press to flip
        card.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            previewTimeout = setTimeout(() => {
                // Long press: Flip the card
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
                // Short tap: Play preview
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

        // Click for desktop
        card.addEventListener('click', (e) => {
            if (window.innerWidth > 768) { // Only on desktop
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
});

// Booking form interaction with interactive neon grid and form flipping
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    const inputs = bookingForm.querySelectorAll('input, select');
    const formFlipper = bookingForm.querySelector('.form-flipper');
    const finishGroup = bookingForm.querySelector('.finish-group');
    const finishButtonWrapper = bookingForm.querySelector('.finish-button-wrapper');
    const finishButtonInner = bookingForm.querySelector('.finish-button-inner');
    const neonGrid = document.querySelector('.neon-grid');
    let filledFields = new Set();

    // Interactive neon grid on form interaction
    bookingForm.addEventListener('mouseover', () => {
        neonGrid.classList.add('active');
    });

    bookingForm.addEventListener('touchstart', () => {
        neonGrid.classList.add('active');
    });

    // Check if all required fields are filled
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

    // Handle input interactions
    inputs.forEach((input, index) => {
        const wrapper = input.closest('.input-wrapper');
        const label = wrapper.querySelector('.input-label');
        const checkmark = wrapper.querySelector('.checkmark');
        const fieldName = input.closest('.form-group').dataset.field;

        // Show/hide label on focus/blur
        input.addEventListener('focus', () => {
            label.classList.add('hidden');
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                label.classList.remove('hidden');
            } else if (input.checkValidity()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);

                // Trigger glowing checkmark animation
                checkmark.classList.add('glowing');

                // Check if all fields are filled to show the Finish button
                if (checkAllFields()) {
                    finishGroup.classList.add('active');
                }

                // Auto-focus the next input if available
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    setTimeout(() => nextInput.focus(), 500); // Delay to allow animation
                }
            }
        });

        // Validate input and flip wrapper on Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.checkValidity() && input.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);

                // Trigger glowing checkmark animation
                checkmark.classList.add('glowing');

                // Check if all fields are filled to show the Finish button
                if (checkAllFields()) {
                    finishGroup.classList.add('active');
                }

                // Auto-focus the next input if available
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    setTimeout(() => nextInput.focus(), 500); // Delay to allow animation
                }
            }
        });

        // On mobile, flip when tapping outside the input
        document.addEventListener('touchend', (e) => {
            if (!wrapper.contains(e.target) && input === document.activeElement && input.checkValidity() && input.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);

                // Trigger glowing checkmark animation
                checkmark.classList.add('glowing');

                // Check if all fields are filled to show the Finish button
                if (checkAllFields()) {
                    finishGroup.classList.add('active');
                }

                // Auto-focus the next input if available
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    setTimeout(() => nextInput.focus(), 500); // Delay to allow animation
                }
            }
        });

        // Allow unflipping by clicking the checkmark
        checkmark.addEventListener('click', () => {
            wrapper.classList.remove('flipped');
            checkmark.classList.remove('glowing');
            filledFields.delete(fieldName);
            label.classList.remove('hidden');
            finishGroup.classList.remove('active');
            input.focus();
        });
    });

    // Handle form flipping and submission
    finishButtonWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        formFlipper.classList.add('flipped');
    });

    // Reset form after submission
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
});

// 3D Retro Cube and Countdown Timer
document.addEventListener('DOMContentLoaded', () => {
    try {
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

        // Failsafe: Check if all required elements exist
        if (!cubeContainer || !cube || !countdownTimer || closeButtons.length !== 6 || Object.values(timerDigits).some(digit => !digit)) {
            console.error('Required elements for retro cube or timer are missing.');
            return;
        }

        // Show cube after 45 seconds
        setTimeout(() => {
            cubeContainer.classList.add('visible');
        }, 45000);

        // Cube rotation logic
        let currentFace = 0;
        const faces = ['front', 'right', 'back', 'left', 'top', 'bottom'];
        let rotationInterval;

        const rotateCube = () => {
            try {
                currentFace = (currentFace + 1) % faces.length;
                cube.style.transform = `rotateX(${currentFace === 4 ? -90 : currentFace === 5 ? 90 : 0}deg) rotateY(${currentFace < 4 ? currentFace * 90 : 0}deg)`;
            } catch (error) {
                console.error('Error during cube rotation:', error);
                clearInterval(rotationInterval);
            }
        };

        // Start cube rotation every 4 seconds
        rotationInterval = setInterval(rotateCube, 4000);

        // Interaction enhancement: Scale and glow on hover/touch
        cube.addEventListener('mouseenter', () => {
            cube.classList.add('interacted');
        });

        cube.addEventListener('touchstart', () => {
            cube.classList.add('interacted');
        });

        // Handle cube close and transform to timer
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                try {
                    // Stop cube rotation
                    clearInterval(rotationInterval);

                    // Roll cube and transform to timer
                    cube.classList.add('roll-to-timer');
                    setTimeout(() => {
                        cubeContainer.classList.add('timer-mode');
                        startCountdown();
                    }, 1000); // Match the roll animation duration
                } catch (error) {
                    console.error('Error during cube close:', error);
                }
            });
        });

        // Countdown timer logic
        const totalSeconds = 3 * 60 * 60; // 3 hours in seconds
        let remainingSeconds = totalSeconds;

        const startCountdown = () => {
            try {
                const countdownInterval = setInterval(() => {
                    if (remainingSeconds <= 0) {
                        clearInterval(countdownInterval);
                        countdownTimer.classList.add('expired');
                        return;
                    }

                    remainingSeconds--;

                    // Calculate hours, minutes, seconds
                    const hours = Math.floor(remainingSeconds / 3600);
                    const minutes = Math.floor((remainingSeconds % 3600) / 60);
                    const seconds = remainingSeconds % 60;

                    // Update digits with flip animation
                    updateDigit(timerDigits.hours1, Math.floor(hours / 10));
                    updateDigit(timerDigits.hours2, hours % 10);
                    updateDigit(timerDigits.minutes1, Math.floor(minutes / 10));
                    updateDigit(timerDigits.minutes2, minutes % 10);
                    updateDigit(timerDigits.seconds1, Math.floor(seconds / 10));
                    updateDigit(timerDigits.seconds2, seconds % 10);
                }, 1000);
            } catch (error) {
                console.error('Error in countdown timer:', error);
            }
        };

        const updateDigit = (digitElement, value) => {
            try {
                const currentValue = parseInt(digitElement.dataset.value || '0');
                if (currentValue !== value) {
                    digitElement.dataset.value = value;
                    digitElement.classList.remove('flip');
                    void digitElement.offsetWidth; // Trigger reflow to restart animation
                    digitElement.classList.add('flip');
                    digitElement.textContent = value;
                }
            } catch (error) {
                console.error('Error updating timer digit:', error);
            }
        };

        // Initialize timer digits
        Object.values(timerDigits).forEach(digit => {
            digit.dataset.value = '0';
            digit.textContent = '0';
        });
    } catch (error) {
        console.error('Error initializing retro cube and timer:', error);
    }
});
