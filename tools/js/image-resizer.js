/**
 * DarkTools - Image Resizer & Optimizer
 * Main JavaScript file for the image resizer tool
 */

// Disable Dropzone auto discover to prevent conflicts - must be before DOMContentLoaded
Dropzone.autoDiscover = false;

document.addEventListener('DOMContentLoaded', () => {
    // Theme management is handled by js/dark-tools.js (ThemeManager)
    
    // ===============================
    // Single Image Processing
    // ===============================
    let currentImage = null;
    
    // Clone dz-message template first, before Dropzone initialization changes DOM
    const singleDropzoneMessage = document.querySelector('#singleDropzone .dz-message').cloneNode(true);
    const batchDropzoneMessage = document.querySelector('#batchDropzone .dz-message').cloneNode(true);
    const compressDropzoneMessage = document.querySelector('#compressDropzone .dz-message').cloneNode(true);
    
    // Initialize Dropzone for single image
    const singleDropzone = new Dropzone("#singleDropzone", {
        url: "javascript:void(0)", // Placeholder URL that won't cause errors
        autoProcessQueue: false,
        maxFiles: 1,
        acceptedFiles: "image/*",
        addRemoveLinks: true,
        dictRemoveFile: '<i class="fas fa-times"></i>',
        clickable: true,
        createImageThumbnails: true,
        init: function() {
            this.on("success", function(file) {
                console.log("File uploaded successfully");
            });
            
            this.on("error", function(file, errorMessage) {
                console.error("Error uploading file:", errorMessage);
                showToast("Error uploading file: " + errorMessage, "error");
            });
            
            this.on("addedfile", function(file) {
                document.querySelector('#singleDropzone .dz-message').style.display = 'none';
                handleSingleFileUpload(file);
            });
            
            this.on("removedfile", function(file) {
                document.querySelector('#singleDropzone .dz-message').style.display = 'flex';
                resetSingleImageProcess();
            });
        }
    });
    
    // Handle file upload for single image
    const handleSingleFileUpload = (file) => {
        currentImage = file;
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Display original image preview
            const imgPreview = document.getElementById('originalPreview');
            const previewWrapper = document.getElementById('originalPreviewWrapper');
            const imgInfo = document.getElementById('originalImageInfo');
            
            imgPreview.src = e.target.result;
            previewWrapper.classList.remove('d-none');
            
            // Get image dimensions
            const img = new Image();
            img.onload = function() {
                const width = this.width;
                const height = this.height;
                const fileSize = formatFileSize(file.size);
                
                // Add image info
                imgInfo.textContent = `${width}x${height} | ${fileSize} | ${file.type.split('/')[1].toUpperCase()}`;
                
                // Set default dimensions in resize options
                document.getElementById('width').value = width;
                document.getElementById('height').value = height;
                
                // Enable process button
                document.getElementById('processImage').disabled = false;
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    };
    
    // Reset single image process
    const resetSingleImageProcess = () => {
        currentImage = null;
        document.getElementById('originalPreviewWrapper').classList.add('d-none');
        document.getElementById('processedResult').classList.add('d-none');
        document.getElementById('processImage').disabled = true;
    };
    
    // Handle resize type selection
    const resizeTypeOptions = document.querySelectorAll('.resize-type-option');
    const resizeOptions = document.querySelectorAll('.resize-options');
    
    resizeTypeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            resizeTypeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to selected option
            option.classList.add('active');
            
            // Show corresponding options
            const type = option.dataset.type;
            resizeOptions.forEach(opt => opt.classList.add('d-none'));
            document.getElementById(`${type}Options`).classList.remove('d-none');
        });
    });
    
    // Handle preset buttons
    const presetButtons = document.querySelectorAll('.preset-button');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const width = button.dataset.width;
            const height = button.dataset.height;
            
            document.getElementById('width').value = width;
            document.getElementById('height').value = height;
            
            // Switch to dimensions tab
            resizeTypeOptions.forEach(opt => opt.classList.remove('active'));
            document.querySelector('.resize-type-option[data-type="dimensions"]').classList.add('active');
            
            resizeOptions.forEach(opt => opt.classList.add('d-none'));
            document.getElementById('dimensionsOptions').classList.remove('d-none');
        });
    });
    
    // Handle aspect ratio maintenance
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    let aspectRatio = 1;
    
    widthInput.addEventListener('input', () => {
        if (maintainAspectRatio.checked && aspectRatio && currentImage) {
            const width = parseInt(widthInput.value);
            heightInput.value = Math.round(width / aspectRatio);
        }
    });
    
    heightInput.addEventListener('input', () => {
        if (maintainAspectRatio.checked && aspectRatio && currentImage) {
            const height = parseInt(heightInput.value);
            widthInput.value = Math.round(height * aspectRatio);
        }
    });
    
    // Handle percentage scale
    const scalePercentage = document.getElementById('scalePercentage');
    const scaleValue = document.getElementById('scaleValue');
    
    scalePercentage.addEventListener('input', () => {
        scaleValue.textContent = `${scalePercentage.value}%`;
    });
    
    // Handle quality slider
    const outputQuality = document.getElementById('outputQuality');
    const qualityValue = document.getElementById('qualityValue');
    
    outputQuality.addEventListener('input', () => {
        qualityValue.textContent = `${outputQuality.value}%`;
    });
    
    // Process image
    const processImage = document.getElementById('processImage');
    processImage.addEventListener('click', () => {
        if (!currentImage) {
            showToast('Please upload an image first', 'error');
            return;
        }
        
        // Get processing options
        const resizeType = document.querySelector('.resize-type-option.active').dataset.type;
        const outputFormat = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('outputQuality').value) / 100;
        const removeMetadata = document.getElementById('removeMetadata').checked;
        let customFileName = document.getElementById('fileName').value;
        
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Create image for processing
        const img = new Image();
        img.onload = function() {
            // Get original dimensions
            let srcWidth = img.width;
            let srcHeight = img.height;
            aspectRatio = srcWidth / srcHeight;
            
            // Calculate new dimensions
            let newWidth, newHeight;
            
            switch (resizeType) {
                case 'dimensions':
                    newWidth = parseInt(widthInput.value) || srcWidth;
                    newHeight = parseInt(heightInput.value) || srcHeight;
                    break;
                    
                case 'percentage':
                    const scale = parseInt(scalePercentage.value) / 100;
                    newWidth = Math.round(srcWidth * scale);
                    newHeight = Math.round(srcHeight * scale);
                    break;
                    
                case 'preset':
                    // This is handled by the dimension inputs already
                    newWidth = parseInt(widthInput.value) || srcWidth;
                    newHeight = parseInt(heightInput.value) || srcHeight;
                    break;
                    
                default:
                    newWidth = srcWidth;
                    newHeight = srcHeight;
            }
            
            // Set canvas dimensions
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // Draw image on canvas (this is where resizing happens)
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            // Convert canvas to Blob
            canvas.toBlob(function(blob) {
                // Create object URL from blob
                const processedImageUrl = URL.createObjectURL(blob);
                
                // Display processed image
                const processedPreview = document.getElementById('processedPreview');
                const processedInfo = document.getElementById('processedImageInfo');
                const processedResult = document.getElementById('processedResult');
                
                processedPreview.src = processedImageUrl;
                processedInfo.textContent = `${newWidth}x${newHeight} | ${formatFileSize(blob.size)} | ${outputFormat.toUpperCase()}`;
                processedResult.classList.remove('d-none');
                
                // Scroll to results
                processedResult.scrollIntoView({ behavior: 'smooth' });
                
                // Setup download button
                const downloadButton = document.getElementById('downloadImage');
                
                // Set custom file name or use original
                if (!customFileName) {
                    const originalName = currentImage.name.split('.');
                    originalName.pop(); // Remove extension
                    customFileName = `${originalName.join('.')}_resized`;
                }
                
                // Set download attributes
                downloadButton.onclick = function() {
                    const a = document.createElement('a');
                    a.href = processedImageUrl;
                    a.download = `${customFileName}.${outputFormat}`;
                    a.click();
                };
                
                // Show success message
                showToast('Image processed successfully');
            }, `image/${outputFormat}`, quality);
        };
        img.src = URL.createObjectURL(currentImage);
    });
    
    // Start over button
    const startOver = document.getElementById('startOver');
    startOver.addEventListener('click', () => {
        // Clear dropzone
        singleDropzone.removeAllFiles();
        
        // Reset form
        resetSingleImageProcess();
    });
    
    // ===============================
    // Batch Processing
    // ===============================
    let batchFiles = [];
    let processedBatchFiles = [];
    
    // Initialize Dropzone for batch processing
    const batchDropzone = new Dropzone("#batchDropzone", {
        url: "javascript:void(0)", // Placeholder URL that won't cause errors
        autoProcessQueue: false,
        maxFiles: 20,
        acceptedFiles: "image/*",
        addRemoveLinks: true,
        dictRemoveFile: '<i class="fas fa-times"></i>',
        clickable: true,
        createImageThumbnails: true,
        init: function() {
            this.on("success", function(file) {
                console.log("File uploaded successfully");
            });
            
            this.on("error", function(file, errorMessage) {
                console.error("Error uploading file:", errorMessage);
                showToast("Error uploading file: " + errorMessage, "error");
            });
            
            this.on("addedfile", function(file) {
                document.querySelector('#batchDropzone .dz-message').style.display = 'none';
                handleBatchFileUpload(file);
            });
            
            this.on("removedfile", function(file) {
                removeBatchFile(file);
                if (batchFiles.length === 0) {
                    document.querySelector('#batchDropzone .dz-message').style.display = 'flex';
                }
            });
        }
    });
    
    // Handle file upload for batch processing
    const handleBatchFileUpload = (file) => {
        batchFiles.push(file);
        
        // Update UI
        updateBatchFileList();
        updateFileCount();
        
        // Enable process button
        document.getElementById('processBatch').disabled = false;
    };
    
    // Remove file from batch
    const removeBatchFile = (file) => {
        const index = batchFiles.indexOf(file);
        if (index > -1) {
            batchFiles.splice(index, 1);
        }
        
        // Update UI
        updateBatchFileList();
        updateFileCount();
        
        // Disable process button if no files
        if (batchFiles.length === 0) {
            document.getElementById('processBatch').disabled = true;
        }
    };
    
    // Update file count
    const updateFileCount = () => {
        document.getElementById('fileCount').textContent = batchFiles.length;
    };
    
    // Update batch file list
    const updateBatchFileList = () => {
        const fileList = document.getElementById('batchFileList');
        
        if (batchFiles.length === 0) {
            fileList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-images fs-1 mb-3 d-block"></i>
                    <p>Uploaded images will appear here</p>
                </div>
            `;
            return;
        }
        
        fileList.innerHTML = '';
        
        batchFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'batch-file-item';
            
            // Create file preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const width = this.width;
                    const height = this.height;
                    
                    const fileDetails = document.querySelector(`#batch-file-${index} .batch-file-details`);
                    fileDetails.textContent = `${width}x${height} | ${formatFileSize(file.size)} | ${file.type.split('/')[1].toUpperCase()}`;
                };
                img.src = e.target.result;
                
                const filePreview = document.querySelector(`#batch-file-${index} .batch-file-preview`);
                filePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            fileItem.id = `batch-file-${index}`;
            fileItem.innerHTML = `
                <img class="batch-file-preview" src="" alt="${file.name}">
                <div class="batch-file-info">
                    <div class="batch-file-name">${file.name}</div>
                    <div class="batch-file-details">Loading...</div>
                </div>
                <div class="batch-file-actions">
                    <button class="btn btn-sm btn-outline-danger remove-batch-file" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-batch-file').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                batchDropzone.removeFile(batchFiles[index]);
            });
        });
    };
    
    // Handle batch resize method selection
    const batchResizeMethodRadios = document.querySelectorAll('input[name="batchResizeMethod"]');
    batchResizeMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Disable all related inputs
            document.getElementById('batchMaxWidth').disabled = true;
            document.getElementById('batchMaxHeight').disabled = true;
            document.getElementById('batchScalePercentage').disabled = true;
            document.getElementById('batchExactWidth').disabled = true;
            document.getElementById('batchExactHeight').disabled = true;
            
            // Enable inputs based on selected method
            const method = radio.value;
            switch (method) {
                case 'maxSize':
                    document.getElementById('batchMaxWidth').disabled = false;
                    document.getElementById('batchMaxHeight').disabled = false;
                    break;
                case 'percentage':
                    document.getElementById('batchScalePercentage').disabled = false;
                    break;
                case 'exactSize':
                    document.getElementById('batchExactWidth').disabled = false;
                    document.getElementById('batchExactHeight').disabled = false;
                    break;
            }
        });
    });
    
    // Handle batch scale percentage
    const batchScalePercentage = document.getElementById('batchScalePercentage');
    const batchScaleValue = document.getElementById('batchScaleValue');
    
    batchScalePercentage.addEventListener('input', () => {
        batchScaleValue.textContent = `${batchScalePercentage.value}%`;
    });
    
    // Handle batch quality slider
    const batchQuality = document.getElementById('batchQuality');
    const batchQualityValue = document.getElementById('batchQualityValue');
    
    batchQuality.addEventListener('input', () => {
        batchQualityValue.textContent = `${batchQuality.value}%`;
    });
    
    // Process batch
    const processBatch = document.getElementById('processBatch');
    processBatch.addEventListener('click', () => {
        if (batchFiles.length === 0) {
            showToast('Please upload at least one image', 'error');
            return;
        }
        
        // Get processing options
        const method = document.querySelector('input[name="batchResizeMethod"]:checked').value;
        const outputFormat = document.getElementById('batchOutputFormat').value;
        const quality = parseInt(document.getElementById('batchQuality').value) / 100;
        const removeMetadata = document.getElementById('batchRemoveMetadata').checked;
        const filePrefix = document.getElementById('batchFilePrefix').value || '';
        
        // Reset processed files
        processedBatchFiles = [];
        
        // Show processing status
        const batchProgress = document.getElementById('batchProgress');
        const batchStatus = document.getElementById('batchStatus');
        const batchSpinner = document.getElementById('batchSpinner');
        
        batchProgress.style.width = '0%';
        batchProgress.textContent = '0%';
        batchProgress.setAttribute('aria-valuenow', '0');
        batchStatus.textContent = 'Processing...';
        batchSpinner.classList.remove('d-none');
        
        // Disable process button
        processBatch.disabled = true;
        
        // Process each file
        let processedCount = 0;
        
        batchFiles.forEach((file, index) => {
            // Create canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create image for processing
            const img = new Image();
            img.onload = function() {
                // Get original dimensions
                let srcWidth = img.width;
                let srcHeight = img.height;
                let aspectRatio = srcWidth / srcHeight;
                
                // Calculate new dimensions
                let newWidth, newHeight;
                
                switch (method) {
                    case 'maxSize':
                        const maxWidth = parseInt(document.getElementById('batchMaxWidth').value) || srcWidth;
                        const maxHeight = parseInt(document.getElementById('batchMaxHeight').value) || srcHeight;
                        
                        if (srcWidth > maxWidth || srcHeight > maxHeight) {
                            if (srcWidth / maxWidth > srcHeight / maxHeight) {
                                newWidth = maxWidth;
                                newHeight = Math.round(maxWidth / aspectRatio);
                            } else {
                                newHeight = maxHeight;
                                newWidth = Math.round(maxHeight * aspectRatio);
                            }
                        } else {
                            newWidth = srcWidth;
                            newHeight = srcHeight;
                        }
                        break;
                        
                    case 'percentage':
                        const scale = parseInt(document.getElementById('batchScalePercentage').value) / 100;
                        newWidth = Math.round(srcWidth * scale);
                        newHeight = Math.round(srcHeight * scale);
                        break;
                        
                    case 'exactSize':
                        newWidth = parseInt(document.getElementById('batchExactWidth').value) || srcWidth;
                        newHeight = parseInt(document.getElementById('batchExactHeight').value) || srcHeight;
                        break;
                        
                    default:
                        newWidth = srcWidth;
                        newHeight = srcHeight;
                }
                
                // Set canvas dimensions
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Draw image on canvas (this is where resizing happens)
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Determine output format
                let fileFormat = outputFormat;
                if (fileFormat === 'same') {
                    fileFormat = file.type.split('/')[1];
                }
                
                // Convert canvas to Blob
                canvas.toBlob(function(blob) {
                    // Save processed file
                    const fileName = `${filePrefix}${file.name.split('.')[0]}.${fileFormat}`;
                    
                    processedBatchFiles.push({
                        name: fileName,
                        blob: blob,
                        type: `image/${fileFormat}`
                    });
                    
                    // Update progress
                    processedCount++;
                    const progress = Math.round((processedCount / batchFiles.length) * 100);
                    batchProgress.style.width = `${progress}%`;
                    batchProgress.textContent = `${progress}%`;
                    batchProgress.setAttribute('aria-valuenow', progress);
                    
                    // Check if all files are processed
                    if (processedCount === batchFiles.length) {
                        batchStatus.textContent = `All ${batchFiles.length} images processed successfully`;
                        batchSpinner.classList.add('d-none');
                        
                        // Enable download button
                        document.getElementById('downloadAllBatch').disabled = false;
                        
                        showToast('Batch processing completed');
                    }
                }, `image/${fileFormat}`, quality);
            };
            img.src = URL.createObjectURL(file);
        });
    });
    
    // Download all processed files as ZIP
    const downloadAllBatch = document.getElementById('downloadAllBatch');
    downloadAllBatch.addEventListener('click', () => {
        if (processedBatchFiles.length === 0) {
            showToast('No processed files to download', 'error');
            return;
        }
        
        // Create ZIP file
        const zip = new JSZip();
        
        // Add files to ZIP
        processedBatchFiles.forEach(file => {
            zip.file(file.name, file.blob);
        });
        
        // Generate ZIP and download
        zip.generateAsync({ type: 'blob' }).then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'processed_images.zip';
            a.click();
        });
    });
    
    // Clear batch
    const clearBatch = document.getElementById('clearBatch');
    clearBatch.addEventListener('click', () => {
        // Clear dropzone
        batchDropzone.removeAllFiles();
        
        // Reset variables
        batchFiles = [];
        processedBatchFiles = [];
        
        // Reset UI
        updateBatchFileList();
        updateFileCount();
        
        // Reset progress
        document.getElementById('batchProgress').style.width = '0%';
        document.getElementById('batchProgress').textContent = '0%';
        document.getElementById('batchProgress').setAttribute('aria-valuenow', '0');
        document.getElementById('batchStatus').textContent = 'No processing started yet';
        document.getElementById('batchSpinner').classList.add('d-none');
        
        // Disable buttons
        document.getElementById('processBatch').disabled = true;
        document.getElementById('downloadAllBatch').disabled = true;
    });
    
    // ===============================
    // Image Compression
    // ===============================
    let compressOriginalImage = null;
    let compressedImage = null;
    
    // Initialize Dropzone for compression
    const compressDropzone = new Dropzone("#compressDropzone", {
        url: "javascript:void(0)", // Placeholder URL that won't cause errors
        autoProcessQueue: false,
        maxFiles: 1,
        acceptedFiles: "image/*",
        addRemoveLinks: true,
        dictRemoveFile: '<i class="fas fa-times"></i>',
        clickable: true,
        createImageThumbnails: true,
        init: function() {
            this.on("success", function(file) {
                console.log("File uploaded successfully");
            });
            
            this.on("error", function(file, errorMessage) {
                console.error("Error uploading file:", errorMessage);
                showToast("Error uploading file: " + errorMessage, "error");
            });
            
            this.on("addedfile", function(file) {
                document.querySelector('#compressDropzone .dz-message').style.display = 'none';
                handleCompressFileUpload(file);
            });
            
            this.on("removedfile", function(file) {
                document.querySelector('#compressDropzone .dz-message').style.display = 'flex';
                resetCompression();
            });
        }
    });
    
    // Handle file upload for compression
    const handleCompressFileUpload = (file) => {
        compressOriginalImage = file;
        
        // Enable compress button
        document.getElementById('compressImage').disabled = false;
    };
    
    // Reset compression
    const resetCompression = () => {
        compressOriginalImage = null;
        compressedImage = null;
        
        // Hide results
        document.getElementById('compressionResults').classList.add('d-none');
        document.getElementById('noCompressionResults').classList.remove('d-none');
        
        // Disable compress button
        document.getElementById('compressImage').disabled = true;
    };
    
    // Handle compression level selection
    const compressionOptions = document.querySelectorAll('.compression-option');
    compressionOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            compressionOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to selected option
            option.classList.add('active');
            
            // Set compression level based on selected option
            const level = option.dataset.level;
            const customLevel = document.getElementById('customCompressionLevel');
            
            switch (level) {
                case 'low':
                    customLevel.value = 90;
                    break;
                case 'medium':
                    customLevel.value = 75;
                    break;
                case 'high':
                    customLevel.value = 50;
                    break;
            }
            
            // Update compression value display
            document.getElementById('compressionValue').textContent = `${customLevel.value}%`;
        });
    });
    
    // Handle custom compression level
    const customCompressionLevel = document.getElementById('customCompressionLevel');
    const compressionValue = document.getElementById('compressionValue');
    
    customCompressionLevel.addEventListener('input', () => {
        compressionValue.textContent = `${customCompressionLevel.value}%`;
        
        // Update compression option based on value
        compressionOptions.forEach(opt => opt.classList.remove('active'));
        
        const value = parseInt(customCompressionLevel.value);
        if (value >= 85) {
            document.querySelector('.compression-option[data-level="low"]').classList.add('active');
        } else if (value >= 65) {
            document.querySelector('.compression-option[data-level="medium"]').classList.add('active');
        } else {
            document.querySelector('.compression-option[data-level="high"]').classList.add('active');
        }
    });
    
    // Compress image
    const compressImage = document.getElementById('compressImage');
    compressImage.addEventListener('click', () => {
        if (!compressOriginalImage) {
            showToast('Please upload an image first', 'error');
            return;
        }
        
        // Get compression options
        const quality = parseInt(document.getElementById('customCompressionLevel').value) / 100;
        const removeMetadata = document.getElementById('compressRemoveMetadata').checked;
        const outputFormat = document.getElementById('compressOutputFormat').value;
        
        // Determine output format
        let fileFormat = outputFormat;
        if (fileFormat === 'same') {
            fileFormat = compressOriginalImage.type.split('/')[1];
        }
        
        // Use Compressor.js for image compression
        new Compressor(compressOriginalImage, {
            quality: quality,
            mimeType: `image/${fileFormat}`,
            checkOrientation: true,
            success(result) {
                // Save compressed file
                compressedImage = result;
                
                // Display results
                displayCompressionResults(compressOriginalImage, result);
                
                // Hide no results message
                document.getElementById('noCompressionResults').classList.add('d-none');
                
                // Show results
                document.getElementById('compressionResults').classList.remove('d-none');
                
                // Show success message
                showToast('Image compressed successfully');
            },
            error(err) {
                console.error('Compression error:', err);
                showToast('Error compressing image: ' + err.message, 'error');
            }
        });
    });
    
    // Display compression results
    const displayCompressionResults = (originalFile, compressedFile) => {
        // Get file sizes
        const originalSize = originalFile.size;
        const compressedSize = compressedFile.size;
        
        // Calculate stats
        const sizeReduction = originalSize - compressedSize;
        const compressionRatio = Math.round((compressedSize / originalSize) * 100);
        
        // Update UI
        document.getElementById('sizeReduction').textContent = `${formatFileSize(sizeReduction)}`;
        document.getElementById('compressionRatio').textContent = `${compressionRatio}%`;
        document.getElementById('spaceSaved').textContent = `${Math.round((sizeReduction / originalSize) * 100)}%`;
        
        // Create object URLs for previews
        const originalUrl = URL.createObjectURL(originalFile);
        const compressedUrl = URL.createObjectURL(compressedFile);
        
        // Show original image
        document.getElementById('originalCompressPreview').src = originalUrl;
        document.getElementById('originalCompressStats').textContent = `Original: ${formatFileSize(originalSize)}`;
        
        // Show compressed image
        document.getElementById('compressedPreview').src = compressedUrl;
        document.getElementById('compressedStats').textContent = `Compressed: ${formatFileSize(compressedSize)}`;
        
        // Setup comparison slider
        document.getElementById('beforeComparisonImg').src = originalUrl;
        document.getElementById('afterComparisonImg').src = compressedUrl;
        
        // Initialize comparison slider
        initializeComparisonSlider();
        
        // Setup download button
        const downloadButton = document.getElementById('downloadCompressed');
        downloadButton.onclick = function() {
            const a = document.createElement('a');
            a.href = compressedUrl;
            a.download = `compressed_${originalFile.name}`;
            a.click();
        };
    };
    
    // Initialize comparison slider
    const initializeComparisonSlider = () => {
        const slider = document.querySelector('.comparison-slider');
        const handle = document.querySelector('.comparison-handle');
        const after = document.querySelector('.comparison-after');
        let isDragging = false;
        
        const moveSlider = (e) => {
            if (!isDragging) return;
            
            const rect = slider.getBoundingClientRect();
            let x = e.clientX - rect.left;
            
            // Constrain x to slider width
            x = Math.max(0, Math.min(rect.width, x));
            
            // Calculate percentage
            const percent = (x / rect.width) * 100;
            
            // Update position
            handle.style.left = `${percent}%`;
            after.style.width = `${percent}%`;
        };
        
        // Mouse events
        handle.addEventListener('mousedown', () => {
            isDragging = true;
        });
        
        document.addEventListener('mousemove', moveSlider);
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Touch events
        handle.addEventListener('touchstart', () => {
            isDragging = true;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                moveSlider(e.touches[0]);
            }
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    };
    
    // Try again compression
    const tryAgainCompress = document.getElementById('tryAgainCompress');
    tryAgainCompress.addEventListener('click', () => {
        // Clear dropzone
        compressDropzone.removeAllFiles();
        
        // Reset compression
        resetCompression();
    });
    
    // Theme Management functions (initThemeManagement, updateThemeToggleAppearance) removed.
    // This is now handled by ThemeManager in js/dark-tools.js
    
    // ===============================
    // Utility Functions
    // ===============================
    
    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Toast notification
    const showToast = (message, type = 'success') => {
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'bottom',
            position: 'right',
            backgroundColor: type === 'success' ? '#00D097' : '#FF495C',
            className: 'toast-notification'
        }).showToast();
    };
}); 