// About Page Interactive Features

// Animated Counter Function
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString() + (element.dataset.suffix || '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + (element.dataset.suffix || '');
        }
    }, 16);
}

// Intersection Observer for Scroll Reveal Animations
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');

                // Trigger counter animation for stat numbers
                if (entry.target.classList.contains('stat-card')) {
                    const numberElement = entry.target.querySelector('.stat-number');
                    if (numberElement && !numberElement.dataset.animated) {
                        const target = parseInt(numberElement.dataset.target);
                        animateCounter(numberElement, target);
                        numberElement.dataset.animated = 'true';
                    }
                }

                // Unobserve after animation
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}

// Stagger Animation for Grid Items
function initStaggerAnimation() {
    const grids = document.querySelectorAll('.stats-grid, .values-grid, .features-grid');

    grids.forEach(grid => {
        const items = grid.querySelectorAll('.stat-card, .value-card, .feature-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    });
}

// Smooth Scroll for Internal Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Initialize all features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initStaggerAnimation();
    initSmoothScroll();

    // Add loaded class to body for CSS transitions
    document.body.classList.add('loaded');
});

// Optional: Add parallax effect to hero section
function initParallax() {
    const hero = document.querySelector('.about-hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        hero.style.transform = `translate3d(0, ${rate}px, 0)`;
    });
}

// Uncomment to enable parallax
// initParallax();
