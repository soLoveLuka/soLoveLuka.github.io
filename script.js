// Smooth scrolling animation for sections
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
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

        // Define the threshold for when to flip back (e.g., when the section is 50% out of view)
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
        // Function to update bar heights based on position
        const updateBars = (x, y) => {
            const containerRect = soundWaveContainer.getBoundingClientRect();
            const containerCenterX = containerRect.left + containerRect.width / 2;
            const containerCenterY = containerRect.top + containerRect.height / 2;

            // Calculate position relative to the center of the container
            const relativeX = x - containerRect.left;
            const relativeY = y - containerRect.top;

            // Adjust influence range based on container size
            const maxDistance = Math.max(containerRect.width, containerRect.height) * 0.6;
            const maxHeight = 80;
            const minHeight = 10;

            soundBars.forEach((bar, index) => {
                const barRect = bar.getBoundingClientRect();
                const barCenterX = barRect.left - containerRect.left + barRect.width / 2;
                const barCenterY = barRect.top - containerRect.top + barRect.height / 2;

                // Calculate distance from the cursor/touch to the bar center
                const distanceX = Math.abs(relativeX - barCenterX);
                const distanceY = Math.abs(relativeY - barCenterY);
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Calculate height based on distance (closer = taller)
                const influence = Math.max(0, (maxDistance - distance) / maxDistance);
                const height = minHeight + (maxHeight - minHeight) * influence * 1.5;

                bar.style.height = `${Math.min(maxHeight, Math.max(minHeight, height))}px`;
            });
        };

        // Mouse movement handler
        const handleMouseMove = (e) => {
            const x = e.clientX;
            const y = e.clientY;
            updateBars(x, y);
        };

        // Touch movement handler
        const handleTouchMove = (e) => {
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;

            // Check if the touch is within the sound wave container
            const containerRect = soundWaveContainer.getBoundingClientRect();
            if (
                x >= containerRect.left &&
                x <= containerRect.right &&
                y >= containerRect.top &&
                y <= containerRect.bottom
            ) {
                e.preventDefault(); // Prevent scrolling only when touching the visualizer
                updateBars(x, y);
            }
            // If touch is outside the container, allow default scrolling behavior
        };

        // Mouse leave handler to reset sound bars
        const handleMouseLeave = () => {
            soundBars.forEach((bar) => {
                bar.style.height = '10px';
            });
        };

        // Touch end handler to reset sound bars
        const handleTouchEnd = () => {
            soundBars.forEach((bar) => {
                bar.style.height = '10px';
            });
        };

        // Add event listeners for mouse (unchanged for desktop)
        heroSection.addEventListener('mousemove', handleMouseMove);
        heroSection.addEventListener('mouseleave', handleMouseLeave);

        // Add event listeners for touch (modified to allow scrolling)
        heroSection.addEventListener('touchmove', handleTouchMove, { passive: false });
        heroSection.addEventListener('touchend', handleTouchEnd);

        // Remove existing listeners to prevent duplicates
        heroSection.removeEventListener('mousemove', handleMouseMove);
        heroSection.removeEventListener('mouseleave', handleMouseLeave);
        heroSection.removeEventListener('touchmove', handleTouchMove);
        heroSection.removeEventListener('touchend', handleTouchEnd);

        // Re-add listeners
        heroSection.addEventListener('mousemove', handleMouseMove);
        heroSection.addEventListener('mouseleave', handleMouseLeave);
        heroSection.addEventListener('touchmove', handleTouchMove, { passive: false });
        heroSection.addEventListener('touchend', handleTouchEnd);
    }
});

// Mixes section animation with IntersectionObserver
document.addEventListener('DOMContentLoaded', () => {
    const mixesSection = document.querySelector('#mixes');
    const mixGrid = document.querySelector('.mix-grid');
    const mixDescription = document.querySelector('.mix-description');

    if (mixesSection && mixGrid && mixDescription) {
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
            threshold: 0.5 // Trigger when 50% of the section is visible
        });

        observer.observe(mixesSection);
    }
});

// Fade-in animations for artist and booking sections with IntersectionObserver
document.addEventListener('DOMContentLoaded', () => {
    const artistSection = document.querySelector('#artist');
    const bookingSection = document.querySelector('#booking');

    const observerOptions = { threshold: 0.3 }; // Trigger when 30% of the section is visible

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

// Preloader
document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        // Hide preloader after 1 second (adjust as needed)
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 1000);
    }
});

// Mix card flip interaction
document.addEventListener('DOMContentLoaded', () => {
    const mixCards = document.querySelectorAll('.mix-card');
    let currentlyFlippedCard = null;

    mixCards.forEach(card => {
        card.addEventListener('click', () => {
            // If another card is flipped, flip it back and pause its audio
            if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                currentlyFlippedCard.classList.remove('flipped');
                const previousAudio = currentlyFlippedCard.querySelector('.mix-audio');
                if (previousAudio) previousAudio.pause();
            }

            // Toggle the clicked card
            card.classList.toggle('flipped');
            currentlyFlippedCard = card.classList.contains('flipped') ? card : null;

            // Pause audio when flipping back
            const audio = card.querySelector('.mix-audio');
            if (!card.classList.contains('flipped') && audio) {
                audio.pause();
            }
        });
    });
});

