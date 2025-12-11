/**
 * Property Parser Module for TLBB GUI Renderer
 * Handles parsing and processing specific TLBB properties
 */

class PropertyParser {
    constructor() {
        this.positionCalculator = window.positionCalculator;
        this.colorParser = window.colorParser;
        this.stringDictionary = window.stringDictionary;
    }

    /**
     * Parse all properties for an element
     * @param {Object} element - Element with properties
     * @param {Object} parentBounds - Parent element bounds
     * @returns {Object} Processed properties
     */
    parseElementProperties(element, parentBounds = null) {
        const processed = {
            // Basic properties
            name: element.name,
            type: element.type,
            path: element.path,
            
            // Layout properties
            bounds: this.calculateBounds(element, parentBounds),
            visible: element.visible,
            
            // Visual properties
            colors: this.parseColors(element),
            images: this.parseImages(element),
            text: this.parseText(element),
            font: this.parseFont(element),
            
            // Behavior properties
            interaction: this.parseInteraction(element),
            events: element.events,
            
            // Special properties
            special: this.parseSpecialProperties(element)
        };

        return processed;
    }

    /**
     * Calculate element bounds
     * @param {Object} element - Element object
     * @param {Object} parentBounds - Parent bounds
     * @returns {Object} Calculated bounds
     */
    calculateBounds(element, parentBounds = null) {
        if (!this.positionCalculator) {
            console.warn('Position calculator not available');
            return { x: 0, y: 0, width: 100, height: 100 };
        }

        return this.positionCalculator.calculateElementBounds(element, parentBounds);
    }

    /**
     * Parse color properties
     * @param {Object} element - Element object
     * @returns {Object} Parsed colors
     */
    parseColors(element) {
        const colors = {};

        // Text color
        if (element.textColor) {
            colors.text = this.colorParser.parseColor(element.textColor);
        }

        // Background color (if specified)
        if (element.properties.BackgroundColor) {
            colors.background = this.colorParser.parseColor(element.properties.BackgroundColor);
        }

        // Border color (if specified)
        if (element.properties.BorderColor) {
            colors.border = this.colorParser.parseColor(element.properties.BorderColor);
        }

        return colors;
    }

    /**
     * Parse image properties
     * @param {Object} element - Element object
     * @returns {Object} Parsed images
     */
    parseImages(element) {
        const images = {};

        // Main image
        if (element.image) {
            images.main = this.parseImageReference(element.image);
        }

        // BackImage (for TLBB_ActionButton and similar)
        if (element.backImage) {
            images.back = this.parseImageReference(element.backImage);
        }

        // Button state images
        if (element.normalImage) {
            images.normal = this.parseImageReference(element.normalImage);
        }
        // if (element.hoverImage) {
        //     images.hover = this.parseImageReference(element.hoverImage);
        // }
        // if (element.pushedImage) {
        //     images.pushed = this.parseImageReference(element.pushedImage);
        // }
        // if (element.disabledImage) {
        //     images.disabled = this.parseImageReference(element.disabledImage);
        // }

        return images;
    }

    /**
     * Parse image reference (set:imageset image:imagename)
     * @param {string} imageRef - Image reference string
     * @returns {Object} Parsed image reference
     */
    parseImageReference(imageRef) {
        if (!imageRef) return null;

        const setMatch = imageRef.match(/set:([^\s]+)/);
        const imageMatch = imageRef.match(/image:([^\s]+)/);

        return {
            original: imageRef,
            set: setMatch ? setMatch[1] : null,
            image: imageMatch ? imageMatch[1] : null,
            valid: !!(setMatch && imageMatch)
        };
    }

    /**
     * Parse text properties
     * @param {Object} element - Element object
     * @returns {Object} Parsed text properties
     */
    parseText(element) {
        const text = {
            value: element.text || '',
            resolved: '',
            formatting: {
                horizontal: element.horzFormatting || 'LeftAligned',
                vertical: element.vertFormatting || 'TopAligned'
            },
            maxLength: element.maxTextLength ? parseInt(element.maxTextLength, 10) : null
        };

        // Resolve text using string dictionary
        if (this.stringDictionary && text.value) {
            text.resolved = this.stringDictionary.resolveTextValue(text.value);
        } else {
            text.resolved = text.value;
        }

        // Truncate if too long
        if (text.maxLength && text.resolved.length > text.maxLength) {
            text.resolved = text.resolved.substring(0, text.maxLength) + '...';
        }

        return text;
    }

