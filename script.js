// 3D Audio Visualizer in Hero Section
document.addEventListener('DOMContentLoaded', () => {
    const visualizerContainer = document.getElementById('visualizer');
    const audio = document.getElementById('background-audio');
    const toggleAudioButton = document.getElementById('toggle-audio');
    const moodSelector = document.getElementById('mood-selector');

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, visualizerContainer.clientWidth / visualizerContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(visualizerContainer.clientWidth, visualizerContainer.clientHeight);
    visualizerContainer.appendChild(renderer.domElement);

    // Create bars for the visualizer
    const bars = [];
    const barCount = 32;
    const barWidth = 1;
    const barDepth = 1;
    const barSpacing = 2;
    for (let i = 0; i < barCount; i++) {
        const geometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
        const material = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
        const bar = new THREE.Mesh(geometry, material);
        bar.position.x = (i - barCount / 2) * (barWidth + barSpacing);
        scene.add(bar);
        bars.push(bar);
    }

    camera.position.z = 50;

    // Web Audio API setup
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    // Mood-based colors
    const moodColors = {
        chill: 0x00f7ff, // Neon blue
        hype: 0xff00ff,  // Neon pink
        retro: 0x00ff00  // Neon green
    };

    // Update visualizer based on audio
    function animate() {
        requestAnimationFrame(animate);

        analyser.getByteFrequencyData(frequencyData);

        bars.forEach((bar, index) => {
            const height = frequencyData[index] / 10 || 1;
            bar.scale.y = height;
            bar.position.y = height / 2;
        });

        renderer.render(scene, camera);
    }

    animate();

    // Handle audio toggle
    let isPlaying = false;
    toggleAudioButton.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            toggleAudioButton.textContent = 'Play Audio';
            audioContext.suspend();
        } else {
            audio.play();
            toggleAudioButton.textContent = 'Pause Audio';
            audioContext.resume();
        }
        isPlaying = !isPlaying;
    });

    // Handle mood selector
    moodSelector.addEventListener('change', (e) => {
        const mood = e.target.value;
        bars.forEach(bar => {
            bar.material.color.setHex(moodColors[mood]);
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = visualizerContainer.clientWidth;
        const height = visualizerContainer.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
});

// Portfolio Timeline Animation
document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.querySelector('.timeline');
    if (timeline) {
        gsap.registerPlugin(ScrollTrigger);

        const timelineItems = document.querySelectorAll('.timeline-item');
        const timelineWidth = timeline.scrollWidth;

        // Horizontal scrolling animation for the timeline
        gsap.to(timeline, {
            x: () => -(timelineWidth - window.innerWidth + 100),
            ease: "none",
            scrollTrigger: {
                trigger: ".timeline-container",
                pin: true,
                scrub: 1,
                start: "top top",
                end: () => `+=${timelineWidth}`,
                invalidateOnRefresh: true
            }
        });

        // Animate timeline items into view
        timelineItems.forEach((item, index) => {
            gsap.to(item, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: item,
                    containerAnimation: gsap.to(timeline, { x: -(timelineWidth - window.innerWidth + 100) }),
                    start: "left center",
                    end: "right center",
                    scrub: true,
                    toggleActions: "play none none reverse"
                }
            });
        });

        // Handle "See Details" buttons
        const detailsButtons = document.querySelectorAll('.timeline-details');
        detailsButtons.forEach(button => {
            button.addEventListener('click', () => {
                const projectTitle = button.parentElement.querySelector('h3').textContent;
                const modal = document.createElement('div');
                modal.classList.add('modal');
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="modal-close">&times;</span>
                        <h3>${projectTitle}</h3>
                        <p>Details about the project, including gear used, techniques applied, and client feedback.</p>
                        <p><strong>Gear Used:</strong> SSL Console, Neumann Mics, Ableton Live</p>
                        <p><strong>Techniques:</strong> Parallel compression, sidechain EQ, stereo widening</p>
                        <p><strong>Client Feedback:</strong> "SomewhatSmiley brought my track to life!"</p>
                    </div>
                `;
                document.body.appendChild(modal);

                const closeModal = modal.querySelector('.modal-close');
                closeModal.addEventListener('click', () => {
                    modal.remove();
                });

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            });
        });
    }
});

// Smooth scrolling animation for sections with background color shift and particles
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const sectionParticles = document.querySelector('.section-particles');
    let lastScrollTop = 0;
    let currentSectionIndex = 0;

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

        const sectionId = sections[currentSectionIndex].id;
        document.body.className = '';
        document.body.classList.add(`${sectionId}-bg`);

        if (sectionParticles) {
            sectionParticles.innerHTML = '';
            const particleCount = window.innerWidth <= 480 ? 10 : 20;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('section-particle');
                const side = Math.random() < 0.5 ? 'left' : 'right';
                const top = Math.random() * 100;
                particle.style[side] = `${Math.random() * 20}%`;
                particle.style.top = `${top}%`;
                particle.style.transform = `translate${side === 'left' ? 'X' : 'X'}(${Math.random() * 100 * (side === 'left' ? -1 : 1)}px)`;
                sectionParticles.appendChild(particle);
                setTimeout(() => particle.classList.add('active'), i * 50);
            }
        }
    }

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        updateSections(scrollDirection);
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // Smooth scrolling for nav links
    document.querySelectorAll('.retro-nav a').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            const sectionIndex = Array.from(sections).indexOf(targetSection);
            currentSectionIndex = sectionIndex;
            updateSections(currentSectionIndex > currentSectionIndex ? 'down' : 'up');
            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
});

// Preloader Animation
document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.querySelector('.preloader');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    const chars = document.querySelectorAll('.preloader-char');

    chars.forEach((char, index) => {
        char.style.setProperty('--char-index', index);
        char.classList.add('wave');
    });

    let progress = 0;
    progressBar.classList.add('active');
    const interval = setInterval(() => {
        progress += 1;
        progressText.textContent = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            preloader.classList.add('hidden');
        }
    }, 60);
});

// Mix Card Interactions
document.addEventListener('DOMContentLoaded', () => {
    const mixCards = document.querySelectorAll('.mix-card');
    const mixGrid = document.querySelector('.mix-grid');
    const mixDescription = document.querySelector('.mix-description');

    const observerOptions = {
        root: null,
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                mixGrid.classList.add('active');
                mixDescription.classList.add('active');
            }
        });
    }, observerOptions);

    observer.observe(mixGrid);

    mixCards.forEach(card => {
        let isFlipped = false;
        let touchStartTime;

        card.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) {
                const audio = card.querySelector('.mix-audio');
                audio.currentTime = 0;
                audio.play();
            }
        });

        card.addEventListener('mouseleave', () => {
            if (window.innerWidth > 768) {
                const audio = card.querySelector('.mix-audio');
                audio.pause();
                audio.currentTime = 0;
            }
        });

        card.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                isFlipped = !isFlipped;
                card.classList.toggle('flipped', isFlipped);
                const audio = card.querySelector('.mix-audio');
                if (!isFlipped) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        });

        card.addEventListener('touchstart', () => {
            touchStartTime = Date.now();
        });

        card.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 300) {
                e.preventDefault();
                const audio = card.querySelector('.mix-audio');
                audio.currentTime = 0;
                audio.play();
            } else {
                isFlipped = !isFlipped;
                card.classList.toggle('flipped', isFlipped);
                const audio = card.querySelector('.mix-audio');
                if (!isFlipped) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        });
    });
});

// Booking Form Animations
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#booking-form');
    const inputs = form.querySelectorAll('input, select, textarea');
    const detailsGroup = form.querySelector('.details-group');
    const retroMessage = document.querySelector('#retro-message');
    const backArrow = detailsGroup.querySelector('.back-arrow');
    const finishButton = form.querySelector('.finish-button-inner');
    let allFieldsFilled = false;

    inputs.forEach(input => {
        const wrapper = input.closest('.input-wrapper');
        const label = wrapper.querySelector('.input-label');
        const checkmark = wrapper.querySelector('.checkmark');

        input.addEventListener('focus', () => {
            label.classList.add('hidden');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                label.classList.remove('hidden');
            }
        });

        input.addEventListener('input', () => {
            if (input.checkValidity() && input.value) {
                wrapper.classList.add('flipped');
            } else {
                wrapper.classList.remove('flipped');
            }

            allFieldsFilled = Array.from(form.querySelectorAll('input, select'))
                .filter(i => i !== form.querySelector('#details'))
                .every(i => i.checkValidity() && i.value);
            retroMessage.classList.toggle('visible', allFieldsFilled);
        });

        checkmark.addEventListener('click', () => {
            wrapper.classList.remove('flipped');
            input.focus();
        });
    });

    retroMessage.addEventListener('click', () => {
        if (allFieldsFilled) {
            form.querySelectorAll('.form-group:not(.details-group)').forEach(group => {
                group.style.display = 'none';
            });
            detailsGroup.classList.add('active');
        }
    });

    backArrow.addEventListener('click', () => {
        form.querySelectorAll('.form-group:not(.details-group)').forEach(group => {
            group.style.display = 'block';
        });
        detailsGroup.classList.remove('active');
    });

    finishButton.addEventListener('click', () => {
        finishButton.classList.add('flipped');
        setTimeout(() => {
            form.submit();
        }, 1000);
    });
});

// Section Visibility on Scroll
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const observerOptions = {
        root: null,
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
});

// Back to Top Button
document.addEventListener('DOMContentLoaded', () => {
    const backToTop = document.querySelector('.back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
});
