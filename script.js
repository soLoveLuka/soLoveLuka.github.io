// Smooth scrolling animation for sections with background color shift and particles
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const sectionParticles = document.querySelector('.section-particles');
    let lastScrollTop = 0;
    let currentSectionIndex = 0;

    // Function to update section visibility based on scroll direction
    function updateSections(scrollDirection) {
        sections.forEach((section, index) => {
            section.classList.remove('in-view', 'out-of-view-up', 'out-of-view-down', 'zoom-down');
        });

        if (scrollDirection === 'down' && currentSectionIndex < sections.length - 1) {
            currentSectionIndex++;
        } else if (scrollDirection === 'up' && currentSectionIndex > 0) {
            currentSectionIndex--;
        }

        sections.forEach((section, index) => {
            if (index < currentSectionIndex) {
                section.classList.add(scrollDirection === 'down' ? 'out-of-view-up' : 'zoom-down');
            } else if (index === currentSectionIndex) {
                section.classList.add('in-view');
            } else {
                section.classList.add(scrollDirection === 'down' ? 'out-of-view-down' : 'out-of-view-up');
            }
        });

        // Update background color based on section
        const sectionId = sections[currentSectionIndex].id;
        document.body.className = ''; // Reset classes
        document.body.classList.add(`${sectionId}-bg`);

        // Add section transition particles
        if (sectionParticles) {
            sectionParticles.innerHTML = ''; // Clear previous particles
            const particleCount = window.innerWidth <= 480 ? 10 : 20; // Fewer particles on mobile
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
        const scrollThreshold = sectionHeight * 0.5;
        if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
            updateSections(scrollDirection);
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

        // Navigation fade-in
        const nav = document.querySelector('.retro-nav');
        if (scrollTop > 50) {
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

        heroSection.removeEventListener('mousemove', handleMouseMove);
        heroSection.removeEventListener('mouseleave', handleMouseLeave);
        heroSection.removeEventListener('touchmove', handleTouchMove);
        heroSection.removeEventListener('touchend', handleTouchEnd);

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
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        mixGrid.classList.add('active');
                        mixDescription.classList.add('active');
                    } else {
                        mixGrid.classList.remove('active');
                        mixDescription.classList.remove('active');
                    }
                });
            }, {
                threshold: 0.05 // Lowered threshold for better mobile visibility
            });

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

// Preloader with waveform and progress indicator (disintegration effect removed)
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
        const totalDuration = 4000; // Reduced to 4 seconds since disintegration is removed
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

// Booking form interaction with interactive neon grid
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    const inputs = bookingForm.querySelectorAll('input, textarea, select');
    const retroMessage = document.getElementById('retro-message');
    const detailsGroup = bookingForm.querySelector('.details-group');
    const backArrow = detailsGroup.querySelector('.back-arrow');
    const finishButtonWrapper = detailsGroup.querySelector('.finish-button-wrapper');
    const finishButtonInner = finishButtonWrapper.querySelector('.finish-button-inner');
    const detailsInput = detailsGroup.querySelector('textarea');
    const neonGrid = document.querySelector('.neon-grid');
    let filledFields = new Set();

    // Interactive neon grid on form interaction
    bookingForm.addEventListener('mouseover', () => {
        neonGrid.classList.add('active');
    });

    bookingForm.addEventListener('touchstart', () => {
        neonGrid.classList.add('active');
    });

    const checkAllFieldsBeforeDetails = () => {
        const formGroups = bookingForm.querySelectorAll('.form-group:not(.details-group)');
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

    const showDetailsGroup = () => {
        const formGroups = bookingForm.querySelectorAll('.form-group:not(.details-group)');
        formGroups.forEach((group, index) => {
            setTimeout(() => {
                group.style.transition = 'transform 1s ease-in-out, opacity 0.5s ease-in-out';
                group.style.transform = `translateY(${(formGroups.length / 2 - index) * 60}px)`;
                group.style.opacity = '0';
            }, index * 200);
        });

        setTimeout(() => {
            detailsGroup.classList.add('active');
        }, formGroups.length * 200 + 500);
    };

    const revertForm = () => {
        detailsGroup.classList.remove('active');
        finishButtonInner.classList.remove('flipped');
        filledFields.delete('details');

        const formGroups = bookingForm.querySelectorAll('.form-group:not(.details-group)');
        formGroups.forEach((group, index) => {
            setTimeout(() => {
                group.style.transition = 'transform 1s ease-in-out, opacity 0.5s ease-in-out';
                group.style.transform = 'translateY(0)';
                group.style.opacity = '1';
            }, index * 200);
        });
    };

    inputs.forEach(input => {
        const wrapper = input.closest('.input-wrapper');
        const label = wrapper.querySelector('.input-label');
        const fieldName = input.closest('.form-group').dataset.field;

        input.addEventListener('input', () => {
            if (input.value.trim()) {
                label.classList.add('hidden');
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);

                if (fieldName !== 'details' && checkAllFieldsBeforeDetails()) {
                    showDetailsGroup();
                    retroMessage.classList.add('visible');
                }
            } else {
                label.classList.remove('hidden');
                wrapper.classList.remove('flipped');
                filledFields.delete(fieldName);
            }
        });
    });

    backArrow.addEventListener('click', () => {
        revertForm();
        retroMessage.classList.remove('visible');
    });

    finishButtonWrapper.addEventListener('click', () => {
        if (!finishButtonInner.classList.contains('flipped')) {
            const wrapper = detailsInput.closest('.input-wrapper');
            if (detailsInput.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add('details');
            }
            finishButtonInner.classList.add('flipped');
        }
    });
});