    /**
     * Parse font properties
     * @param {Object} element - Element object
     * @returns {Object} Parsed font properties
     */
    parseFont(element) {
        const font = {
            family: 'Arial',
            size: 12,
            weight: 'normal',
            style: 'normal'
        };

        if (element.font) {
            // Parse TLBB font format (e.g., "YouYuan11.25")
            const fontMatch = element.font.match(/([A-Za-z]+)([\d.]+)/);
            if (fontMatch) {
                font.family = this.mapTLBBFont(fontMatch[1]);
                font.size = parseFloat(fontMatch[2]);
            }
        }

        return font;
    }

    /**
     * Map TLBB font names to web fonts
     * @param {string} tlbbFont - TLBB font name
     * @returns {string} CSS font family
     */
    mapTLBBFont(tlbbFont) {
        const fontMap = {
            'YouYuan': 'Microsoft YaHei, sans-serif',
            'SimSun': 'SimSun, serif',
            'SimHei': 'SimHei, sans-serif',
            'Arial': 'Arial, sans-serif',
            'Tahoma': 'Tahoma, sans-serif'
        };

        return fontMap[tlbbFont] || 'Arial, sans-serif';
    }

    /**
     * Parse interaction properties
     * @param {Object} element - Element object
     * @returns {Object} Parsed interaction properties
     */
    parseInteraction(element) {
        return {
            mouseHollow: element.mouseHollow,
            draggingEnabled: element.draggingEnabled,
            alwaysOnTop: element.alwaysOnTop,
            dragAcceptName: element.dragAcceptName,
            dragTarget: element.dragTarget,
            clickable: this.isClickable(element),
            focusable: this.isFocusable(element),
            selectable: this.isSelectable(element)
        };
    }

    /**
     * Check if element is clickable
     * @param {Object} element - Element object
     * @returns {boolean} True if clickable
     */
    isClickable(element) {
        return element.type.includes('Button') || 
               Object.keys(element.events).some(event => 
                   event.includes('Click') || event.includes('Pressed'));
    }

    /**
     * Check if element is focusable
     * @param {Object} element - Element object
     * @returns {boolean} True if focusable
     */
    isFocusable(element) {
        return element.type.includes('EditBox') || 
               element.type.includes('ListBox') ||
               this.isClickable(element);
    }

    /**
     * Check if element is selectable
     * @param {Object} element - Element object
     * @returns {boolean} True if selectable
     */
    isSelectable(element) {
        return element.type.includes('Check') || 
               element.type.includes('Radio') ||
               element.selected !== undefined;
    }

    /**
     * Parse special properties based on element type
     * @param {Object} element - Element object
     * @returns {Object} Special properties
     */
    parseSpecialProperties(element) {
        const special = {};

        switch (element.type) {
            case 'TLBB_ButtonCheck':
            case 'TLBB_ButtonCheckNULL':
            case 'TLBB_ButtonCheckForChatPage':
                special.checkMode = element.checkMode;
                special.selected = element.selected;
                break;

            case 'TLBB_ActionButton':
                special.empty = element.properties.Empty === 'True';
                special.dragAcceptName = element.dragAcceptName;
                break;

            case 'TLBB_EditBoxNormal':
                special.maxTextLength = element.maxTextLength;
                special.readOnly = element.properties.ReadOnly === 'True';
                break;

            case 'TLBB_ProgressBar':
                special.progress = this.parseFloat(element.properties.Progress, 0);
                special.range = {
                    min: this.parseFloat(element.properties.RangeMin, 0),
                    max: this.parseFloat(element.properties.RangeMax, 100)
                };
                break;

            case 'TLBB_ScrollBar':
                special.orientation = element.properties.Orientation || 'Vertical';
                special.documentSize = this.parseFloat(element.properties.DocumentSize, 100);
                special.pageSize = this.parseFloat(element.properties.PageSize, 10);
                special.stepSize = this.parseFloat(element.properties.StepSize, 1);
                break;

            case 'TLBB_ListBoxCommon':
            case 'TLBB_MultiColumnList':
                special.multiSelect = element.properties.MultiSelect === 'True';
                special.forceVertScrollbar = element.properties.ForceVertScrollbar === 'True';
                break;

            case 'TLBB_MeshWindow':
                special.meshFile = element.properties.MeshFile;
                special.animationFile = element.properties.AnimationFile;
                break;
        }

        return special;
    }

