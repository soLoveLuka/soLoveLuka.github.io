// Ensure DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    // Floating Stars (Particle Effect)
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const stars = [];
    const numStars = 100;

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }

    function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();

            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(animateStars);
    }

    animateStars();

    // Resize canvas on window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Scroll Animation for Mix Cards
    const mixCards = document.querySelectorAll('.mix-card');
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    mixCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'all 0.5s ease';
        observer.observe(card);
    });

    // Booking Form Feedback
    const form = document.querySelector('.booking-form');
    const bookingGrid = document.querySelector('.booking-grid');

    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent actual form submission for now
        bookingGrid.style.animation = 'pulse 1s 2'; // Pulse the grid twice
        form.reset(); // Clear the form
        alert('Booking submitted! We’ll get back to you soon.'); // Placeholder feedback
    });
});

// Smooth scrolling animation for sections
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    let lastScrollTop = 0;
    let currentSectionIndex = 0;

    // Function to update section visibility based on scroll direction
    function updateSections(scrollDirection) {
        // Remove all classes from sections
        sections.forEach((section, index) => {
            section.classList.remove('in-view', 'out-of-view-up', 'out-of-view-down', 'zoom-down');
        });

        // Determine the new current section based on scroll direction
        if (scrollDirection === 'down' && currentSectionIndex < sections.length - 1) {
            currentSectionIndex++;
        } else if (scrollDirection === 'up' && currentSectionIndex > 0) {
            currentSectionIndex--;
        }

        // Apply classes to sections based on their position relative to the current section
        sections.forEach((section, index) => {
            if (index < currentSectionIndex) {
                // Sections above the current section
                section.classList.add(scrollDirection === 'down' ? 'out-of-view-up' : 'zoom-down');
            } else if (index === currentSectionIndex) {
                // Current section
                section.classList.add('in-view');
            } else {
                // Sections below the current section
                section.classList.add(scrollDirection === 'down' ? 'out-of-view-down' : 'out-of-view-up');
            }
        });
    }

    // Scroll event listener
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';

        // Update sections only if the scroll direction changes significantly
        const sectionHeight = window.innerHeight;
        const scrollThreshold = sectionHeight * 0.5; // Trigger when scrolled halfway into a section
        if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
            updateSections(scrollDirection);
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Prevent negative scroll
    });

    // Initial setup: Ensure the first section is visible
    sections[0].classList.add('in-view'); // Explicitly set the first section (hero) to in-view
});

// Sound wave interaction with mouse movement
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero');
    const soundWaveContainer = document.querySelector('.sound-wave-container');
    const soundBars = document.querySelectorAll('.sound-bar');

    if (heroSection && soundWaveContainer && soundBars.length > 0) {
        heroSection.addEventListener('mousemove', (e) => {
            const containerRect = soundWaveContainer.getBoundingClientRect();
            // Adjust for scroll position
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const mouseX = e.clientX - containerRect.left + scrollX; // Adjust mouse X for scroll
            const mouseY = e.clientY - containerRect.top + scrollY; // Adjust mouse Y for scroll
            const centerY = containerRect.height / 2;

            soundBars.forEach((bar, index) => {
                // Get the actual position of each bar relative to the container
                const barRect = bar.getBoundingClientRect();
                const barX = barRect.left - containerRect.left + (barRect.width / 2); // Center of the bar
                const distanceX = Math.abs(mouseX - barX);
                const distanceY = Math.abs(mouseY - centerY);
                const maxHeight = 80;
                const minHeight = 10;
                const influenceX = Math.max(0, 150 - distanceX);
                const influenceY = Math.max(0, 150 - distanceY);
                const height = minHeight + (influenceX + influenceY) * 0.3;
                bar.style.height = `${Math.min(maxHeight, height)}px`;

                // Debugging: Log positions to compare
                console.log(`Bar ${index}: barX=${barX}, mouseX=${mouseX}, distanceX=${distanceX}`);
            });
        });

        heroSection.addEventListener('mouseleave', () => {
            soundBars.forEach((bar) => {
                bar.style.height = '10px';
            });
        });
    }
});
