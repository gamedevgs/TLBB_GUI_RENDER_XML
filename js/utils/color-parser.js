/**
 * Color Parser Module for TLBB GUI Renderer
 * Handles parsing and converting different color formats used in TLBB XML
 */

class ColorParser {
    constructor() {
        // Default colors for different elements
        this.defaultColors = {
            text: '#FFFFFF',
            background: '#2D2D2D',
            border: '#555555',
            button: '#4A90E2',
            frame: '#3C3C3C'
        };
    }

    /**
     * Parse TLBB color format (ARGB)
     * @param {string} colorValue - Color value string
     * @returns {Object} Parsed color object
     */
    parseColor(colorValue) {
        if (!colorValue || typeof colorValue !== 'string') {
            return this.getDefaultColor();
        }

        const cleanValue = colorValue.trim().toUpperCase();

        // Handle ARGB format (AARRGGBB)
        if (this.isARGBFormat(cleanValue)) {
            return this.parseARGB(cleanValue);
        }

        // Handle RGB format (#RRGGBB)
        if (this.isRGBFormat(cleanValue)) {
            return this.parseRGB(cleanValue);
        }

        // Handle named colors
        if (this.isNamedColor(cleanValue)) {
            return this.parseNamedColor(cleanValue);
        }

        // Handle decimal color values
        if (this.isDecimalColor(cleanValue)) {
            return this.parseDecimalColor(cleanValue);
        }

        // Return default if cannot parse
        console.warn(`Unable to parse color: ${colorValue}`);
        return this.getDefaultColor();
    }

    /**
     * Check if value is ARGB format
     */
    isARGBFormat(value) {
        return /^[0-9A-F]{8}$/.test(value);
    }

    /**
     * Check if value is RGB format
     */
    isRGBFormat(value) {
        return /^#?[0-9A-F]{6}$/.test(value);
    }

    /**
     * Check if value is named color
     */
    isNamedColor(value) {
        const namedColors = [
            'RED', 'GREEN', 'BLUE', 'WHITE', 'BLACK', 'YELLOW', 
            'CYAN', 'MAGENTA', 'GRAY', 'GREY', 'TRANSPARENT'
        ];
        return namedColors.includes(value);
    }

    /**
     * Check if value is decimal color
     */
    isDecimalColor(value) {
        return /^\d+$/.test(value);
    }

    /**
     * Parse ARGB format: AARRGGBB
     */
    parseARGB(value) {
        const alpha = parseInt(value.substr(0, 2), 16) / 255;
        const red = parseInt(value.substr(2, 2), 16);
        const green = parseInt(value.substr(4, 2), 16);
        const blue = parseInt(value.substr(6, 2), 16);

        return {
            r: red,
            g: green,
            b: blue,
            a: alpha,
            hex: `#${value.substr(2, 6)}`,
            rgba: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
            original: value,
            format: 'ARGB'
        };
    }

    /**
     * Parse RGB format: #RRGGBB or RRGGBB
     */
    parseRGB(value) {
        const cleanValue = value.startsWith('#') ? value.substr(1) : value;
        const red = parseInt(cleanValue.substr(0, 2), 16);
        const green = parseInt(cleanValue.substr(2, 2), 16);
        const blue = parseInt(cleanValue.substr(4, 2), 16);

        return {
            r: red,
            g: green,
            b: blue,
            a: 1.0,
            hex: `#${cleanValue}`,
            rgba: `rgba(${red}, ${green}, ${blue}, 1.0)`,
            original: value,
            format: 'RGB'
        };
    }

    /**
     * Parse named colors
     */
    parseNamedColor(value) {
        const colorMap = {
            'RED': { r: 255, g: 0, b: 0, a: 1.0 },
            'GREEN': { r: 0, g: 255, b: 0, a: 1.0 },
            'BLUE': { r: 0, g: 0, b: 255, a: 1.0 },
            'WHITE': { r: 255, g: 255, b: 255, a: 1.0 },
            'BLACK': { r: 0, g: 0, b: 0, a: 1.0 },
            'YELLOW': { r: 255, g: 255, b: 0, a: 1.0 },
            'CYAN': { r: 0, g: 255, b: 255, a: 1.0 },
            'MAGENTA': { r: 255, g: 0, b: 255, a: 1.0 },
            'GRAY': { r: 128, g: 128, b: 128, a: 1.0 },
            'GREY': { r: 128, g: 128, b: 128, a: 1.0 },
            'TRANSPARENT': { r: 0, g: 0, b: 0, a: 0.0 }
        };

        const color = colorMap[value] || colorMap['WHITE'];
        
        return {
            ...color,
            hex: this.rgbToHex(color.r, color.g, color.b),
            rgba: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
            original: value,
            format: 'Named'
        };
    }

