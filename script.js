document.addEventListener('DOMContentLoaded', () => {
    const mixes = [
        { title: 'Mix 1', mood: 'energetic' },
        { title: 'Mix 2', mood: 'chill' },
        { title: 'Mix 3', mood: 'energetic' }
    ];

    const featuredMixesSection = document.getElementById('featured-mixes');
    const mixGrid = document.getElementById('mixes');
    let hasBeenVisible = false;

    if (!featuredMixesSection || !mixGrid) {
        console.error('Required DOM elements not found.');
        return;
    }

    mixes.forEach(mix => {
        const card = document.createElement('div');
        card.className = 'mix-card';
        card.innerHTML = `<h3>${mix.title}</h3>`;
        mixGrid.appendChild(card);
    });

    const observerOptions = {
        threshold: window.innerWidth <= 768 ? 0.05 : 0.1,
        rootMargin: '0px 0px -20% 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                mixGrid.classList.add('active');
                hasBeenVisible = true;
            } else if (hasBeenVisible && entry.boundingClientRect.top > window.innerHeight) {
                mixGrid.classList.remove('active');
            }
        });
    }, observerOptions);

    sectionObserver.observe(featuredMixesSection);
});
