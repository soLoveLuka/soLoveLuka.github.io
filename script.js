// Smooth scrolling animation for sections with enhanced transitions
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const sectionParticles = document.querySelector('.section-particles');
    let lastScrollTop = 0;
    let currentSectionIndex = 0;

    function updateSections(scrollDirection, targetIndex = null) {
        sections.forEach((section, index) => {
            section.classList.remove('in-view', 'out-of-view-up', 'out-of-view-down', 'zoom-down');
            section.style.transition = 'transform 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.8s ease-in-out, scale 0.8s ease-in-out';
            section.style.opacity = '0';
            section.style.scale = '0.95';
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
                section.style.transform = 'translateY(-100vh)';
            } else if (index === currentSectionIndex) {
                section.classList.add('in-view');
                section.style.transform = 'translateY(0)';
                section.style.opacity = '1';
                section.style.scale = '1';
            } else {
                section.classList.add(scrollDirection === 'down' || (targetIndex !== null && targetIndex > oldIndex) ? 'out-of-view-down' : 'out-of-view-up');
                section.style.transform = 'translateY(100vh)';
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
            const particleCount = isMobile ? 10 : 30; // Increased particles for better effect
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('section-particle');
                const side = Math.random() < 0.5 ? 'left' : 'right';
                const x = side === 'left' ? 0 : window.innerWidth - 5;
                const y = Math.random() * window.innerHeight;
                const rotation = Math.random() * 360;
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                particle.style.transform = `rotate(${rotation}deg)`;
                sectionParticles.appendChild(particle);

                setTimeout(() => {
                    particle.classList.add('active');
                    particle.style.transform = `translateX(${side === 'left' ? 150 : -150}px) rotate(${rotation + 180}deg)`;
                    particle.style.opacity = '1';
                }, i * 30);
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
        if (scrollTop > 50 || isMobile) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');

        const backToTop = document.querySelector('.back-to-top');
        if (scrollTop > 300) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');

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
                bar.style.transition = 'height 0.3s ease-in-out';
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
});

// Mix card flip interaction with audio preview
document.addEventListener('DOMContentLoaded', () => {
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
});

// Booking form interaction with interactive neon grid and enhanced animations
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    const formFlipper = bookingForm.querySelector('.form-flipper');
    const inputs = bookingForm.querySelectorAll('.form-front input, .form-front select');
    const retroMessage = document.getElementById('retro-message');
    const finishGroup = bookingForm.querySelector('.finish-group');
    const finishButtonWrapper = finishGroup.querySelector('.finish-button-wrapper');
    const finishButtonInner = finishButtonWrapper.querySelector('.finish-button-inner');
    const neonGrid = document.querySelector('.neon-grid');
    let filledFields = new Set();
    let lastFocusedInput = null;

    bookingForm.addEventListener('mouseover', () => {
        neonGrid.classList.add('active');
    });

    bookingForm.addEventListener('touchstart', () => {
        neonGrid.classList.add('active');
    });

    const checkAllFieldsBeforeFinish = () => {
        const formGroups = bookingForm.querySelectorAll('.form-front .form-group:not(.finish-group)');
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

    const showFinishGroup = () => {
        const formGroups = bookingForm.querySelectorAll('.form-front .form-group:not(.finish-group)');
        formGroups.forEach((group, index) => {
            setTimeout(() => {
                group.style.transition = 'transform 1s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.5s ease-in-out';
                group.style.transform = `translateY(${(formGroups.length / 2 - index) * 60}px)`;
                group.style.opacity = '0';
            }, index * 200);
        });

        setTimeout(() => {
            finishGroup.classList.add('active');
            finishButtonWrapper.style.display = 'block';
        }, formGroups.length * 200 + 500);
    };

    inputs.forEach((input, index) => {
        const wrapper = input.closest('.input-wrapper');
        const label = wrapper.querySelector('.input-label');
        const checkmark = wrapper.querySelector('.checkmark');
        const fieldName = input.closest('.form-group').dataset.field;

        input.addEventListener('focus', () => {
            label.classList.add('hidden');
            lastFocusedInput = input;
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                label.classList.remove('hidden');
            }

            if (lastFocusedInput === input && input.checkValidity() && input.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);
                checkmark.classList.add('glowing');

                const allFieldsFilled = checkAllFieldsBeforeFinish();
                retroMessage.classList.toggle('visible', allFieldsFilled);
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.checkValidity() && input.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);
                checkmark.classList.add('glowing');

                const allFieldsFilled = checkAllFieldsBeforeFinish();
                retroMessage.classList.toggle('visible', allFieldsFilled);

                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                }
            }
        });

        document.addEventListener('touchend', (e) => {
            if (!wrapper.contains(e.target) && input === document.activeElement && input.checkValidity() && input.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);
                checkmark.classList.add('glowing');

                const allFieldsFilled = checkAllFieldsBeforeFinish();
                retroMessage.classList.toggle('visible', allFieldsFilled);

                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                }
            }
        });

        checkmark.addEventListener('click', () => {
            wrapper.classList.remove('flipped');
            checkmark.classList.remove('glowing');
            filledFields.delete(fieldName);
            label.classList.remove('hidden');
            retroMessage.classList.remove('visible');
            input.focus();
        });
    });

    retroMessage.addEventListener('click', () => {
        if (checkAllFieldsBeforeFinish()) {
            showFinishGroup();
        }
    });

    finishButtonWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        formFlipper.classList.add('flipped');
    });

    formFlipper.querySelector('.book-now-button').addEventListener('click', (e) => {
        setTimeout(() => {
            alert('Booking submitted successfully!');
            bookingForm.submit();
            bookingForm.reset();
            formFlipper.classList.remove('flipped');
            filledFields.clear();
            inputs.forEach(input => {
                const wrapper = input.closest('.input-wrapper');
                wrapper.classList.remove('flipped');
                const checkmark = wrapper.querySelector('.checkmark');
                checkmark.classList.remove('glowing');
                const label = wrapper.querySelector('.input-label');
                label.classList.remove('hidden');
            });
            finishGroup.classList.remove('active');
            const formGroups = bookingForm.querySelectorAll('.form-front .form-group:not(.finish-group)');
            formGroups.forEach((group, index) => {
                setTimeout(() => {
                    group.style.transition = 'transform 1s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.5s ease-in-out';
                    group.style.transform = 'translateY(0)';
                    group.style.opacity = '1';
                }, index * 200);
            });
        }, 500);
    });
});
