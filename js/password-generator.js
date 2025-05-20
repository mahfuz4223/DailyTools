// Password Generator Main JavaScript

// Constants for character sets
const CHARS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similar: 'O0l1I',
    sequential: {
        numbers: '0123456789',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }
};

// Common English words for passphrases (sample - should be expanded)
const WORDS = [
    'apple', 'banana', 'carrot', 'dog', 'elephant',
    'fish', 'grape', 'house', 'ice', 'jungle',
    'kite', 'lemon', 'monkey', 'nest', 'orange',
    'pencil', 'queen', 'rabbit', 'sun', 'tree',
    'umbrella', 'violin', 'water', 'xylophone', 'yellow',
    'zebra'
];

// Password Generator Class
class PasswordGenerator {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.currentConfig = this.getDefaultConfig();
    }

    initializeElements() {
        // Main elements
        this.passwordDisplay = document.getElementById('passwordDisplay');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.getElementById('lengthValue');

        // Character set checkboxes
        this.upperCase = document.getElementById('upperCase');
        this.lowerCase = document.getElementById('lowerCase');
        this.numbers = document.getElementById('numbers');
        this.symbols = document.getElementById('symbols');

        // Advanced options
        this.excludeSimilar = document.getElementById('excludeSimilar');
        this.excludeSequential = document.getElementById('excludeSequential');
        this.pronounceable = document.getElementById('pronounceable');

        // Password type radios
        this.typeStandard = document.getElementById('typeStandard');
        this.typePin = document.getElementById('typePin');
        this.typePassphrase = document.getElementById('typePassphrase');
        this.typePattern = document.getElementById('typePattern');

        // Pattern input
        this.patternInput = document.getElementById('patternInput');
        this.patternContainer = document.getElementById('patternInput').parentElement;

        // Security analysis elements
        this.strengthProgress = document.getElementById('strengthProgress');
        this.strengthLabel = document.getElementById('strengthLabel');
        this.entropyValue = document.getElementById('entropyValue');
        this.standardTime = document.getElementById('standardTime');
        this.gpuTime = document.getElementById('gpuTime');
        this.cloudTime = document.getElementById('cloudTime');

        // Security checks
        this.dictionaryCheck = document.getElementById('dictionaryCheck');
        this.breachCheck = document.getElementById('breachCheck');
        this.distributionCheck = document.getElementById('distributionCheck');

        // Memory aid
        this.memoryAid = document.getElementById('memoryAid');

        // Bulk generation
        this.bulkCount = document.getElementById('bulkCount');
        this.bulkGenerate = document.getElementById('bulkGenerate');
        this.bulkResults = document.getElementById('bulkResults');
        this.exportBulk = document.getElementById('exportBulk');
    }

    setupEventListeners() {
        // Generate button
        this.generateBtn.addEventListener('click', () => this.generatePassword());

        // Copy button
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        // Length slider
        this.lengthSlider.addEventListener('input', (e) => {
            this.lengthValue.textContent = `${e.target.value} characters`;
            this.currentConfig.length = parseInt(e.target.value);
            this.generatePassword();
        });

        // Character set checkboxes
        [this.upperCase, this.lowerCase, this.numbers, this.symbols].forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateConfig();
                this.generatePassword();
            });
        });

        // Advanced options
        [this.excludeSimilar, this.excludeSequential, this.pronounceable].forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateConfig();
                this.generatePassword();
            });
        });

        // Password type radios
        document.querySelectorAll('input[name="passwordType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.handlePasswordTypeChange(radio.id);
                this.generatePassword();
            });
        });

        // Pattern input
        this.patternInput.addEventListener('input', () => this.generatePassword());

        // Bulk generation
        this.bulkGenerate.addEventListener('click', () => this.generateBulkPasswords());
        this.exportBulk.addEventListener('click', () => this.exportBulkPasswords());

        // Initialize tooltips
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(tooltip => new bootstrap.Tooltip(tooltip));
    }

    getDefaultConfig() {
        return {
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            excludeSimilar: false,
            excludeSequential: false,
            pronounceable: false,
            type: 'standard'
        };
    }

    updateConfig() {
        this.currentConfig = {
            length: parseInt(this.lengthSlider.value),
            uppercase: this.upperCase.checked,
            lowercase: this.lowerCase.checked,
            numbers: this.numbers.checked,
            symbols: this.symbols.checked,
            excludeSimilar: this.excludeSimilar.checked,
            excludeSequential: this.excludeSequential.checked,
            pronounceable: this.pronounceable.checked,
            type: this.getSelectedPasswordType()
        };
    }

    getSelectedPasswordType() {
        const selected = document.querySelector('input[name="passwordType"]:checked');
        return selected ? selected.id.replace('type', '').toLowerCase() : 'standard';
    }

    handlePasswordTypeChange(typeId) {
        // Update configuration
        this.currentConfig.type = typeId.replace('type', '').toLowerCase();

        // Show/hide pattern input
        this.patternContainer.classList.toggle('d-none', typeId !== 'typePattern');

        // Update available options based on type
        this.updateAvailableOptions(typeId);
    }

    updateAvailableOptions(typeId) {
        const options = {
            typeStandard: { length: { min: 8, max: 64, default: 16 } },
            typePin: { length: { min: 4, max: 12, default: 6 } },
            typePassphrase: { length: { min: 2, max: 10, default: 4 } },
            typePattern: { length: { min: 4, max: 64, default: 12 } }
        };

        const config = options[typeId];
        if (config) {
            this.lengthSlider.min = config.length.min;
            this.lengthSlider.max = config.length.max;
            this.lengthSlider.value = config.length.default;
            this.lengthValue.textContent = `${config.length.default} characters`;
        }

        // Disable irrelevant options for certain types
        const disableOptions = typeId === 'typePin' || typeId === 'typePassphrase';
        [this.upperCase, this.lowerCase, this.numbers, this.symbols].forEach(checkbox => {
            checkbox.disabled = disableOptions;
        });
    }

    generatePassword() {
        let password = '';
        
        switch (this.currentConfig.type) {
            case 'pin':
                password = this.generatePin();
                break;
            case 'passphrase':
                password = this.generatePassphrase();
                break;
            case 'pattern':
                password = this.generatePatternPassword();
                break;
            default:
                password = this.generateStandardPassword();
        }

        this.displayPassword(password);
        this.analyzePassword(password);
    }

    generateStandardPassword() {
        let chars = '';
        let password = '';

        // Build character set
        if (this.currentConfig.uppercase) chars += CHARS.uppercase;
        if (this.currentConfig.lowercase) chars += CHARS.lowercase;
        if (this.currentConfig.numbers) chars += CHARS.numbers;
        if (this.currentConfig.symbols) chars += CHARS.symbols;

        // Remove similar characters if option is selected
        if (this.currentConfig.excludeSimilar) {
            CHARS.similar.split('').forEach(char => {
                chars = chars.replace(char, '');
            });
        }

        // Generate password
        for (let i = 0; i < this.currentConfig.length; i++) {
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            
            // Check for sequential characters
            if (this.currentConfig.excludeSequential && password.length > 0) {
                const lastChar = password[password.length - 1];
                if (this.isSequential(lastChar, char)) {
                    i--; // Try again
                    continue;
                }
            }
            
            password += char;
        }

        return password;
    }

    generatePin() {
        let pin = '';
        const length = parseInt(this.lengthSlider.value);
        
        for (let i = 0; i < length; i++) {
            const digit = Math.floor(Math.random() * 10);
            
            // Avoid sequential numbers if option is selected
            if (this.currentConfig.excludeSequential && pin.length > 0) {
                const lastDigit = parseInt(pin[pin.length - 1]);
                if (Math.abs(digit - lastDigit) === 1) {
                    i--; // Try again
                    continue;
                }
            }
            
            pin += digit;
        }
        
        return pin;
    }

    generatePassphrase() {
        const words = [];
        const length = parseInt(this.lengthSlider.value);
        
        for (let i = 0; i < length; i++) {
            let word = WORDS[Math.floor(Math.random() * WORDS.length)];
            
            // Capitalize first letter if uppercase is enabled
            if (this.currentConfig.uppercase) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }
            
            words.push(word);
        }
        
        return words.join('-');
    }

    generatePatternPassword() {
        const pattern = this.patternInput.value || 'XXX-###-xxx';
        let password = '';
        
        for (let char of pattern) {
            switch (char) {
                case 'X':
                    password += CHARS.uppercase.charAt(Math.floor(Math.random() * CHARS.uppercase.length));
                    break;
                case 'x':
                    password += CHARS.lowercase.charAt(Math.floor(Math.random() * CHARS.lowercase.length));
                    break;
                case '#':
                    password += CHARS.numbers.charAt(Math.floor(Math.random() * CHARS.numbers.length));
                    break;
                case '@':
                    password += CHARS.symbols.charAt(Math.floor(Math.random() * CHARS.symbols.length));
                    break;
                default:
                    password += char;
            }
        }
        
        return password;
    }

    isSequential(char1, char2) {
        // Check in all sequential character sets
        for (const set of Object.values(CHARS.sequential)) {
            const index1 = set.indexOf(char1);
            const index2 = set.indexOf(char2);
            if (index1 !== -1 && index2 !== -1 && Math.abs(index1 - index2) === 1) {
                return true;
            }
        }
        return false;
    }

    displayPassword(password) {
        this.passwordDisplay.textContent = password;
        this.passwordDisplay.classList.add('fade-in');
        setTimeout(() => this.passwordDisplay.classList.remove('fade-in'), 300);
    }

    analyzePassword(password) {
        // Calculate entropy and strength
        const entropy = this.calculateEntropy(password);
        const strength = this.getPasswordStrength(entropy);
        
        // Update strength meter
        this.updateStrengthMeter(strength, entropy);
        
        // Update cracking times
        this.updateCrackingTimes(entropy);
        
        // Perform security checks
        this.performSecurityChecks(password);
        
        // Generate memory aid
        this.generateMemoryAid(password);
    }

    calculateEntropy(password) {
        let charsetSize = 0;
        
        if (this.currentConfig.type === 'passphrase') {
            return password.split('-').length * Math.log2(WORDS.length);
        }
        
        if (this.currentConfig.uppercase) charsetSize += 26;
        if (this.currentConfig.lowercase) charsetSize += 26;
        if (this.currentConfig.numbers) charsetSize += 10;
        if (this.currentConfig.symbols) charsetSize += CHARS.symbols.length;
        
        return Math.log2(Math.pow(charsetSize, password.length));
    }

    getPasswordStrength(entropy) {
        if (entropy < 28) return { level: 'very-weak', label: 'Very Weak' };
        if (entropy < 36) return { level: 'weak', label: 'Weak' };
        if (entropy < 60) return { level: 'medium', label: 'Medium' };
        if (entropy < 128) return { level: 'strong', label: 'Strong' };
        return { level: 'very-strong', label: 'Very Strong' };
    }

    updateStrengthMeter(strength, entropy) {
        // Remove all strength classes
        this.strengthProgress.className = 'progress-bar';
        
        // Add new strength class
        this.strengthProgress.classList.add(strength.level);
        
        // Update width based on entropy (max 128 bits)
        const percentage = Math.min(entropy / 128 * 100, 100);
        this.strengthProgress.style.width = `${percentage}%`;
        
        // Update labels
        this.strengthLabel.textContent = strength.label;
        this.entropyValue.textContent = `${Math.round(entropy)} bits`;
    }

    updateCrackingTimes(entropy) {
        const times = this.calculateCrackingTimes(entropy);
        
        this.standardTime.textContent = this.formatTime(times.standard);
        this.gpuTime.textContent = this.formatTime(times.gpu);
        this.cloudTime.textContent = this.formatTime(times.cloud);
    }

    calculateCrackingTimes(entropy) {
        // Calculations based on these rates (guesses per second):
        // Standard computer: 1 million
        // High-end GPU: 100 billion
        // Cloud computing: 1 trillion
        const combinations = Math.pow(2, entropy);
        
        return {
            standard: combinations / 1000000,
            gpu: combinations / 100000000000,
            cloud: combinations / 1000000000000
        };
    }

    formatTime(seconds) {
        if (seconds < 1) return 'Instantly';
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
    }

    async performSecurityChecks(password) {
        // Reset checks
        this.resetSecurityChecks();
        
        // Perform checks
        await Promise.all([
            this.checkDictionary(password),
            this.checkBreachDatabase(password),
            this.checkDistribution(password)
        ]);
    }

    resetSecurityChecks() {
        [this.dictionaryCheck, this.breachCheck, this.distributionCheck].forEach(check => {
            check.className = 'check-item';
            check.querySelector('.fa-circle-notch').classList.remove('d-none');
        });
    }

    async checkDictionary(password) {
        // Simulate API call to dictionary service
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const isCommon = password.toLowerCase().split(/[^a-z]+/).some(word => 
            word.length > 3 && WORDS.includes(word)
        );
        
        this.updateCheckResult(this.dictionaryCheck, !isCommon);
    }

    async checkBreachDatabase(password) {
        // Simulate API call to breach database
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In a real implementation, we would use the Have I Been Pwned API
        // For demo purposes, we'll assume it's not in breach database
        this.updateCheckResult(this.breachCheck, true);
    }

    async checkDistribution(password) {
        // Analyze character distribution
        const counts = {};
        password.split('').forEach(char => {
            counts[char] = (counts[char] || 0) + 1;
        });
        
        // Check if any character appears more than 30% of the time
        const maxCount = Math.max(...Object.values(counts));
        const isWellDistributed = maxCount / password.length <= 0.3;
        
        this.updateCheckResult(this.distributionCheck, isWellDistributed);
    }

    updateCheckResult(element, passed) {
        element.classList.remove('success', 'warning', 'danger');
        element.classList.add(passed ? 'success' : 'danger');
        element.querySelector('.fa-circle-notch').classList.add('d-none');
    }

    generateMemoryAid(password) {
        let aid = '';
        
        if (this.currentConfig.type === 'standard') {
            // Split password into chunks of 4
            const chunks = password.match(/.{1,4}/g) || [];
            aid = chunks.map(chunk => {
                const letters = chunk.replace(/[^a-zA-Z]/g, '');
                const numbers = chunk.replace(/[^0-9]/g, '');
                const symbols = chunk.replace(/[a-zA-Z0-9]/g, '');
                
                let tips = [];
                if (letters) tips.push(`Letters: ${letters}`);
                if (numbers) tips.push(`Numbers: ${numbers}`);
                if (symbols) tips.push(`Symbols: ${symbols}`);
                
                return tips.join(', ');
            }).join(' | ');
        } else if (this.currentConfig.type === 'passphrase') {
            aid = 'Remember the story: ' + password.split('-').join(' ');
        }
        
        this.memoryAid.innerHTML = aid ? `
            <p class="mb-2">Memory Tips:</p>
            <div class="mnemonic">${aid}</div>
        ` : '<p class="text-muted small">Generate a password to see memory tips</p>';
    }

    async copyToClipboard() {
        const password = this.passwordDisplay.textContent;
        
        try {
            await navigator.clipboard.writeText(password);
            
            // Show success feedback
            this.copyBtn.classList.add('btn-success');
            this.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            
            // Reset after 2 seconds
            setTimeout(() => {
                this.copyBtn.classList.remove('btn-success');
                this.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy password:', err);
            
            // Show error feedback
            this.copyBtn.classList.add('btn-danger');
            setTimeout(() => this.copyBtn.classList.remove('btn-danger'), 2000);
        }
    }

    generateBulkPasswords() {
        const count = parseInt(this.bulkCount.value);
        const passwords = [];
        
        for (let i = 0; i < count; i++) {
            let password = '';
            switch (this.currentConfig.type) {
                case 'pin':
                    password = this.generatePin();
                    break;
                case 'passphrase':
                    password = this.generatePassphrase();
                    break;
                case 'pattern':
                    password = this.generatePatternPassword();
                    break;
                default:
                    password = this.generateStandardPassword();
            }
            passwords.push(password);
        }
        
        this.displayBulkPasswords(passwords);
    }

    displayBulkPasswords(passwords) {
        const listGroup = this.bulkResults.querySelector('.list-group');
        listGroup.innerHTML = passwords.map((password, index) => `
            <div class="list-group-item slide-in" style="animation-delay: ${index * 50}ms">
                <span class="password-text">${password}</span>
                <button class="btn btn-sm btn-outline-primary copy-btn" onclick="copyBulkPassword(this, '${password}')">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `).join('');
        
        this.bulkResults.classList.remove('d-none');
    }

    exportBulkPasswords() {
        const passwords = Array.from(this.bulkResults.querySelectorAll('.password-text'))
            .map(el => el.textContent);
            
        if (passwords.length === 0) return;
        
        const blob = new Blob([passwords.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = 'passwords.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize Password Generator
document.addEventListener('DOMContentLoaded', () => {
    window.passwordGenerator = new PasswordGenerator();
});

// Global function for bulk password copying
window.copyBulkPassword = async (button, password) => {
    try {
        await navigator.clipboard.writeText(password);
        
        // Show success feedback
        button.classList.add('btn-success');
        button.innerHTML = '<i class="fas fa-check"></i>';
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.classList.remove('btn-success');
            button.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy password:', err);
        
        // Show error feedback
        button.classList.add('btn-danger');
        setTimeout(() => {
            button.classList.remove('btn-danger');
            button.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    }
}; 