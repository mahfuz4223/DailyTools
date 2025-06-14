// QR Code Generator Main JavaScript

// Initialize all components when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize QR code generator
    const qrGenerator = new QRCodeGenerator();
    qrGenerator.init();
});

// QR Code Generator Class
class QRCodeGenerator {
    constructor() {
        this.qrCode = null;
        this.currentType = 'url';
        this.scanner = null;
        this.isScanning = false;
        this.debounceTimer = null;
        this.defaultOptions = {
            width: 300,
            height: 300,
            data: '',
            margin: 10,
            qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: 'Q'
            },
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.2,
                margin: 5,
                crossOrigin: 'anonymous',
            },
            dotsOptions: {
                type: 'rounded',
                color: '#000000',
                gradient: null
            },
            backgroundOptions: {
                color: '#ffffff',
            },
            cornersSquareOptions: {
                type: 'extra-rounded',
                color: '#000000',
            },
            cornersDotOptions: {
                type: 'dot',
                color: '#000000',
            },
        };
        this.logoLibrary = [
            { name: 'GitHub', url: '../assets/logos/github.svg' },
            { name: 'Twitter', url: '../assets/logos/twitter.svg' },
            { name: 'LinkedIn', url: '../assets/logos/linkedin.svg' },
            { name: 'Instagram', url: '../assets/logos/instagram.svg' },
            { name: 'Facebook', url: '../assets/logos/facebook.svg' },
            { name: 'YouTube', url: '../assets/logos/youtube.svg' }
        ];
    }

    init() {
        this.initQRCode();
        this.initColorPickers();
        this.initEventListeners();
        this.setupInputFields('url');
        this.initLogoLibrary();
        this.initLogoHandlers();
        this.initGenerateButton();
        this.initDownloadHandlers();
        this.initShareHandlers();
        this.initScannerPlaceholder(); // Placeholder for scanner
    }

    initQRCode() {
        this.qrCode = new QRCodeStyling(this.defaultOptions);
        const qrPreview = document.getElementById('qrPreview');
        if (qrPreview) {
            this.qrCode.append(qrPreview);
        }
    }

    initColorPickers() {
        const pickrOptions = {
            theme: 'nano',
            lockOpacity: true,
            defaultRepresentation: 'HEX',
            components: {
                preview: true,
                opacity: false,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: false,
                    hsla: false,
                    input: true,
                    clear: false,
                    save: true
                }
            }
        };

        // Initialize color pickers only if elements exist
        const foregroundEl = document.getElementById('foregroundColor');
        const backgroundEl = document.getElementById('backgroundColor');
        const gradientStartEl = document.getElementById('gradientStart');
        const gradientEndEl = document.getElementById('gradientEnd');
        const frameColorEl = document.getElementById('frameColor');

        if (foregroundEl) {
            this.foregroundPicker = Pickr.create({
                el: foregroundEl,
                default: '#000000',
                ...pickrOptions
            });

            this.foregroundPicker.on('change', (color) => {
                const rgba = color.toRGBA();
                this.updateQRCode({
                    dotsOptions: {
                        color: `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`,
                    }
                });
            });
        }

        if (backgroundEl) {
            this.backgroundPicker = Pickr.create({
                el: backgroundEl,
                default: '#FFFFFF',
                ...pickrOptions
            });

            this.backgroundPicker.on('change', (color) => {
                const rgba = color.toRGBA();
                this.updateQRCode({
                    backgroundOptions: {
                        color: `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`,
                    }
                });
            });
        }

        if (gradientStartEl && gradientEndEl) {
            this.gradientStartPicker = Pickr.create({
                el: gradientStartEl,
                default: '#000000',
                ...pickrOptions
            });

            this.gradientEndPicker = Pickr.create({
                el: gradientEndEl,
                default: '#000000',
                ...pickrOptions
            });

            const updateGradient = () => {
                if (!document.getElementById('useGradient')?.checked) return;
                
                const startColor = this.gradientStartPicker.getColor().toRGBA();
                const endColor = this.gradientEndPicker.getColor().toRGBA();
                
                this.updateQRCode({
                    dotsOptions: {
                        gradient: {
                            type: 'linear',
                            rotation: 45,
                            colorStops: [
                                { offset: 0, color: `rgba(${startColor[0]}, ${startColor[1]}, ${startColor[2]}, ${startColor[3]})` },
                                { offset: 1, color: `rgba(${endColor[0]}, ${endColor[1]}, ${endColor[2]}, ${endColor[3]})` }
                            ]
                        }
                    }
                });
            };

            this.gradientStartPicker.on('change', updateGradient);
            this.gradientEndPicker.on('change', updateGradient);
        }

        if (frameColorEl) {
            this.frameColorPicker = Pickr.create({
                el: frameColorEl,
                default: '#000000',
                ...pickrOptions
            });

            this.frameColorPicker.on('change', (color) => {
                this.updateFrame();
            });
        }
    }

    initEventListeners() {
        // Content Type Selection
        document.querySelectorAll('input[name="contentType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentType = e.target.value;
                this.setupInputFields(this.currentType);
            });
        });

        // Style Options
        const dotStyle = document.getElementById('dotStyle');
        const cornerStyle = document.getElementById('cornerStyle');
        const frameStyle = document.getElementById('frameStyle');
        const frameText = document.getElementById('frameText');
        const frameOptions = document.getElementById('frameOptions');

        if (dotStyle) {
            dotStyle.addEventListener('change', (e) => {
                this.updateQRCode({
                    dotsOptions: {
                        type: e.target.value
                    }
                });
            });
        }

        if (cornerStyle) {
            cornerStyle.addEventListener('change', (e) => {
                this.updateQRCode({
                    cornersSquareOptions: {
                        type: e.target.value
                    },
                    cornersDotOptions: {
                        type: e.target.value
                    }
                });
            });
        }

        if (frameStyle) {
            frameStyle.addEventListener('change', (e) => {
                frameOptions.classList.toggle('d-none', e.target.value === 'none');
                this.updateFrame();
            });
        }

        if (frameText) {
            frameText.addEventListener('input', () => {
                this.updateFrame();
            });
        }

        // Gradient Toggle
        const useGradient = document.getElementById('useGradient');
        const gradientOptions = document.getElementById('gradientOptions');

        if (useGradient && gradientOptions) {
            useGradient.addEventListener('change', (e) => {
                gradientOptions.classList.toggle('d-none', !e.target.checked);
                
                if (e.target.checked && this.gradientStartPicker && this.gradientEndPicker) {
                    const startColor = this.gradientStartPicker.getColor().toRGBA();
                    const endColor = this.gradientEndPicker.getColor().toRGBA();
                    
                    this.updateQRCode({
                        dotsOptions: {
                            gradient: {
                                type: 'linear',
                                rotation: 45,
                                colorStops: [
                                    { offset: 0, color: `rgba(${startColor[0]}, ${startColor[1]}, ${startColor[2]}, ${startColor[3]})` },
                                    { offset: 1, color: `rgba(${endColor[0]}, ${endColor[1]}, ${endColor[2]}, ${endColor[3]})` }
                                ]
                            }
                        }
                    });
                } else if (this.foregroundPicker) {
                    const color = this.foregroundPicker.getColor().toRGBA();
                    this.updateQRCode({
                        dotsOptions: {
                            color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
                            gradient: null
                        }
                    });
                }
            });
        }

        // ... rest of the event listeners ...
    }

    updateQRCode(options = {}) {
        const overlay = document.querySelector('.preview-overlay');
        if (overlay) {
            overlay.classList.remove('d-none');
        }

        // Merge options with current options
        const mergedOptions = {
            ...this.defaultOptions,
            ...options
        };

        // Update QR code
        setTimeout(() => {
            try {
                this.qrCode.update(mergedOptions);
            } catch (error) {
                console.error('Error updating QR code:', error);
            } finally {
                if (overlay) {
                    overlay.classList.add('d-none');
                }
            }
        }, 100);
    }

    setupInputFields(type) {
        const container = document.getElementById('inputFields');
        if (!container) return;

        let fields = '';
        switch (type) {
            case 'url':
                fields = `
                    <div class="form-group">
                        <label for="urlInput" class="form-label">URL</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-link"></i></span>
                            <input type="url" class="form-control" id="urlInput" placeholder="Enter URL" title="Enter the URL for the QR code">
                        </div>
                    </div>`;
                break;

            case 'text':
                fields = `
                    <div class="form-group">
                        <label for="textInput" class="form-label">Text</label>
                        <textarea class="form-control" id="textInput" rows="4" placeholder="Enter your text" title="Enter the text for the QR code"></textarea>
                    </div>`;
                break;

            case 'wifi':
                fields = `
                    <div class="form-group mb-3">
                        <label for="ssidInput" class="form-label">Network Name (SSID)</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-wifi"></i></span>
                            <input type="text" class="form-control" id="ssidInput" placeholder="Enter network name" title="Enter the WiFi network name">
                        </div>
                    </div>
                    <div class="form-group mb-3">
                        <label for="passwordInput" class="form-label">Password</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-key"></i></span>
                            <input type="password" class="form-control" id="passwordInput" placeholder="Enter password" title="Enter the WiFi password">
                            <button class="btn btn-outline-secondary" type="button" title="Toggle password visibility">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="encryptionType" class="form-label">Encryption Type</label>
                        <select class="form-select" id="encryptionType" title="Select WiFi encryption type">
                            <option value="WPA">WPA/WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">No Password</option>
                        </select>
                    </div>`;
                break;

            case 'contact':
                fields = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="nameInput" class="form-label">Name</label>
                            <input type="text" class="form-control" id="nameInput" placeholder="Enter name" title="Enter contact name">
                        </div>
                        <div class="col-md-6">
                            <label for="phoneInput" class="form-label">Phone</label>
                            <input type="tel" class="form-control" id="phoneInput" placeholder="Enter phone number" title="Enter contact phone number">
                        </div>
                        <div class="col-12">
                            <label for="emailInput" class="form-label">Email</label>
                            <input type="email" class="form-control" id="emailInput" placeholder="Enter email" title="Enter contact email">
                        </div>
                        <div class="col-12">
                            <label for="addressInput" class="form-label">Address</label>
                            <textarea class="form-control" id="addressInput" rows="2" placeholder="Enter address" title="Enter contact address"></textarea>
                        </div>
                    </div>`;
                break;

            case 'email':
                fields = `
                    <div class="form-group mb-3">
                        <label for="emailToInput" class="form-label">Email Address</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                            <input type="email" class="form-control" id="emailToInput" placeholder="Enter email address" title="Enter recipient email address">
                        </div>
                    </div>
                    <div class="form-group mb-3">
                        <label for="emailSubjectInput" class="form-label">Subject</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-heading"></i></span>
                            <input type="text" class="form-control" id="emailSubjectInput" placeholder="Enter subject" title="Enter email subject">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="emailBodyInput" class="form-label">Message</label>
                        <textarea class="form-control" id="emailBodyInput" rows="4" placeholder="Enter message" title="Enter email message"></textarea>
                    </div>`;
                break;
        }

        container.innerHTML = fields;
        this.setupInputListeners();
    }

    setupInputListeners() {
        const inputs = document.querySelectorAll('#inputFields input, #inputFields textarea, #inputFields select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounceGenerateQRCode();
            });
        });

        // Add password toggle functionality
        const passwordToggle = document.querySelector('#inputFields button');
        const passwordInput = document.getElementById('passwordInput');
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                passwordToggle.querySelector('i').classList.toggle('fa-eye');
                passwordToggle.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    }

    debounceGenerateQRCode() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.generateQRCode();
        }, 300);
    }

    initLogoLibrary() {
        const logoLibrary = document.getElementById('logoLibrary');
        if (!logoLibrary) return;

        logoLibrary.innerHTML = this.logoLibrary.map(logo => `
            <div class="logo-item" data-logo="${logo.url}">
                <img src="${logo.url}" alt="${logo.name} logo" title="${logo.name}">
            </div>
        `).join('');

        // Add click handlers for logo selection
        logoLibrary.querySelectorAll('.logo-item').forEach(item => {
            item.addEventListener('click', () => {
                const logoUrl = item.dataset.logo;
                this.updateLogoPreview(logoUrl);
                this.updateQRCode({
                    image: logoUrl
                });

                // Update active state
                logoLibrary.querySelectorAll('.logo-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    initLogoHandlers() {
        // Logo Upload Handler
        const logoUpload = document.getElementById('logoUpload');
        if (logoUpload) {
            logoUpload.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = e.target?.result;
                        if (result) {
                            this.updateLogoPreview(result);
                            this.updateQRCode({
                                image: result
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Logo Size Handler
        const logoSize = document.getElementById('logoSize');
        if (logoSize) {
            logoSize.addEventListener('input', (e) => {
                const size = parseFloat(e.target.value);
                this.updateQRCode({
                    imageOptions: {
                        ...this.defaultOptions.imageOptions,
                        imageSize: size
                    }
                });
            });
        }

        // Logo Margin Handler
        const logoMargin = document.getElementById('logoMargin');
        if (logoMargin) {
            logoMargin.addEventListener('input', (e) => {
                const margin = parseInt(e.target.value);
                this.updateQRCode({
                    imageOptions: {
                        ...this.defaultOptions.imageOptions,
                        margin: margin
                    }
                });
            });
        }
    }

    updateLogoPreview(src) {
        const preview = document.getElementById('logoPreview');
        if (!preview) return;

        preview.innerHTML = `<img src="${src}" alt="Logo preview" style="max-width: 100%; height: auto;">`;
    }

    initGenerateButton() {
        const generateBtn = document.getElementById('generateQRBtn');
        if (!generateBtn) return;

        generateBtn.addEventListener('click', () => {
            this.generateQRCodeWithLoading();
        });

        // Also trigger generation on Enter key in input fields
        document.querySelectorAll('#inputFields input, #inputFields textarea').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.generateQRCodeWithLoading();
                }
            });
        });
    }

    async generateQRCodeWithLoading() {
        const generateBtn = document.getElementById('generateQRBtn');
        const spinner = generateBtn?.querySelector('.spinner-border');
        const qrPreview = document.getElementById('qrPreview');
        const overlay = document.querySelector('.preview-overlay');

        try {
            // Show loading state
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.classList.remove('btn-success', 'btn-danger');
            }
            if (spinner) spinner.classList.remove('d-none');
            if (overlay) overlay.classList.remove('d-none');
            if (qrPreview) qrPreview.classList.add('loading');

            // Generate QR code
            await this.generateQRCode();

            // Show success feedback
            if (generateBtn) {
                generateBtn.classList.add('btn-success');
                generateBtn.classList.remove('btn-gradient-primary');
                
                // Reset button state after animation
                setTimeout(() => {
                    generateBtn.classList.remove('btn-success');
                    generateBtn.classList.add('btn-gradient-primary');
                }, 2000);
            }

        } catch (error) {
            console.error('Error generating QR code:', error);
            // Show error feedback
            if (generateBtn) {
                generateBtn.classList.add('btn-danger');
                generateBtn.classList.remove('btn-gradient-primary');
                
                // Reset button state after animation
                setTimeout(() => {
                    generateBtn.classList.remove('btn-danger');
                    generateBtn.classList.add('btn-gradient-primary');
                }, 1000);
            }

        } finally {
            // Reset loading state
            if (generateBtn) generateBtn.disabled = false;
            if (spinner) spinner.classList.add('d-none');
            if (overlay) overlay.classList.add('d-none');
            if (qrPreview) qrPreview.classList.remove('loading');
        }
    }

    async generateQRCode() {
        let data = '';
        
        switch (this.currentType) {
            case 'url':
                data = document.getElementById('urlInput')?.value || '';
                if (!data) throw new Error('Please enter a URL');
                if (!data.startsWith('http://') && !data.startsWith('https://')) {
                    data = 'https://' + data;
                }
                break;

            case 'text':
                data = document.getElementById('textInput')?.value || '';
                if (!data) throw new Error('Please enter some text');
                break;

            case 'wifi':
                const ssid = document.getElementById('ssidInput')?.value || '';
                const password = document.getElementById('passwordInput')?.value || '';
                const encryption = document.getElementById('encryptionType')?.value || '';
                if (!ssid) throw new Error('Please enter the WiFi network name');
                data = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
                break;

            case 'contact':
                const name = document.getElementById('nameInput')?.value || '';
                const phone = document.getElementById('phoneInput')?.value || '';
                const email = document.getElementById('emailInput')?.value || '';
                const address = document.getElementById('addressInput')?.value || '';
                if (!name && !phone && !email) throw new Error('Please enter at least one contact detail');
                data = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nADR:${address}\nEND:VCARD`;
                break;

            case 'email':
                const emailTo = document.getElementById('emailToInput')?.value || '';
                const subject = document.getElementById('emailSubjectInput')?.value || '';
                const body = document.getElementById('emailBodyInput')?.value || '';
                if (!emailTo) throw new Error('Please enter an email address');
                data = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                break;
        }

        // Update QR code with validation and error handling
        return new Promise((resolve, reject) => {
            try {
                this.updateQRCode({ data });
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    updateFrame() {
        const frameStyle = document.getElementById('frameStyle')?.value;
        const frameText = document.getElementById('frameText')?.value || '';
        const frameColor = this.frameColorPicker?.getColor()?.toRGBA();
        
        if (!frameStyle || frameStyle === 'none' || !frameColor) {
            this.updateQRCode({
                cornersSquareOptions: {
                    type: document.getElementById('cornerStyle')?.value || 'extra-rounded',
                    color: this.defaultOptions.cornersSquareOptions.color
                }
            });
            return;
        }

        const frameConfig = {
            cornersSquareOptions: {
                type: frameStyle,
                color: `rgba(${frameColor[0]}, ${frameColor[1]}, ${frameColor[2]}, ${frameColor[3]})`,
            },
            cornersDotOptions: {
                type: frameStyle,
                color: `rgba(${frameColor[0]}, ${frameColor[1]}, ${frameColor[2]}, ${frameColor[3]})`,
            }
        };

        if (frameText) {
            frameConfig.cornersSquareOptions.text = frameText;
        }

        this.updateQRCode(frameConfig);
    }

    initDownloadHandlers() {
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadOptions = document.querySelectorAll('.download-options button');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                // Show download options
                document.querySelector('.download-options')?.classList.toggle('d-none');
            });
        }

        downloadOptions.forEach(button => {
            button.addEventListener('click', async () => {
                const format = button.dataset.format;
                try {
                    // Hide download options
                    document.querySelector('.download-options')?.classList.add('d-none');
                    
                    // Show loading state
                    button.disabled = true;
                    const originalText = button.textContent;
                    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

                    // Download the QR code
                    // Download the QR code
                    if (format === 'svg') {
                        // SVG Download is marked as "Coming Soon"
                        alert('SVG download feature is coming soon and is currently not available.');
                        button.disabled = false; // Re-enable button
                        button.innerHTML = 'SVG (Coming Soon)'; // Restore text
                        // Do not proceed with download logic for SVG
                        return;
                    } else if (format === 'webp') {
                        await this.qrCode.download({
                            extension: 'webp'
                        });
                    } else {
                        await this.qrCode.download({
                            extension: 'png'
                        });
                    }

                    // Show success state
                    button.classList.add('btn-success');
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        button.disabled = false;
                        button.classList.remove('btn-success');
                        button.textContent = originalText;
                    }, 2000);
                } catch (error) {
                    console.error('Error downloading QR code:', error);
                    // Show error state
                    button.classList.add('btn-danger');
                    button.innerHTML = '<i class="fas fa-times"></i>';
                    setTimeout(() => {
                        button.disabled = false;
                        button.classList.remove('btn-danger');
                        button.textContent = originalText;
                    }, 2000);
                }
            });
        });
    }

    initShareHandlers() {
        const shareBtn = document.getElementById('shareBtn');
        const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                shareModal.show();
            });
        }

        // Share via Email
        window.shareViaEmail = async () => {
            try {
                const dataUrl = await this.qrCode.getDataUrl();
                const subject = 'QR Code';
                const body = 'Here is your QR code:\n\n' + dataUrl;
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via email:', error);
            }
        };

        // Share via Twitter
        window.shareViaTwitter = async () => {
            try {
                const dataUrl = await this.qrCode.getDataUrl();
                const text = 'Check out my QR code!';
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(dataUrl)}`, '_blank');
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via Twitter:', error);
            }
        };

        // Share via Facebook
        window.shareViaFacebook = async () => {
            try {
                const dataUrl = await this.qrCode.getDataUrl();
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dataUrl)}`, '_blank');
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via Facebook:', error);
            }
        };

        // Share via LinkedIn
        window.shareViaLinkedin = async () => {
            try {
                const dataUrl = await this.qrCode.getDataUrl();
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(dataUrl)}`, '_blank');
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via LinkedIn:', error);
            }
        };

        // Copy Link
        window.copyShareLink = async () => {
            try {
                const dataUrl = await this.qrCode.getDataUrl();
                await navigator.clipboard.writeText(dataUrl);
                
                // Show success feedback
                const copyBtn = document.querySelector('.copy-link');
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                copyBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                    copyBtn.classList.remove('btn-success');
                }, 2000);
            } catch (error) {
                console.error('Error copying link:', error);
            }
        };
    }

    initScannerPlaceholder() {
        const toggleBtn = document.getElementById('toggleScanner');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                alert('QR Code Scanner feature is coming soon and is currently not available.');
            });
        }
        // Note: The actual scanner initialization (Html5Qrcode) is omitted
        // as the feature is marked as coming soon.
    }

    // ... rest of the class implementation ...
}