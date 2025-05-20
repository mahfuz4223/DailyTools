// At the beginning of the file, add a function to ensure header and footer are always loaded
function ensureComponentsLoaded() {
    // Check if header is loaded
    setTimeout(() => {
        const header = document.getElementById('header');
        const footer = document.getElementById('footer');
        
        if (header && !header.innerHTML.trim()) {
            console.log('Loading fallback header');
            // Create fallback header
            header.innerHTML = `
                <nav class="navbar navbar-expand-lg navbar-dark">
                    <div class="container">
                        <a class="navbar-brand" href="../index.html">
                            <i class="fas fa-tools me-2"></i>DarkTools
                        </a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav ms-auto">
                                <li class="nav-item">
                                    <a class="nav-link" href="../index.html">Home</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link active" href="../tools.html">Tools</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="../about.html">About</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            `;
        }
        
        if (footer && !footer.innerHTML.trim()) {
            console.log('Loading fallback footer');
            // Create fallback footer
            footer.innerHTML = `
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
        
        // Hide loading message once components are loaded
        const corsNotice = document.querySelector('.cors-notice');
        if (corsNotice) {
            setTimeout(() => {
                corsNotice.style.display = 'none';
            }, 1000);
        }
    }, 100);
    
    // Try again after a longer delay just to be safe
    setTimeout(() => {
        const header = document.getElementById('header');
        const footer = document.getElementById('footer');
        
        if (header && !header.innerHTML.trim()) {
            // Force create header again
            console.log('Forcing header creation (second attempt)');
            createHeader();
        }
        
        if (footer && !footer.innerHTML.trim()) {
            // Force create footer again
            console.log('Forcing footer creation (second attempt)');
            createFooter();
        }
    }, 2000);
}

// Create header with inline content to avoid CORS
function createHeader() {
    const header = document.getElementById('header');
    if (header) {
        header.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark">
                <div class="container">
                    <a class="navbar-brand" href="../index.html">
                        <i class="fas fa-tools me-2"></i>DarkTools
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="../index.html">Home</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link active" href="../tools.html">Tools</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="../about.html">About</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }
}

// Create footer with inline content to avoid CORS
function createFooter() {
    const footer = document.getElementById('footer');
    if (footer) {
        footer.innerHTML = `
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

// PDF Tools JavaScript with enhanced interactivity

// Handle file:// protocol specifically
if (window.location.protocol === 'file:') {
    console.log('File protocol detected, ensuring direct component loading');
    // Will use direct component loading instead of fetching
}

// Disable Dropzone auto discover to prevent conflicts before DOM content loads
Dropzone.autoDiscover = false;

// Global variables to store dropzone instances
let mergeDropzone, splitDropzone, compressDropzone, convertDropzone;
// Global variables for PDF.js
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Ensure header and footer are loaded
    ensureComponentsLoaded();

    // Initialize tooltips
    try {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } catch (error) {
        console.error("Error initializing tooltips:", error);
    }

    // Initialize help modal
    const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
    
    // Help button event listener
    document.getElementById('helpButton').addEventListener('click', function() {
        helpModal.show();
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl + O to open file selector
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            
            // Determine active tab and trigger file selector
            const activeTab = document.querySelector('.tab-pane.active');
            if (activeTab) {
                const dropzoneId = activeTab.querySelector('.dropzone').id;
                const dropzoneElement = document.getElementById(dropzoneId);
                if (dropzoneElement) {
                    dropzoneElement.click();
                }
            }
        }
        
        // Left/Right arrows for PDF navigation
        if (e.key === 'ArrowLeft') {
            const prevButton = document.getElementById('prevPage');
            if (prevButton && !prevButton.disabled) {
                prevButton.click();
            }
        }
        
        if (e.key === 'ArrowRight') {
            const nextButton = document.getElementById('nextPage');
            if (nextButton && !nextButton.disabled) {
                nextButton.click();
            }
        }
        
        // Escape key to cancel current operation
        if (e.key === 'Escape') {
            // Close any active modals or dropdowns
            const activeModals = document.querySelectorAll('.modal.show');
            activeModals.forEach(modal => {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            });
        }
    });

    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Tab switching with smooth transitions
    const tabLinks = document.querySelectorAll('.nav-link');
    tabLinks.forEach(tab => {
        tab.addEventListener('click', function() {
            // Add transition class to tab content
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.add('tab-transition');
            });
        });
    });

    // Add hover effects to cards for better interactivity
    document.querySelectorAll('.glass-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('card-hover');
        });
        card.addEventListener('mouseleave', function() {
            this.classList.remove('card-hover');
        });
    });

    // Initialize merge PDF dropzone
    try {
        mergeDropzone = new Dropzone("#mergeDropzone", {
            url: "https://httpbin.org/post", // Placeholder URL
            acceptedFiles: "application/pdf",
            addRemoveLinks: true,
            maxFilesize: 50, // MB
            autoProcessQueue: false,
            parallelUploads: 10,
            createImageThumbnails: true,
            thumbnailWidth: 120,
            thumbnailHeight: 120,
            init: function() {
                this.on("addedfile", function(file) {
                    updateMergeFilesList();
                    document.getElementById('mergePdfs').removeAttribute('disabled');
                    // Add animation to newly added file
                    setTimeout(() => {
                        file.previewElement.classList.add('file-added-animation');
                    }, 10);
                });
                this.on("removedfile", function() {
                    updateMergeFilesList();
                    if (this.files.length === 0) {
                        document.getElementById('mergePdfs').setAttribute('disabled', 'true');
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error initializing merge dropzone:", error);
    }

    // Initialize split PDF dropzone
    try {
        splitDropzone = new Dropzone("#splitDropzone", {
            url: "https://httpbin.org/post", // Placeholder URL
            acceptedFiles: "application/pdf",
            addRemoveLinks: true,
            maxFilesize: 50, // MB
            maxFiles: 1,
            autoProcessQueue: false,
            createImageThumbnails: true,
            init: function() {
                this.on("addedfile", function(file) {
                    if (this.files.length > 1) {
                        this.removeFile(this.files[0]);
                    }
                    // Add animation and show preview
                    setTimeout(() => {
                        document.getElementById('splitPreviewContainer').classList.remove('d-none');
                        document.getElementById('splitPdf').removeAttribute('disabled');
                        loadPdfPreview(this.files[0], 'splitPreviewCanvas', 'splitPageInfo', 'splitPdfInfo');
                    }, 300);
                });
                this.on("removedfile", function() {
                    document.getElementById('splitPreviewContainer').classList.add('d-none');
                    document.getElementById('splitPdf').setAttribute('disabled', 'true');
                    pdfDoc = null;
                    currentPage = 1;
                    totalPages = 0;
                });
            }
        });
    } catch (error) {
        console.error("Error initializing split dropzone:", error);
    }

    // Initialize compress PDF dropzone
    try {
        compressDropzone = new Dropzone("#compressPdfDropzone", {
            url: "https://httpbin.org/post", // Placeholder URL
            acceptedFiles: "application/pdf",
            maxFilesize: 50, // MB
            maxFiles: 1,
            addRemoveLinks: true,
            autoProcessQueue: false,
            createImageThumbnails: true,
            init: function() {
                this.on("addedfile", function() {
                    if (this.files.length > 1) {
                        this.removeFile(this.files[0]);
                    }
                    document.getElementById('compressPdf').removeAttribute('disabled');
                    showCompressLoading();
                });
                this.on("removedfile", function() {
                    document.getElementById('compressPdf').setAttribute('disabled', 'true');
                    hideCompressLoading();
                });
            }
        });
    } catch (error) {
        console.error("Error initializing compress dropzone:", error);
    }

    // Initialize convert PDF dropzone
    try {
        convertDropzone = new Dropzone("#convertPdfDropzone", {
            url: "https://httpbin.org/post", // Placeholder URL
            acceptedFiles: "application/pdf",
            maxFilesize: 50, // MB
            maxFiles: 1,
            addRemoveLinks: true,
            autoProcessQueue: false,
            createImageThumbnails: true,
            init: function() {
                this.on("addedfile", function() {
                    if (this.files.length > 1) {
                        this.removeFile(this.files[0]);
                    }
                    document.getElementById('convertPdf').removeAttribute('disabled');
                });
                this.on("removedfile", function() {
                    document.getElementById('convertPdf').setAttribute('disabled', 'true');
                });
            }
        });
    } catch (error) {
        console.error("Error initializing convert dropzone:", error);
    }

    // Update merge files list with ordering functionality
    function updateMergeFilesList() {
        const fileList = document.getElementById('mergeFileList');
        if (!fileList) return;
        
        // Check if mergeDropzone exists and has files
        if (typeof mergeDropzone === 'undefined' || !mergeDropzone.files) {
            fileList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-file-pdf fs-1 mb-3 d-block"></i>
                    <p>Upload PDF files to merge them</p>
                </div>
            `;
            if (document.getElementById('pdfCount')) {
                document.getElementById('pdfCount').textContent = '0';
            }
            return;
        }
        
        const files = mergeDropzone.files;
        
        if (files.length === 0) {
            fileList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-file-pdf fs-1 mb-3 d-block"></i>
                    <p>Uploaded PDF files will appear here</p>
                </div>
            `;
            if (document.getElementById('pdfCount')) {
                document.getElementById('pdfCount').textContent = '0';
            }
            return;
        }
        
        if (document.getElementById('pdfCount')) {
            document.getElementById('pdfCount').textContent = files.length;
        }
        
        // Create sortable list
        fileList.innerHTML = '';
        const fileListUl = document.createElement('ul');
        fileListUl.className = 'sortable-list list-group';
        fileListUl.id = 'sortableFiles';
        
        files.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex align-items-center file-item';
            li.dataset.fileIndex = index;
            
            li.innerHTML = `
                <div class="drag-handle me-2">
                    <i class="fas fa-grip-vertical text-muted"></i>
                </div>
                <div class="file-thumb me-2">
                    <i class="fas fa-file-pdf text-primary"></i>
                </div>
                <div class="file-info flex-grow-1">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size text-muted small">${formatFileSize(file.size)}</div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-sm btn-outline-danger remove-file" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            fileListUl.appendChild(li);
        });
        
        fileList.appendChild(fileListUl);
        
        // Initialize sortable functionality if Sortable is defined
        if (typeof Sortable !== 'undefined') {
            try {
                new Sortable(fileListUl, {
                    animation: 150,
                    handle: '.drag-handle',
                    ghostClass: 'sortable-ghost',
                    onEnd: function() {
                        // Update order based on new positions
                        showToast('File order updated!', 'success');
                    }
                });
            } catch (error) {
                console.error('Error initializing Sortable:', error);
            }
        }
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                if (mergeDropzone && mergeDropzone.files && mergeDropzone.files[index]) {
                    mergeDropzone.removeFile(mergeDropzone.files[index]);
                }
            });
        });
    }

    // Load preview of merged PDF (actual rendering)
    document.getElementById('mergePdfs').addEventListener('click', function() {
        this.disabled = true;
        
        // Show loading spinner
        document.getElementById('mergeSpinner').classList.remove('d-none');
        document.getElementById('mergeStatus').textContent = 'Merging PDF files...';
        
        // Simulate processing with progress updates
        simulatePdfProcessing(
            () => {
                // After processing complete
                document.getElementById('mergeSpinner').classList.add('d-none');
                document.getElementById('mergeStatus').textContent = 'PDF files merged successfully!';
                document.getElementById('mergePreview').classList.remove('d-none');
                
                // Show success toast
                showToast('PDF files merged successfully!', 'success');
                
                // In a real implementation, we would load the actual merged PDF here
                // For demo purposes, we'll use first uploaded PDF as preview
                if (mergeDropzone.files.length > 0) {
                    const file = mergeDropzone.files[0];
                    const fileReader = new FileReader();
                    
                    fileReader.onload = function() {
                        const typedarray = new Uint8Array(this.result);
                        
                        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                            pdf.getPage(1).then(function(page) {
                                const canvas = document.getElementById('pdfPreviewCanvas');
                                const ctx = canvas.getContext('2d');
                                
                                const viewport = page.getViewport({ scale: 1.0 });
                                const scale = Math.min(
                                    canvas.width / viewport.width,
                                    canvas.height / viewport.height
                                ) * 0.9;
                                
                                const scaledViewport = page.getViewport({ scale: scale });
                                
                                canvas.width = scaledViewport.width;
                                canvas.height = scaledViewport.height;
                                
                                const renderContext = {
                                    canvasContext: ctx,
                                    viewport: scaledViewport
                                };
                                
                                page.render(renderContext).promise.then(function() {
                                    // Create a blob URL for download
                                    const blob = new Blob([file], { type: 'application/pdf' });
                                    const blobUrl = URL.createObjectURL(blob);
                                    document.getElementById('downloadMergedPdf').setAttribute('data-blob-url', blobUrl);
                                    document.getElementById('downloadMergedPdf').removeAttribute('disabled');
                                });
                            });
                        }).catch(function(error) {
                            console.error('Error loading preview PDF:', error);
                        });
                    };
                    
                    fileReader.readAsArrayBuffer(file);
                }
            }
        );
    });
    
    // Password toggle for merge PDF
    const addPasswordCheckbox = document.getElementById('addPassword');
    if (addPasswordCheckbox) {
        addPasswordCheckbox.addEventListener('change', function() {
            const passwordContainer = document.getElementById('passwordContainer');
            if (!passwordContainer) return;
            
            if (this.checked) {
                passwordContainer.classList.remove('d-none');
                passwordContainer.classList.add('slide-in');
            } else {
                passwordContainer.classList.add('d-none');
                passwordContainer.classList.remove('slide-in');
            }
        });
    }
    
    // Split PDF functionality
    const splitPdfButton = document.getElementById('splitPdf');
    if (splitPdfButton) {
        splitPdfButton.addEventListener('click', function() {
            this.disabled = true;
            
            // Show loading spinner
            const splitSpinner = document.getElementById('splitSpinner');
            const splitStatus = document.getElementById('splitStatus');
            const splitFilesList = document.getElementById('splitFilesList');
            const downloadAllSplit = document.getElementById('downloadAllSplit');
            
            if (splitSpinner) splitSpinner.classList.remove('d-none');
            if (splitStatus) splitStatus.textContent = 'Splitting PDF...';
            
            // Get the PDF file and verification
            const pdfFile = splitDropzone.files[0];
            if (!pdfFile || !pdfDoc) {
                showToast('Error: No valid PDF loaded', 'error');
                if (splitSpinner) splitSpinner.classList.add('d-none');
                if (splitStatus) splitStatus.textContent = 'Error: No valid PDF to split';
                this.disabled = false;
                return;
            }
            
            // Simulate processing
            simulatePdfProcessing(
                () => {
                    // After processing complete
                    if (splitSpinner) splitSpinner.classList.add('d-none');
                    if (splitStatus) {
                        splitStatus.classList.add('d-none');
                    }
                    if (splitFilesList) {
                        splitFilesList.classList.remove('d-none');
                    }
                    
                    // Show success toast
                    showToast('PDF split successfully!', 'success');
                    
                    // Get the actual PDF file
                    if (!pdfFile) {
                        showToast('Error: No PDF file found', 'error');
                        return;
                    }
                    
                    // Create sample split results with actual PDF data
                    if (splitFilesList) {
                        splitFilesList.innerHTML = '';
                        
                        const filePrefix = document.getElementById('splitFilePrefix').value || 'split_';
                        const splitMethod = document.querySelector('input[name="splitMethod"]:checked').id;
                        let numOutputFiles = 3; // Default for demo
                        
                        if (splitMethod === 'splitEach' && pdfDoc) {
                            numOutputFiles = Math.min(pdfDoc.numPages, 5); // Limit to 5 for demo
                        } else if (splitMethod === 'splitEvery') {
                            const pagesPerPdf = parseInt(document.getElementById('splitNPages').value) || 1;
                            numOutputFiles = Math.ceil(pdfDoc.numPages / pagesPerPdf);
                            numOutputFiles = Math.min(numOutputFiles, 5); // Limit to 5 for demo
                        } else if (splitMethod === 'splitRange') {
                            const pageRangesInput = document.getElementById('pageRanges').value;
                            if (pageRangesInput.trim()) {
                                const ranges = pageRangesInput.split(',');
                                numOutputFiles = Math.min(ranges.length, 5); // Limit to 5 for demo
                            }
                        }
                        
                        const splitPdfBlobs = [];
                        
                        for (let i = 1; i <= numOutputFiles; i++) {
                            // Create a blob for each split file (using the original file for demo)
                            const blob = new Blob([pdfFile], { type: 'application/pdf' });
                            const blobUrl = URL.createObjectURL(blob);
                            splitPdfBlobs.push(blobUrl);
                            
                            // Calculate the page range information for display
                            let pageInfo = '';
                            if (splitMethod === 'splitEach') {
                                pageInfo = `Page ${i}`;
                            } else if (splitMethod === 'splitEvery') {
                                const pagesPerPdf = parseInt(document.getElementById('splitNPages').value) || 1;
                                const startPage = ((i - 1) * pagesPerPdf) + 1;
                                const endPage = Math.min(i * pagesPerPdf, pdfDoc.numPages);
                                pageInfo = `Pages ${startPage}-${endPage}`;
                            } else if (splitMethod === 'splitRange') {
                                const pageRangesInput = document.getElementById('pageRanges').value;
                                if (pageRangesInput.trim()) {
                                    const ranges = pageRangesInput.split(',');
                                    if (i <= ranges.length) {
                                        pageInfo = `Range: ${ranges[i-1].trim()}`;
                                    } else {
                                        pageInfo = `Split ${i}`;
                                    }
                                } else {
                                    pageInfo = `Split ${i}`;
                                }
                            }
                            
                            const div = document.createElement('div');
                            div.className = 'split-file-item mb-2 p-2 border rounded d-flex align-items-center';
                            div.innerHTML = `
                                <div class="split-file-icon me-2">
                                    <i class="fas fa-file-pdf text-primary"></i>
                                </div>
                                <div class="split-file-info flex-grow-1">
                                    <div class="split-file-name">${filePrefix}${i}.pdf</div>
                                    <div class="split-file-info text-muted small">${pageInfo} • ${formatFileSize(Math.floor(pdfFile.size / numOutputFiles))}</div>
                                </div>
                                <div class="split-file-actions">
                                    <button class="btn btn-sm btn-outline-primary me-1 download-split-file" data-blob-url="${blobUrl}" data-filename="${filePrefix}${i}.pdf">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            `;
                            splitFilesList.appendChild(div);
                            
                            // Add appear animation
                            setTimeout(() => {
                                div.classList.add('file-appear');
                            }, i * 200);
                        }
                        
                        // Save all blob URLs for the "Download All" button
                        if (downloadAllSplit) {
                            downloadAllSplit.setAttribute('data-blob-urls', JSON.stringify(splitPdfBlobs));
                            downloadAllSplit.removeAttribute('disabled');
                        }
                        
                        // Add event listeners for individual download buttons
                        document.querySelectorAll('.download-split-file').forEach(button => {
                            button.addEventListener('click', function() {
                                const blobUrl = this.getAttribute('data-blob-url');
                                const filename = this.getAttribute('data-filename');
                                downloadFile(blobUrl, filename);
                            });
                        });
                    }
                }
            );
        });
    }
    
    // Download all split PDFs
    document.getElementById('downloadAllSplit').addEventListener('click', function() {
        const blobUrls = JSON.parse(this.getAttribute('data-blob-urls') || '[]');
        if (blobUrls.length === 0) {
            showToast('No PDF files to download', 'error');
            return;
        }
        
        // In a real implementation, we would use JSZip to create a zip file
        // For demo, just download the first file
        const filePrefix = document.getElementById('splitFilePrefix').value || 'split_';
        downloadPDF(blobUrls[0], `${filePrefix}1.pdf`);
        
        showToast('Downloading split PDFs...', 'success');
    });
    
    // Compress PDF functionality
    const compressPdfButton = document.getElementById('compressPdf');
    if (compressPdfButton) {
        compressPdfButton.addEventListener('click', function() {
            this.disabled = true;
            
            // Show loading spinner
            const compressionSpinner = document.getElementById('compressionSpinner');
            const noCompressionResults = document.getElementById('noCompressionResults');
            const compressionResults = document.getElementById('compressionResults');
            
            if (compressionSpinner) compressionSpinner.classList.remove('d-none');
            if (noCompressionResults) noCompressionResults.classList.add('processing');
            
            // Simulate processing
            simulatePdfProcessing(
                () => {
                    // After processing complete
                    if (compressionSpinner) compressionSpinner.classList.add('d-none');
                    if (noCompressionResults) noCompressionResults.classList.add('d-none');
                    if (compressionResults) {
                        compressionResults.classList.remove('d-none');
                        compressionResults.classList.add('results-appear');
                    }
                    
                    // Show success toast
                    showToast('PDF compressed successfully!', 'success');
                    
                    // Show compression results
                    const originalSize = Math.floor(Math.random() * 5000000) + 1000000;
                    const compressionLevelElement = document.querySelector('.compression-option.active');
                    const compressionLevel = compressionLevelElement ? compressionLevelElement.getAttribute('data-level') : 'medium';
                    
                    let reduction;
                    switch(compressionLevel) {
                        case 'low': reduction = 0.2; break;
                        case 'medium': reduction = 0.5; break;
                        case 'high': reduction = 0.8; break;
                        default: reduction = 0.5;
                    }
                    
                    const compressedSize = Math.floor(originalSize * (1 - reduction));
                    const savedSize = originalSize - compressedSize;
                    
                    const originalPdfStats = document.getElementById('originalPdfStats');
                    const compressedPdfStats = document.getElementById('compressedPdfStats');
                    const sizeReduction = document.getElementById('sizeReduction');
                    const compressionRatio = document.getElementById('compressionRatio');
                    const spaceSaved = document.getElementById('spaceSaved');
                    
                    if (originalPdfStats) {
                        originalPdfStats.innerHTML = `
                            <div><strong>Size:</strong> ${formatFileSize(originalSize)}</div>
                            <div><strong>Pages:</strong> 5</div>
                        `;
                    }
                    
                    if (compressedPdfStats) {
                        compressedPdfStats.innerHTML = `
                            <div><strong>Size:</strong> ${formatFileSize(compressedSize)}</div>
                            <div><strong>Pages:</strong> 5</div>
                        `;
                    }
                    
                    if (sizeReduction) sizeReduction.textContent = `${Math.floor(reduction * 100)}%`;
                    if (compressionRatio) compressionRatio.textContent = `${(1/(1-reduction)).toFixed(1)}x`;
                    if (spaceSaved) spaceSaved.textContent = formatFileSize(savedSize);
                    
                    // Draw placeholder previews
                    drawPlaceholderPreview('originalPdfPreview');
                    drawPlaceholderPreview('compressedPdfPreview');
                }
            );
        });
    }
    
    // Convert PDF functionality
    document.getElementById('convertPdf').addEventListener('click', function() {
        this.disabled = true;
        
        // Show conversion results and hide empty state
        document.getElementById('noConversionResults').classList.add('d-none');
        document.getElementById('conversionResults').classList.remove('d-none');
        document.getElementById('convertSpinner').classList.remove('d-none');
        
        // Update status
        document.getElementById('convertStatus').textContent = 'Converting PDF...';
        
        // Get selected format
        const selectedFormat = document.querySelector('.conversion-option.active').getAttribute('data-format');
        const quality = document.getElementById('imageQuality').value;
        
        // Get the PDF file
        const pdfFile = convertDropzone.files[0];
        if (!pdfFile) {
            showToast('Error: No PDF file to convert', 'error');
            return;
        }
        
        // Use FileReader to get the file content
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            
            // Load the PDF using PDF.js
            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                const numPages = pdf.numPages;
                const conversionPreview = document.getElementById('conversionPreview');
                conversionPreview.innerHTML = '';
                
                // Prepare blob URLs for download
                const blobUrls = [];
                let completedPages = 0;
                
                // Process each page based on selected range
                let pagesToConvert = [];
                const convertAllPages = document.getElementById('convertAllPages').checked;
                
                if (convertAllPages) {
                    for (let i = 1; i <= numPages; i++) {
                        pagesToConvert.push(i);
                    }
                } else {
                    // Parse page range input
                    const pageRangeInput = document.getElementById('convertPageRange').value;
                    const ranges = pageRangeInput.split(',');
                    
                    ranges.forEach(range => {
                        const trimmedRange = range.trim();
                        if (trimmedRange.includes('-')) {
                            // Range like 1-3
                            const [start, end] = trimmedRange.split('-').map(n => parseInt(n.trim()));
                            for (let i = start; i <= end; i++) {
                                if (i >= 1 && i <= numPages) {
                                    pagesToConvert.push(i);
                                }
                            }
                        } else {
                            // Single page
                            const page = parseInt(trimmedRange);
                            if (page >= 1 && page <= numPages) {
                                pagesToConvert.push(page);
                            }
                        }
                    });
                }
                
                // Limit to 5 pages for preview
                pagesToConvert = pagesToConvert.slice(0, 5);
                
                // Update progress bar for total pages
                document.getElementById('convertProgress').style.width = '0%';
                document.getElementById('convertProgress').textContent = '0%';
                
                // Convert each page
                pagesToConvert.forEach((pageNum, index) => {
                    pdf.getPage(pageNum).then(function(page) {
                        const viewport = page.getViewport({ scale: 1.5 });
                        
                        // Create a canvas for rendering
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        
                        // Render the PDF page to the canvas
                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        
                        page.render(renderContext).promise.then(function() {
                            // Process the canvas based on selected format
                            let dataUrl, mimeType, extension;
                            
                            switch(selectedFormat) {
                                case 'jpg':
                                    dataUrl = canvas.toDataURL('image/jpeg', quality / 100);
                                    mimeType = 'image/jpeg';
                                    extension = 'jpg';
                                    break;
                                case 'png':
                                    dataUrl = canvas.toDataURL('image/png');
                                    mimeType = 'image/png';
                                    extension = 'png';
                                    break;
                                case 'svg':
                                    // SVG conversion is more complex and would require additional libraries
                                    // Using PNG as fallback for demo
                                    dataUrl = canvas.toDataURL('image/png');
                                    mimeType = 'image/png';
                                    extension = 'png';
                                    break;
                                case 'text':
                                    // Text extraction would require additional processing
                                    // Using placeholder text
                                    dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Sample text content from page ' + pageNum);
                                    mimeType = 'text/plain';
                                    extension = 'txt';
                                    break;
                            }
                            
                            // Convert data URL to Blob
                            const binaryString = atob(dataUrl.split(',')[1]);
                            const array = [];
                            for (let i = 0; i < binaryString.length; i++) {
                                array.push(binaryString.charCodeAt(i));
                            }
                            const blob = new Blob([new Uint8Array(array)], { type: mimeType });
                            const blobUrl = URL.createObjectURL(blob);
                            blobUrls.push(blobUrl);
                            
                            // Create preview item
                            const div = document.createElement('div');
                            div.className = 'conversion-preview-item mb-3';
                            
                            const filename = `converted_page_${pageNum}.${extension}`;
                            const icon = selectedFormat === 'text' ? 'fa-file-alt' : 'fa-file-image';
                            const iconColor = selectedFormat === 'text' ? 'text-secondary' : 'text-primary';
                            
                            div.innerHTML = `
                                <div class="d-flex align-items-center mb-2">
                                    <div class="converted-file-icon me-2">
                                        <i class="fas ${icon} ${iconColor}"></i>
                                    </div>
                                    <div class="converted-file-info flex-grow-1">
                                        <div class="converted-file-name">${filename}</div>
                                    </div>
                                    <div class="converted-file-actions">
                                        <button class="btn btn-sm btn-outline-primary download-converted-file" data-blob-url="${blobUrl}" data-filename="${filename}">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="converted-preview glass-card p-2 text-center">
                                    ${selectedFormat === 'text' ? 
                                        `<div class="text-preview p-2 text-start">
                                            <p>Sample text content from page ${pageNum}...</p>
                                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                                        </div>` : 
                                        `<div class="image-preview">
                                            <img src="${dataUrl}" alt="Preview" style="max-width: 100%; max-height: 150px;">
                                        </div>`
                                    }
                                </div>
                            `;
                            
                            conversionPreview.appendChild(div);
                            
                            // Add appear animation
                            setTimeout(() => {
                                div.classList.add('preview-appear');
                            }, index * 200);
                            
                            // Update progress
                            completedPages++;
                            const progress = Math.round((completedPages / pagesToConvert.length) * 100);
                            document.getElementById('convertProgress').style.width = `${progress}%`;
                            document.getElementById('convertProgress').textContent = `${progress}%`;
                            document.getElementById('convertProgress').setAttribute('aria-valuenow', progress);
                            
                            // Check if all conversions are complete
                            if (completedPages === pagesToConvert.length) {
                                // Conversion complete
                                document.getElementById('convertSpinner').classList.add('d-none');
                                document.getElementById('convertStatus').textContent = 'Conversion complete!';
                                document.getElementById('downloadConverted').removeAttribute('disabled');
                                document.getElementById('downloadConverted').setAttribute('data-blob-urls', JSON.stringify(blobUrls));
                                
                                // Add event listeners for individual download buttons
                                document.querySelectorAll('.download-converted-file').forEach(button => {
                                    button.addEventListener('click', function() {
                                        const blobUrl = this.getAttribute('data-blob-url');
                                        const filename = this.getAttribute('data-filename');
                                        downloadFile(blobUrl, filename);
                                    });
                                });
                                
                                // Show success toast
                                showToast(`PDF converted to ${selectedFormat.toUpperCase()} successfully!`, 'success');
                            }
                        }).catch(error => {
                            console.error('Error rendering page:', error);
                            showToast('Error rendering page: ' + error.message, 'error');
                        });
                    }).catch(error => {
                        console.error('Error getting page:', error);
                        showToast('Error getting page: ' + error.message, 'error');
                    });
                });
                
                // Handle empty page selection
                if (pagesToConvert.length === 0) {
                    document.getElementById('convertSpinner').classList.add('d-none');
                    document.getElementById('convertStatus').textContent = 'No valid pages to convert!';
                    showToast('No valid pages to convert. Please check your page range.', 'error');
                }
                
            }).catch(error => {
                console.error('Error loading PDF:', error);
                document.getElementById('convertSpinner').classList.add('d-none');
                document.getElementById('convertStatus').textContent = 'Error loading PDF!';
                showToast('Error loading PDF: ' + error.message, 'error');
            });
        };
        
        fileReader.readAsArrayBuffer(pdfFile);
    });
    
    // Download all converted files
    document.getElementById('downloadConverted').addEventListener('click', function() {
        const blobUrls = JSON.parse(this.getAttribute('data-blob-urls') || '[]');
        if (blobUrls.length === 0) {
            showToast('No files to download', 'error');
            return;
        }
        
        // In a real implementation, we would use JSZip to create a zip file
        // For demo, just download the first file
        const format = document.querySelector('.conversion-option.active').getAttribute('data-format');
        downloadFile(blobUrls[0], `converted_page_1.${format === 'text' ? 'txt' : format}`);
        
        showToast('Downloading converted files...', 'success');
    });
    
    // Generic file download function
    function downloadFile(blobUrl, fileName) {
        if (!blobUrl) {
            showToast('Error: File not available for download', 'error');
            return;
        }
        
        showToast(`Downloading ${fileName}...`, 'success');
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.click();
        
        // Clean up the blob URL after download starts
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 1000);
    }
    
    // Use the same function for PDF downloads
    function downloadPDF(blobUrl, fileName) {
        return downloadFile(blobUrl, fileName);
    }
    
    // Clear buttons functionality
    document.getElementById('clearMerge').addEventListener('click', function() {
        mergeDropzone.removeAllFiles(true);
        document.getElementById('mergePreview').classList.add('d-none');
        document.getElementById('downloadMergedPdf').setAttribute('disabled', 'true');
        document.getElementById('mergePdfs').setAttribute('disabled', 'true');
        document.getElementById('mergeStatus').textContent = 'PDF files will be merged here';
        showToast('Cleared all files', 'info');
    });
    
    document.getElementById('clearSplit').addEventListener('click', function() {
        splitDropzone.removeAllFiles(true);
        document.getElementById('splitPreviewContainer').classList.add('d-none');
        document.getElementById('splitFilesList').classList.add('d-none');
        document.getElementById('splitStatus').classList.remove('d-none');
        document.getElementById('splitStatus').textContent = 'Split PDFs will appear here';
        document.getElementById('downloadAllSplit').setAttribute('disabled', 'true');
        document.getElementById('splitPdf').setAttribute('disabled', 'true');
        showToast('Cleared all files', 'info');
    });
    
    document.getElementById('tryAgainCompress').addEventListener('click', function() {
        compressDropzone.removeAllFiles(true);
        document.getElementById('compressionResults').classList.add('d-none');
        document.getElementById('noCompressionResults').classList.remove('d-none');
        document.getElementById('compressPdf').setAttribute('disabled', 'true');
        showToast('Ready for a new compression', 'info');
    });
    
    document.getElementById('clearConversion').addEventListener('click', function() {
        convertDropzone.removeAllFiles(true);
        document.getElementById('conversionResults').classList.add('d-none');
        document.getElementById('noConversionResults').classList.remove('d-none');
        document.getElementById('convertPdf').setAttribute('disabled', 'true');
        document.getElementById('convertProgress').style.width = '0%';
        document.getElementById('convertProgress').textContent = '0%';
        showToast('Cleared all files', 'info');
    });
    
    // PDF preview navigation
    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage);
        }
    });
    
    function updatePageNavigation() {
        document.getElementById('splitPageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        
        if (currentPage === 1) {
            document.getElementById('prevPage').setAttribute('disabled', 'true');
        } else {
            document.getElementById('prevPage').removeAttribute('disabled');
        }
        
        if (currentPage === totalPages) {
            document.getElementById('nextPage').setAttribute('disabled', 'true');
        } else {
            document.getElementById('nextPage').removeAttribute('disabled');
        }
    }
    
    // Load and render actual PDF for preview
    function loadPdfPreview(file, canvasId, pageInfoId, fileInfoId) {
        console.log('Loading PDF preview for file:', file.name);
        
        // Update file info
        if (fileInfoId) {
            document.getElementById(fileInfoId).textContent = file.name;
        }
        
        // Show loading state
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            showToast('Error: Preview canvas not found', 'error');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        canvas.width = 400;
        canvas.height = 550;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f0f0f0';
        ctx.font = '14px Arial';
        ctx.fillText('Loading PDF...', canvas.width/2 - 50, canvas.height/2);
        
        // Use FileReader to get the file content
        const fileReader = new FileReader();
        
        fileReader.onload = function() {
            console.log('FileReader loaded file successfully');
            try {
                const typedarray = new Uint8Array(this.result);
                console.log(`PDF binary data loaded: ${typedarray.length} bytes`);
                
                // Load the PDF using PDF.js
                pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                    console.log(`PDF document loaded successfully with ${pdf.numPages} pages`);
                    pdfDoc = pdf;
                    totalPages = pdf.numPages;
                    currentPage = 1;
                    
                    // Update page information
                    if (pageInfoId) {
                        document.getElementById(pageInfoId).textContent = `Page 1 of ${totalPages}`;
                    }
                    
                    renderPage(currentPage);
                }).catch(function(error) {
                    console.error('Error loading PDF with PDF.js:', error);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'red';
                    ctx.font = '14px Arial';
                    ctx.fillText('Error loading PDF', canvas.width/2 - 60, canvas.height/2 - 10);
                    ctx.font = '12px Arial';
                    const errorMsg = error.message.length > 50 ? error.message.substring(0, 50) + '...' : error.message;
                    ctx.fillText(errorMsg, canvas.width/2 - 100, canvas.height/2 + 10);
                    showToast(`Error loading PDF: ${error.message}`, 'error');
                });
            } catch (error) {
                console.error('Error processing PDF data:', error);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'red';
                ctx.font = '14px Arial';
                ctx.fillText('Error processing PDF data', canvas.width/2 - 80, canvas.height/2);
                showToast(`Error processing PDF: ${error.message}`, 'error');
            }
        };
        
        fileReader.onerror = function(error) {
            console.error('FileReader error:', error);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'red';
            ctx.font = '14px Arial';
            ctx.fillText('Error reading file', canvas.width/2 - 50, canvas.height/2);
            showToast('Error reading file', 'error');
        };
        
        try {
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error starting file read:', error);
            showToast(`Error reading file: ${error.message}`, 'error');
        }
    }
    
    // Render a specific page of the PDF
    function renderPage(pageNumber) {
        if (!pdfDoc) {
            console.error('No PDF document loaded');
            showToast('Error: No PDF document loaded', 'error');
            return;
        }
        
        // Validate page number
        if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
            console.error(`Invalid page number: ${pageNumber}. Document has ${pdfDoc.numPages} pages.`);
            return;
        }
        
        console.log(`Rendering page ${pageNumber} of ${pdfDoc.numPages}`);
        
        const canvas = document.getElementById('splitPreviewCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas first
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Loading indicator
        ctx.fillStyle = '#f0f0f0';
        ctx.font = '14px Arial';
        ctx.fillText('Loading page...', canvas.width/2 - 50, canvas.height/2);
        
        // Get the page
        pdfDoc.getPage(pageNumber).then(function(page) {
            // Scale the page to fit the canvas
            const viewport = page.getViewport({ scale: 1.0 });
            const scale = Math.min(
                (canvas.width || 400) / viewport.width,
                (canvas.height || 550) / viewport.height
            ) * 0.9;
            
            const scaledViewport = page.getViewport({ scale: scale });
            
            // Adjust canvas to page dimensions
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            
            // Render the page
            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };
            
            console.log(`Rendering PDF page with dimensions: ${scaledViewport.width}x${scaledViewport.height}`);
            
            page.render(renderContext).promise.then(function() {
                console.log(`Page ${pageNumber} rendered successfully`);
                updatePageNavigation();
            }).catch(function(error) {
                console.error('Error rendering page:', error);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'red';
                ctx.font = '14px Arial';
                ctx.fillText(`Error rendering page: ${error.message}`, 20, canvas.height/2);
                showToast(`Error rendering page: ${error.message}`, 'error');
            });
        }).catch(function(error) {
            console.error('Error getting page:', error);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'red';
            ctx.font = '14px Arial';
            ctx.fillText(`Error getting page: ${error.message}`, 20, canvas.height/2);
            showToast(`Error getting page: ${error.message}`, 'error');
        });
    }
    
    // Helper functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showToast(message, type = 'info') {
        let bgColor;
        switch(type) {
            case 'success': bgColor = 'linear-gradient(to right, #00b09b, #96c93d)'; break;
            case 'error': bgColor = 'linear-gradient(to right, #ff5f6d, #ffc371)'; break;
            case 'warning': bgColor = 'linear-gradient(to right, #f7b733, #fc4a1a)'; break;
            default: bgColor = 'linear-gradient(to right, #2193b0, #6dd5ed)';
        }
        
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: bgColor,
            stopOnFocus: true,
            className: "toast-notification"
        }).showToast();
    }
    
    function simulatePdfProcessing(callback) {
        // Simulate processing time
        const duration = Math.floor(Math.random() * 1500) + 500; // 0.5-2 seconds
        setTimeout(callback, duration);
    }
    
    function simulateDownload(filename) {
        showToast(`Downloading ${filename}...`, 'success');
        
        // Create a fake download link
        const link = document.createElement('a');
        link.href = '#';
        link.download = filename;
        link.click();
    }
    
    function showCompressLoading() {
        document.getElementById('noCompressionResults').innerHTML = `
            <div class="glass-card p-4 text-center">
                <span class="loader mb-3"></span>
                <h5 class="mb-3">Analyzing PDF...</h5>
                <p class="text-muted">We're analyzing your PDF to prepare for compression</p>
            </div>
        `;
    }
    
    function hideCompressLoading() {
        document.getElementById('noCompressionResults').innerHTML = `
            <div class="glass-card p-4 text-center text-muted">
                <i class="fas fa-file-pdf fs-1 mb-3 d-block"></i>
                <h5>No PDF Compressed Yet</h5>
                <p>Upload a PDF and set compression options to see results</p>
                <div class="spinner-border spinner-border-sm text-primary d-none mt-3" id="compressionSpinner" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }

    // Helper function to draw placeholder previews
    function drawPlaceholderPreview(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        try {
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 260;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(20, 20, 160, 30);
            ctx.fillRect(20, 70, 160, 10);
            ctx.fillRect(20, 90, 160, 10);
            ctx.fillRect(20, 110, 100, 10);
        } catch (error) {
            console.error('Error drawing preview:', error);
        }
    }

    // Split PDF functionality
    document.querySelectorAll('input[name="splitMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const splitNPages = document.getElementById('splitNPages');
            if (!splitNPages) return;
            
            if (this.id === 'splitEvery') {
                splitNPages.removeAttribute('disabled');
            } else {
                splitNPages.setAttribute('disabled', 'true');
            }
        });
    });
    
    // Convert all pages toggle
    const convertAllPagesCheckbox = document.getElementById('convertAllPages');
    if (convertAllPagesCheckbox) {
        convertAllPagesCheckbox.addEventListener('change', function() {
            const pageRangeContainer = document.getElementById('pageRangeContainer');
            if (!pageRangeContainer) return;
            
            if (this.checked) {
                pageRangeContainer.classList.add('d-none');
            } else {
                pageRangeContainer.classList.remove('d-none');
                pageRangeContainer.classList.add('slide-in');
            }
        });
    }
    
    // Image quality range slider
    const qualitySlider = document.getElementById('imageQuality');
    const qualityValue = document.getElementById('qualityValue');
    
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', function() {
            qualityValue.textContent = this.value + '%';
            
            // Change color based on quality
            if (this.value < 30) {
                qualityValue.className = 'badge bg-danger';
            } else if (this.value < 70) {
                qualityValue.className = 'badge bg-warning';
            } else {
                qualityValue.className = 'badge bg-primary';
            }
        });
    }
    
    // Compression options
    document.querySelectorAll('.compression-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.compression-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 700);
        });
    });
    
    // Conversion options
    document.querySelectorAll('.conversion-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.conversion-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 700);
        });
    });
}); 