// Booking form interaction
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    const inputs = bookingForm.querySelectorAll('input, textarea, select');
    const retroMessage = document.getElementById('retro-message');
    const detailsGroup = bookingForm.querySelector('.details-group');
    const backArrow = detailsGroup.querySelector('.back-arrow');
    const finishButtonWrapper = detailsGroup.querySelector('.finish-button-wrapper');
    const finishButtonInner = finishButtonWrapper.querySelector('.finish-button-inner');
    const detailsInput = detailsGroup.querySelector('textarea');
    let filledFields = new Set();

    // Function to check if all fields before details are filled and flipped
    const checkAllFieldsBeforeDetails = () => {
        const formGroups = bookingForm.querySelectorAll('.form-group:not(.details-group)');
        let allFilled = true;

        formGroups.forEach(group => {
            const wrapper = group.querySelector('.input-wrapper');
            const input = group.querySelector('input, select');
            const isRequired = input.hasAttribute('required');

            // Check if the field is required and not filled
            if (isRequired && !input.value.trim()) {
                allFilled = false;
            }

            // Check if the wrapper has the flipped class (indicating the field has been interacted with)
            if (!wrapper.classList.contains('flipped')) {
                allFilled = false;
            }
        });

        return allFilled;
    };

    // Function to show the details group and collapse other fields
    const showDetailsGroup = () => {
        // Collapse other form groups
        const formGroups = bookingForm.querySelectorAll('.form-group:not(.details-group)');
        formGroups.forEach((group, index) => {
            setTimeout(() => {
                group.style.transition = 'transform 1s ease-in-out, opacity 0.5s ease-in-out';
                group.style.transform = `translateY(${(formGroups.length / 2 - index) * 60}px)`;
                group.style.opacity = '0';
            }, index * 200);
        });

        // Show the details group after the collapse animation
        setTimeout(() => {
            detailsGroup.classList.add('active');
        }, formGroups.length * 200 + 500);
    };

    // Function to revert the form to its initial state
    const revertForm = () => {
        // Hide the details group
        detailsGroup.classList.remove('active');

        // Reset the finish button
        finishButtonInner.classList.remove('flipped');

        // Reset the filled fields for the details input
        filledFields.delete('details');

        // Show the other form groups again
        const formGroups = bookingForm.querySelectorAll('.form-group:not(.details-group)');
        formGroups.forEach(group => {
            group.style.transform = 'translateY(0)';
            group.style.opacity = '1';
        });

        // Show retro message
        retroMessage.classList.add('visible');
        setTimeout(() => {
            retroMessage.classList.remove('visible');
        }, 5000);
    };

    // Handle input focus, blur, and change for each field
    inputs.forEach((input) => {
        const wrapper = input.closest('.input-wrapper');
        const formGroup = input.closest('.form-group');
        const fieldName = formGroup.dataset.field;
        const label = wrapper.querySelector('.input-label');

        // On focus: hide the label
        input.addEventListener('focus', () => {
            label.classList.add('hidden');

            // If the field was previously flipped, flip it back
            if (wrapper.classList.contains('flipped')) {
                wrapper.classList.remove('flipped');
                filledFields.delete(fieldName);

                // Show retro message
                retroMessage.classList.add('visible');
                setTimeout(() => {
                    retroMessage.classList.remove('visible');
                }, 5000);

                // If reverting from the details group, revert the entire form
                if (fieldName === 'details') {
                    revertForm();
                }
            }
        });

        // On blur: flip the card if the field has a value
        input.addEventListener('blur', () => {
            if (input.value.trim() && !wrapper.classList.contains('flipped')) {
                wrapper.classList.add('flipped');
                filledFields.add(fieldName);

                // Check if all fields before details are filled and flipped
                if (fieldName !== 'details' && checkAllFieldsBeforeDetails()) {
                    showDetailsGroup();
                }
            } else if (!input.value.trim()) {
                label.classList.remove('hidden');
            }
        });

        // For select elements, handle change to flip the card
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => {
                if (input.value && !wrapper.classList.contains('flipped')) {
                    wrapper.classList.add('flipped');
                    filledFields.add(fieldName);

                    // Check if all fields before details are filled and flipped
                    if (checkAllFieldsBeforeDetails()) {
                        showDetailsGroup();
                    }
                }
            });
        }

        // Ensure the input is focused when clicking the back side
        wrapper.querySelector('.input-back').addEventListener('click', () => {
            input.focus();
        });
    });

    // Back arrow click handler
    backArrow.addEventListener('click', () => {
        revertForm();
    });

    // Finish button click handler
    finishButtonInner.querySelector('.finish-button-front').addEventListener('click', () => {
        if (detailsInput.value.trim()) {
            finishButtonInner.classList.add('flipped');
            filledFields.add('details');
        } else {
            // Show retro message if details are empty
            retroMessage.classList.add('visible');
            setTimeout(() => {
                retroMessage.classList.remove('visible');
            }, 5000);
        }
    });

    // Handle form submission with AJAX
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(bookingForm);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        try {
            const response = await fetch(bookingForm.action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formObject)
            });

            if (response.ok) {
                const successMessage = document.createElement('p');
                successMessage.textContent = 'Thank you for your booking! I’ll get back to you soon.';
                successMessage.style.color = '#00f7ff';
                successMessage.style.textShadow = '0 0 10px #00f7ff';
                successMessage.style.marginTop = '1rem';
                successMessage.style.textAlign = 'center';
                bookingForm.innerHTML = '';
                bookingForm.appendChild(successMessage);
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'Oops! Something went wrong. Please try again later.';
            errorMessage.style.color = '#ff00ff';
            errorMessage.style.textShadow = '0 0 10px #ff00ff';
            errorMessage.style.marginTop = '1rem';
            errorMessage.style.textAlign = 'center';
            bookingForm.appendChild(errorMessage);
        }
    });
});
