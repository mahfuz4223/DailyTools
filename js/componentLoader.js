// Component Loader System
class ComponentLoader {
    constructor() {
        // Detect if we're in a subdirectory
        const isInSubdir = window.location.pathname.includes('/tools/');
        this.componentsPath = isInSubdir ? '../components' : './components';
        this.components = {
            header: {
                id: 'header',
                path: '/header.html'
            },
            footer: {
                id: 'footer',
                path: '/footer.html'
            }
        };
        
        // Detect if using file protocol
        this.isFileProtocol = window.location.protocol === 'file:';
    }

    // Initialize component loading
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadAllComponents());
        } else {
            this.loadAllComponents();
        }
    }

    // Load all registered components
    async loadAllComponents() {
        try {
            // If using file protocol, use direct component creation instead of fetch
            if (this.isFileProtocol) {
                this.createFallbackComponents();
                return;
            }
            
            await Promise.all([
                this.loadComponent('header'),
                this.loadComponent('footer')
            ]);

            // Initialize component-specific functionality
            this.initializeComponents();
            this.setupThemeToggle();

        } catch (error) {
            console.error('Error loading components:', error);
            // Use fallback components
            this.createFallbackComponents();
        }
    }

    // Load individual component
    async loadComponent(componentName) {
        const component = this.components[componentName];
        if (!component) return;
        
        // Skip fetch for file protocol
        if (this.isFileProtocol) {
            this.createFallbackComponent(componentName);
            return;
        }

        try {
            const response = await fetch(`${this.componentsPath}${component.path}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const content = await response.text();
            const targetElement = document.getElementById(component.id);
            if (targetElement) {
                targetElement.innerHTML = content;
            }
        } catch (error) {
            // Silently handle error and use fallback
            this.createFallbackComponent(componentName);
        }
    }

    // Create all fallback components
    createFallbackComponents() {
        this.createFallbackComponent('header');
        this.createFallbackComponent('footer');
        this.initializeComponents();
        this.setupThemeToggle();
    }
    
    // Create a single fallback component
    createFallbackComponent(componentName) {
        const component = this.components[componentName];
        if (!component) return;
        
        const targetElement = document.getElementById(component.id);
        if (!targetElement) return;
        
        if (componentName === 'header') {
            const isInSubdir = window.location.pathname.includes('/tools/');
            const basePath = isInSubdir ? '../' : './';
            targetElement.innerHTML = `
                <nav class="navbar navbar-expand-lg navbar-dark">
                    <div class="container">
                        <a class="navbar-brand" href="${basePath}index.html">
                            <i class="fas fa-tools me-2"></i>DarkTools
                        </a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav ms-auto">
                                <li class="nav-item">
                                    <a class="nav-link" href="${basePath}index.html">Home</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="${basePath}tools.html">Tools</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="${basePath}about.html">About</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            `;
        } else if (componentName === 'footer') {
            targetElement.innerHTML = `
                <div class="container py-4">
                    <div class="row">
                        <div class="col-md-6">
                            <p>&copy; 2023 DarkTools. All rights reserved.</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <a href="#" class="text-decoration-none me-3">Privacy Policy</a>
                            <a href="#" class="text-decoration-none">Terms of Service</a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Initialize components after loading
    initializeComponents() {
        // Add active class to current nav item
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });

        // Initialize dropdowns
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            try {
                new bootstrap.Dropdown(dropdown);
            } catch (e) {
                // Silently ignore dropdown errors
            }
        });

        // Initialize mobile menu
        const mobileMenuBtn = document.querySelector('.navbar-toggler');
        const navMenu = document.querySelector('.navbar-collapse');
        
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuBtn.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('show');
                }
            });
        }
    }

    // Setup theme toggle
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                // Animate theme toggle button
                themeToggle.classList.add('rotate-animation');
                setTimeout(() => themeToggle.classList.remove('rotate-animation'), 500);
            });
        }

        // Set initial theme
        const savedTheme = localStorage.getItem('theme') || 
                          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// Create and initialize ComponentLoader
const componentLoader = new ComponentLoader();
componentLoader.init(); 