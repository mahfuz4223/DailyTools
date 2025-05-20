// JSON Formatter Pro Class
class JSONFormatterPro {
    constructor() {
        // Initialize state
        this.state = {
            jsonEditor: null,
            currentMode: 'code',
            isProcessing: false,
            currentTheme: document.documentElement.getAttribute('data-bs-theme') || 'light',
            searchResults: {
                total: 0,
                current: -1,
                matches: []
            },
            formatOptions: {
                indent: 2,
                sortKeys: false,
                colorize: true
            }
        };

        // Initialize elements
        this.elements = {
            formatBtn: document.getElementById('formatBtn'),
            minifyBtn: document.getElementById('minifyBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            shareBtn: document.getElementById('shareBtn'),
            sampleBtn: document.getElementById('sampleBtn'),
            clearBtn: document.getElementById('clearBtn'),
            searchBtn: document.getElementById('searchBtn'),
            filterBtn: document.getElementById('filterBtn'),
            transformBtn: document.getElementById('transformBtn'),
            indentSize: document.getElementById('indentSize'),
            sortKeys: document.getElementById('sortKeys'),
            colorize: document.getElementById('colorize'),
            validationStatus: document.getElementById('validationStatus'),
            charCount: document.getElementById('charCount'),
            lineCount: document.getElementById('lineCount'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            editor: document.getElementById('editor'),
            searchPanel: document.getElementById('searchPanel'),
            filterPanel: document.getElementById('filterPanel'),
            transformPanel: document.getElementById('transformPanel'),
            previewPanel: document.getElementById('previewPanel'),
            previewCode: document.getElementById('previewCode'),
            // Search panel elements
            searchInput: document.getElementById('searchInput'),
            prevMatch: document.getElementById('prevMatch'),
            nextMatch: document.getElementById('nextMatch'),
            closeSearch: document.getElementById('closeSearch'),
            searchStats: document.getElementById('searchStats'),
            // Filter panel elements
            filterInput: document.getElementById('filterInput'),
            applyFilter: document.getElementById('applyFilter'),
            closeFilter: document.getElementById('closeFilter'),
            // Transform panel elements
            transformType: document.getElementById('transformType'),
            applyTransform: document.getElementById('applyTransform'),
            closeTransform: document.getElementById('closeTransform')
        };

        // Add mode toggle buttons to toolbar
        this.addModeToggleButtons();
        
        // Initialize JSONEditor
        this.initializeJSONEditor();
        
        // Initialize event listeners
        this.initializeEventListeners();

        // Initialize highlight.js
        hljs.highlightElement(this.elements.previewCode);
    }

    // Add mode toggle buttons
    addModeToggleButtons() {
        const toolbarGroup = document.querySelector('.toolbar-group');
        const divider = document.createElement('div');
        divider.className = 'vr mx-2';
        toolbarGroup.appendChild(divider);

        const modes = [
            { id: 'tree', icon: 'fa-sitemap', title: 'Tree Mode' },
            { id: 'view', icon: 'fa-eye', title: 'View Mode' },
            { id: 'editor', icon: 'fa-edit', title: 'Editor Mode' }
            // Code mode is removed as it's problematic with the jsoneditor library
        ];

        modes.forEach(mode => {
            const button = document.createElement('button');
            button.className = `btn-tool${mode.id === this.state.currentMode ? ' active' : ''}`;
            button.id = `${mode.id}ModeBtn`;
            button.title = mode.title;
            button.innerHTML = `<i class="fas ${mode.icon}"></i>`;
            button.addEventListener('click', () => this.switchEditorMode(mode.id));
            toolbarGroup.appendChild(button);
        });
    }

    // Initialize JSONEditor
    initializeJSONEditor() {
        try {
            // Set up container
            const container = this.elements.editor;
            
            // Create editor options - starting with tree mode which is more reliable
            const options = {
                mode: 'tree', // Always start with tree mode
                modes: ['tree', 'view', 'editor'], // Replace form with editor mode
                onChange: () => this.onChange(),
                indentation: this.state.formatOptions.indent,
                mainMenuBar: false,
                navigationBar: false,
                statusBar: false
            };
            
            // Try to create the editor
            this.state.jsonEditor = new JSONEditor(container, options);
            this.state.currentMode = 'tree'; // Ensure mode state is correct
            
            // Set initial content
            this.loadSample();
            
            // Apply theme
            this.updateEditorTheme();
            
            // Success message 
            console.info('JSONEditor initialized successfully in tree mode');
            this.showToast('Editor loaded successfully', 'info');
        } catch (error) {
            console.error('JSONEditor initialization error:', error);
            // Fallback to a basic textarea if JSONEditor fails
            this.createFallbackEditor();
            throw new Error('Failed to initialize JSONEditor: ' + error.message);
        }
    }

    // Create a fallback editor if JSONEditor fails
    createFallbackEditor() {
        // Clear the container
        this.elements.editor.innerHTML = '';
        
        // Create a basic textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control h-100';
        textarea.style.height = '100%';
        textarea.style.width = '100%';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = 'monospace';
        textarea.placeholder = 'Enter your JSON here...';
        
        // Add to container
        this.elements.editor.appendChild(textarea);
        
        // Store reference
        this.elements.fallbackTextarea = textarea;
        
        // Set up basic methods
        this.state.jsonEditor = {
            get: () => {
                try {
                    return JSON.parse(textarea.value || '{}');
                } catch (e) {
                    return {};
                }
            },
            set: (json) => {
                textarea.value = JSON.stringify(json, null, this.state.formatOptions.indent);
            },
            format: () => {
                try {
                    const json = JSON.parse(textarea.value || '{}');
                    textarea.value = JSON.stringify(json, null, this.state.formatOptions.indent);
                } catch (e) {
                    // Do nothing if invalid JSON
                }
            },
            compact: () => {
                try {
                    const json = JSON.parse(textarea.value || '{}');
                    textarea.value = JSON.stringify(json);
                } catch (e) {
                    // Do nothing if invalid JSON
                }
            },
            setMode: () => {}, // No-op
            expandPath: () => {}, // No-op
            setOptions: () => {} // No-op
        };
        
        // Add event listener for changes
        textarea.addEventListener('input', () => this.onChange());
        
        // Show fallback notification
        this.showToast('Using fallback editor mode. Some features may be limited.', 'warning');
    }

    // Update editor theme
    updateEditorTheme() {
        if (!this.state.jsonEditor) return;

        try {
            const isDark = this.state.currentTheme === 'dark';
            
            // Skip if using fallback editor
            if (this.elements.fallbackTextarea) {
                this.elements.fallbackTextarea.style.backgroundColor = isDark ? '#1e1e1e' : '#ffffff';
                this.elements.fallbackTextarea.style.color = isDark ? '#e8e8e8' : '#1e1e1e';
                return;
            }
            
            // Try to update Ace Editor theme if in code mode
            if (this.state.currentMode === 'code' && 
                this.state.jsonEditor.aceEditor && 
                typeof this.state.jsonEditor.aceEditor.setTheme === 'function') {
                const theme = isDark ? 'ace/theme/monokai' : 'ace/theme/github';
                this.state.jsonEditor.aceEditor.setTheme(theme);
            }
            
            // Handle text mode for editor view
            if (this.state.currentMode === 'editor') {
                const container = this.elements.editor;
                const textareaEl = container.querySelector('textarea.jsoneditor-text');
                if (textareaEl) {
                    textareaEl.style.backgroundColor = isDark ? '#1e1e1e' : '#ffffff';
                    textareaEl.style.color = isDark ? '#e8e8e8' : '#1e1e1e';
                    textareaEl.style.fontFamily = 'monospace';
                    textareaEl.style.fontSize = '14px';
                }
            }

            // Update tree/form mode colors
            const container = this.elements.editor;
            if (isDark) {
                container.style.setProperty('--jse-theme-color', '#e8e8e8');
                container.style.setProperty('--jse-theme-background-color', '#1e1e1e');
                container.style.setProperty('--jse-theme-color-readonly', '#d4d4d4');
                container.style.setProperty('--jse-theme-background-color-readonly', '#2d2d2d');
                container.style.setProperty('--jse-theme-border-color', '#454545');
                container.style.setProperty('--jse-theme-value-color', '#9cdcfe');
                container.style.setProperty('--jse-theme-number-color', '#b5cea8');
                container.style.setProperty('--jse-theme-string-color', '#ce9178');
                container.style.setProperty('--jse-theme-boolean-color', '#569cd6');
                container.style.setProperty('--jse-theme-null-color', '#569cd6');
                container.style.setProperty('--jse-theme-invalid-color', '#f14c4c');
            } else {
                container.style.setProperty('--jse-theme-color', '#1e1e1e');
                container.style.setProperty('--jse-theme-background-color', '#ffffff');
                container.style.setProperty('--jse-theme-color-readonly', '#4d4d4d');
                container.style.setProperty('--jse-theme-background-color-readonly', '#f5f5f5');
                container.style.setProperty('--jse-theme-border-color', '#d1d1d1');
                container.style.setProperty('--jse-theme-value-color', '#1a1aa6');
                container.style.setProperty('--jse-theme-number-color', '#098658');
                container.style.setProperty('--jse-theme-string-color', '#a31515');
                container.style.setProperty('--jse-theme-boolean-color', '#0000ff');
                container.style.setProperty('--jse-theme-null-color', '#0000ff');
                container.style.setProperty('--jse-theme-invalid-color', '#ff0000');
            }
        } catch (error) {
            console.error('Theme update error:', error);
        }
    }

    // Switch editor mode - completely reworked to avoid using problematic jsoneditor methods
    switchEditorMode(newMode) {
        if (!this.state.jsonEditor || newMode === this.state.currentMode) return;

        try {
            // If using fallback editor, show message and return
            if (this.elements.fallbackTextarea) {
                this.showToast('Mode switching is not available in fallback mode', 'warning');
                return;
            }
            
            // Get current JSON content
            let content;
            try {
                content = this.state.jsonEditor.get();
            } catch (error) {
                console.error('Error getting content for mode switch:', error);
                content = {};
            }
            
            // Save current container
            const container = this.elements.editor;
            
            // Clear container
            container.innerHTML = '';
            
            // Create new editor in the requested mode
            try {
                const options = {
                    mode: newMode,
                    modes: ['tree', 'view', 'editor'], // Omit code mode completely
                    onChange: () => this.onChange(),
                    indentation: this.state.formatOptions.indent,
                    mainMenuBar: false,
                    navigationBar: false,
                    statusBar: false
                };
                
                // Special handling for editor mode
                if (newMode === 'editor') {
                    // Create a more basic editing interface with better stability
                    options.mode = 'text';
                    options.modes = ['text', 'tree', 'view'];
                    options.onModeChange = (mode) => {
                        // Keep our state in sync with internal mode changes
                        if (mode === 'text') {
                            this.state.currentMode = 'editor';
                        } else {
                            this.state.currentMode = mode;
                        }
                        this.updateEditorTheme();
                    };
                }
                
                // Create new editor
                this.state.jsonEditor = new JSONEditor(container, options);
                
                // Set current mode
                this.state.currentMode = newMode;
                
                // Load the content
                try {
                    this.state.jsonEditor.set(content);
                } catch (setError) {
                    console.error('Error setting content after mode switch:', setError);
                    // Try to set an empty object if previous content fails
                    this.state.jsonEditor.set({});
                }
                
                // Update theme
                this.updateEditorTheme();
                
                // Update button states
                document.querySelectorAll('.btn-tool').forEach(btn => {
                    btn.classList.remove('active');
                });
                const modeBtn = document.getElementById(`${newMode}ModeBtn`);
                if (modeBtn) {
                    modeBtn.classList.add('active');
                }
                
                this.showToast(`Switched to ${newMode} mode`, 'success');
            } catch (createError) {
                console.error('Error creating editor in new mode:', createError);
                // Fallback to tree mode if the requested mode fails
                try {
                    this.state.jsonEditor = new JSONEditor(container, {
                        mode: 'tree',
                        modes: ['tree'],
                        onChange: () => this.onChange(),
                        indentation: this.state.formatOptions.indent,
                        mainMenuBar: false,
                        navigationBar: false,
                        statusBar: false
                    });
                    
                    this.state.currentMode = 'tree';
                    this.state.jsonEditor.set(content);
                    
                    this.showToast(`Failed to switch to ${newMode} mode, using tree mode instead`, 'warning');
                } catch (fallbackError) {
                    // If all else fails, use the textarea fallback
                    console.error('Failed to create fallback tree editor:', fallbackError);
                    this.createFallbackEditor();
                    if (this.elements.fallbackTextarea) {
                        this.elements.fallbackTextarea.value = JSON.stringify(content, null, 2);
                    }
                    this.showToast('Using fallback text editor due to mode switching errors', 'error');
                }
            }
        } catch (error) {
            console.error('Error in switchEditorMode:', error);
            this.showToast(`Mode switching error: ${error.message}`, 'error');
        }
    }

    // Handle mode change
    onModeChange(newMode) {
        this.state.currentMode = newMode;
        this.updateEditorTheme();
        try {
            this.updateStats();
        } catch (error) {
            console.error('Error updating stats after mode change:', error);
        }
    }

    // Handle content change
    onChange() {
        try {
            this.validateJSON();
        } catch (error) {
            console.error('Error validating JSON:', error);
        }
        
        try {
            this.updateStats();
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Validate JSON
    validateJSON(json) {
        if (!this.state.jsonEditor) return [];

        try {
            // Handle fallback textarea
            if (this.elements.fallbackTextarea) {
                try {
                    const text = this.elements.fallbackTextarea.value;
                    if (!text.trim()) {
                        this.elements.validationStatus.innerHTML = 
                            '<i class="fas fa-info-circle text-info"></i><span class="ms-2">Empty JSON</span>';
                        return [];
                    }
                    JSON.parse(text);
                    this.elements.validationStatus.innerHTML = 
                        '<i class="fas fa-check-circle text-success"></i><span class="ms-2">Valid JSON</span>';
                    return [];
                } catch (e) {
                    this.elements.validationStatus.innerHTML = 
                        `<i class="fas fa-exclamation-circle text-danger"></i><span class="ms-2">${e.message}</span>`;
                    return [{
                        path: [],
                        message: e.message
                    }];
                }
            }
            
            // Normal editor validation
            const value = json || this.state.jsonEditor.get();
            JSON.parse(JSON.stringify(value));
            
            this.elements.validationStatus.innerHTML = 
                '<i class="fas fa-check-circle text-success"></i><span class="ms-2">Valid JSON</span>';
            
            return [];
        } catch (error) {
            this.elements.validationStatus.innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i><span class="ms-2">${error.message}</span>`;
            
            // Try to determine the location of the error if in code mode
            if (this.state.currentMode === 'code' && 
                this.state.jsonEditor.aceEditor && 
                typeof this.state.jsonEditor.aceEditor.getValue === 'function') {
                
                const match = error.message.match(/at position (\d+)/);
                if (match) {
                    try {
                        const pos = parseInt(match[1]);
                        const text = this.state.jsonEditor.aceEditor.getValue();
                        const lines = text.substr(0, pos).split('\n');
                        const row = lines.length - 1;
                        const col = lines[lines.length - 1].length;
                        
                        // Highlight the error location
                        this.state.jsonEditor.aceEditor.gotoLine(row + 1, col);
                        this.state.jsonEditor.aceEditor.focus();
                    } catch (e) {
                        console.error('Error highlighting position:', e);
                    }
                }
            }
            
            return [{
                path: [],
                message: error.message
            }];
        }
    }

    // Format JSON
    async formatJSON() {
        if (!this.state.jsonEditor || this.state.isProcessing) return;

        try {
            this.showLoading();
            
            // Get current content
            const json = this.state.jsonEditor.get();
            
            // Sort keys if enabled
            const content = this.state.formatOptions.sortKeys ? this.sortObjectKeys(json) : json;
            
            // Format based on mode
            if (this.state.currentMode === 'code' && 
                this.state.jsonEditor.aceEditor && 
                typeof this.state.jsonEditor.aceEditor.setValue === 'function') {
                // Use ace editor formatting
                this.state.jsonEditor.aceEditor.setValue(
                    JSON.stringify(content, null, this.state.formatOptions.indent)
                );
                this.state.jsonEditor.aceEditor.selection.clearSelection();
                this.state.jsonEditor.format();
            } else if (this.state.currentMode === 'editor') {
                // Handle editor (text) mode
                const textareaEl = this.elements.editor.querySelector('textarea.jsoneditor-text');
                if (textareaEl) {
                    const formatted = JSON.stringify(content, null, this.state.formatOptions.indent);
                    textareaEl.value = formatted;
                    
                    // Trigger change event
                    const event = new Event('change');
                    textareaEl.dispatchEvent(event);
                }
            } else if (this.elements.fallbackTextarea) {
                // Use fallback formatting
                this.elements.fallbackTextarea.value = JSON.stringify(content, null, this.state.formatOptions.indent);
            } else {
                // Use standard JSONEditor set
                this.state.jsonEditor.set(content);
            }
            
            this.showToast('JSON formatted successfully!', 'success');
        } catch (error) {
            console.error('Format error:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Minify JSON
    async minifyJSON() {
        if (!this.state.jsonEditor || this.state.isProcessing) return;

        try {
            this.showLoading();
            
            // Get current content
            const json = this.state.jsonEditor.get();
            
            // Minify based on mode
            if (this.state.currentMode === 'code' && 
                this.state.jsonEditor.aceEditor && 
                typeof this.state.jsonEditor.aceEditor.setValue === 'function') {
                // Use ace editor minification
                this.state.jsonEditor.aceEditor.setValue(JSON.stringify(json));
                this.state.jsonEditor.aceEditor.selection.clearSelection();
                this.state.jsonEditor.compact();
            } else if (this.state.currentMode === 'editor') {
                // Handle editor (text) mode
                const textareaEl = this.elements.editor.querySelector('textarea.jsoneditor-text');
                if (textareaEl) {
                    const minified = JSON.stringify(json);
                    textareaEl.value = minified;
                    
                    // Trigger change event
                    const event = new Event('change');
                    textareaEl.dispatchEvent(event);
                }
            } else if (this.elements.fallbackTextarea) {
                // Use fallback minification
                this.elements.fallbackTextarea.value = JSON.stringify(json);
            } else {
                // Use standard JSONEditor set
                this.state.jsonEditor.set(json);
            }
            
            this.showToast('JSON minified successfully!', 'success');
        } catch (error) {
            console.error('Minify error:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Load sample
    loadSample() {
        const sample = {
            "name": "JSON Formatter Pro",
            "version": "2.0.0",
            "description": "Advanced JSON formatter and validator",
            "features": {
                "parsing": {
                    "modes": ["Strict JSON", "JSON5", "Auto-repair"],
                    "validation": "Real-time",
                    "errorHandling": "Advanced"
                },
                "formatting": {
                    "indentation": "Configurable",
                    "sorting": "Smart key sorting",
                    "prettify": "Prettier integration"
                },
                "editor": {
                    "highlighting": "Advanced syntax",
                    "autoComplete": true,
                    "errorDetection": "Instant",
                    "minimap": "Enhanced navigation"
                },
                "export": {
                    "formats": ["JSON", "Minified"],
                    "options": ["Copy", "Download", "Share"]
                }
            },
            "compatibility": {
                "browsers": ["Chrome", "Firefox", "Safari", "Edge"],
                "platforms": ["Windows", "macOS", "Linux"],
                "responsive": true
            },
            "performance": {
                "parsing": "Optimized",
                "formatting": "Fast",
                "validation": "Real-time"
            }
        };

        if (this.state.jsonEditor) {
            try {
                this.state.jsonEditor.set(sample);
                
                // Only format if we're not initializing (prevents errors during initialization)
                if (!this.elements.fallbackTextarea && this.state.jsonEditor.format) {
                    try {
                        // Try to format directly with JSONEditor
                        this.state.jsonEditor.format();
                    } catch (formatError) {
                        console.log('Direct formatting failed, using standard formatting');
                        // No need to call formatJSON during initialization
                    }
                } else if (this.elements.fallbackTextarea) {
                    // Format in fallback mode
                    this.elements.fallbackTextarea.value = JSON.stringify(sample, null, this.state.formatOptions.indent);
                }
            } catch (error) {
                console.error('Error loading sample:', error);
                // Last resort - try to create a new editor instance
                try {
                    // Get container
                    const container = this.elements.editor;
                    
                    // Clear container
                    container.innerHTML = '';
                    
                    // Create new editor in tree mode
                    const options = {
                        mode: 'tree',
                        modes: ['tree', 'view', 'editor'],
                        onChange: () => this.onChange(),
                        indentation: this.state.formatOptions.indent,
                        mainMenuBar: false,
                        navigationBar: false,
                        statusBar: false
                    };
                    
                    // Create editor
                    this.state.jsonEditor = new JSONEditor(container, options);
                    this.state.currentMode = 'tree';
                    
                    // Set content
                    this.state.jsonEditor.set(sample);
                    
                    // Update UI
                    document.querySelectorAll('.btn-tool').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    const modeBtn = document.getElementById('treeModeBtn');
                    if (modeBtn) {
                        modeBtn.classList.add('active');
                    }
                } catch (retryError) {
                    console.error('Failed to recreate editor:', retryError);
                    this.createFallbackEditor();
                    if (this.elements.fallbackTextarea) {
                        this.elements.fallbackTextarea.value = JSON.stringify(sample, null, this.state.formatOptions.indent);
                    }
                }
            }
        }
    }

    // Update statistics
    updateStats() {
        if (!this.state.jsonEditor) return;
        
        try {
            let charCount = 0;
            let lineCount = 0;
            
            // Handle different ways to get content based on editor type
            if (this.elements.fallbackTextarea) {
                // Fallback textarea stats
                const text = this.elements.fallbackTextarea.value || '';
                charCount = text.length;
                lineCount = text.split('\n').length;
            } else if (this.state.currentMode === 'code' && 
                      this.state.jsonEditor.aceEditor && 
                      typeof this.state.jsonEditor.aceEditor.getValue === 'function') {
                // Ace editor stats
                const text = this.state.jsonEditor.aceEditor.getValue() || '';
                charCount = text.length;
                lineCount = text.split('\n').length;
            } else {
                // Try to get JSON from editor and stringify it
                try {
                    const json = this.state.jsonEditor.get();
                    if (json) {
                        const text = JSON.stringify(json, null, this.state.formatOptions.indent);
                        charCount = text.length;
                        lineCount = text.split('\n').length;
                    }
                } catch (jsonError) {
                    console.error('Error getting JSON for stats:', jsonError);
                    charCount = 0;
                    lineCount = 0;
                }
            }
            
            // Update display
            this.elements.charCount.textContent = `${charCount} characters`;
            this.elements.lineCount.textContent = `${lineCount} lines`;
        } catch (error) {
            console.error('Error updating stats:', error);
            // Set default values
            this.elements.charCount.textContent = '0 characters';
            this.elements.lineCount.textContent = '0 lines';
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        try {
            // Button events
            this.elements.formatBtn.addEventListener('click', () => this.formatJSON());
            this.elements.minifyBtn.addEventListener('click', () => this.minifyJSON());
            this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
            this.elements.downloadBtn.addEventListener('click', () => this.downloadJSON());
            this.elements.sampleBtn.addEventListener('click', () => this.loadSample());
            this.elements.clearBtn.addEventListener('click', () => this.clearEditor());
            
            // Settings events
            this.elements.indentSize.addEventListener('change', () => {
                const indent = parseInt(this.elements.indentSize.value);
                this.state.formatOptions.indent = indent;
                if (this.state.jsonEditor) {
                    this.state.jsonEditor.setOptions({ indentation: indent });
                    this.formatJSON();
                }
            });

            this.elements.sortKeys.addEventListener('change', (e) => {
                this.state.formatOptions.sortKeys = e.target.checked;
                if (this.state.jsonEditor) {
                    this.state.jsonEditor.setOptions({ enableSort: e.target.checked });
                    this.formatJSON();
                }
            });

            // Theme change listener
            document.addEventListener('themeChanged', (e) => {
                if (this.state.jsonEditor) {
                    this.state.currentTheme = e.detail.theme;
                    this.state.jsonEditor.setOptions({
                        theme: e.detail.theme === 'dark' ? 'ace/theme/monokai' : 'ace/theme/github'
                    });
                }
            });

            // Window resize handler
            window.addEventListener('resize', () => {
                if (this.state.jsonEditor) {
                    this.state.jsonEditor.resize();
                }
            });

            // New button events
            this.elements.shareBtn.addEventListener('click', () => this.shareJSON());
            this.elements.searchBtn.addEventListener('click', () => this.togglePanel('searchPanel'));
            this.elements.filterBtn.addEventListener('click', () => this.togglePanel('filterPanel'));
            this.elements.transformBtn.addEventListener('click', () => this.togglePanel('transformPanel'));
            
            // Search panel events
            this.elements.searchInput.addEventListener('input', e => this.search(e.target.value));
            this.elements.prevMatch.addEventListener('click', () => this.navigateSearch('prev'));
            this.elements.nextMatch.addEventListener('click', () => this.navigateSearch('next'));
            this.elements.closeSearch.addEventListener('click', () => this.togglePanel('searchPanel'));

            // Filter panel events
            this.elements.applyFilter.addEventListener('click', () => {
                this.filterJSON(this.elements.filterInput.value);
            });
            this.elements.closeFilter.addEventListener('click', () => this.togglePanel('filterPanel'));

            // Transform panel events
            this.elements.applyTransform.addEventListener('click', () => {
                this.transformJSON(this.elements.transformType.value);
            });
            this.elements.closeTransform.addEventListener('click', () => this.togglePanel('transformPanel'));

            // Preview panel close
            this.elements.previewPanel.addEventListener('click', e => {
                if (e.target === this.elements.previewPanel) {
                    this.elements.previewPanel.classList.add('d-none');
                }
            });

            // Colorize option
            this.elements.colorize.addEventListener('change', e => {
                this.state.formatOptions.colorize = e.target.checked;
                if (this.state.currentMode === 'code') {
                    this.formatJSON();
                }
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', e => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key.toLowerCase()) {
                        case 'f':
                            e.preventDefault();
                            this.togglePanel('searchPanel');
                            break;
                        case 'g':
                            e.preventDefault();
                            if (e.shiftKey) {
                                this.navigateSearch('prev');
                            } else {
                                this.navigateSearch('next');
                            }
                            break;
                    }
                }
                if (e.key === 'Escape') {
                    ['searchPanel', 'filterPanel', 'transformPanel', 'previewPanel'].forEach(panel => {
                        this.elements[panel].classList.add('d-none');
                    });
                }
            });

        } catch (error) {
            console.error('Error initializing event listeners:', error);
            this.showToast('Error initializing event listeners', 'error');
        }
    }

    // Copy to clipboard
    async copyToClipboard() {
        if (!this.state.jsonEditor) return;

        try {
            const json = this.state.jsonEditor.get();
            await navigator.clipboard.writeText(JSON.stringify(json, null, this.state.formatOptions.indent));
            this.showToast('JSON copied to clipboard!', 'success');
        } catch (error) {
            this.showToast('Failed to copy: ' + error.message, 'error');
        }
    }

    // Download JSON
    async downloadJSON() {
        if (!this.state.jsonEditor) return;

        try {
            const json = this.state.jsonEditor.get();
            const formatted = JSON.stringify(json, null, this.state.formatOptions.indent);
            const blob = new Blob([formatted], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = 'formatted.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showToast('JSON file downloaded!', 'success');
        } catch (error) {
            this.showToast('Failed to download: ' + error.message, 'error');
        }
    }

    // Clear editor
    clearEditor() {
        if (!this.state.jsonEditor) return;
        
        if (Object.keys(this.state.jsonEditor.get() || {}).length > 0) {
            if (!confirm('Are you sure you want to clear the editor? This cannot be undone.')) {
                return;
            }
        }
        
        this.state.jsonEditor.set({});
        this.validateJSON();
        this.updateStats();
        this.showToast('Editor cleared', 'info');
    }

    // Toggle panels
    togglePanel(panelName) {
        const panels = ['searchPanel', 'filterPanel', 'transformPanel', 'previewPanel'];
        panels.forEach(panel => {
            if (panel === panelName) {
                this.elements[panel].classList.toggle('d-none');
            } else {
                this.elements[panel].classList.add('d-none');
            }
        });

        // Focus input if panel is shown
        if (!this.elements[panelName].classList.contains('d-none')) {
            const input = this.elements[panelName].querySelector('input');
            if (input) input.focus();
        }
    }

    // Search functionality
    async search(query) {
        if (!query) {
            this.state.searchResults = { total: 0, current: -1, matches: [] };
            this.updateSearchStats();
            return;
        }

        try {
            // If using fallback editor, do a simple text search
            if (this.elements.fallbackTextarea) {
                const text = this.elements.fallbackTextarea.value;
                const matches = [];
                let pos = -1;
                
                while ((pos = text.indexOf(query, pos + 1)) !== -1) {
                    matches.push({ 
                        position: pos,
                        value: text.substr(pos, query.length)
                    });
                }
                
                this.state.searchResults = {
                    total: matches.length,
                    current: matches.length > 0 ? 0 : -1,
                    matches: matches
                };
                
                this.updateSearchStats();
                
                // Highlight in textarea if possible
                if (matches.length > 0 && this.elements.fallbackTextarea) {
                    const currentMatch = matches[this.state.searchResults.current];
                    this.elements.fallbackTextarea.focus();
                    this.elements.fallbackTextarea.setSelectionRange(
                        currentMatch.position, 
                        currentMatch.position + query.length
                    );
                }
                
                return;
            }
            
            // Handle editor mode (text) search
            if (this.state.currentMode === 'editor') {
                const textareaEl = this.elements.editor.querySelector('textarea.jsoneditor-text');
                if (textareaEl) {
                    const text = textareaEl.value;
                    const matches = [];
                    let pos = -1;
                    
                    while ((pos = text.toLowerCase().indexOf(query.toLowerCase(), pos + 1)) !== -1) {
                        matches.push({ 
                            position: pos,
                            value: text.substr(pos, query.length)
                        });
                    }
                    
                    this.state.searchResults = {
                        total: matches.length,
                        current: matches.length > 0 ? 0 : -1,
                        matches: matches
                    };
                    
                    this.updateSearchStats();
                    
                    // Highlight in textarea if possible
                    if (matches.length > 0) {
                        const currentMatch = matches[this.state.searchResults.current];
                        textareaEl.focus();
                        textareaEl.setSelectionRange(
                            currentMatch.position, 
                            currentMatch.position + query.length
                        );
                        
                        // Scroll to position
                        const linesBefore = text.substr(0, currentMatch.position).split('\n').length - 1;
                        const lineHeight = parseInt(window.getComputedStyle(textareaEl).lineHeight);
                        textareaEl.scrollTop = linesBefore * lineHeight;
                    }
                    
                    return;
                }
            }
            
            // Regular editor search
            const json = this.state.jsonEditor.get();
            const results = [];
            
            const searchInObject = (obj, path = '') => {
                if (!obj) return;
                
                if (typeof obj === 'object') {
                    for (const [key, value] of Object.entries(obj)) {
                        const currentPath = path ? `${path}.${key}` : key;
                        
                        if (key.toLowerCase().includes(query.toLowerCase()) || 
                            JSON.stringify(value).toLowerCase().includes(query.toLowerCase())) {
                            results.push({ path: currentPath, value });
                        }
                        
                        if (typeof value === 'object' && value !== null) {
                            searchInObject(value, currentPath);
                        }
                    }
                }
            };

            searchInObject(json);
            
            this.state.searchResults = {
                total: results.length,
                current: results.length > 0 ? 0 : -1,
                matches: results
            };

            this.updateSearchStats();
            this.highlightCurrentMatch();
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Search error: ' + error.message, 'error');
        }
    }

    // Update search statistics
    updateSearchStats() {
        const { total, current } = this.state.searchResults;
        if (total === 0) {
            this.elements.searchStats.textContent = 'No matches found';
        } else {
            this.elements.searchStats.textContent = `Match ${current + 1} of ${total}`;
        }
    }

    // Navigate through search results
    navigateSearch(direction) {
        const { total, current } = this.state.searchResults;
        if (total === 0) return;

        if (direction === 'next') {
            this.state.searchResults.current = (current + 1) % total;
        } else {
            this.state.searchResults.current = (current - 1 + total) % total;
        }

        this.updateSearchStats();
        this.highlightCurrentMatch();
    }

    // Highlight current search match
    highlightCurrentMatch() {
        const { matches, current } = this.state.searchResults;
        if (matches.length === 0 || current === -1) return;

        // Handle fallback textarea
        if (this.elements.fallbackTextarea) {
            try {
                const match = matches[current];
                if (match && match.position !== undefined) {
                    this.elements.fallbackTextarea.focus();
                    this.elements.fallbackTextarea.setSelectionRange(
                        match.position, 
                        match.position + match.value.length
                    );
                }
            } catch (error) {
                console.error('Error highlighting match in textarea:', error);
            }
            return;
        }
        
        // Handle editor mode (text) search
        if (this.state.currentMode === 'editor') {
            try {
                const match = matches[current];
                const textareaEl = this.elements.editor.querySelector('textarea.jsoneditor-text');
                if (textareaEl && match && match.position !== undefined) {
                    textareaEl.focus();
                    textareaEl.setSelectionRange(
                        match.position, 
                        match.position + match.value.length
                    );
                    
                    // Scroll to position
                    const text = textareaEl.value;
                    const linesBefore = text.substr(0, match.position).split('\n').length - 1;
                    const lineHeight = parseInt(window.getComputedStyle(textareaEl).lineHeight);
                    textareaEl.scrollTop = linesBefore * lineHeight;
                }
            } catch (error) {
                console.error('Error highlighting match in editor mode:', error);
            }
            return;
        }
        
        // Handle JSON editor highlighting
        try {
            const match = matches[current];
            
            // Check if expandPath and node properties exist before using them
            if (this.state.jsonEditor && typeof this.state.jsonEditor.expandPath === 'function') {
                this.state.jsonEditor.expandPath(match.path.split('.'));
                
                // Scroll to the matched node if node API is available
                setTimeout(() => {
                    if (this.state.jsonEditor && 
                        this.state.jsonEditor.node && 
                        typeof this.state.jsonEditor.node.findNodeByPath === 'function') {
                        
                        const node = this.state.jsonEditor.node.findNodeByPath(match.path.split('.'));
                        if (node) {
                            if (typeof node.scrollTo === 'function') {
                                node.scrollTo();
                            }
                            if (typeof node.highlight === 'function') {
                                node.highlight();
                            }
                        }
                    } else if (this.state.currentMode === 'code' && 
                              this.state.jsonEditor.aceEditor) {
                        // If in code mode, try to find the text
                        try {
                            const editor = this.state.jsonEditor.aceEditor;
                            const text = editor.getValue();
                            const searchText = JSON.stringify(match.value);
                            const pos = text.indexOf(searchText);
                            
                            if (pos !== -1) {
                                const lines = text.substring(0, pos).split('\n');
                                const row = lines.length - 1;
                                const col = lines[lines.length - 1].length;
                                
                                editor.scrollToLine(row + 1, true, true);
                                editor.gotoLine(row + 1, col);
                                editor.find(searchText.replace(/^"|"$/g, ''));
                            }
                        } catch (e) {
                            console.error('Error highlighting in code mode:', e);
                        }
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error highlighting match:', error);
        }
    }

    // Filter JSON using JMESPath
    async filterJSON(expression) {
        if (!expression) return;

        try {
            this.showLoading();
            const json = this.state.jsonEditor.get();
            
            // Use our custom JMESPath implementation
            const result = window.jmespath.search(json, expression);
            
            if (result === null || result === undefined) {
                this.showToast('No results found for this filter expression', 'warning');
                return;
            }
            
            // Show preview of filtered result
            this.showPreview(result);
        } catch (error) {
            console.error('Filter error:', error);
            this.showToast('Filter error: ' + (error.message || 'Invalid expression'), 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Transform JSON
    async transformJSON(type) {
        try {
            this.showLoading();
            const json = this.state.jsonEditor.get();
            let result;

            // Validate input before transformation
            try {
                JSON.parse(JSON.stringify(json));
            } catch (error) {
                throw new Error('Invalid JSON: Please fix the errors before transforming');
            }

            switch (type) {
                case 'sort':
                    result = this.sortObjectKeys(json);
                    break;
                case 'compact':
                    result = this.removeEmpty(json);
                    break;
                case 'flatten':
                    result = this.flattenObject(json);
                    break;
                case 'unflatten':
                    result = this.unflattenObject(json);
                    break;
                case 'toXML':
                    try {
                        result = await this.jsonToXML(json);
                    } catch (error) {
                        throw new Error('Failed to convert to XML: ' + error.message);
                    }
                    break;
                case 'toYAML':
                    try {
                        result = await this.jsonToYAML(json);
                    } catch (error) {
                        throw new Error('Failed to convert to YAML: ' + error.message);
                    }
                    break;
                default:
                    throw new Error('Unknown transformation type: ' + type);
            }

            this.showPreview(result);
            this.showToast(`Transformation to ${type} completed successfully`, 'success');
        } catch (error) {
            console.error('Transform error:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Show preview
    showPreview(content) {
        const formatted = typeof content === 'string' 
            ? content 
            : JSON.stringify(content, null, this.state.formatOptions.indent);
        
        this.elements.previewCode.textContent = formatted;
        this.elements.previewCode.className = 'language-json';
        hljs.highlightElement(this.elements.previewCode);
        this.elements.previewPanel.classList.remove('d-none');
    }

    // Remove empty values
    removeEmpty(obj) {
        const isEmpty = value => {
            if (value === null || value === undefined || value === '') return true;
            if (Array.isArray(value) && value.length === 0) return true;
            if (typeof value === 'object' && Object.keys(value).length === 0) return true;
            return false;
        };

        const clean = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;

            if (Array.isArray(obj)) {
                return obj
                    .filter(item => !isEmpty(item))
                    .map(item => clean(item));
            }

            return Object.entries(obj)
                .filter(([_, value]) => !isEmpty(value))
                .reduce((acc, [key, value]) => ({
                    ...acc,
                    [key]: clean(value)
                }), {});
        };

        return clean(obj);
    }

    // Flatten object
    flattenObject(obj, prefix = '') {
        return Object.keys(obj).reduce((acc, key) => {
            const pre = prefix.length ? prefix + '.' : '';
            
            if (Array.isArray(obj[key])) {
                obj[key].forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        Object.assign(acc, this.flattenObject(item, `${pre}${key}[${index}]`));
                    } else {
                        acc[`${pre}${key}[${index}]`] = item;
                    }
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(acc, this.flattenObject(obj[key], pre + key));
            } else {
                acc[pre + key] = obj[key];
            }
            
            return acc;
        }, {});
    }

    // Unflatten object
    unflattenObject(obj) {
        const result = {};

        for (const key in obj) {
            const keys = key.split('.');
            let current = result;
            
            for (let i = 0; i < keys.length; i++) {
                let k = keys[i];
                const arrayMatch = k.match(/^(.*?)\[(\d+)\]$/);
                
                if (arrayMatch) {
                    // Handle array notation
                    const arrayKey = arrayMatch[1];
                    const arrayIndex = parseInt(arrayMatch[2]);
                    
                    if (i === keys.length - 1) {
                        // Last key, set the value
                        current[arrayKey] = current[arrayKey] || [];
                        current[arrayKey][arrayIndex] = obj[key];
                    } else {
                        // Not last key, ensure array exists and create object at index
                        current[arrayKey] = current[arrayKey] || [];
                        current[arrayKey][arrayIndex] = current[arrayKey][arrayIndex] || {};
                        current = current[arrayKey][arrayIndex];
                    }
                } else {
                    if (i === keys.length - 1) {
                        // Last key, set the value
                        current[k] = obj[key];
                    } else {
                        // Not last key, ensure object exists
                        current[k] = current[k] || {};
                        current = current[k];
                    }
                }
            }
        }

        return result;
    }

    // Convert JSON to XML
    async jsonToXML(json) {
        const escapeXml = (unsafe) => {
            return unsafe.replace(/[<>&'"]/g, (c) => {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                }
            });
        };

        const convert = (obj, indent = '') => {
            if (obj === null) return `${indent}<null/>`;
            if (typeof obj !== 'object') {
                return escapeXml(String(obj));
            }

            return Object.entries(obj).map(([key, value]) => {
                // Sanitize key for XML
                const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
                
                if (Array.isArray(value)) {
                    return value.map(item => {
                        if (item === null) {
                            return `${indent}<${safeKey}/>`; 
                        }
                        return `${indent}<${safeKey}>${
                            typeof item === 'object' ? 
                                '\n' + convert(item, indent + '  ') + '\n' + indent : 
                                convert(item)
                        }</${safeKey}>`;
                    }).join('\n');
                }
                
                if (value === null) {
                    return `${indent}<${safeKey}/>`;
                }
                
                if (typeof value === 'object') {
                    return `${indent}<${safeKey}>\n${
                        convert(value, indent + '  ')
                    }\n${indent}</${safeKey}>`;
                }
                
                return `${indent}<${safeKey}>${convert(value)}</${safeKey}>`;
            }).join('\n');
        };

        return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${
            convert(json, '  ')
        }\n</root>`;
    }

    // Convert JSON to YAML
    async jsonToYAML(json) {
        const getType = (value) => {
            if (value === null) return 'null';
            if (Array.isArray(value)) return 'array';
            return typeof value;
        };

        const escapeString = (str) => {
            if (typeof str !== 'string') return str;
            if (str.match(/[:#\[\]{}"']/)) {
                return `"${str.replace(/"/g, '\\"')}"`;
            }
            return str;
        };

        const convert = (obj, indent = '', isArrayItem = false) => {
            const type = getType(obj);
            const prefix = isArrayItem ? '- ' : '';
            
            switch (type) {
                case 'null':
                    return prefix + 'null';
                case 'undefined':
                    return prefix + 'null';
                case 'boolean':
                case 'number':
                    return prefix + String(obj);
                case 'string':
                    return prefix + escapeString(obj);
                case 'array':
                    if (obj.length === 0) return prefix + '[]';
                    return obj.map(item => 
                        convert(item, indent + '  ', true)
                    ).join('\n');
                case 'object':
                    if (Object.keys(obj).length === 0) return prefix + '{}';
                    return (isArrayItem ? prefix + '\n' : '') + 
                        Object.entries(obj).map(([key, value]) => {
                            const valueType = getType(value);
                            const escapedKey = escapeString(key);
                            
                            if (valueType === 'array' || valueType === 'object') {
                                return `${indent}${escapedKey}:\n${
                                    convert(value, indent + '  ')
                                }`;
                            }
                            
                            return `${indent}${escapedKey}: ${
                                convert(value, indent + '  ')
                            }`;
                        }).join('\n');
                default:
                    return prefix + String(obj);
            }
        };

        return convert(json);
    }

    // Share JSON
    async shareJSON() {
        try {
            const json = this.state.jsonEditor.get();
            const formatted = JSON.stringify(json, null, this.state.formatOptions.indent);
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Shared JSON',
                    text: formatted,
                    type: 'text/json'
                });
                this.showToast('JSON shared successfully!', 'success');
            } else {
                await navigator.clipboard.writeText(formatted);
                this.showToast('JSON copied to clipboard (sharing not supported)', 'info');
            }
        } catch (error) {
            this.showToast('Failed to share: ' + error.message, 'error');
        }
    }

    // Show loading overlay with animation
    showLoading() {
        this.elements.loadingOverlay.classList.add('show');
        this.state.isProcessing = true;
    }

    // Hide loading overlay with animation
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('show');
        this.state.isProcessing = false;
    }

    // Enhanced toast notification
    showToast(message, type = 'info') {
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
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            },
            onClick: function() {
                this.hideToast();
            }
        }).showToast();
    }

    // Sort object keys with advanced options
    sortObjectKeys(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }
        
        const sorted = {};
        const keys = Object.keys(obj).sort((a, b) => {
            // Keep special characters at the end
            const aClean = a.replace(/[^a-zA-Z0-9]/g, '');
            const bClean = b.replace(/[^a-zA-Z0-9]/g, '');
            return aClean.localeCompare(bClean);
        });
        
        for (const key of keys) {
            sorted[key] = this.sortObjectKeys(obj[key]);
        }
        
        return sorted;
    }
}

// Initialize the formatter when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.jsonFormatter = new JSONFormatterPro();
    } catch (error) {
        console.error('Error initializing JSON formatter:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
}); 