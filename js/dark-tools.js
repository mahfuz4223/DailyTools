// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        // Defer binding events until we are sure the toggle exists, 
        // e.g., after components are loaded if toggle is in a component.
        // initTheme can run early to set the theme from localStorage.
        this.initTheme();

        // Attempt to bind events on DOMContentLoaded, but also provide a way to re-bind if needed.
        document.addEventListener('DOMContentLoaded', () => this.ensureThemeToggleConnected());
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        let currentTheme = savedTheme;

        if (!currentTheme) {
            currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        this.applyTheme(currentTheme, false); // Apply theme without saving, as it's just initialization
    }

    ensureThemeToggleConnected() {
        if (!this.themeToggle) {
            this.themeToggle = document.getElementById('themeToggle');
        }
        if (this.themeToggle && !this.themeToggle.hasAttribute('data-theme-listener-attached')) {
            // Check if it's a checkbox (as in header.html)
            if (this.themeToggle.type === 'checkbox') {
                 this.themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'light';
                 this.themeToggle.addEventListener('change', () => this.toggleThemeOnCheckbox());
            } else {
                // Fallback for other types of toggles if necessary, or assume click for non-checkboxes
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
            }
            this.themeToggle.setAttribute('data-theme-listener-attached', 'true');
        }
        // Listen for system theme changes if no preference is saved
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.systemThemeChangeHandler);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.systemThemeChangeHandler.bind(this));
    }

    systemThemeChangeHandler(e) {
        if (!localStorage.getItem('theme')) { // Only apply if user hasn't set a specific theme
            const newTheme = e.matches ? 'dark' : 'light';
            this.applyTheme(newTheme, false);
        }
    }
    
    applyTheme(theme, savePreference = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (savePreference) {
            localStorage.setItem('theme', theme);
        }

        // Optional: update body class if used for styling
        // document.body.className = document.body.className.replace(/theme-(dark|light)/g, '');
        // document.body.classList.add(`theme-${theme}`);

        if (this.themeToggle && this.themeToggle.type === 'checkbox') {
            this.themeToggle.checked = theme === 'light';
        }
        // Dispatch an event so other components can react to theme change
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme } }));
    }

    toggleThemeOnCheckbox() {
        const newTheme = this.themeToggle.checked ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.animateToggle();
    }

    // Generic toggle, might be used if toggle isn't a checkbox
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.animateToggle();
    }

    animateToggle() {
        if (this.themeToggle) {
            this.themeToggle.classList.add('rotate-animation');
            setTimeout(() => {
                if (this.themeToggle) this.themeToggle.classList.remove('rotate-animation');
            }, 500);
        }
    }
}

// Initialize theme manager.
// The ThemeManager constructor calls initTheme().
// ensureThemeToggleConnected() will be called on DOMContentLoaded and can also be called 
// manually after dynamic component loading if the toggle isn't available on DOMContentLoaded.
if (!window.themeManager) {
    window.themeManager = new ThemeManager();
}

// Note: The standalone initializeTheme function and its DOMContentLoaded listener 
// have been removed to avoid redundancy with the ThemeManager class.
// The ThemeManager now handles its own initialization and event binding. 