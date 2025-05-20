// Password Generator Class
class PasswordGenerator {
    constructor() {
        // Initialize state
        this.state = {
            isGenerating: false,
            currentPassword: '',
            passwordType: 'standard',
            history: []
        };

        // Initialize elements
        this.initializeElements();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load password history
        this.loadPasswordHistory();
        
        // Update UI
        this.updateUI();
        
        // Initialize tooltips
        this.initializeTooltips();
    }

    // Initialize DOM elements
    initializeElements() {
        try {
            // Main elements
            this.elements = {
                passwordDisplay: document.getElementById('passwordDisplay'),
                generateBtn: document.getElementById('generateBtn'),
                copyBtn: document.getElementById('copyBtn'),
                lengthSlider: document.getElementById('lengthSlider'),
                lengthValue: document.getElementById('lengthValue'),
                
                // Character set checkboxes
                upperCase: document.getElementById('upperCase'),
                lowerCase: document.getElementById('lowerCase'),
                numbers: document.getElementById('numbers'),
                symbols: document.getElementById('symbols'),
                
                // Advanced options
                excludeSimilar: document.getElementById('excludeSimilar'),
                excludeSequential: document.getElementById('excludeSequential'),
                pronounceable: document.getElementById('pronounceable'),
                
                // Password type radios
                typeStandard: document.getElementById('typeStandard'),
                typePin: document.getElementById('typePin'),
                typePassphrase: document.getElementById('typePassphrase'),
                typePattern: document.getElementById('typePattern'),
                
                // Pattern input
                patternInputContainer: document.getElementById('patternInputContainer'),
                patternInput: document.getElementById('patternInput'),
                
                // Character sets container
                characterSetsContainer: document.getElementById('characterSets'),
                advancedOptionsContainer: document.getElementById('advancedOptions'),
                
                // Strength elements
                strengthProgress: document.getElementById('strengthProgress'),
                strengthLabel: document.getElementById('strengthLabel'),
                entropyValue: document.getElementById('entropyValue'),
                strengthDetails: document.getElementById('strengthDetails'),
                
                // History elements
                historyList: document.getElementById('historyList'),
                clearHistory: document.getElementById('clearHistory'),
                exportHistory: document.getElementById('exportHistory'),
                
                // Loading spinner
                spinner: document.querySelector('.spinner-border'),
                memoryAid: document.getElementById('memoryAid'),
                
                // Theme toggle
                themeToggle: document.getElementById('themeToggle')
            };

            // Validate required elements
            const requiredElements = ['passwordDisplay', 'generateBtn', 'copyBtn', 'lengthSlider', 'themeToggle'];
            for (const elementName of requiredElements) {
                if (!this.elements[elementName]) {
                    throw new Error(`Required element "${elementName}" not found`);
                }
            }
        } catch (error) {
            console.error('Error initializing elements:', error);
            this.showToast('Error initializing application. Please refresh the page.', 'error');
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        try {
            // Main actions
            this.elements.generateBtn.addEventListener('click', () => this.generatePassword());
            this.elements.copyBtn.addEventListener('click', () => this.copyPassword());
            this.elements.lengthSlider.addEventListener('input', () => this.updateLengthValue());
            
            // History actions
            if (this.elements.clearHistory) {
                this.elements.clearHistory.addEventListener('click', () => this.clearPasswordHistory());
            }
            if (this.elements.exportHistory) {
                this.elements.exportHistory.addEventListener('click', () => this.exportPasswordHistory());
            }

            // Password type change handlers
            document.querySelectorAll('input[name="passwordType"]').forEach(radio => {
                radio.addEventListener('change', () => this.handlePasswordTypeChange());
            });

            // Character set change handlers
            [
                this.elements.upperCase,
                this.elements.lowerCase,
                this.elements.numbers,
                this.elements.symbols
            ].forEach(checkbox => {
                if (checkbox) {
                    checkbox.addEventListener('change', () => this.validateCharacterSets());
                }
            });

            // History item event delegation
            if (this.elements.historyList) {
                this.elements.historyList.addEventListener('click', (e) => {
                    const historyItem = e.target.closest('.history-item');
                    if (!historyItem) return;

                    const password = historyItem.querySelector('.history-password')?.textContent;
                    if (!password) return;

                    if (e.target.closest('.fa-copy')) {
                        this.copyToClipboard(password);
                    } else if (e.target.closest('.fa-sync-alt')) {
                        this.displayPassword(password);
                        this.analyzePassword(password);
                    } else if (e.target.closest('.fa-times')) {
                        this.removeFromHistory(password);
                    }
                });
            }

            // Theme toggle
            if (this.elements.themeToggle) {
                this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
                // Initialize theme from localStorage
                this.initializeTheme();
            }
        } catch (error) {
            console.error('Error initializing event listeners:', error);
            this.showToast('Error setting up event handlers. Some features may not work.', 'error');
        }
    }

    // Initialize Bootstrap tooltips
    initializeTooltips() {
        try {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        } catch (error) {
            console.error('Error initializing tooltips:', error);
        }
    }

    // Generate password based on selected options
    async generatePassword() {
        try {
            if (this.state.isGenerating) return;
            this.state.isGenerating = true;

            // Show loading state
            this.elements.generateBtn.classList.add('loading');
            this.elements.spinner?.classList.remove('d-none');

            let password = '';
            const type = this.getSelectedPasswordType();

            switch (type) {
                case 'standard':
                    password = this.generateStandardPassword();
                    break;
                case 'pin':
                    password = this.generatePIN();
                    break;
                case 'passphrase':
                    password = await this.generatePassphrase();
                    break;
                case 'pattern':
                    password = this.generatePatternPassword();
                    break;
                default:
                    throw new Error(`Invalid password type: ${type}`);
            }

            if (!password) {
                throw new Error('Failed to generate password');
            }

            // Update state and UI
            this.state.currentPassword = password;
            this.displayPassword(password);
            await this.analyzePassword(password);
            this.addToHistory(password);

        } catch (error) {
            console.error('Error generating password:', error);
            this.showToast('Failed to generate password. Please try again.', 'error');
        } finally {
            // Reset loading state
            this.state.isGenerating = false;
            this.elements.generateBtn.classList.remove('loading');
            this.elements.spinner?.classList.add('d-none');
        }
    }

    // Generate standard password with improved entropy
    generateStandardPassword() {
        try {
            let chars = '';
            if (this.elements.upperCase?.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (this.elements.lowerCase?.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
            if (this.elements.numbers?.checked) chars += '0123456789';
            if (this.elements.symbols?.checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            if (!chars) {
                throw new Error('No character sets selected');
            }

            if (this.elements.excludeSimilar?.checked) {
                chars = chars.replace(/[ilLI|`1oO0]/g, '');
            }

            const length = parseInt(this.elements.lengthSlider?.value || '16');
            if (isNaN(length) || length < 4) {
                throw new Error('Invalid password length');
            }

            // Generate password using crypto API
            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            let password = '';
            
            for (let i = 0; i < length; i++) {
                password += chars[array[i] % chars.length];
            }

            // Validate password meets requirements
            if (this.elements.excludeSequential?.checked) {
                const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
                if (hasSequential) {
                    return this.generateStandardPassword();
                }
            }

            return password;

        } catch (error) {
            console.error('Error generating standard password:', error);
            throw error;
        }
    }

    // Generate PIN with improved randomness
    generatePIN() {
        try {
            const length = parseInt(this.elements.lengthSlider?.value || '6');
            if (isNaN(length) || length < 4) {
                throw new Error('Invalid PIN length');
            }

            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            return Array.from(array)
                .map(n => n % 10)
                .join('');

        } catch (error) {
            console.error('Error generating PIN:', error);
            throw error;
        }
    }

    // Generate passphrase using word list
    async generatePassphrase() {
        try {
            // TODO: Replace with actual word list API call or local word list
            const words = [
                'correct', 'horse', 'battery', 'staple',
                'apple', 'banana', 'orange', 'grape',
                'red', 'blue', 'green', 'yellow',
                'happy', 'quick', 'lazy', 'brave'
            ];
            
            const wordCount = Math.max(3, Math.floor(parseInt(this.elements.lengthSlider?.value || '4')));
            const array = new Uint32Array(wordCount);
            crypto.getRandomValues(array);
            
            return Array.from(array)
                .map(n => words[n % words.length])
                .join('-');

        } catch (error) {
            console.error('Error generating passphrase:', error);
            throw error;
        }
    }

    // Generate pattern password
    generatePatternPassword() {
        try {
            const pattern = this.elements.patternInput?.value;
            if (!pattern) {
                throw new Error('No pattern specified');
            }

            const charSets = {
                'X': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                'x': 'abcdefghijklmnopqrstuvwxyz',
                '#': '0123456789',
                '@': '!@#$%^&*()_+-=[]{}|;:,.<>?'
            };

            const array = new Uint32Array(pattern.length);
            crypto.getRandomValues(array);
            
            return pattern
                .split('')
                .map((char, index) => {
                    const set = charSets[char];
                    return set ? set[array[index] % set.length] : char;
                })
                .join('');

        } catch (error) {
            console.error('Error generating pattern password:', error);
            throw error;
        }
    }

    // Display generated password
    displayPassword(password) {
        try {
            if (!this.elements.passwordDisplay) return;
            
            // Clear existing content
            this.elements.passwordDisplay.textContent = '';
            
            // Create and append characters with animation
            const fragment = document.createDocumentFragment();
            
            password.split('').forEach((char, index) => {
                const span = document.createElement('span');
                span.className = 'password-char entering';
                span.textContent = char;
                span.setAttribute('data-index', index);
                
                // Add aria-label for screen readers
                span.setAttribute('aria-hidden', 'true');
                
                fragment.appendChild(span);
                
                // Stagger the animation
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        span.classList.remove('entering');
                    }, index * 20); // Reduced delay for smoother animation
                });
            });
            
            // Add the fragment to DOM
            this.elements.passwordDisplay.appendChild(fragment);
            
            // Set the full password as aria-label for accessibility
            this.elements.passwordDisplay.setAttribute('aria-label', `Generated password: ${password}`);
            
            // Add copy to clipboard functionality
            this.elements.passwordDisplay.addEventListener('click', () => {
                this.copyToClipboard(password);
            });

        } catch (error) {
            console.error('Error displaying password:', error);
            // Fallback to basic display
            if (this.elements.passwordDisplay) {
                this.elements.passwordDisplay.textContent = password;
            }
        }
    }

    // Analyze password strength and security
    async analyzePassword(password) {
        try {
            // Get zxcvbn result
            const result = zxcvbn(password);
            const strength = result.score;
            const entropy = result.guesses_log10.toFixed(1);

            // Update strength meter
            if (this.elements.strengthProgress) {
                this.elements.strengthProgress.style.width = `${(strength / 4) * 100}%`;
                this.elements.strengthProgress.className = `progress-bar ${this.getStrengthClass(strength)}`;
                this.elements.strengthProgress.setAttribute('aria-valuenow', strength * 25);
            }

            // Update labels
            if (this.elements.strengthLabel) {
                this.elements.strengthLabel.textContent = this.getStrengthLabel(strength);
            }
            if (this.elements.entropyValue) {
                this.elements.entropyValue.textContent = `Entropy: ${entropy} bits`;
            }

            // Update strength details
            if (this.elements.strengthDetails) {
                const suggestions = result.feedback.suggestions
                    .map(s => `<li>${s}</li>`)
                    .join('');
                
                this.elements.strengthDetails.innerHTML = `
                    <ul>
                        <li>Crack time: ${result.crack_times_display.offline_fast_hashing_1e10_per_second}</li>
                        <li>${result.feedback.warning || 'No major weaknesses found.'}</li>
                        ${suggestions}
                    </ul>
                `;
            }

            // Update cracking times
            this.updateCrackingTimes(result.guesses);

            // Generate memory aid
            this.generateMemoryAid(password);

            // Perform security checks
            await this.performSecurityChecks(password);

            // Show success message
            this.showToast('Password generated and analyzed!', 'success');

        } catch (error) {
            console.error('Error analyzing password:', error);
            this.showToast('Error analyzing password strength', 'error');
        }
    }

    // Calculate and update cracking times
    updateCrackingTimes(guesses) {
        try {
            const times = {
                standard: guesses / 1000000, // 1M hashes/second
                gpu: guesses / 1000000000, // 1B hashes/second
                cloud: guesses / 1000000000000 // 1T hashes/second
            };

            // Update UI elements
            Object.entries({
                standardTime: times.standard,
                gpuTime: times.gpu,
                cloudTime: times.cloud
            }).forEach(([elementId, time]) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = this.formatTime(time);
                }
            });

        } catch (error) {
            console.error('Error updating cracking times:', error);
        }
    }

    // Format time in human-readable format
    formatTime(seconds) {
        if (seconds < 1) return 'Instant';
        if (seconds > 1e11) return 'Centuries';

        const units = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];

        for (const unit of units) {
            if (seconds >= unit.seconds) {
                const value = Math.floor(seconds / unit.seconds);
                return `${value} ${unit.label}${value !== 1 ? 's' : ''}`;
            }
        }

        return 'Less than a second';
    }

    // Perform security checks
    async performSecurityChecks(password) {
        try {
            const checks = {
                dictionaryCheck: this.checkDictionary(password),
                breachCheck: this.checkBreachDatabase(password),
                distributionCheck: this.checkCharacterDistribution(password)
            };

            // Update UI for each check
            for (const [checkName, checkPromise] of Object.entries(checks)) {
                const element = document.getElementById(checkName);
                if (!element) continue;

                try {
                    this.updateCheckStatus(element, 'checking');
                    const result = await checkPromise;
                    this.updateCheckStatus(element, result ? 'warning' : 'success');
                } catch (error) {
                    console.error(`Error in ${checkName}:`, error);
                    this.updateCheckStatus(element, 'danger');
                }
            }

        } catch (error) {
            console.error('Error performing security checks:', error);
        }
    }

    // Update security check status
    updateCheckStatus(element, status) {
        // Remove existing status classes
        element.classList.remove('checking', 'success', 'warning', 'danger');
        
        // Update icon and status
        const icon = element.querySelector('i:last-child');
        switch (status) {
            case 'checking':
                element.classList.add('checking');
                icon.className = 'fas fa-circle-notch fa-spin';
                break;
            case 'success':
                element.classList.add('success');
                icon.className = 'fas fa-check-circle';
                break;
            case 'warning':
                element.classList.add('warning');
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'danger':
                element.classList.add('danger');
                icon.className = 'fas fa-times-circle';
                break;
        }
    }

    // Check if password is a dictionary word
    async checkDictionary(password) {
        // Simple dictionary check (replace with actual dictionary API or local word list)
        const commonWords = ['password', 'admin', '123456', 'qwerty', 'letmein'];
        return commonWords.includes(password.toLowerCase()) || 
               commonWords.some(word => password.toLowerCase().includes(word));
    }

    // Check if password appears in breach database
    async checkBreachDatabase(password) {
        try {
            // Use k-Anonymity model with HIBP API
            const sha1 = await this.sha1(password);
            const prefix = sha1.substring(0, 5);
            const suffix = sha1.substring(5).toUpperCase();

            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            if (!response.ok) return false;

            const text = await response.text();
            return text.split('\n').some(line => line.split(':')[0] === suffix);
        } catch (error) {
            console.error('Error checking breach database:', error);
            return false;
        }
    }

    // Calculate SHA-1 hash
    async sha1(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Check character distribution
    checkCharacterDistribution(password) {
        if (password.length < 8) return false;

        const counts = {
            uppercase: 0,
            lowercase: 0,
            numbers: 0,
            symbols: 0
        };

        for (const char of password) {
            if (/[A-Z]/.test(char)) counts.uppercase++;
            else if (/[a-z]/.test(char)) counts.lowercase++;
            else if (/[0-9]/.test(char)) counts.numbers++;
            else counts.symbols++;
        }

        // Check if characters are well-distributed
        const percentages = Object.values(counts).map(count => count / password.length);
        const maxPercentage = Math.max(...percentages);
        
        // No single character type should make up more than 70% of the password
        return maxPercentage <= 0.7;
    }

    // Get strength class for progress bar
    getStrengthClass(score) {
        const classes = [
            'bg-danger',    // Very Weak
            'bg-warning',   // Weak
            'bg-info',      // Medium
            'bg-primary',   // Strong
            'bg-success'    // Very Strong
        ];
        return classes[score] || classes[0];
    }

    // Get strength label
    getStrengthLabel(score) {
        const labels = [
            'Very Weak',
            'Weak',
            'Medium',
            'Strong',
            'Very Strong'
        ];
        return labels[score] || labels[0];
    }

    // Copy password to clipboard
    async copyPassword() {
        const password = this.elements.passwordDisplay.textContent;
        if (!password) return;

        try {
            await navigator.clipboard.writeText(password);
            this.showToast('Password copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy password', 'error');
        }
    }

    // Show toast notification with improved error handling
    showToast(message, type = 'info') {
        try {
            const colors = {
                success: '#28a745',
                error: '#dc3545',
                info: '#17a2b8',
                warning: '#ffc107'
            };

            Toastify({
                text: message,
                duration: 3000,
                gravity: 'bottom',
                position: 'right',
                style: {
                    background: colors[type] || colors.info,
                    borderRadius: '8px'
                }
            }).showToast();
        } catch (error) {
            console.error('Error showing toast:', error);
            // Fallback to alert for critical messages
            if (type === 'error') {
                alert(message);
            }
        }
    }

    // Password history management
    addToHistory(password) {
        try {
            const history = this.getPasswordHistory();
            const newEntry = {
                password,
                timestamp: new Date().toISOString()
            };

            // Add to beginning of array
            history.unshift(newEntry);

            // Keep only last 10 passwords
            if (history.length > 10) {
                history.pop();
            }

            // Save to localStorage
            localStorage.setItem('passwordHistory', JSON.stringify(history));

            // Update UI
            this.updateHistoryUI();

        } catch (error) {
            console.error('Error adding password to history:', error);
            this.showToast('Failed to save password to history', 'error');
        }
    }

    getPasswordHistory() {
        try {
            const history = localStorage.getItem('passwordHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error getting password history:', error);
            return [];
        }
    }

    loadPasswordHistory() {
        this.updateHistoryUI();
    }

    clearPasswordHistory() {
        try {
            if (!confirm('Are you sure you want to clear the password history?')) {
                return;
            }

            localStorage.removeItem('passwordHistory');
            this.updateHistoryUI();
            this.showToast('Password history cleared', 'success');

        } catch (error) {
            console.error('Error clearing password history:', error);
            this.showToast('Failed to clear password history', 'error');
        }
    }

    updateHistoryUI() {
        try {
            if (!this.elements.historyList) return;
            
            const history = this.getPasswordHistory();
            
            if (history.length === 0) {
                this.elements.historyList.innerHTML = `
                    <div class="history-empty">
                        <i class="fas fa-clock" aria-hidden="true"></i>
                        <p>No passwords in history</p>
                        <small>Generated passwords will appear here</small>
                    </div>
                `;
                return;
            }

            this.elements.historyList.innerHTML = history
                .map(item => this.createHistoryItemHTML(item))
                .join('');

        } catch (error) {
            console.error('Error updating history UI:', error);
            this.showToast('Failed to update password history', 'error');
        }
    }

    // Create HTML for history item
    createHistoryItemHTML(item) {
        const timestamp = new Date(item.timestamp).toLocaleString();
        return `
            <div class="history-item history-item-new">
                <div class="history-password">${this.escapeHtml(item.password)}</div>
                <div class="history-actions">
                    <button class="history-btn" title="Copy password">
                        <i class="fas fa-copy" aria-hidden="true"></i>
                    </button>
                    <button class="history-btn" title="Use this password">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i>
                    </button>
                    <button class="history-btn" title="Remove from history">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="history-timestamp">${timestamp}</div>
            </div>
        `;
    }

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Copy to clipboard with error handling
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Password copied to clipboard!', 'success');
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            this.showToast('Failed to copy password', 'error');
            
            // Fallback for browsers that don't support clipboard API
            this.fallbackCopy(text);
        }
    }

    // Fallback copy method
    fallbackCopy(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Password copied to clipboard!', 'success');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showToast('Failed to copy password', 'error');
        }
    }

    // Remove password from history
    removeFromHistory(password) {
        try {
            const history = this.getPasswordHistory()
                .filter(item => item.password !== password);
            
            localStorage.setItem('passwordHistory', JSON.stringify(history));
            this.updateHistoryUI();
            this.showToast('Password removed from history', 'success');

        } catch (error) {
            console.error('Error removing password from history:', error);
            this.showToast('Failed to remove password from history', 'error');
        }
    }

    // UI updates
    updateLengthValue() {
        if (this.elements.lengthValue && this.elements.lengthSlider) {
            this.elements.lengthValue.textContent = `${this.elements.lengthSlider.value} characters`;
        }
    }

    // Handle password type change
    handlePasswordTypeChange() {
        try {
            const type = this.getSelectedPasswordType();
            
            // Update UI visibility
            this.updateTypeVisibility(type);
            
            // Update length slider based on type
            this.updateLengthSlider(type);
            
            // Update length value display
            this.updateLengthValue();

        } catch (error) {
            console.error('Error handling password type change:', error);
            this.showToast('Error updating password type', 'error');
        }
    }

    // Update UI visibility based on password type
    updateTypeVisibility(type) {
        // Pattern input visibility
        if (this.elements.patternInputContainer) {
            this.elements.patternInputContainer.classList.toggle('d-none', type !== 'pattern');
        }

        // Character sets and advanced options visibility
        const hideForTypes = ['pin', 'passphrase', 'pattern'];
        if (this.elements.characterSetsContainer) {
            this.elements.characterSetsContainer.classList.toggle('d-none', hideForTypes.includes(type));
        }
        if (this.elements.advancedOptionsContainer) {
            this.elements.advancedOptionsContainer.classList.toggle('d-none', hideForTypes.includes(type));
        }
    }

    // Update length slider based on password type
    updateLengthSlider(type) {
        if (!this.elements.lengthSlider) return;

        const config = {
            pin: { min: 4, max: 12, value: 6 },
            passphrase: { min: 3, max: 8, value: 4 },
            pattern: { min: 8, max: 32, value: 16 },
            standard: { min: 8, max: 64, value: 16 }
        };

        const settings = config[type] || config.standard;
        
        this.elements.lengthSlider.min = settings.min;
        this.elements.lengthSlider.max = settings.max;
        this.elements.lengthSlider.value = settings.value;
    }

    // Validate character sets
    validateCharacterSets() {
        try {
            const checkboxes = [
                this.elements.upperCase,
                this.elements.lowerCase,
                this.elements.numbers,
                this.elements.symbols
            ];

            const anyChecked = checkboxes.some(checkbox => checkbox?.checked);

            if (!anyChecked && this.elements.upperCase) {
                this.elements.upperCase.checked = true;
                this.showToast('At least one character set must be selected', 'warning');
            }

        } catch (error) {
            console.error('Error validating character sets:', error);
        }
    }

    // Get selected password type
    getSelectedPasswordType() {
        const radio = document.querySelector('input[name="passwordType"]:checked');
        return radio ? radio.id.replace('type', '').toLowerCase() : 'standard';
    }

    updateUI() {
        this.updateLengthValue();
        this.validateCharacterSets();
    }

    // Export password history
    exportPasswordHistory() {
        try {
            const history = this.getPasswordHistory();
            
            if (history.length === 0) {
                this.showToast('No passwords to export', 'warning');
                return;
            }

            const exportData = history.map(item => ({
                password: item.password,
                generated: new Date(item.timestamp).toLocaleString()
            }));

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `password-history-${new Date().toISOString().split('T')[0]}.json`;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Password history exported successfully', 'success');

        } catch (error) {
            console.error('Error exporting password history:', error);
            this.showToast('Failed to export password history', 'error');
        }
    }

    // Generate memory aid tips
    generateMemoryAid(password) {
        try {
            if (!password || !this.elements.memoryAid) return;

            const type = this.getSelectedPasswordType();
            let aid = '';

            switch (type) {
                case 'standard':
                    // Split password into chunks of 3-4 characters
                    const chunks = password.match(/.{1,4}/g) || [];
                    const tips = chunks.map(chunk => {
                        const parts = [];
                        
                        // Find patterns in each chunk
                        const uppercase = chunk.match(/[A-Z]/g);
                        const lowercase = chunk.match(/[a-z]/g);
                        const numbers = chunk.match(/[0-9]/g);
                        const symbols = chunk.match(/[^A-Za-z0-9]/g);
                        
                        if (uppercase) parts.push(`Uppercase: ${uppercase.join('')}`);
                        if (lowercase) parts.push(`Lowercase: ${lowercase.join('')}`);
                        if (numbers) parts.push(`Numbers: ${numbers.join('')}`);
                        if (symbols) parts.push(`Symbols: ${symbols.join('')}`);
                        
                        return parts.join(' | ');
                    });
                    
                    aid = `
                        <div class="memory-tips">
                            <p class="mb-2">Break it down:</p>
                            ${tips.map((tip, i) => `
                                <div class="memory-chunk">
                                    <span class="chunk-text">${password.slice(i * 4, (i + 1) * 4)}</span>
                                    <small class="chunk-tip">${tip}</small>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    break;

                case 'pin':
                    // Create a pattern or story for PIN
                    const digits = password.split('');
                    aid = `
                        <div class="memory-tips">
                            <p class="mb-2">Number patterns:</p>
                            <div class="pin-pattern">
                                ${digits.map(d => `<span class="pin-digit">${d}</span>`).join(' → ')}
                            </div>
                        </div>
                    `;
                    break;

                case 'passphrase':
                    // Create a story or visualization for the passphrase
                    const words = password.split('-');
                    aid = `
                        <div class="memory-tips">
                            <p class="mb-2">Create a story:</p>
                            <div class="passphrase-story">
                                ${words.map(word => `<span class="story-word">${word}</span>`).join(' ')}
                            </div>
                        </div>
                    `;
                    break;

                case 'pattern':
                    // Explain the pattern structure
                    aid = `
                        <div class="memory-tips">
                            <p class="mb-2">Pattern breakdown:</p>
                            <div class="pattern-explanation">
                                ${password.split('').map(char => {
                                    let type = '';
                                    if (/[A-Z]/.test(char)) type = 'uppercase';
                                    else if (/[a-z]/.test(char)) type = 'lowercase';
                                    else if (/[0-9]/.test(char)) type = 'number';
                                    else type = 'symbol';
                                    return `<span class="pattern-char ${type}">${char}</span>`;
                                }).join('')}
                            </div>
                        </div>
                    `;
                    break;
            }

            this.elements.memoryAid.innerHTML = aid || '<p class="text-muted small">Generate a password to see memory tips</p>';

        } catch (error) {
            console.error('Error generating memory aid:', error);
            this.elements.memoryAid.innerHTML = '<p class="text-muted small">Generate a password to see memory tips</p>';
        }
    }

    // Initialize theme from localStorage
    initializeTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
                this.updateThemeIcon(savedTheme);
            } else {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = prefersDark ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
                this.updateThemeIcon(theme);
            }
        } catch (error) {
            console.error('Error initializing theme:', error);
        }
    }

    // Toggle theme between light and dark
    toggleTheme() {
        try {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            this.updateThemeIcon(newTheme);
            
            // Add transition class for smooth color changes
            document.documentElement.classList.add('theme-transition');
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 300);

        } catch (error) {
            console.error('Error toggling theme:', error);
            this.showToast('Failed to toggle theme', 'error');
        }
    }

    // Update theme toggle icon
    updateThemeIcon(theme) {
        if (!this.elements.themeToggle) return;
        
        const sunIcon = this.elements.themeToggle.querySelector('.sun-icon');
        const moonIcon = this.elements.themeToggle.querySelector('.moon-icon');
        
        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }
}

// Initialize the password generator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create password generator instance
        window.passwordGenerator = new PasswordGenerator();
        
        // Initialize tooltips
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        
    } catch (error) {
        console.error('Error initializing password generator:', error);
        alert('Failed to initialize password generator. Please refresh the page.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const passwordDisplay = document.getElementById('passwordDisplay');
    const togglePassword = document.getElementById('togglePassword');
    const copyBtn = document.getElementById('copyBtn');
    const generateBtn = document.getElementById('generateBtn');
    const previewOverlay = document.querySelector('.preview-overlay');

    function wrapCharsInSpan(text) {
        return text.split('').map(char => `<span class="password-char">${char}</span>`).join('');
    }

    // Initialize with wrapped characters
    if (passwordDisplay.textContent) {
        passwordDisplay.innerHTML = wrapCharsInSpan(passwordDisplay.textContent);
    }

    // Toggle password visibility with character animation
    togglePassword.addEventListener('click', () => {
        const isVisible = !passwordDisplay.classList.contains('password-masked');
        const chars = passwordDisplay.querySelectorAll('.password-char');
        
        togglePassword.classList.toggle('active');
        passwordDisplay.classList.toggle('password-masked', isVisible);
        
        if (isVisible) {
            togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
            togglePassword.setAttribute('title', 'Show password');
            chars.forEach((char, index) => {
                setTimeout(() => {
                    char.style.animation = 'hideChar 0.3s forwards';
                }, index * 30);
            });
        } else {
            togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
            togglePassword.setAttribute('title', 'Hide password');
            chars.forEach((char, index) => {
                setTimeout(() => {
                    char.style.animation = 'revealChar 0.3s forwards';
                }, index * 30);
            });
        }
    });

    // Update password display when new password is generated
    function updatePasswordDisplay(password) {
        const wrappedPassword = wrapCharsInSpan(password);
        passwordDisplay.innerHTML = wrappedPassword;
        
        // Animate each character appearing
        const chars = passwordDisplay.querySelectorAll('.password-char');
        chars.forEach((char, index) => {
            char.style.opacity = '0';
            char.style.transform = 'translateY(10px)';
            setTimeout(() => {
                char.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                char.style.opacity = '1';
                char.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    // Generate button loading state
    generateBtn.addEventListener('click', async () => {
        generateBtn.classList.add('loading');
        previewOverlay.classList.add('active');
        
        // Simulate password generation delay (remove this in production)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Example password - replace with your actual password generation
        const newPassword = 'TestPassword123!';
        updatePasswordDisplay(newPassword);
        
        generateBtn.classList.remove('loading');
        previewOverlay.classList.remove('active');
        passwordDisplay.classList.add('generate-success');
        setTimeout(() => passwordDisplay.classList.remove('generate-success'), 300);
    });

    // Copy button animation
    copyBtn.addEventListener('click', async () => {
        try {
            const password = Array.from(passwordDisplay.querySelectorAll('.password-char'))
                .map(span => span.textContent)
                .join('');
            await navigator.clipboard.writeText(password);
            copyBtn.classList.add('copy-success');
            setTimeout(() => copyBtn.classList.remove('copy-success'), 1500);
        } catch (err) {
            copyBtn.classList.add('shake');
            setTimeout(() => copyBtn.classList.remove('shake'), 300);
        }
    });

    // Update strength indicator
    function updateStrengthIndicator(strength) {
        const indicator = document.querySelector('.password-strength-indicator');
        indicator.className = 'password-strength-indicator';
        
        switch(strength) {
            case 'weak':
                indicator.classList.add('strength-weak');
                break;
            case 'medium':
                indicator.classList.add('strength-medium');
                break;
            case 'strong':
                indicator.classList.add('strength-strong');
                break;
            case 'very-strong':
                indicator.classList.add('strength-very-strong');
                break;
        }
    }

    // Example strength update (integrate with your password generation logic)
    document.addEventListener('passwordGenerated', (e) => {
        updateStrengthIndicator(e.detail.strength);
    });
});

// Password History Management
document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const exportHistoryBtn = document.getElementById('exportHistory');

    // Function to add password to history
    function addToHistory(password) {
        const timestamp = new Date().toLocaleString();
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item history-item-new';
        historyItem.innerHTML = `
            <div class="history-password">${password}</div>
            <div class="history-actions">
                <button class="history-btn" title="Copy password">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="history-btn" title="Use this password">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="history-btn" title="Remove from history">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="history-timestamp">${timestamp}</div>
        `;

        // Remove empty state if present
        const emptyState = historyList.querySelector('.history-empty');
        if (emptyState) {
            emptyState.remove();
        }

        // Add new item at the top
        historyList.insertBefore(historyItem, historyList.firstChild);

        // Setup event listeners for the new item
        setupHistoryItemListeners(historyItem, password);
    }

    // Setup event listeners for history item
    function setupHistoryItemListeners(item, password) {
        const copyBtn = item.querySelector('.fa-copy').parentElement;
        const useBtn = item.querySelector('.fa-sync-alt').parentElement;
        const removeBtn = item.querySelector('.fa-times').parentElement;

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(password);
                showToast('Password copied to clipboard');
            } catch (err) {
                showToast('Failed to copy password', 'error');
            }
        });

        useBtn.addEventListener('click', () => {
            document.getElementById('passwordDisplay').textContent = password;
            showToast('Password restored');
        });

        removeBtn.addEventListener('click', () => {
            item.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                item.remove();
                if (historyList.children.length === 0) {
                    showEmptyState();
                }
            }, 300);
        });
    }

    // Show empty state
    function showEmptyState() {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-clock"></i>
                <p>No passwords in history</p>
                <small>Generated passwords will appear here</small>
            </div>
        `;
    }

    // Show toast message
    function showToast(message, type = 'success') {
        // Implement your toast notification here
        console.log(message);
    }

    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the password history?')) {
            historyList.innerHTML = '';
            showEmptyState();
            showToast('History cleared');
        }
    });

    // Export history
    exportHistoryBtn.addEventListener('click', () => {
        const passwords = Array.from(historyList.querySelectorAll('.history-password'))
            .map(el => el.textContent);
        
        if (passwords.length === 0) {
            showToast('No passwords to export', 'error');
            return;
        }

        const blob = new Blob([passwords.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `password-history-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('History exported successfully');
    });

    // Listen for new password generation
    document.addEventListener('passwordGenerated', (e) => {
        addToHistory(e.detail.password);
    });
});

