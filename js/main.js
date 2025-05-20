document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: false,
        mirror: true
    });
    
    // Initialize Particles.js for hero background
    initParticles();
    
    // Initialize category filter
    initCategoryFilter();
    
    // Animate stats counters when in view
    initStatsCounter();
    
    // Initialize GSAP animations
    initGSAPAnimations();
    
    // Handle tool card hover effects
    initToolCardEffects();

    // Listen for theme changes
    window.addEventListener('themeChanged', (e) => {
        updateParticlesColors(e.detail.theme);
    });
});

// Particles.js initialization
function initParticles() {
    if (document.getElementById('particles-js')) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const particlesConfig = getParticlesConfig(currentTheme);
        
        particlesJS('particles-js', particlesConfig);
    }
}

function getParticlesConfig(theme) {
    const isDark = theme === 'dark';
    
    return {
        particles: {
            number: {
                value: 80,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: isDark ? '#ffffff' : '#000000'
            },
            opacity: {
                value: isDark ? 0.1 : 0.05,
                random: true
            },
            size: {
                value: 3,
                random: true
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: isDark ? '#ffffff' : '#000000',
                opacity: isDark ? 0.1 : 0.05,
                width: 1
            },
            move: {
                enable: true,
                speed: 1,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 0.3
                    }
                },
                push: {
                    particles_nb: 3
                }
            }
        },
        retina_detect: true
    };
}

function updateParticlesColors(theme) {
    // If particles are initialized, update their colors
    if (window.pJSDom && window.pJSDom[0]) {
        const isDark = theme === 'dark';
        const particles = window.pJSDom[0].pJS.particles;
        
        particles.color.value = isDark ? '#ffffff' : '#000000';
        particles.line_linked.color = isDark ? '#ffffff' : '#000000';
        
        // Refresh particles
        window.pJSDom[0].pJS.fn.particlesRefresh();
    }
}

// Category filter
function initCategoryFilter() {
    const filterButtons = document.querySelectorAll('.category-pill');
    const toolItems = document.querySelectorAll('.tool-item');
    
    if (filterButtons.length && toolItems.length) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get filter value
                const filterValue = this.getAttribute('data-filter');
                
                // GSAP animation for filtering
                gsap.to('.tool-item', {
                    opacity: 0,
                    y: 20,
                    stagger: 0.03,
                    duration: 0.3,
                    onComplete: () => {
                        // Show/hide items based on filter
                        toolItems.forEach(item => {
                            if (filterValue === 'all' || item.classList.contains(filterValue)) {
                                item.style.display = 'block';
                            } else {
                                item.style.display = 'none';
                            }
                        });
                        
                        // Animate items back in
                        gsap.to('.tool-item:not([style*="display: none"])', {
                            opacity: 1,
                            y: 0,
                            stagger: 0.05,
                            duration: 0.5,
                            ease: 'power2.out'
                        });
                    }
                });
                
                // Re-initialize AOS for newly visible items
                setTimeout(() => {
                    AOS.refresh();
                }, 500);
            });
        });
    }
}

// Stats counter
function initStatsCounter() {
    const counterElements = document.querySelectorAll('.counter');
    
    const options = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const countTo = parseFloat(element.getAttribute('data-count'));
                const isDecimal = countTo % 1 !== 0;
                const duration = 2000;
                const startTime = performance.now();
                
                function updateCounter(currentTime) {
                    const elapsedTime = currentTime - startTime;
                    const progress = Math.min(elapsedTime / duration, 1);
                    const currentValue = progress * countTo;
                    
                    if (isDecimal) {
                        element.textContent = currentValue.toFixed(1);
                    } else {
                        element.textContent = Math.floor(currentValue);
                    }
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    }
                }
                
                requestAnimationFrame(updateCounter);
                observer.unobserve(element);
            }
        });
    }, options);
    
    counterElements.forEach(counter => {
        observer.observe(counter);
    });
}

// GSAP Animations
function initGSAPAnimations() {
    // Hero title animation
    gsap.from('.hero-title', {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.hero-title',
            start: 'top 80%',
        }
    });
    
    // Tool card stagger animations when scrolling
    gsap.utils.toArray('.tool-card').forEach((card, i) => {
        gsap.from(card, {
            opacity: 0,
            y: 50,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
            },
            delay: i * 0.1
        });
    });
    
    // Floating elements animation
    const floatingElements = document.querySelectorAll('.floating-icon');
    floatingElements.forEach((element, index) => {
        gsap.to(element, {
            y: '-=20',
            duration: 2 + (index * 0.5),
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true
        });
    });
    
    // Tool preview cards parallax effect
    gsap.to('.main-card', {
        y: -30,
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        }
    });
    
    gsap.to('.secondary-card', {
        y: -50,
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5
        }
    });
}

// Tool card effects
function initToolCardEffects() {
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const cardGlow = this.querySelector('.card-glow');
            if (cardGlow) {
                // Position the glow at mouse entry point
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                cardGlow.style.left = `${x}px`;
                cardGlow.style.top = `${y}px`;
            }
        });
        
        // Mouse move parallax effect within card
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = (x / rect.width - 0.5) * 10;
            const yPercent = (y / rect.height - 0.5) * 10;
            
            gsap.to(this, {
                rotationY: xPercent,
                rotationX: -yPercent,
                transformPerspective: 1000,
                duration: 0.4,
                ease: 'power1.out'
            });
            
            // Move the icon slightly for depth effect
            const icon = this.querySelector('.tool-icon');
            if (icon) {
                gsap.to(icon, {
                    x: xPercent * 0.5,
                    y: yPercent * 0.5,
                    duration: 0.4,
                    ease: 'power1.out'
                });
            }
        });
        
        // Reset transforms when mouse leaves
        card.addEventListener('mouseleave', function() {
            gsap.to(this, {
                rotationY: 0,
                rotationX: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.5)'
            });
            
            const icon = this.querySelector('.tool-icon');
            if (icon) {
                gsap.to(icon, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.5)'
                });
            }
        });
    });
}