document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables
    const sections = document.querySelectorAll('section');
    const sectionParticles = document.querySelector('.section-particles');
    let lastScrollTop = 0;
    let currentSectionIndex = 0;
    let manualScroll = false; // Flag to track manual navigation
    let lastScrollTime = 0; // For throttling scroll updates

    // Utility: Debounce function
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // Utility: Throttle using requestAnimationFrame
    const throttleRAF = (func) => {
        let isRunning = false;
        return (...args) => {
            if (!isRunning) {
                isRunning = true;
                requestAnimationFrame(() => {
                    func.apply(this, args);
                    isRunning = false;
                });
            }
        };
    };

    // Smooth scrolling and section transitions
    const updateSections = (scrollDirection) => {
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

        // Update background color based on section (disable on mobile)
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            const sectionId = sections[currentSectionIndex].id;
            document.body.className = '';
            document.body.classList.add(`${sectionId}-bg`);
        }

        // Add section transition particles (fewer on mobile)
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
    };

    // Scroll handler
    const handleScroll = throttleRAF(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const currentTime = performance.now();
        if (currentTime - lastScrollTime < 100) return; // Throttle to 100ms
        lastScrollTime = currentTime;

        if (manualScroll) {
            manualScroll = false;
            return;
        }

        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        const sectionHeight = window.innerHeight;
        const isMobile = window.innerWidth <= 768;
        const scrollThreshold = sectionHeight * (isMobile ? 0.7 : 0.5);

        if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
            updateSections(scrollDirection);
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

        // Navigation visibility (always visible on mobile)
        const nav = document.querySelector('.retro-nav');
        if (isMobile || scrollTop > 50) {
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

        // Check if mix cards should flip back
        const mixesSection = document.querySelector('#mixes');
        const mixCards = document.querySelectorAll('.mix-card');
        const mixesRect = mixesSection.getBoundingClientRect();
        const threshold = window.innerHeight * 0.8; // Increased threshold
        if (mixesRect.top > window.innerHeight - threshold || mixesRect.bottom < threshold) {
            mixCards.forEach(card => {
                if (card.classList.contains('flipped')) {
                    card.classList.remove('flipped');
                    const audio = card.querySelector('.mix-audio');
                    if (audio) audio.pause();
                }
            });
        }
    });

    window.addEventListener('scroll', handleScroll);

    // Smooth scrolling for nav links and buttons
    document.querySelectorAll('.retro-nav a, .neon-button, .back-to-top').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            const sectionIndex = Array.from(sections).indexOf(targetSection);
            manualScroll = true;
            currentSectionIndex = sectionIndex;
            updateSections(currentSectionIndex > currentSectionIndex ? 'down' : 'up');
            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Sound wave interaction
    const heroSection = document.querySelector('.hero');
    const soundWaveContainer = document.querySelector('.sound-wave-container');
    const soundBars = document.querySelectorAll('.sound-bar');

    if (heroSection && soundWaveContainer && soundBars.length > 0) {
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
                const barCenterY = barRect.top - containerRect.top + barRect.height / 2;
                const distanceX = Math.abs(relativeX - barCenterX);
                const distanceY = Math.abs(relativeY - barCenterY);
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                const influence = Math.max(0, (maxDistance - distance) / maxDistance);
                const height = minHeight + (maxHeight - minHeight) * influence * 1.5;
                bar.style.height = `${Math.min(maxHeight, Math.max(minHeight, height))}px`;
            });
        };

        const handleMouseMove = (e) => updateBars(e.clientX, e.clientY);
        const handleTouchMove = (e) => {
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            const containerRect = soundWaveContainer.getBoundingClientRect();
            if (x >= containerRect.left && x <= containerRect.right && y >= containerRect.top && y <= containerRect.bottom) {
                e.preventDefault();
                updateBars(x, y);
            }
        };
        const resetBars = () => soundBars.forEach(bar => bar.style.height = '10px');

        heroSection.addEventListener('mousemove', handleMouseMove);
        heroSection.addEventListener('mouseleave', resetBars);
        heroSection.addEventListener('touchmove', handleTouchMove, { passive: false });
        heroSection.addEventListener('touchend', resetBars);
    }

    // Mixes section animation
    const mixesSection = document.querySelector('#mixes');
    const mixGrid = document.querySelector('.mix-grid');
    const mixDescription = document.querySelector('.mix-description');
    const mixImages = document.querySelectorAll('.mix-card-front img');

    if (mixesSection && mixGrid && mixDescription && mixImages.length > 0) {
        const checkImagesLoaded = () => {
            return Promise.all(
                Array.from(mixImages).map(img => {
                    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
                    return new Promise(resolve => {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', resolve);
                    });
                })
            );
        };

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
            }, { threshold: 0.05 });
            observer.observe(mixesSection);
        });
    }

    // Fade-in animations for artist and booking sections
    const artistSection = document.querySelector('#artist');
    const bookingSection = document.querySelector('#booking');
    const observerOptions = { threshold: 0.3 };
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, observerOptions);

    if (artistSection) sectionObserver.observe(artistSection);
    if (bookingSection) sectionObserver.observe(bookingSection);

    // Preloader
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
            setTimeout(() => preloader.classList.add('hidden'), 2000);
        }, 1000);
    }

    // Mix card flip interaction
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

    // Booking form interaction
    const bookingForm = document.getElementById('booking-form');
    const inputs = bookingForm.querySelectorAll('input, textarea, select');
    const retroMessage = document.getElementById('retro-message');
    const detailsGroup = bookingForm.querySelector('.details-group');
    const backArrow = detailsGroup.querySelector('.back-arrow');
    const finishButtonWrapper = detailsGroup.querySelector('.finish-button-wrapper');
    const finishButtonInner = finishButtonWrapper.querySelector('.finish-button-inner');
    const finishButtonBack = finishButtonInner.querySelector('.finish-button-back');
    const detailsInput = detailsGroup.querySelector('textarea');
    const neonGrid = document.querySelector('.neon-grid');
    let filledFields = new Set();

    bookingForm.addEventListener('mouseover', () => neonGrid.classList.add('active'));
    bookingForm.addEventListener('touchstart', () => neonGrid.classList.add('active'));

    const checkAllFieldsBeforeDetails = () => {
        const formGroups = bookingForm.querySelectorAll('.form-group:not(.details-group)');
        return Array.from(formGroups).every(group => {
            const wrapper = group.querySelector('.input-wrapper');
            const input = group.querySelector('input, select');
            const isRequired = input.hasAttribute('required');
            return !isRequired || (input.value.trim() && wrapper.classList.contains('flipped'));
        });
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
        setTimeout(() => detailsGroup.classList.add('active'), formGroups.length * 200 + 500);
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
        const checkmark = wrapper.querySelector('.checkmark');
        const fieldName = input.closest('.form-group').dataset.field;

        input.addEventListener('focus', () => label.classList.add('hidden'));
        input.addEventListener('blur', () => {
            if (!input.value.trim()) label.classList.remove('hidden');
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.checkValidity() && input.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);
                input.blur();
                const allFieldsFilled = checkAllFieldsBeforeDetails();
                retroMessage.classList.toggle('visible', allFieldsFilled);
            }
        });

        bookingForm.addEventListener('touchend', (e) => {
            if (!wrapper.contains(e.target) && input === document.activeElement && input.checkValidity() && input.value.trim()) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);
                input.blur();
                const allFieldsFilled = checkAllFieldsBeforeDetails();
                retroMessage.classList.toggle('visible', allFieldsFilled);
            }
        });

        checkmark.addEventListener('click', () => {
            wrapper.classList.remove('flipped');
            filledFields.delete(fieldName);
            if (!input.value.trim()) label.classList.remove('hidden');
            retroMessage.classList.remove('visible');
            input.focus();
        });
    });

    retroMessage.addEventListener('click', () => {
        if (checkAllFieldsBeforeDetails()) showDetailsGroup();
    });

    backArrow.addEventListener('click', revertForm);

    finishButtonBack.addEventListener('click', (e) => {
        if (!detailsInput.value.trim()) {
            e.preventDefault();
            detailsInput.focus();
            return;
        }
        if (!finishButtonInner.classList.contains('flipped')) {
            const wrapper = detailsInput.closest('.input-wrapper');
            wrapper.classList.add('flipped');
            filledFields.add('details');
            finishButtonInner.classList.add('flipped');
        }
        // Form submission is handled by the browser since the button is type="submit"
    });

    detailsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && detailsInput.value.trim()) {
            const wrapper = detailsInput.closest('.input-wrapper');
            wrapper.classList.add('flipped');
            filledFields.add('details');
        }
    });

    bookingForm.addEventListener('touchend', (e) => {
        if (!detailsGroup.contains(e.target) && detailsInput === document.activeElement && detailsInput.value.trim()) {
            const wrapper = detailsInput.closest('.input-wrapper');
            wrapper.classList.add('flipped');
            filledFields.add('details');
        }
    });
});
