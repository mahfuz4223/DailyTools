// Barcode Generator Main JavaScript

// Initialize all components when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize barcode generator
    const barcodeGenerator = new BarcodeGenerator();
    barcodeGenerator.init();
});

// Barcode Generator Class
class BarcodeGenerator {
    constructor() {
        this.currentType = 'CODE128';
        this.scanner = null;
        this.isScanning = false;
        this.debounceTimer = null;
        this.defaultOptions = {
            format: 'CODE128',
            width: 2,
            height: 100,
            displayValue: true,
            text: '',
            fontOptions: '',
            font: 'monospace',
            textAlign: 'center',
            textPosition: 'bottom',
            textMargin: 2,
            fontSize: 20,
            background: '#ffffff',
            lineColor: '#000000',
            margin: 10
        };
    }

    init() {
        this.initBarcode();
        this.initColorPickers();
        this.initEventListeners();
        this.setupInputFields('CODE128');
        this.initGenerateButton();
        this.initDownloadHandlers();
        this.initShareHandlers();
        this.initScanner();
    }

    initBarcode() {
        const barcodePreview = document.getElementById('barcodePreview');
        if (barcodePreview) {
            const canvas = document.createElement('canvas');
            barcodePreview.appendChild(canvas);
            this.generateBarcode(canvas);
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

        // Initialize color pickers
        const lineColorEl = document.getElementById('lineColor');
        const backgroundColorEl = document.getElementById('backgroundColor');

        if (lineColorEl) {
            this.lineColorPicker = Pickr.create({
                el: lineColorEl,
                default: '#000000',
                ...pickrOptions
            });

            this.lineColorPicker.on('change', (color) => {
                this.defaultOptions.lineColor = color.toHEXA().toString();
                this.updateBarcode();
            });
        }

        if (backgroundColorEl) {
            this.backgroundColorPicker = Pickr.create({
                el: backgroundColorEl,
                default: '#FFFFFF',
                ...pickrOptions
            });

            this.backgroundColorPicker.on('change', (color) => {
                this.defaultOptions.background = color.toHEXA().toString();
                this.updateBarcode();
            });
        }
    }

    initEventListeners() {
        // Barcode Type Selection
        document.querySelectorAll('input[name="barcodeType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentType = e.target.value;
                this.defaultOptions.format = this.currentType;
                this.setupInputFields(this.currentType);
                this.updateBarcode();
            });
        });

        // Style Options
        const lineWidth = document.getElementById('lineWidth');
        const height = document.getElementById('height');
        const showText = document.getElementById('showText');

        if (lineWidth) {
            lineWidth.addEventListener('input', (e) => {
                this.defaultOptions.width = parseFloat(e.target.value);
                this.updateBarcode();
            });
        }

        if (height) {
            height.addEventListener('input', (e) => {
                this.defaultOptions.height = parseInt(e.target.value);
                this.updateBarcode();
            });
        }

        if (showText) {
            showText.addEventListener('change', (e) => {
                this.defaultOptions.displayValue = e.target.checked;
                this.updateBarcode();
            });
        }
    }

    setupInputFields(type) {
        const container = document.getElementById('inputFields');
        if (!container) return;

        let fields = '';
        switch (type) {
            case 'CODE128':
                fields = `
                    <div class="form-group">
                        <label for="barcodeInput" class="form-label">Barcode Content</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-barcode"></i></span>
                            <input type="text" class="form-control" id="barcodeInput" placeholder="Enter barcode content">
                        </div>
                        <div class="form-text">Enter any text or numbers</div>
                    </div>`;
                break;

            case 'EAN13':
                fields = `
                    <div class="form-group">
                        <label for="barcodeInput" class="form-label">EAN-13 Number</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-barcode"></i></span>
                            <input type="text" class="form-control" id="barcodeInput" placeholder="Enter 12 digits" maxlength="12" pattern="[0-9]{12}">
                        </div>
                        <div class="form-text">Enter exactly 12 digits (checksum will be calculated automatically)</div>
                    </div>`;
                break;

            case 'UPC':
                fields = `
                    <div class="form-group">
                        <label for="barcodeInput" class="form-label">UPC Number</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-barcode"></i></span>
                            <input type="text" class="form-control" id="barcodeInput" placeholder="Enter 11 digits" maxlength="11" pattern="[0-9]{11}">
                        </div>
                        <div class="form-text">Enter exactly 11 digits (checksum will be calculated automatically)</div>
                    </div>`;
                break;

            case 'CODE39':
                fields = `
                    <div class="form-group">
                        <label for="barcodeInput" class="form-label">Code 39 Content</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-barcode"></i></span>
                            <input type="text" class="form-control" id="barcodeInput" placeholder="Enter content" pattern="[A-Z0-9-. $/+%]*">
                        </div>
                        <div class="form-text">Use capital letters, numbers, and special characters (- . $ / + %)</div>
                    </div>`;
                break;
        }

        container.innerHTML = fields;
        this.setupInputListeners();
    }

    setupInputListeners() {
        const input = document.getElementById('barcodeInput');
        if (input) {
            input.addEventListener('input', () => {
                this.debounceGenerateBarcode();
            });

            // Add validation for specific barcode types
            if (this.currentType === 'EAN13') {
                input.addEventListener('keypress', (e) => {
                    if (!/[0-9]/.test(e.key) || (input.value.length >= 12 && e.key !== 'Enter')) {
                        e.preventDefault();
                    }
                });
                input.addEventListener('input', () => {
                    if (input.value.length === 12) {
                        this.generateBarcodeWithLoading();
                    }
                });
            } else if (this.currentType === 'UPC') {
                input.addEventListener('keypress', (e) => {
                    if (!/[0-9]/.test(e.key) || (input.value.length >= 11 && e.key !== 'Enter')) {
                        e.preventDefault();
                    }
                });
                input.addEventListener('input', () => {
                    if (input.value.length === 11) {
                        this.generateBarcodeWithLoading();
                    }
                });
            } else if (this.currentType === 'CODE39') {
                input.addEventListener('keypress', (e) => {
                    if (!/[A-Z0-9-. $/+%]/.test(e.key.toUpperCase())) {
                        e.preventDefault();
                    }
                });
                input.addEventListener('input', () => {
                    input.value = input.value.toUpperCase();
                });
            }
        }
    }

    debounceGenerateBarcode() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updateBarcode();
        }, 300);
    }

    generateBarcode(canvas) {
        const input = document.getElementById('barcodeInput');
        const text = input ? input.value : '';
        const previewContainer = document.querySelector('.preview-container');
        
        try {
            // Get container dimensions
            const containerWidth = previewContainer?.clientWidth || 300;
            const containerHeight = previewContainer?.clientHeight || 200;
            
            // Calculate optimal barcode dimensions
            const maxWidth = containerWidth - (2 * this.defaultOptions.margin);
            const maxHeight = containerHeight - (2 * this.defaultOptions.margin);
            
            // Update options with calculated dimensions
            const options = {
                ...this.defaultOptions,
                width: Math.min(this.defaultOptions.width, maxWidth / 50), // Adjust width relative to container
                height: Math.min(this.defaultOptions.height, maxHeight),
                text: text || ' ',
                valid: (valid) => {
                    if (valid) {
                        input?.classList.remove('is-invalid');
                        canvas.style.opacity = '1';
                    } else {
                        input?.classList.add('is-invalid');
                        canvas.style.opacity = '0.5';
                    }
                }
            };

            // Special handling for different barcode types
            if (this.currentType === 'EAN13' || this.currentType === 'UPC') {
                options.fontSize = Math.min(20, maxHeight / 8);
                options.textMargin = Math.min(2, maxHeight / 50);
                options.width = Math.min(2, maxWidth / 100);
            } else {
                options.fontSize = Math.min(20, maxHeight / 6);
                options.textMargin = Math.min(4, maxHeight / 25);
            }

            // Generate barcode
            JsBarcode(canvas, text || ' ', options);

            // Center the canvas in the preview container
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.margin = 'auto';

        } catch (error) {
            console.error('Error generating barcode:', error);
            input?.classList.add('is-invalid');
            canvas.style.opacity = '0.5';
        }
    }

    updateBarcode() {
        const barcodePreview = document.getElementById('barcodePreview');
        const canvas = barcodePreview?.querySelector('canvas');
        if (canvas) {
            // Clear previous barcode
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Generate new barcode
            this.generateBarcode(canvas);
        }
    }

    async generateBarcodeWithLoading() {
        const generateBtn = document.getElementById('generateBarcodeBtn');
        const spinner = generateBtn?.querySelector('.spinner-border');
        const barcodePreview = document.getElementById('barcodePreview');
        const overlay = document.querySelector('.preview-overlay');

        try {
            // Show loading state
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.classList.remove('btn-success', 'btn-danger');
            }
            if (spinner) spinner.classList.remove('d-none');
            if (overlay) overlay.classList.remove('d-none');
            if (barcodePreview) barcodePreview.classList.add('loading');

            // Generate barcode
            await this.updateBarcode();

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
            console.error('Error generating barcode:', error);
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
            if (barcodePreview) barcodePreview.classList.remove('loading');
        }
    }

    initGenerateButton() {
        const generateBtn = document.getElementById('generateBarcodeBtn');
        if (!generateBtn) return;

        generateBtn.addEventListener('click', () => {
            this.generateBarcodeWithLoading();
        });

        // Also trigger generation on Enter key in input fields
        document.querySelectorAll('#inputFields input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.generateBarcodeWithLoading();
                }
            });
        });
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

                    // Get the canvas
                    const canvas = document.querySelector('#barcodePreview canvas');
                    if (!canvas) throw new Error('No barcode canvas found');

                    // Create download link
                    const link = document.createElement('a');
                    if (format === 'svg') {
                        // SVG Download is marked as "Coming Soon"
                        alert('SVG download feature is coming soon and is currently not available.');
                        button.disabled = false; // Re-enable button
                        button.innerHTML = 'SVG (Coming Soon)'; // Restore text
                        // Do not proceed with download logic for SVG
                        return;
                    } else if (format === 'webp') {
                        const webpData = canvas.toDataURL('image/webp');
                        link.href = webpData;
                        link.download = 'barcode.webp';
                    } else {
                        const pngData = canvas.toDataURL('image/png');
                        link.href = pngData;
                        link.download = 'barcode.png';
                    }

                    // Trigger download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Show success state
                    button.classList.add('btn-success');
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        button.disabled = false;
                        button.classList.remove('btn-success');
                        button.textContent = originalText;
                    }, 2000);
                } catch (error) {
                    console.error('Error downloading barcode:', error);
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
                const canvas = document.querySelector('#barcodePreview canvas');
                if (!canvas) throw new Error('No barcode canvas found');
                
                const dataUrl = canvas.toDataURL('image/png');
                const subject = 'Barcode';
                const body = 'Here is your barcode:\n\n' + dataUrl;
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via email:', error);
            }
        };

        // Share via Twitter
        window.shareViaTwitter = async () => {
            try {
                const canvas = document.querySelector('#barcodePreview canvas');
                if (!canvas) throw new Error('No barcode canvas found');
                
                const dataUrl = canvas.toDataURL('image/png');
                const text = 'Check out my barcode!';
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(dataUrl)}`, '_blank');
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via Twitter:', error);
            }
        };

        // Share via Facebook
        window.shareViaFacebook = async () => {
            try {
                const canvas = document.querySelector('#barcodePreview canvas');
                if (!canvas) throw new Error('No barcode canvas found');
                
                const dataUrl = canvas.toDataURL('image/png');
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dataUrl)}`, '_blank');
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via Facebook:', error);
            }
        };

        // Share via LinkedIn
        window.shareViaLinkedin = async () => {
            try {
                const canvas = document.querySelector('#barcodePreview canvas');
                if (!canvas) throw new Error('No barcode canvas found');
                
                const dataUrl = canvas.toDataURL('image/png');
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(dataUrl)}`, '_blank');
                shareModal.hide();
            } catch (error) {
                console.error('Error sharing via LinkedIn:', error);
            }
        };

        // Copy Link
        window.copyShareLink = async () => {
            try {
                const canvas = document.querySelector('#barcodePreview canvas');
                if (!canvas) throw new Error('No barcode canvas found');
                
                const dataUrl = canvas.toDataURL('image/png');
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

    initScanner() {
        const toggleBtn = document.getElementById('toggleScanner');
        const reader = document.getElementById('reader');
        const result = document.getElementById('scanResult');

        if (!toggleBtn || !reader || !result) return;

        toggleBtn.addEventListener('click', () => {
            if (this.isScanning) {
                this.stopScanner();
                toggleBtn.innerHTML = '<i class="fas fa-camera me-2"></i>Start Scanner';
            } else {
                this.startScanner();
                toggleBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Scanner';
            }
        });
    }

    startScanner() {
        if (!this.scanner) {
            this.scanner = new Html5Qrcode('reader');
        }

        this.scanner.start(
            { facingMode: 'environment' },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                const resultContainer = document.getElementById('scanResult');
                if (resultContainer) {
                    // Clear previous results
                    resultContainer.innerHTML = '';

                    // Create alert div
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-success mb-3';

                    // Create heading
                    const heading = document.createElement('h6');
                    heading.className = 'alert-heading mb-1';
                    heading.textContent = 'Barcode Detected!';
                    alertDiv.appendChild(heading);

                    // Create paragraph for content - Use textContent to prevent XSS
                    const contentParagraph = document.createElement('p');
                    contentParagraph.className = 'mb-0';
                    contentParagraph.textContent = `Content: ${decodedText}`;
                    alertDiv.appendChild(contentParagraph);

                    resultContainer.appendChild(alertDiv);

                    // Create button container
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'd-grid';

                    // Create copy button
                    const copyButton = document.createElement('button');
                    copyButton.className = 'btn btn-primary';
                    copyButton.innerHTML = '<i class="fas fa-copy me-2"></i>Copy Content'; // Icon is safe HTML here
                    copyButton.addEventListener('click', () => copyToClipboard(decodedText));
                    buttonContainer.appendChild(copyButton);

                    resultContainer.appendChild(buttonContainer);
                }
            },
            (errorMessage) => {
                console.error('QR Code scanning error:', errorMessage);
            }
        ).catch((err) => {
            console.error('Error starting scanner:', err);
        });

        this.isScanning = true;
    }

    stopScanner() {
        if (this.scanner && this.isScanning) {
            this.scanner.stop().then(() => {
                this.isScanning = false;
            }).catch((err) => {
                console.error('Error stopping scanner:', err);
            });
        }
    }
}

// Helper function to copy scanned content to clipboard
window.copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        const btn = document.querySelector('#scanResult .btn-primary');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check me-2"></i>Copied!';
        btn.classList.add('btn-success');
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('btn-success');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
}; 