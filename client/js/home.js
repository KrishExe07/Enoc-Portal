// Home Page Enhanced Interactivity

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initParallaxEffect();
    initFeatureCardTilt();
    initStaggerAnimation();

    // Add loaded class for transitions
    document.body.classList.add('loaded');
});

// Scroll Reveal Animation
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}

// Enhanced Parallax Effect for Hero Section
function initParallaxEffect() {
    const parallaxLayers = document.querySelectorAll('.parallax-layer');

    if (parallaxLayers.length === 0) return;

    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        parallaxLayers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0.1;
            const moveX = (clientX - centerX) * depth;
            const moveY = (clientY - centerY) * depth;

            layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });

    // Scroll-based parallax
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        parallaxLayers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0.1;
            const yPos = scrolled * depth * 0.5;
            layer.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// 3D Tilt Effect for Feature Cards
function initFeatureCardTilt() {
    const tiltElements = document.querySelectorAll('.tilt');

    tiltElements.forEach(element => {
        element.addEventListener('mouseenter', function () {
            this.style.transition = 'transform 0.1s ease';
        });

        element.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            this.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                translateY(-12px) 
                scale(1.02)
            `;
        });

        element.addEventListener('mouseleave', function () {
            this.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
        });
    });
}

// Stagger Animation for Grid Items
function initStaggerAnimation() {
    const grids = document.querySelectorAll('.features-grid');

    grids.forEach(grid => {
        const items = grid.querySelectorAll('.feature-item');
        items.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
        });
    });
}

// Smooth Scroll for Anchor Links
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

// Add ripple effect to buttons
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    ripple.style.top = `${event.clientY - button.offsetTop - radius}px`;
    ripple.classList.add('ripple');

    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
        existingRipple.remove();
    }

    button.appendChild(ripple);
}

// Apply ripple to all buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', createRipple);
});

// Performance optimization: Debounce scroll and resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize parallax on scroll
const optimizedParallax = debounce(() => {
    const scrolled = window.pageYOffset;
    const parallaxLayers = document.querySelectorAll('.parallax-layer');

    parallaxLayers.forEach(layer => {
        const depth = parseFloat(layer.dataset.depth) || 0.1;
        const yPos = scrolled * depth * 0.5;
        layer.style.transform = `translateY(${yPos}px)`;
    });
}, 10);

window.addEventListener('scroll', optimizedParallax);