    /**
     * Parse decimal color values
     */
    parseDecimalColor(value) {
        const decimal = parseInt(value, 10);
        
        // Convert decimal to ARGB
        const alpha = (decimal >> 24) & 0xFF;
        const red = (decimal >> 16) & 0xFF;
        const green = (decimal >> 8) & 0xFF;
        const blue = decimal & 0xFF;

        return {
            r: red,
            g: green,
            b: blue,
            a: alpha / 255,
            hex: this.rgbToHex(red, green, blue),
            rgba: `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`,
            original: value,
            format: 'Decimal'
        };
    }

    /**
     * Convert RGB values to hex string
     */
    rgbToHex(r, g, b) {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    }

    /**
     * Get default color object
     */
    getDefaultColor() {
        return {
            r: 255,
            g: 255,
            b: 255,
            a: 1.0,
            hex: '#FFFFFF',
            rgba: 'rgba(255, 255, 255, 1.0)',
            original: 'default',
            format: 'Default'
        };
    }

    /**
     * Blend two colors
     * @param {Object} color1 - First color
     * @param {Object} color2 - Second color
     * @param {number} ratio - Blend ratio (0-1)
     * @returns {Object} Blended color
     */
    blendColors(color1, color2, ratio) {
        const r = Math.round(color1.r * (1 - ratio) + color2.r * ratio);
        const g = Math.round(color1.g * (1 - ratio) + color2.g * ratio);
        const b = Math.round(color1.b * (1 - ratio) + color2.b * ratio);
        const a = color1.a * (1 - ratio) + color2.a * ratio;

        return {
            r, g, b, a,
            hex: this.rgbToHex(r, g, b),
            rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
            original: 'blended',
            format: 'Blended'
        };
    }

    /**
     * Adjust color brightness
     * @param {Object} color - Color object
     * @param {number} factor - Brightness factor (-1 to 1)
     * @returns {Object} Adjusted color
     */
    adjustBrightness(color, factor) {
        const adjust = (value) => {
            if (factor > 0) {
                return Math.round(value + (255 - value) * factor);
            } else {
                return Math.round(value * (1 + factor));
            }
        };

        const r = Math.max(0, Math.min(255, adjust(color.r)));
        const g = Math.max(0, Math.min(255, adjust(color.g)));
        const b = Math.max(0, Math.min(255, adjust(color.b)));

        return {
            r, g, b,
            a: color.a,
            hex: this.rgbToHex(r, g, b),
            rgba: `rgba(${r}, ${g}, ${b}, ${color.a})`,
            original: color.original,
            format: 'Adjusted'
        };
    }

    /**
     * Get contrasting color (for text on background)
     * @param {Object} backgroundColor - Background color
     * @returns {Object} Contrasting color
     */
    getContrastingColor(backgroundColor) {
        // Calculate luminance
        const luminance = (0.299 * backgroundColor.r + 
                          0.587 * backgroundColor.g + 
                          0.114 * backgroundColor.b) / 255;

        // Return white or black based on luminance
        return luminance > 0.5 ? 
            { r: 0, g: 0, b: 0, a: 1.0, hex: '#000000', rgba: 'rgba(0, 0, 0, 1.0)' } :
            { r: 255, g: 255, b: 255, a: 1.0, hex: '#FFFFFF', rgba: 'rgba(255, 255, 255, 1.0)' };
    }

    /**
     * Parse color from CSS-style properties
     * @param {string} cssColor - CSS color value
     * @returns {Object} Parsed color object
     */
    parseCSSColor(cssColor) {
        // Create temporary element to parse CSS color
        const tempDiv = document.createElement('div');
        tempDiv.style.color = cssColor;
        document.body.appendChild(tempDiv);
        
        const computedColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);

        // Parse RGB/RGBA from computed style
        const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1], 10);
            const g = parseInt(rgbMatch[2], 10);
            const b = parseInt(rgbMatch[3], 10);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1.0;

            return {
                r, g, b, a,
                hex: this.rgbToHex(r, g, b),
                rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
                original: cssColor,
                format: 'CSS'
            };
        }

        return this.getDefaultColor();
    }

    /**
     * Generate color palette based on base color
     * @param {Object} baseColor - Base color
     * @returns {Object} Color palette
     */
    generatePalette(baseColor) {
        return {
            primary: baseColor,
            light: this.adjustBrightness(baseColor, 0.3),
            dark: this.adjustBrightness(baseColor, -0.3),
            lighter: this.adjustBrightness(baseColor, 0.6),
            darker: this.adjustBrightness(baseColor, -0.6),
            contrasting: this.getContrastingColor(baseColor)
        };
    }
}

// Export for use in other modules
window.ColorParser = ColorParser;
window.colorParser = new ColorParser();
