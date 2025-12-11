/**
 * Text Renderer Module
 * Handles rendering of text elements
 */

class TextRenderer extends BaseRenderer {
    constructor() {
        super();
        this.type = 'text';
        this.stringDictionary = null;
    }

    /**
     * Initialize text renderer
     * @param {StringDictionary} stringDictionary - String dictionary instance
     */
    init(stringDictionary) {
        this.stringDictionary = stringDictionary;
    }

    /**
     * Check if this renderer can handle the element
     * @param {Object} element - XML element object
     * @returns {boolean} Can handle
     */
    canRender(element) {
        const textTypes = [
            'StaticText',
            'Editbox',
            'MultiLineEditbox',
            'Listbox',
            'ListboxTextItem',
            'ComboDropList',
            'Combobox',
            'MultiColumnList',
            'TabControl',
            'TabContentPane',
            'ProgressBar',
            'Slider',
            'Scrollbar'
        ];
        return textTypes.includes(element.type);
    }

    /**
     * Render element
     * @param {Object} element - Element data
     * @param {HTMLElement} parent - Parent container
     * @returns {HTMLElement} Rendered element
     */
    render(element, parent) {
        const container = this.createBaseElement(element, level);
        
        // Apply text-specific styling
        this.applyTextStyling(container, element);
        
        // Set text content
        this.setTextContent(container, element);
        
        // Handle specific text element types
        this.handleSpecificType(container, element);
        
        // Apply common properties
        this.applyCommonProperties(container, element);
        
        return container;
    }

    /**
     * Apply text-specific styling
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    applyTextStyling(element, data) {
        // Font properties
        if (data.Font) {
            this.applyFontProperties(element, data.Font);
        }
        
        // Text color
        if (data.TextColour || data.NormalTextColour) {
            const color = data.TextColour || data.NormalTextColour;
            element.style.color = this.parseColor(color);
        }
        
        // Text alignment
        if (data.HorizontalAlignment) {
            element.style.textAlign = this.parseAlignment(data.HorizontalAlignment);
        }
        
        if (data.VerticalAlignment) {
            element.style.display = 'flex';
            element.style.alignItems = this.parseVerticalAlignment(data.VerticalAlignment);
        }
        
        // Text formatting
        if (data.WordWrap === 'true') {
            element.style.wordWrap = 'break-word';
            element.style.whiteSpace = 'normal';
        } else {
            element.style.whiteSpace = 'nowrap';
            element.style.overflow = 'hidden';
            element.style.textOverflow = 'ellipsis';
        }
        
        // Text effects
        if (data.TextShadow === 'true') {
            element.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
        }
    }

    /**
     * Apply font properties
     * @param {HTMLElement} element - DOM element
     * @param {string} fontString - Font property string
     */
    applyFontProperties(element, fontString) {
        // Font string format: "FontName-Size" or "FontName-Size-Bold" etc.
        const fontParts = fontString.split('-');
        
        if (fontParts.length >= 2) {
            const fontName = fontParts[0];
            const fontSize = parseInt(fontParts[1]);
            
            // Apply font family
            element.style.fontFamily = this.getFontFamily(fontName);
            
            // Apply font size
            if (!isNaN(fontSize)) {
                element.style.fontSize = fontSize + 'px';
            }
            
            // Apply font weight and style
            for (let i = 2; i < fontParts.length; i++) {
                const modifier = fontParts[i].toLowerCase();
                switch (modifier) {
                    case 'bold':
                        element.style.fontWeight = 'bold';
                        break;
                    case 'italic':
                        element.style.fontStyle = 'italic';
                        break;
                    case 'underline':
                        element.style.textDecoration = 'underline';
                        break;
                }
            }
        }
    }

    /**
     * Get font family mapping
     * @param {string} tlbbFont - TLBB font name
     * @returns {string} CSS font family
     */
    getFontFamily(tlbbFont) {
        const fontMapping = {
            'Arial': 'Arial, sans-serif',
            'Times': 'Times New Roman, serif',
            'Courier': 'Courier New, monospace',
            'Verdana': 'Verdana, sans-serif',
            'Tahoma': 'Tahoma, sans-serif',
            'SimSun': 'SimSun, "Microsoft YaHei", sans-serif',
            'SimHei': 'SimHei, "Microsoft YaHei", sans-serif',
            'Microsoft YaHei': '"Microsoft YaHei", sans-serif',
            'Default': 'Arial, sans-serif'
        };
        
        return fontMapping[tlbbFont] || fontMapping['Default'];
    }

    /**
     * Parse text alignment
     * @param {string} alignment - TLBB alignment value
     * @returns {string} CSS text-align value
     */
    parseAlignment(alignment) {
        const alignmentMap = {
            'Left': 'left',
            'Centre': 'center',
            'Center': 'center',
            'Right': 'right',
            'LeftAligned': 'left',
            'CentreAligned': 'center',
            'RightAligned': 'right'
        };
        
        return alignmentMap[alignment] || 'left';
    }