    /**
     * Parse float value with default
     * @param {string} value - String value
     * @param {number} defaultValue - Default value
     * @returns {number} Parsed float value
     */
    parseFloat(value, defaultValue = 0) {
        if (!value) return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Get display info for property panel
     * @param {Object} element - Element object
     * @param {string} displayMode - Display mode
     * @returns {string} Display text
     */
    getDisplayInfo(element, displayMode) {
        switch (displayMode) {
            case 'element':
                return element.name;

            case 'type':
                return element.type;

            case 'position':
                const bounds = this.calculateBounds(element);
                return `${Math.round(bounds.x)}, ${Math.round(bounds.y)}`;

            case 'size':
                const size = this.calculateBounds(element);
                return `${Math.round(size.width)}×${Math.round(size.height)}`;

            case 'text':
                const textInfo = this.parseText(element);
                return textInfo.resolved || textInfo.value || '';

            default:
                return element.name;
        }
    }

    /**
     * Validate element properties
     * @param {Object} element - Element object
     * @returns {Object} Validation result
     */
    validateProperties(element) {
        const validation = {
            valid: true,
            warnings: [],
            errors: []
        };

        // Check required properties
        if (!element.name) {
            validation.errors.push('Element has no name');
            validation.valid = false;
        }

        if (!element.type) {
            validation.errors.push('Element has no type');
            validation.valid = false;
        }

        // Check position/size properties
        const bounds = this.calculateBounds(element);
        if (bounds.width <= 0) {
            validation.warnings.push('Element has zero or negative width');
        }
        if (bounds.height <= 0) {
            validation.warnings.push('Element has zero or negative height');
        }

        // Check text properties
        if (element.text && element.text.startsWith('#{') && element.text.endsWith('}')) {
            const key = element.text.substring(2, element.text.length - 1);
            if (this.stringDictionary && !this.stringDictionary.hasKey(key)) {
                validation.warnings.push(`Text reference not found: ${key}`);
            }
        }

        // Check image properties
        if (element.image && !this.parseImageReference(element.image).valid) {
            validation.warnings.push(`Invalid image reference: ${element.image}`);
        }

        return validation;
    }

    /**
     * Get property groups for display
     * @param {Object} element - Element object
     * @returns {Array} Property groups
     */
    getPropertyGroups(element) {
        const processed = this.parseElementProperties(element);
        
        const groups = [
            {
                name: 'Basic',
                properties: {
                    'Name': element.name,
                    'Type': element.type,
                    'Path': element.path,
                    'Visible': element.visible ? 'True' : 'False'
                }
            },
            {
                name: 'Layout',
                properties: {
                    'Position': element.position || 'Not set',
                    'Size': element.size || 'Not set',
                    'X Position': element.unifiedXPosition || 'Not set',
                    'Y Position': element.unifiedYPosition || 'Not set',
                    'Bounds': this.positionCalculator.formatBounds(processed.bounds)
                }
            },
            {
                name: 'Visual',
                properties: {
                    'Text': processed.text.resolved || 'None',
                    'Text Color': element.textColor || 'Default',
                    'Font': element.font || 'Default',
                    'Image': element.image || 'None'
                }
            },
            {
                name: 'Behavior',
                properties: {
                    'Mouse Hollow': element.mouseHollow ? 'True' : 'False',
                    'Dragging Enabled': element.draggingEnabled ? 'True' : 'False',
                    'Always On Top': element.alwaysOnTop ? 'True' : 'False',
                    'Clickable': processed.interaction.clickable ? 'True' : 'False'
                }
            }
        ];

        // Add events group if there are events
        if (Object.keys(element.events).length > 0) {
            groups.push({
                name: 'Events',
                properties: element.events
            });
        }

        // Add special properties group if there are any
        if (Object.keys(processed.special).length > 0) {
            groups.push({
                name: 'Special',
                properties: processed.special
            });
        }

        return groups;
    }
}

// Export for use in other modules
window.PropertyParser = PropertyParser;
window.propertyParser = new PropertyParser();
