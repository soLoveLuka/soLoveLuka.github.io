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
    }, 10));
});

// Sound wave interaction with mouse movement
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero');
    const soundWaveContainer = document.querySelector('.sound-wave-container');
    const soundBars = document.querySelectorAll('.sound-bar');

    if (heroSection && soundWaveContainer && soundBars.length > 0) {
        // Mouse movement handler for sound wave interaction
        const handleMouseMove = (e) => {
            const containerRect = soundWaveContainer.getBoundingClientRect();
            const mouseX = e.clientX - containerRect.left;
            const mouseY = e.clientY - containerRect.top;
            const centerY = containerRect.height / 2;

            soundBars.forEach((bar, index) => {
                const barX = bar.offsetLeft + (bar.offsetWidth / 2);
                const distanceX = Math.abs(mouseX - barX);
                const distanceY = Math.abs(mouseY - centerY);
                const maxHeight = 80;
                const minHeight = 10;
                const influenceX = Math.max(0, 150 - distanceX);
                const influenceY = Math.max(0, 150 - distanceY);
                const height = minHeight + (influenceX + influenceY) * 0.3;
                bar.style.height = `${Math.min(maxHeight, height)}px`;
            });
        };

        // Mouse leave handler to reset sound bars
        const handleMouseLeave = () => {
            soundBars.forEach((bar) => {
                bar.style.height = '10px';
            });
        };

        // Add event listeners
        heroSection.addEventListener('mousemove', handleMouseMove);
        heroSection.addEventListener('mouseleave', handleMouseLeave);

        // Ensure event listeners are not added multiple times
        heroSection.removeEventListener('mousemove', handleMouseMove);
        heroSection.removeEventListener('mouseleave', handleMouseLeave);
        heroSection.addEventListener('mousemove', handleMouseMove);
        heroSection.addEventListener('mouseleave', handleMouseLeave);
    }
});

// Handle booking form submission with AJAX
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');

    if (bookingForm) {
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
                    bookingForm.appendChild(successMessage);
                    bookingForm.reset();
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                const errorMessage = document.createElement('p');
                errorMessage.textContent = 'Oops! Something went wrong. Please try again later.';
                errorMessage.style.color = '#ff00ff';
                errorMessage.style.textShadow = '0 0 10px #ff00ff';
                errorMessage.style.marginTop = '1rem';
                bookingForm.appendChild(errorMessage);
            }
        });
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