    /**
     * Parse vertical alignment
     * @param {string} alignment - TLBB vertical alignment value
     * @returns {string} CSS align-items value
     */
    parseVerticalAlignment(alignment) {
        const alignmentMap = {
            'Top': 'flex-start',
            'Centre': 'center',
            'Center': 'center',
            'Bottom': 'flex-end',
            'TopAligned': 'flex-start',
            'CentreAligned': 'center',
            'BottomAligned': 'flex-end'
        };
        
        return alignmentMap[alignment] || 'flex-start';
    }

    /**
     * Set text content
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setTextContent(element, data) {
        let textContent = '';
        
        // Get text from various possible properties
        if (data.Text) {
            textContent = data.Text;
        } else if (data.Caption) {
            textContent = data.Caption;
        } else if (data.NormalText) {
            textContent = data.NormalText;
        } else if (data.DefaultText) {
            textContent = data.DefaultText;
        }
        
        // Process string dictionary references
        if (textContent && this.stringDictionary) {
            textContent = this.stringDictionary.resolve(textContent);
        }
        
        // Set the text content
        if (data.type === 'MultiLineEditbox' || data.type === 'Listbox') {
            // For multi-line elements, preserve line breaks
            element.innerHTML = this.escapeHtml(textContent).replace(/\n/g, '<br>');
        } else {
            element.textContent = textContent;
        }
        
        // Set placeholder for edit boxes
        if ((data.type === 'Editbox' || data.type === 'MultiLineEditbox') && data.PlaceholderText) {
            let placeholder = data.PlaceholderText;
            if (this.stringDictionary) {
                placeholder = this.stringDictionary.resolve(placeholder);
            }
            element.setAttribute('placeholder', placeholder);
        }
    }

    /**
     * Handle specific text element types
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    handleSpecificType(element, data) {
        switch (data.type) {
            case 'Editbox':
                this.setupEditbox(element, data);
                break;
            case 'MultiLineEditbox':
                this.setupMultiLineEditbox(element, data);
                break;
            case 'Listbox':
                this.setupListbox(element, data);
                break;
            case 'Combobox':
                this.setupCombobox(element, data);
                break;
            case 'ProgressBar':
                this.setupProgressBar(element, data);
                break;
            case 'Slider':
                this.setupSlider(element, data);
                break;
            case 'Scrollbar':
                this.setupScrollbar(element, data);
                break;
            default:
                this.setupStaticText(element, data);
                break;
        }
    }

    /**
     * Setup static text element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupStaticText(element, data) {
        element.classList.add('tlbb-static-text');
        
        // Make it non-selectable by default
        element.style.userSelect = 'none';
        element.style.pointerEvents = 'none';
        
        // Background color for debugging
        if (data.BackgroundColour && data.BackgroundColour !== 'FF000000') {
            element.style.backgroundColor = this.parseColor(data.BackgroundColour);
        }
    }

    /**
     * Setup editbox element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupEditbox(element, data) {
        element.classList.add('tlbb-editbox');
        
        // Make it look like an input
        element.style.border = '1px solid #ccc';
        element.style.padding = '2px 4px';
        element.style.backgroundColor = '#fff';
        element.style.cursor = 'text';
        
        // Add input behavior
        element.setAttribute('contenteditable', 'true');
        element.setAttribute('spellcheck', 'false');
        
        // Max length
        if (data.MaxTextLength) {
            element.setAttribute('data-max-length', data.MaxTextLength);
        }
        
        // Read only
        if (data.ReadOnly === 'true') {
            element.setAttribute('contenteditable', 'false');
            element.style.backgroundColor = '#f0f0f0';
        }
    }

    /**
     * Setup multi-line editbox element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupMultiLineEditbox(element, data) {
        element.classList.add('tlbb-multiline-editbox');
        
        // Make it look like a textarea
        element.style.border = '1px solid #ccc';
        element.style.padding = '4px';
        element.style.backgroundColor = '#fff';
        element.style.cursor = 'text';
        element.style.overflow = 'auto';
        element.style.resize = 'none';
        
        // Add input behavior
        element.setAttribute('contenteditable', 'true');
        element.setAttribute('spellcheck', 'false');
        
        // Word wrap
        element.style.wordWrap = 'break-word';
        element.style.whiteSpace = 'pre-wrap';
        
        // Max length
        if (data.MaxTextLength) {
            element.setAttribute('data-max-length', data.MaxTextLength);
        }
        
        // Read only
        if (data.ReadOnly === 'true') {
            element.setAttribute('contenteditable', 'false');
            element.style.backgroundColor = '#f0f0f0';
        }
    }

    /**
     * Setup listbox element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupListbox(element, data) {
        element.classList.add('tlbb-listbox');
        
        // List appearance
        element.style.border = '1px solid #ccc';
        element.style.backgroundColor = '#fff';
        element.style.overflow = 'auto';
        element.style.cursor = 'default';
        
        // Create list items if specified
        if (data.children) {
            data.children.forEach((child, index) => {
                if (child.type === 'ListboxTextItem') {
                    const item = document.createElement('div');
                    item.className = 'tlbb-listbox-item';
                    item.textContent = child.Text || `Item ${index + 1}`;
                    item.style.padding = '2px 4px';
                    item.style.cursor = 'pointer';
                    
                    // Hover effect
                    item.addEventListener('mouseenter', () => {
                        item.style.backgroundColor = '#e0e0e0';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.backgroundColor = '';
                    });
                    
                    element.appendChild(item);
                }
            });
        }
    }

    /**
     * Setup combobox element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupCombobox(element, data) {
        element.classList.add('tlbb-combobox');
        
        // Combobox appearance
        element.style.border = '1px solid #ccc';
        element.style.backgroundColor = '#fff';
        element.style.cursor = 'pointer';
        element.style.position = 'relative';
        
        // Add dropdown arrow
        const arrow = document.createElement('div');
        arrow.className = 'tlbb-combobox-arrow';
        arrow.innerHTML = '▼';
        arrow.style.position = 'absolute';
        arrow.style.right = '4px';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        arrow.style.pointerEvents = 'none';
        
        element.appendChild(arrow);
    }

    /**
     * Setup progress bar element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupProgressBar(element, data) {
        element.classList.add('tlbb-progress-bar');
        
        // Progress bar container
        element.style.border = '1px solid #ccc';
        element.style.backgroundColor = '#f0f0f0';
        element.style.overflow = 'hidden';
        
        // Progress fill
        const fill = document.createElement('div');
        fill.className = 'tlbb-progress-fill';
        fill.style.height = '100%';
        fill.style.backgroundColor = '#007acc';
        fill.style.transition = 'width 0.3s ease';
        
        // Set progress value
        const progress = parseFloat(data.Progress || data.Value || 0);
        fill.style.width = Math.max(0, Math.min(100, progress)) + '%';
        
        element.appendChild(fill);
        
        // Progress text
        if (data.ShowProgress === 'true' || data.ShowText === 'true') {
            const text = document.createElement('div');
            text.className = 'tlbb-progress-text';
            text.style.position = 'absolute';
            text.style.top = '50%';
            text.style.left = '50%';
            text.style.transform = 'translate(-50%, -50%)';
            text.style.fontSize = '12px';
            text.style.color = '#333';
            text.textContent = `${Math.round(progress)}%`;
            
            element.style.position = 'relative';
            element.appendChild(text);
        }
    }

    /**
     * Setup slider element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupSlider(element, data) {
        element.classList.add('tlbb-slider');
        
        // Slider track
        element.style.backgroundColor = '#ddd';
        element.style.borderRadius = '4px';
        element.style.position = 'relative';
        element.style.cursor = 'pointer';
        
        // Slider thumb
        const thumb = document.createElement('div');
        thumb.className = 'tlbb-slider-thumb';
        thumb.style.width = '16px';
        thumb.style.height = '16px';
        thumb.style.backgroundColor = '#007acc';
        thumb.style.borderRadius = '50%';
        thumb.style.position = 'absolute';
        thumb.style.top = '50%';
        thumb.style.transform = 'translateY(-50%)';
        thumb.style.cursor = 'grab';
        
        // Set thumb position
        const value = parseFloat(data.Value || data.CurrentValue || 0);
        const min = parseFloat(data.MinValue || 0);
        const max = parseFloat(data.MaxValue || 100);
        const percentage = ((value - min) / (max - min)) * 100;
        
        thumb.style.left = Math.max(0, Math.min(100, percentage)) + '%';
        
        element.appendChild(thumb);
    }

    /**
     * Setup scrollbar element
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupScrollbar(element, data) {
        element.classList.add('tlbb-scrollbar');
        
        const isVertical = data.Orientation !== 'Horizontal';
        
        // Scrollbar track
        element.style.backgroundColor = '#f0f0f0';
        element.style.border = '1px solid #ccc';
        
        if (isVertical) {
            element.style.width = '16px';
        } else {
            element.style.height = '16px';
        }
        
        // Scrollbar thumb
        const thumb = document.createElement('div');
        thumb.className = 'tlbb-scrollbar-thumb';
        thumb.style.backgroundColor = '#999';
        thumb.style.position = 'relative';
        thumb.style.cursor = 'pointer';
        
        if (isVertical) {
            thumb.style.width = '100%';
            thumb.style.height = '20px';
        } else {
            thumb.style.height = '100%';
            thumb.style.width = '20px';
        }
        
        element.appendChild(thumb);
    }

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update element text
     * @param {HTMLElement} element - DOM element
     * @param {string} newText - New text content
     */
    updateText(element, newText) {
        if (this.stringDictionary) {
            newText = this.stringDictionary.resolve(newText);
        }
        
        if (element.classList.contains('tlbb-multiline-editbox')) {
            element.innerHTML = this.escapeHtml(newText).replace(/\n/g, '<br>');
        } else {
            element.textContent = newText;
        }
    }

    /**
     * Get element text
     * @param {HTMLElement} element - DOM element
     * @returns {string} Element text
     */
    getText(element) {
        if (element.classList.contains('tlbb-multiline-editbox')) {
            return element.innerHTML.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
        } else {
            return element.textContent;
        }
    }
}

// Export for use in other modules
window.TextRenderer = TextRenderer;
