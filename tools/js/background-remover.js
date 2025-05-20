// Background Remover Class
class BackgroundRemover {
    constructor() {
        // API Key
        this.API_KEY = "4EsbZjKKCqTJLcYDwncFihre";

        // Initialize state
        this.state = {
            isProcessing: false,
            currentFile: null,
            originalImageUrl: null,
            resultImageUrl: null,
            currentBgColor: 'transparent',
            zoom: 100
        };

        // Initialize elements
        this.initializeElements();
        
        // Initialize event listeners
        this.initializeEventListeners();

        // Initialize tooltips
        this.initializeTooltips();
    }

    // Initialize DOM elements
    initializeElements() {
        try {
            this.elements = {
                // Main containers
                uploadContainer: document.getElementById('uploadContainer'),
                dropZone: document.getElementById('dropZone'),
                previewContainer: document.getElementById('previewContainer'),
                resultContainer: document.getElementById('resultContainer'),
                placeholderResult: document.getElementById('placeholderResult'),
                
                // Input elements
                fileInput: document.getElementById('fileInput'),
                qualitySelect: document.getElementById('qualitySelect'),
                refinementSlider: document.getElementById('refinementSlider'),
                preserveShadows: document.getElementById('preserveShadows'),
                enhanceDetails: document.getElementById('enhanceDetails'),
                
                // Preview elements
                previewImage: document.getElementById('previewImage'),
                resultImage: document.getElementById('resultImage'),
                
                // Action buttons
                processBtn: document.getElementById('processBtn'),
                removeBtn: document.getElementById('removeBtn'),
                rotateBtn: document.getElementById('rotateBtn'),
                cropBtn: document.getElementById('cropBtn'),
                downloadBtn: document.getElementById('downloadBtn'),
                copyBtn: document.getElementById('copyBtn'),
                shareBtn: document.getElementById('shareBtn'),
                
                // Info elements
                resultSize: document.getElementById('resultSize'),
                resultFormat: document.getElementById('resultFormat'),
                qualityValue: document.getElementById('qualityValue'),
                refinementValue: document.getElementById('refinementValue')
            };

            // Validate required elements
            const requiredElements = ['dropZone', 'fileInput', 'processBtn', 'resultContainer'];
            for (const elementName of requiredElements) {
                if (!this.elements[elementName]) {
                    throw new Error(`Required element "${elementName}" not found`);
                }
            }
        } catch (error) {
            console.error('Error initializing elements:', error);
            this.showToast('Error initializing application', 'error');
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        try {
            // File input and drop zone
            this.elements.dropZone.addEventListener('click', () => this.elements.fileInput.click());
            this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            
            // Drag and drop events
            this.elements.dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.elements.dropZone.classList.add('drag-over');
            });
            
            this.elements.dropZone.addEventListener('dragleave', () => {
                this.elements.dropZone.classList.remove('drag-over');
            });
            
            this.elements.dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.elements.dropZone.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    this.handleFile(e.dataTransfer.files[0]);
                }
            });

            // Button actions
            this.elements.processBtn.addEventListener('click', () => this.processImage());
            this.elements.removeBtn.addEventListener('click', () => this.resetUpload());
            this.elements.rotateBtn.addEventListener('click', () => this.rotateImage());
            this.elements.cropBtn.addEventListener('click', () => this.enableCropping());
            this.elements.downloadBtn.addEventListener('click', () => this.downloadImage());
            this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
            this.elements.shareBtn.addEventListener('click', () => this.showShareModal());
            
            // Settings changes
            this.elements.qualitySelect.addEventListener('change', () => this.updateQuality());
            this.elements.refinementSlider.addEventListener('input', () => this.updateRefinement());
            this.elements.preserveShadows.addEventListener('change', () => this.updateSettings());
            this.elements.enhanceDetails.addEventListener('change', () => this.updateSettings());

            // Background options
            document.querySelectorAll('.bg-option').forEach(option => {
                option.addEventListener('click', () => {
                    this.updateBackgroundOption(option);
                });
            });

        } catch (error) {
            console.error('Error initializing event listeners:', error);
            this.showToast('Error setting up event handlers', 'error');
        }
    }

    // Initialize Bootstrap tooltips
    initializeTooltips() {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }

    // Handle file selection
    handleFileSelect(event) {
        if (event.target.files.length > 0) {
            this.handleFile(event.target.files[0]);
            // Clear the input to allow selecting the same file again
            event.target.value = '';
        }
    }

    // Process the selected file
    handleFile(file) {
        try {
            // Disable process button during file handling
            this.elements.processBtn.disabled = true;
            
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                this.showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
                this.elements.processBtn.disabled = false;
                return;
            }
            
            // Validate file size (12MB limit for Remove.bg API)
            if (file.size > 12 * 1024 * 1024) {
                this.showToast('Image file size must be less than 12MB.', 'error');
                this.elements.processBtn.disabled = false;
                return;
            }
            
            // Store file for processing
            this.state.currentFile = file;
            
            // Create preview with loading indicator
            this.showLoadingPreview();
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.state.originalImageUrl = e.target.result;
                this.elements.previewImage.src = this.state.originalImageUrl;
                
                // Show preview
                this.showPreview();
                this.elements.processBtn.disabled = false;
            };
            
            reader.onerror = () => {
                this.showToast('Error reading the selected file.', 'error');
                this.elements.processBtn.disabled = false;
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error handling file:', error);
            this.showToast('Error processing the selected file.', 'error');
            this.elements.processBtn.disabled = false;
        }
    }

    // Show loading preview
    showLoadingPreview() {
        this.elements.dropZone.classList.add('d-none');
        this.elements.previewContainer.classList.remove('d-none');
        this.elements.previewImage.src = '';
        this.elements.previewImage.classList.add('loading');
    }

    // Show preview screen
    showPreview() {
        // Hide drop zone with fade out
        this.elements.dropZone.style.opacity = '0';
        setTimeout(() => {
            this.elements.dropZone.classList.add('d-none');
            
            // Show preview container with animation
            this.elements.previewContainer.classList.remove('d-none');
            requestAnimationFrame(() => {
                this.elements.previewContainer.classList.add('show');
            });
            
            // Remove loading state
            this.elements.previewImage.classList.remove('loading');
        }, 300);

        this.elements.resultContainer.classList.add('d-none');
        this.elements.placeholderResult.classList.remove('d-none');
        
        // Reset process button
        const btnContent = this.elements.processBtn.querySelector('.btn-content');
        if (btnContent) {
            btnContent.classList.remove('processing');
        }
        
        // Add image load event for better preview
        this.elements.previewImage.onload = () => {
            this.elements.previewImage.classList.remove('loading');
            this.showToast('Image loaded successfully!', 'success');
        };
    }

    // Process image with Remove.bg API
    processImage() {
        if (!this.state.currentFile) {
            this.showToast('Please select an image first', 'warning');
            return;
        }

        // Show processing state
        const btnContent = this.elements.processBtn.querySelector('.btn-content');
        if (btnContent) {
            btnContent.classList.add('processing');
        }

        // Create form data
        const formData = new FormData();
        formData.append('image_file', this.state.currentFile);
        formData.append('size', 'auto');

        // Add settings
        if (this.elements.preserveShadows.checked) {
            formData.append('preserve_shadows', 'true');
        }
        if (this.elements.enhanceDetails.checked) {
            formData.append('enhance_details', 'true');
        }
        
        // Make API request
        axios({
            method: 'post',
            url: 'https://api.remove.bg/v1.0/removebg',
            data: formData,
            responseType: 'arraybuffer',
            headers: {
                'X-Api-Key': this.API_KEY,
                'Content-Type': 'multipart/form-data',
            },
        })
        .then(response => {
            // Convert response to base64
            const base64 = btoa(
                new Uint8Array(response.data)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            
            // Set result image
            this.state.resultImageUrl = `data:image/png;base64,${base64}`;
            this.elements.resultImage.src = this.state.resultImageUrl;
            
            // Show result
            this.showResult();
            this.showToast('Background removed successfully!', 'success');
        })
        .catch(error => {
            console.error('Error removing background:', error);
            
            // Parse error message if possible
            let errorMsg = 'An error occurred during background removal.';
            
            if (error.response && error.response.data) {
                try {
                    const decoder = new TextDecoder('utf-8');
                    const errorJson = JSON.parse(decoder.decode(error.response.data));
                    if (errorJson.errors && errorJson.errors.length > 0) {
                        errorMsg = errorJson.errors[0].title;
                    }
                } catch (e) {
                    errorMsg = `Error: ${error.response.status} - ${error.response.statusText}`;
                }
            }
            
            this.showToast(errorMsg, 'error');
            this.resetProcessButton();
        });
    }

    // Show result screen
    showResult() {
        this.elements.resultContainer.classList.remove('d-none');
        this.elements.placeholderResult.classList.add('d-none');
        this.resetProcessButton();
        this.updateResultInfo();
    }

    // Reset process button
    resetProcessButton() {
        const btnContent = this.elements.processBtn.querySelector('.btn-content');
        if (btnContent) {
            btnContent.classList.remove('processing');
        }
    }

    // Update result information
    updateResultInfo() {
        if (this.state.resultImageUrl) {
            // Update format
            const format = this.elements.qualitySelect.value;
            this.elements.resultFormat.textContent = format.toUpperCase();
            
            // Update size
            const img = new Image();
            img.onload = () => {
                const size = Math.round((this.state.resultImageUrl.length * 3/4) / 1024);
                this.elements.resultSize.textContent = size > 1024 ? 
                    `${(size/1024).toFixed(1)} MB` : 
                    `${size} KB`;
            };
            img.src = this.state.resultImageUrl;
        }
    }

    // Reset upload with smooth transitions
    resetUpload() {
        // Fade out preview
        this.elements.previewContainer.classList.remove('show');
        
        setTimeout(() => {
            this.elements.fileInput.value = '';
            this.elements.previewContainer.classList.add('d-none');
            this.elements.resultContainer.classList.add('d-none');
            this.elements.placeholderResult.classList.remove('d-none');
            
            // Show drop zone with fade in
            this.elements.dropZone.classList.remove('d-none');
            requestAnimationFrame(() => {
                this.elements.dropZone.style.opacity = '1';
            });
            
            this.state.currentFile = null;
            this.state.originalImageUrl = null;
            this.state.resultImageUrl = null;
        }, 300);
    }

    // Update background option
    updateBackgroundOption(option) {
        // Update active state
        document.querySelectorAll('.bg-option').forEach(opt => {
            opt.classList.remove('border-primary');
            opt.classList.add('border-secondary');
        });
        option.classList.remove('border-secondary');
        option.classList.add('border-primary');
        
        // Apply background
        this.applyBackground(option.dataset.bg);
    }

    // Apply background color
    applyBackground(color) {
        this.state.currentBgColor = color;
        
        if (color === 'transparent') {
            this.elements.resultContainer.style.backgroundColor = '';
            this.elements.resultContainer.classList.add('checkerboard');
        } else {
            this.elements.resultContainer.style.backgroundColor = color;
            this.elements.resultContainer.classList.remove('checkerboard');
        }
    }

    // Download image
    downloadImage() {
        const format = document.querySelector('input[name="format"]:checked').value;
        const canvas = document.createElement('canvas');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (this.state.currentBgColor !== 'transparent' && format === 'jpg') {
                ctx.fillStyle = this.state.currentBgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(img, 0, 0);
            
            const resultDataUrl = format === 'png' ? 
                canvas.toDataURL('image/png') : 
                canvas.toDataURL('image/jpeg', 0.9);
            
            const filename = `removed-background.${format}`;
            
            const link = document.createElement('a');
            link.href = resultDataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        img.src = this.state.resultImageUrl;
    }

    // Copy to clipboard
    copyToClipboard() {
        if (this.state.resultImageUrl) {
            fetch(this.state.resultImageUrl)
                .then(res => res.blob())
                .then(blob => {
                    navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]).then(() => {
                        this.showToast('Image copied to clipboard!', 'success');
                    }).catch(err => {
                        console.error('Error copying to clipboard:', err);
                        this.showToast('Failed to copy image to clipboard', 'error');
                    });
                });
        }
    }

    // Show share modal
    showShareModal() {
        const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
        shareModal.show();
    }

    // Show toast notification
    showToast(message, type = 'info') {
        try {
            const colors = {
                success: '#198754',
                error: '#dc3545',
                info: '#0dcaf0',
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
            if (type === 'error') {
                alert(message);
            }
        }
    }
}

// Initialize the background remover when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.backgroundRemover = new BackgroundRemover();
    } catch (error) {
        console.error('Error initializing background remover:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
}); 