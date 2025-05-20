/**
 * DarkTools - Color Palette Generator
 * Main JavaScript file for the color palette tool
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme management
    initThemeManagement();
    
    // ===============================
    // Color Palette Generator
    // ===============================
    const colorPicker = document.getElementById('colorPicker');
    const paletteColors = document.getElementById('paletteColors');
    const generateRandomPalette = document.getElementById('generateRandomPalette');
    const addColorToPalette = document.getElementById('addColorToPalette');
    const savePalette = document.getElementById('savePalette');
    const exportPalette = document.getElementById('exportPalette');
    const savedPalettes = document.getElementById('savedPalettes');
    
    // Generate random hex color
    const randomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };
    
    // Generate a random palette
    const generatePalette = (numColors = 5) => {
        paletteColors.innerHTML = '';
        
        for (let i = 0; i < numColors; i++) {
            const color = randomColor();
            addColorBlock(color);
        }
    };
    
    // Add color block to palette
    const addColorBlock = (color) => {
        const colorColumn = document.createElement('div');
        colorColumn.className = 'col-md-4 col-lg-2 col-6';
        
        colorColumn.innerHTML = `
            <div class="color-block" style="background-color: ${color}">
                <button class="btn-copy" aria-label="Copy color code" title="Copy color code">
                    <i class="fas fa-copy"></i>
                </button>
                <div class="color-info">${color}</div>
            </div>
        `;
        
        // Copy color code on click
        const copyButton = colorColumn.querySelector('.btn-copy');
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(color);
            showToast(`Color ${color} copied to clipboard`);
        });
        
        // Click on color block to replace with custom color
        const colorBlock = colorColumn.querySelector('.color-block');
        colorBlock.addEventListener('click', () => {
            colorPicker.value = color;
            colorPicker.click();
        });
        
        paletteColors.appendChild(colorColumn);
    };
    
    // Initialize with a random palette
    generatePalette();
    
    // Event listeners for palette generation
    generateRandomPalette.addEventListener('click', () => generatePalette());
    
    addColorToPalette.addEventListener('click', () => {
        addColorBlock(colorPicker.value);
    });
    
    colorPicker.addEventListener('change', () => {
        addColorBlock(colorPicker.value);
    });
    
    // Save current palette
    savePalette.addEventListener('click', () => {
        const colors = Array.from(paletteColors.querySelectorAll('.color-info')).map(el => el.textContent);
        if (colors.length === 0) {
            showToast('Please generate a palette first', 'error');
            return;
        }
        
        // Save to local storage
        const savedPalettesData = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
        savedPalettesData.push({
            id: Date.now(),
            colors: colors
        });
        localStorage.setItem('savedPalettes', JSON.stringify(savedPalettesData));
        
        // Update UI
        displaySavedPalettes();
        showToast('Palette saved successfully');
    });
    
    // Display saved palettes
    const displaySavedPalettes = () => {
        const savedPalettesData = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
        
        if (savedPalettesData.length === 0) {
            savedPalettes.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-swatchbook fs-1 mb-3 d-block"></i>
                    <p>Your saved palettes will appear here</p>
                </div>
            `;
            return;
        }
        
        savedPalettes.innerHTML = '';
        
        savedPalettesData.forEach(palette => {
            const paletteCard = document.createElement('div');
            paletteCard.className = 'saved-palette-card glass-card p-3 mb-3';
            
            let colorsHTML = '';
            palette.colors.forEach(color => {
                colorsHTML += `<div class="mini-color" style="background-color: ${color}" title="${color}"></div>`;
            });
            
            paletteCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="mini-palette">
                        ${colorsHTML}
                    </div>
                    <button class="btn btn-sm btn-outline-danger delete-palette" data-id="${palette.id}" aria-label="Delete palette" title="Delete palette">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <button class="btn btn-sm btn-outline-primary w-100 load-palette" data-id="${palette.id}">
                    <i class="fas fa-sync-alt me-2"></i>Load Palette
                </button>
            `;
            
            savedPalettes.appendChild(paletteCard);
        });
        
        // Add event listeners for saved palettes
        document.querySelectorAll('.delete-palette').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteSavedPalette(id);
            });
        });
        
        document.querySelectorAll('.load-palette').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                loadSavedPalette(id);
            });
        });
    };
    
    // Delete saved palette
    const deleteSavedPalette = (id) => {
        const savedPalettesData = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
        const filteredPalettes = savedPalettesData.filter(palette => palette.id.toString() !== id.toString());
        localStorage.setItem('savedPalettes', JSON.stringify(filteredPalettes));
        displaySavedPalettes();
        showToast('Palette deleted');
    };
    
    // Load saved palette
    const loadSavedPalette = (id) => {
        const savedPalettesData = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
        const palette = savedPalettesData.find(palette => palette.id.toString() === id.toString());
        
        if (palette) {
            paletteColors.innerHTML = '';
            palette.colors.forEach(color => {
                addColorBlock(color);
            });
            showToast('Palette loaded');
        }
    };
    
    // Initialize saved palettes
    displaySavedPalettes();
    
    // Export palette as CSS
    exportPalette.addEventListener('click', () => {
        const colors = Array.from(paletteColors.querySelectorAll('.color-info')).map(el => el.textContent);
        if (colors.length === 0) {
            showToast('Please generate a palette first', 'error');
            return;
        }
        
        // Create CSS variables
        let cssVariables = ':root {\n';
        colors.forEach((color, index) => {
            cssVariables += `    --color-${index + 1}: ${color};\n`;
        });
        cssVariables += '}';
        
        // Copy to clipboard
        navigator.clipboard.writeText(cssVariables)
            .then(() => {
                showToast('CSS variables copied to clipboard');
            })
            .catch(() => {
                // Fallback for browsers that don't support clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = cssVariables;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showToast('CSS variables copied to clipboard');
            });
    });
    
    // ===============================
    // Gradient Generator
    // ===============================
    const gradientPreview = document.getElementById('gradientPreview');
    const gradientStartColor = document.getElementById('gradientStartColor');
    const gradientEndColor = document.getElementById('gradientEndColor');
    const gradientStartColorPicker = document.getElementById('gradientStartColorPicker');
    const gradientEndColorPicker = document.getElementById('gradientEndColorPicker');
    const startColorPreview = document.getElementById('startColorPreview');
    const endColorPreview = document.getElementById('endColorPreview');
    const directionArrow = document.getElementById('directionArrow');
    const gradientAngle = document.getElementById('gradientAngle');
    const gradientOpacity = document.getElementById('gradientOpacity');
    const angleValue = document.getElementById('angleValue');
    const opacityValue = document.getElementById('opacityValue');
    const gradientCSS = document.getElementById('gradientCSS');
    const copyGradientCSS = document.getElementById('copyGradientCSS');
    const presetGradients = document.querySelectorAll('.preset-gradient');
    const gradientTypeOptions = document.querySelectorAll('.gradient-type-option');
    const startPresetColors = document.querySelectorAll('#startPresetColors .preset-color');
    const endPresetColors = document.querySelectorAll('#endPresetColors .preset-color');
    const startFormatOptions = document.querySelectorAll('.color-selection-container:first-child .color-format-option');
    const endFormatOptions = document.querySelectorAll('.color-selection-container:last-child .color-format-option');
    const gradientHandleStart = document.getElementById('gradientHandleStart');
    const gradientHandleEnd = document.getElementById('gradientHandleEnd');
    
    // Create fullscreen toggle button
    const toggleFullscreenBtn = document.createElement('button');
    toggleFullscreenBtn.className = 'toggle-fullscreen';
    toggleFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    toggleFullscreenBtn.title = 'Toggle fullscreen mode';
    toggleFullscreenBtn.setAttribute('aria-label', 'Toggle fullscreen mode');
    gradientPreview.appendChild(toggleFullscreenBtn);
    
    // Current gradient settings
    let currentGradient = {
        type: 'linear',
        angle: 90,
        startColor: '#4C6FFF',
        endColor: '#8C6FFF',
        opacity: 100,
        startPosition: 0,
        endPosition: 100
    };
    
    // Color format conversion functions
    const hexToRgb = (hex) => {
        // Remove hash if present
        hex = hex.replace('#', '');
        
        // Parse r, g, b values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return { r, g, b };
    };
    
    const rgbToHex = (r, g, b) => {
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        
        const toHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    };
    
    const rgbToHsl = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    };
    
    // Parse color string regardless of format (hex, rgb, hsl)
    const parseColor = (colorStr) => {
        // Check for HEX format
        if (colorStr.startsWith('#')) {
            return colorStr;
        }
        // Check for RGB format
        else if (colorStr.startsWith('rgb')) {
            const values = colorStr.match(/\d+/g);
            if (values && values.length >= 3) {
                const r = parseInt(values[0]);
                const g = parseInt(values[1]);
                const b = parseInt(values[2]);
                return rgbToHex(r, g, b);
            }
        }
        // Check for HSL format
        else if (colorStr.startsWith('hsl')) {
            const values = colorStr.match(/\d+/g);
            if (values && values.length >= 3) {
                const h = parseInt(values[0]);
                const s = parseInt(values[1]);
                const l = parseInt(values[2]);
                return hslToHex(h, s, l);
            }
        }
        return '#FFFFFF'; // Default to white if parsing fails
    };
    
    // Convert HSL to RGB
    const hslToRgb = (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    };
    
    // Convert HSL to Hex
    const hslToHex = (h, s, l) => {
        const rgb = hslToRgb(h, s, l);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
    };
    
    // Update color preview
    const updateColorPreview = (color, previewElement) => {
        previewElement.style.backgroundColor = color;
    };
    
    // Format color based on selected format
    const formatColor = (color, format) => {
        // Ensure color is in hex format first
        const hexColor = parseColor(color);
        
        if (format === 'hex') {
            return hexColor;
        } else if (format === 'rgb') {
            const { r, g, b } = hexToRgb(hexColor);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (format === 'hsl') {
            const { r, g, b } = hexToRgb(hexColor);
            const { h, s, l } = rgbToHsl(r, g, b);
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
        return hexColor;
    };
    
    // Update gradient preview
    const updateGradientPreview = () => {
        const { type, angle, startColor, endColor, opacity, startPosition, endPosition } = currentGradient;
        const opacityDecimal = opacity / 100;
        
        let gradientStyle = '';
        let cssCode = '';
        
        switch (type) {
            case 'linear':
                gradientStyle = `linear-gradient(${angle}deg, ${startColor} ${startPosition}%, ${endColor} ${endPosition}%)`;
                cssCode = `background: linear-gradient(${angle}deg, ${startColor} ${startPosition}%, ${endColor} ${endPosition}%);`;
                directionArrow.style.transform = `rotate(${angle}deg)`;
                break;
            case 'radial':
                gradientStyle = `radial-gradient(circle, ${startColor} ${startPosition}%, ${endColor} ${endPosition}%)`;
                cssCode = `background: radial-gradient(circle, ${startColor} ${startPosition}%, ${endColor} ${endPosition}%);`;
                directionArrow.style.transform = `rotate(0deg)`;
                break;
            case 'conic':
                gradientStyle = `conic-gradient(from ${angle}deg, ${startColor}, ${endColor})`;
                cssCode = `background: conic-gradient(from ${angle}deg, ${startColor}, ${endColor});`;
                directionArrow.style.transform = `rotate(${angle}deg)`;
                break;
        }
        
        gradientPreview.style.background = gradientStyle;
        
        // Fix opacity - apply to container not to gradient
        gradientPreview.style.opacity = opacityDecimal;
        
        if (opacityDecimal < 1) {
            cssCode = `${cssCode.slice(0, -1)} opacity(${opacityDecimal});`;
        }
        
        gradientCSS.value = cssCode;
        angleValue.textContent = `${angle}°`;
        opacityValue.textContent = `${opacity}%`;
        
        // Update color previews
        updateColorPreview(startColor, startColorPreview);
        updateColorPreview(endColor, endColorPreview);
        
        // Update handle positions
        gradientHandleStart.style.left = `${startPosition}%`;
        gradientHandleEnd.style.left = `${endPosition}%`;
    };
    
    // Initialize gradient
    updateGradientPreview();
    
    // Toggle fullscreen mode
    toggleFullscreenBtn.addEventListener('click', () => {
        gradientPreview.classList.toggle('fullscreen-gradient');
        const isFullscreen = gradientPreview.classList.contains('fullscreen-gradient');
        toggleFullscreenBtn.innerHTML = isFullscreen ? 
            '<i class="fas fa-compress"></i>' : 
            '<i class="fas fa-expand"></i>';
    });
    
    // Handle gradient type selection
    gradientTypeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            gradientTypeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to selected option
            option.classList.add('active');
            
            // Update gradient type
            currentGradient.type = option.dataset.type;
            
            // Update gradient preview
            updateGradientPreview();
        });
    });
    
    // Event listeners for color pickers
    gradientStartColorPicker.addEventListener('input', () => {
        currentGradient.startColor = gradientStartColorPicker.value;
        gradientStartColor.value = formatColor(gradientStartColorPicker.value, 'hex');
        updateGradientPreview();
    });
    
    gradientEndColorPicker.addEventListener('input', () => {
        currentGradient.endColor = gradientEndColorPicker.value;
        gradientEndColor.value = formatColor(gradientEndColorPicker.value, 'hex');
        updateGradientPreview();
    });
    
    // Event listeners for color inputs
    gradientStartColor.addEventListener('input', () => {
        try {
            const newColor = parseColor(gradientStartColor.value);
            currentGradient.startColor = newColor;
            gradientStartColorPicker.value = newColor;
            updateGradientPreview();
        } catch (error) {
            console.error('Invalid color format:', error);
        }
    });
    
    gradientEndColor.addEventListener('input', () => {
        try {
            const newColor = parseColor(gradientEndColor.value);
            currentGradient.endColor = newColor;
            gradientEndColorPicker.value = newColor;
            updateGradientPreview();
        } catch (error) {
            console.error('Invalid color format:', error);
        }
    });
    
    // Handle color format switching
    startFormatOptions.forEach(option => {
        option.addEventListener('click', () => {
            startFormatOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const format = option.dataset.format;
            gradientStartColor.value = formatColor(currentGradient.startColor, format);
        });
    });
    
    endFormatOptions.forEach(option => {
        option.addEventListener('click', () => {
            endFormatOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const format = option.dataset.format;
            gradientEndColor.value = formatColor(currentGradient.endColor, format);
        });
    });
    
    // Handle preset colors
    startPresetColors.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            currentGradient.startColor = color;
            gradientStartColorPicker.value = color;
            gradientStartColor.value = formatColor(color, 'hex');
            updateGradientPreview();
        });
    });
    
    endPresetColors.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            currentGradient.endColor = color;
            gradientEndColorPicker.value = color;
            gradientEndColor.value = formatColor(color, 'hex');
            updateGradientPreview();
        });
    });
    
    // Gradient angle and opacity controls
    gradientAngle.addEventListener('input', () => {
        currentGradient.angle = parseInt(gradientAngle.value);
        updateGradientPreview();
    });
    
    gradientOpacity.addEventListener('input', () => {
        currentGradient.opacity = parseInt(gradientOpacity.value);
        updateGradientPreview();
    });
    
    // Handle draggable gradient handles
    let isDragging = false;
    let currentHandle = null;
    
    const handleDragStart = (e, handle) => {
        isDragging = true;
        currentHandle = handle;
        e.preventDefault();
        document.body.style.cursor = 'grabbing';
    };
    
    const handleDragMove = (e) => {
        if (!isDragging) return;
        
        const rect = gradientPreview.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        if (currentHandle === gradientHandleStart) {
            currentGradient.startPosition = Math.min(position, currentGradient.endPosition - 10);
        } else if (currentHandle === gradientHandleEnd) {
            currentGradient.endPosition = Math.max(position, currentGradient.startPosition + 10);
        }
        
        updateGradientPreview();
    };
    
    const handleDragEnd = () => {
        isDragging = false;
        currentHandle = null;
        document.body.style.cursor = 'default';
    };
    
    gradientHandleStart.addEventListener('mousedown', (e) => handleDragStart(e, gradientHandleStart));
    gradientHandleEnd.addEventListener('mousedown', (e) => handleDragStart(e, gradientHandleEnd));
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Add touch support for mobile devices
    gradientHandleStart.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        handleDragStart({ clientX: touch.clientX, preventDefault: () => {} }, gradientHandleStart);
    });
    
    gradientHandleEnd.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        handleDragStart({ clientX: touch.clientX, preventDefault: () => {} }, gradientHandleEnd);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            handleDragMove({ clientX: touch.clientX });
        }
    });
    
    document.addEventListener('touchend', handleDragEnd);
    
    // Copy CSS code
    copyGradientCSS.addEventListener('click', () => {
        navigator.clipboard.writeText(gradientCSS.value);
        showToast('CSS code copied to clipboard');
    });
    
    // Preset gradients
    presetGradients.forEach(preset => {
        preset.addEventListener('click', () => {
            const startColor = preset.dataset.start;
            const endColor = preset.dataset.end;
            
            currentGradient.startColor = startColor;
            currentGradient.endColor = endColor;
            
            gradientStartColor.value = formatColor(startColor, 'hex');
            gradientEndColor.value = formatColor(endColor, 'hex');
            gradientStartColorPicker.value = startColor;
            gradientEndColorPicker.value = endColor;
            
            updateGradientPreview();
        });
    });
    
    // Download gradient as image
    const downloadGradientImage = document.getElementById('downloadGradientImage');
    downloadGradientImage.addEventListener('click', () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 1200;
        canvas.height = 600;
        
        // Create gradient
        let gradient;
        const { type, angle, startColor, endColor, startPosition, endPosition } = currentGradient;
        
        switch (type) {
            case 'linear':
                // Convert angle to radians and calculate x, y coordinates
                const angleRad = (angle * Math.PI) / 180;
                const x1 = canvas.width / 2 - Math.cos(angleRad) * canvas.width;
                const y1 = canvas.height / 2 - Math.sin(angleRad) * canvas.height;
                const x2 = canvas.width / 2 + Math.cos(angleRad) * canvas.width;
                const y2 = canvas.height / 2 + Math.sin(angleRad) * canvas.height;
                
                gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                break;
            case 'radial':
                gradient = ctx.createRadialGradient(
                    canvas.width / 2, canvas.height / 2, 0,
                    canvas.width / 2, canvas.height / 2, canvas.width / 2
                );
                break;
            case 'conic':
                // Simulate conic gradient (not directly supported in canvas)
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                break;
        }
        
        // Calculate positions as percentage of 1
        const startPos = startPosition / 100;
        const endPos = endPosition / 100;
        
        gradient.addColorStop(startPos, startColor);
        gradient.addColorStop(endPos, endColor);
        
        // Fill canvas with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply opacity if needed
        if (currentGradient.opacity < 100) {
            // Create a semi-transparent white overlay
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - currentGradient.opacity / 100})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Create download link
        const link = document.createElement('a');
        link.download = `gradient-${startColor.replace('#', '')}-${endColor.replace('#', '')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('Gradient image downloaded');
    });
    
    // Copy gradient CSS code
    const copyGradientCode = document.getElementById('copyGradientCode');
    copyGradientCode.addEventListener('click', () => {
        navigator.clipboard.writeText(gradientCSS.value);
        showToast('CSS code copied to clipboard');
    });
    
    // ===============================
    // Color Harmonies
    // ===============================
    const baseColor = document.getElementById('baseColor');
    const harmonyColorPicker = document.getElementById('harmonyColorPicker');
    const harmonyColors = document.getElementById('harmonyColors');
    const generateHarmony = document.getElementById('generateHarmony');
    const saveHarmony = document.getElementById('saveHarmony');
    const copyHarmonyCode = document.getElementById('copyHarmonyCode');
    const downloadHarmonyPalette = document.getElementById('downloadHarmonyPalette');
    const colorWheelCanvas = document.getElementById('colorWheelCanvas');
    const colorWheelMarkers = document.getElementById('colorWheelMarkers');
    const harmonyTypeOptions = document.querySelectorAll('.harmony-type-option');
    
    // Current harmony settings
    let currentHarmony = {
        baseColor: '#4C6FFF',
        type: 'complementary',
        colors: []
    };
    
    // Draw the color wheel
    const drawColorWheel = () => {
        if (!colorWheelCanvas) return;
        
        const ctx = colorWheelCanvas.getContext('2d');
        const centerX = colorWheelCanvas.width / 2;
        const centerY = colorWheelCanvas.height / 2;
        const radius = Math.min(centerX, centerY) - 5;
        
        // Clear canvas
        ctx.clearRect(0, 0, colorWheelCanvas.width, colorWheelCanvas.height);
        
        // Draw color wheel
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = (angle - 1) * Math.PI / 180;
            const endAngle = (angle + 1) * Math.PI / 180;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            // Convert angle to HSL color (max saturation and lightness = 50%)
            const hue = angle;
            const saturation = 100;
            const lightness = 50;
            
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fill();
        }
        
        // Draw center white circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.stroke();
    };
    
    // Update color wheel markers
    const updateColorWheelMarkers = (colors) => {
        if (!colorWheelMarkers) return;
        
        // Clear existing markers
        colorWheelMarkers.innerHTML = '';
        
        // Add new markers
        colors.forEach(color => {
            const { h, s, l } = hexToHSL(color);
            
            // Skip colors with very low saturation as they don't make sense on the wheel
            if (s < 10) return;
            
            // Calculate position
            const radius = Math.min(colorWheelCanvas.width, colorWheelCanvas.height) / 2 - 10;
            const angle = h * Math.PI / 180;
            const x = radius * Math.cos(angle - Math.PI/2) + colorWheelCanvas.width/2;
            const y = radius * Math.sin(angle - Math.PI/2) + colorWheelCanvas.height/2;
            
            // Create marker
            const marker = document.createElement('div');
            marker.className = 'color-wheel-marker';
            marker.style.left = `${x}px`;
            marker.style.top = `${y}px`;
            marker.style.backgroundColor = color;
            
            colorWheelMarkers.appendChild(marker);
        });
    };
    
    // Convert hex to HSL
    const hexToHSL = (hex) => {
        // Remove the hash if it exists
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Find greatest and smallest values
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        
        // Calculate HSL values
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        // Convert to degrees and percentages
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        
        return { h, s, l };
    };
    
    // Generate color harmonies
    const generateColorHarmony = () => {
        const color = baseColor.value;
        
        // Get active harmony type
        const activeType = document.querySelector('.harmony-type-option.active');
        if (!activeType) return;
        
        const type = activeType.dataset.harmony;
        currentHarmony.type = type;
        currentHarmony.baseColor = color;
        
        const hsl = hexToHSL(color);
        
        let harmonies = [];
        
        switch (type) {
            case 'complementary':
                harmonies = [
                    { h: hsl.h, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'analogous':
                harmonies = [
                    { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l },
                    { h: hsl.h, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'triadic':
                harmonies = [
                    { h: hsl.h, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'tetradic':
                harmonies = [
                    { h: hsl.h, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'monochromatic':
                harmonies = [
                    { h: hsl.h, s: hsl.s, l: Math.max(hsl.l - 30, 10) },
                    { h: hsl.h, s: hsl.s, l: Math.max(hsl.l - 15, 10) },
                    { h: hsl.h, s: hsl.s, l: hsl.l },
                    { h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 15, 90) },
                    { h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 30, 90) }
                ];
                break;
            case 'splitComplementary':
                harmonies = [
                    { h: hsl.h, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 150) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
        }
        
        // Convert HSL to hex colors
        const hexColors = harmonies.map(h => hslToHex(h.h, h.s, h.l));
        currentHarmony.colors = hexColors;
        
        displayHarmonyColors(hexColors);
        updateColorWheelMarkers(hexColors);
    };
    
    // Display harmony colors
    const displayHarmonyColors = (colors) => {
        if (!harmonyColors) return;
        
        harmonyColors.innerHTML = '';
        
        colors.forEach(hexColor => {
            const colorColumn = document.createElement('div');
            colorColumn.className = 'col-md-4 col-lg-2 col-6';
            
            colorColumn.innerHTML = `
                <div class="color-block" style="background-color: ${hexColor}">
                    <button class="btn-copy" aria-label="Copy color code" title="Copy color code">
                        <i class="fas fa-copy"></i>
                    </button>
                    <div class="color-info">${hexColor}</div>
                </div>
            `;
            
            // Copy color code on click
            const copyButton = colorColumn.querySelector('.btn-copy');
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(hexColor);
                showToast(`Color ${hexColor} copied to clipboard`);
            });
            
            // Click on color block to set as base color
            const colorBlock = colorColumn.querySelector('.color-block');
            colorBlock.addEventListener('click', () => {
                baseColor.value = hexColor;
                harmonyColorPicker.value = hexColor;
                updateBaseColorPreview(hexColor);
            });
            
            harmonyColors.appendChild(colorColumn);
        });
    };
    
    // Update base color preview
    const updateBaseColorPreview = (color) => {
        const baseColorPreview = document.getElementById('baseColorPreview');
        if (baseColorPreview) {
            baseColorPreview.style.backgroundColor = color;
        }
    };
    
    // Initialize color wheel
    drawColorWheel();
    
    // Event listeners for harmony type options
    harmonyTypeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            harmonyTypeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to selected option
            option.classList.add('active');
            
            // Generate harmony with new type
            if (baseColor.value) {
                generateColorHarmony();
            }
        });
    });
    
    // Event listeners for color harmonies
    harmonyColorPicker.addEventListener('input', () => {
        baseColor.value = harmonyColorPicker.value;
        updateBaseColorPreview(harmonyColorPicker.value);
    });
    
    baseColor.addEventListener('input', () => {
        harmonyColorPicker.value = baseColor.value;
        updateBaseColorPreview(baseColor.value);
    });
    
    generateHarmony.addEventListener('click', generateColorHarmony);
    
    // Event listeners for harmony preset colors
    document.querySelectorAll('#harmony-content .preset-color').forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            baseColor.value = color;
            harmonyColorPicker.value = color;
            updateBaseColorPreview(color);
        });
    });
    
    // Save harmony to palette
    saveHarmony.addEventListener('click', () => {
        if (currentHarmony.colors.length === 0) {
            showToast('Please generate a harmony first', 'error');
            return;
        }
        
        // Add colors to palette
        paletteColors.innerHTML = '';
        currentHarmony.colors.forEach(color => {
            addColorBlock(color);
        });
        
        // Switch to palette tab
        document.getElementById('palette-tab').click();
        showToast('Harmony added to palette');
    });
    
    // Copy harmony CSS variables
    copyHarmonyCode.addEventListener('click', () => {
        if (currentHarmony.colors.length === 0) {
            showToast('Please generate a harmony first', 'error');
            return;
        }
        
        let cssVariables = ':root {\n';
        currentHarmony.colors.forEach((color, index) => {
            cssVariables += `    --color-${index + 1}: ${color};\n`;
        });
        cssVariables += '}';
        
        navigator.clipboard.writeText(cssVariables);
        showToast('CSS variables copied to clipboard');
    });
    
    // Download harmony palette as image
    downloadHarmonyPalette.addEventListener('click', () => {
        if (currentHarmony.colors.length === 0) {
            showToast('Please generate a harmony first', 'error');
            return;
        }
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const numColors = currentHarmony.colors.length;
        const colorWidth = 1200 / numColors;
        
        // Set canvas size
        canvas.width = 1200;
        canvas.height = 300;
        
        // Draw colors
        currentHarmony.colors.forEach((color, index) => {
            ctx.fillStyle = color;
            ctx.fillRect(index * colorWidth, 0, colorWidth, canvas.height);
            
            // Add color code text at the bottom
            ctx.fillStyle = getContrastingTextColor(color);
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(color, index * colorWidth + colorWidth / 2, canvas.height - 20);
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `harmony-${currentHarmony.type}-${currentHarmony.baseColor.replace('#', '')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('Harmony image downloaded');
    });
    
    // Determine contrasting text color (black or white) for a background color
    const getContrastingTextColor = (hexColor) => {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calculate the luminance (perceived brightness) of the color
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return white for dark colors, black for light colors
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    };
    
    // ===============================
    // Theme Management
    // ===============================
    function initThemeManagement() {
        const themeToggle = document.getElementById('themeToggle');
        
        if (!themeToggle) return;
        
        // Check for saved theme preference or use default
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Initialize the theme toggle appearance based on current theme
        updateThemeToggleAppearance(savedTheme);
        
        // Add event listener to toggle theme
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Update the theme
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update theme toggle appearance
            updateThemeToggleAppearance(newTheme);
        });
    }
    
    // Update theme toggle button appearance based on current theme
    function updateThemeToggleAppearance(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        if (theme === 'dark') {
            themeToggle.setAttribute('title', 'Switch to light mode');
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            themeToggle.setAttribute('title', 'Switch to dark mode');
            themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
    
    // ===============================
    // Utility Functions
    // ===============================
    
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