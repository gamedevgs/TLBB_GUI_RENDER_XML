/**
 * Position Calculator Module for TLBB GUI Renderer
 * Handles different positioning schemes used in TLBB XML layouts
 * Updated to follow XML_RENDERING_IMPLEMENTATION.md guidelines
 */

// CONFIG constants for standardized values
const CONFIG = {
    VIRTUAL_WIDTH: 1024,
    VIRTUAL_HEIGHT: 768,
    POSITION_FORMATS: {
        UNIFIED: 'unified',
        RELATIVE: 'relative',
        ABSOLUTE: 'absolute'
    },
    DEFAULT_VALUES: {
        WIDTH: 100,
        HEIGHT: 30,
        X: 0,
        Y: 0
    }
};

class PositionCalculator {
    constructor() {
        this.defaultViewportSize = { width: CONFIG.VIRTUAL_WIDTH, height: CONFIG.VIRTUAL_HEIGHT };
    }

    /**
     * Parse position value from XML property with proper priority order
     * @param {string} value - Position value string
     * @returns {Object} Parsed position object
     */
    parsePosition(value) {
        if (value == null) return { x: 0, y: 0, type: 'absolute' };
        // Coerce non-string inputs safely
        if (typeof value !== 'string') {
            // Common patterns: numeric -> treat as absolute 0, object wrapper {value: '...'}
            if (typeof value === 'number') {
                return { x: value || 0, y: 0, type: 'absolute' };
            }
            if (typeof value === 'object') {
                if (value.value && typeof value.value === 'string') {
                    value = value.value;
                } else {
                    // Unsupported structure
                    return { x: 0, y: 0, type: 'absolute' };
                }
            } else {
                return { x: 0, y: 0, type: 'absolute' };
            }
        }

        // Trim to avoid parsing issues
        value = value.trim();
        if (!value.length) return { x: 0, y: 0, type: 'absolute' };

        // Handle different position formats according to implementation guide
        if (value.includes('{{')) {
            // UnifiedPosition format: "{{0.5,-120},{0.2,0}}" - HIGHEST PRIORITY
            return this.parseUnifiedPosition(value);
        } else if (value.includes('x:') && value.includes('y:')) {
            // Standard position format: "x:0.5 y:0.2" 
            return this.parseStandardPosition(value);
        } else if (value.includes('{') && value.includes(',')) {
            // Single unified format: "{0.0,0}"
            return this.parseSingleUnified(value);
        } else if (/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(value)) {
            // Simple comma pair "123,456" treat as absolute
            const [x,y] = value.split(',').map(parseFloat);
            return { x: x||0, y: y||0, type: 'absolute' };
        } else {
            // AbsolutePosition format: "x:29.0 y:63.0"
            return this.parseAbsolutePosition(value);
        }
    }

    /**
     * Parse size value from XML property with proper priority order
     * @param {string} value - Size value string
     * @returns {Object} Parsed size object
     */
    parseSize(value) {
        if (value == null) return { width: 100, height: 100, type: 'absolute' };
        if (typeof value !== 'string') {
            if (typeof value === 'number') {
                return { width: value || 0, height: value || 0, type: 'absolute' };
            }
            if (typeof value === 'object') {
                if (value.value && typeof value.value === 'string') {
                    value = value.value;
                } else {
                    return { width: 100, height: 100, type: 'absolute' };
                }
            } else {
                return { width: 100, height: 100, type: 'absolute' };
            }
        }
        value = value.trim();
        if (!value.length) return { width: 100, height: 100, type: 'absolute' };

        // Handle different size formats according to implementation guide
        if (value.includes('{{')) {
            // UnifiedSize format: "{{1.0,-20},{0.6,0}}" - HIGHEST PRIORITY
            return this.parseUnifiedSize(value);
        } else if (value.includes('w:') && value.includes('h:')) {
            // Standard Size format: "w:1.0 h:1.0" or AbsoluteSize: "w:100 h:50"
            return this.parseStandardSize(value);
        } else if (/^-?\d+(?:\.\d+)?x-?\d+(?:\.\d+)?$/i.test(value)) {
            // Pattern like 100x200
            const [w,h] = value.toLowerCase().split('x').map(parseFloat);
            return { width: w||0, height: h||0, type: 'absolute' };
        } else {
            // Try to parse as absolute size
            return this.parseAbsoluteSize(value);
        }
    }

    /**
     * Parse unified position format: "{{0.5,-120},{0.2,0}}"
     * Following implementation guide: Clean up string, parse 4 parts
     */
    parseUnifiedPosition(value) {
        // console.log('🔧 Parsing unified position:', value);
        if (!value || !value.includes('{{')) {
            // console.log('⚠️ Invalid unified position format');
            return { x: 0, y: 0, type: 'absolute' };
        }

        try {
            // Clean up the string first (remove braces, spaces) - following guide
            let cleaned = value
                .replace(/[{}]/g, '') // Remove braces
                .replace(/\s/g, '');  // Remove spaces
            
            // console.log('🧹 Cleaned string:', cleaned);
            
            const parts = cleaned.split(',');
            // console.log('📝 Split parts:', parts);
            
            if (parts.length >= 4) {
                const relX = parseFloat(parts[0]) || 0;
                const absX = parseFloat(parts[1]) || 0;
                const relY = parseFloat(parts[2]) || 0;
                const absY = parseFloat(parts[3]) || 0;
                
                const result = {
                    x: {
                        scale: relX,
                        offset: absX
                    },
                    y: {
                        scale: relY,
                        offset: absY
                    },
                    type: 'unified'
                };
                
                // console.log('📐 Parsed position result:', result);
                
                // SPECIAL CASE: When scale is 1.0 and offset is negative, 
                // this usually means "position from the opposite edge"
                if (result.x.scale === 1.0 && result.x.offset < 0) {
                    // console.log('🔄 Detected right-edge positioning for X');
                    result.x.anchorRight = true;
                }
                if (result.y.scale === 1.0 && result.y.offset < 0) {
                    // console.log('🔄 Detected bottom-edge positioning for Y');
                    result.y.anchorBottom = true;
                }
                
                return result;
            }
        } catch (e) {
            // console.error('❌ Error parsing unified position:', e);
        }
        
        // console.log('⚠️ Failed to parse unified position, using default');
        return { x: 0, y: 0, type: 'absolute' };
    }

    /**
     * Parse unified size format: "{{1.0,-20},{0.6,0}}"
     * Following implementation guide: Clean up string, parse 4 parts
     */
    parseUnifiedSize(value) {
        // console.log('🔧 Parsing unified size:', value);
        if (!value || !value.includes('{{')) {
            console.log('⚠️ Invalid unified size format');
            return { width: 100, height: 100, type: 'absolute' };
        }

        try {
            // Clean up the string first (remove braces, spaces) - following guide
            let cleaned = value
                .replace(/[{}]/g, '') // Remove braces
                .replace(/\s/g, '');  // Remove spaces
            
            // console.log('🧹 Cleaned string:', cleaned);
            
            const parts = cleaned.split(',');
            // console.log('📝 Split parts:', parts);
            
            if (parts.length >= 4) {
                const relWidth = parseFloat(parts[0]) || 0;
                const absWidth = parseFloat(parts[1]) || 0;
                const relHeight = parseFloat(parts[2]) || 0;
                const absHeight = parseFloat(parts[3]) || 0;
                
                const result = {
                    width: {
                        scale: relWidth,
                        offset: absWidth
                    },
                    height: {
                        scale: relHeight,
                        offset: absHeight
                    },
                    type: 'unified'
                };
                // console.log('📐 Parsed size result:', result);
                return result;
            }
        } catch (e) {
            console.error('❌ Error parsing unified size:', e);
        }
        
        // console.log('⚠️ Failed to parse unified size, using default');
        return { width: 100, height: 100, type: 'absolute' };
    }

    /**
     * Parse single unified format: "{0.0,0}"
     */
    parseSingleUnified(value) {
        const match = value.match(/\{([^,]+),([^}]+)\}/);
        if (match) {
            return {
                scale: parseFloat(match[1]) || 0,
                offset: parseFloat(match[2]) || 0,
                type: 'single-unified'
            };
        }
        return { scale: 0, offset: 0, type: 'single-unified' };
    }

    /**
     * Parse standard position format: "x:0.5 y:0.2"
     */
    parseStandardPosition(value) {
        // console.log('🔧 Parsing standard position:', value);
        const xMatch = value.match(/x:([\d.-]+)/);
        const yMatch = value.match(/y:([\d.-]+)/);
        
        const result = {
            x: xMatch ? parseFloat(xMatch[1]) : 0,
            y: yMatch ? parseFloat(yMatch[1]) : 0,
            type: 'relative'
        };
        
        // console.log('📐 Parsed standard position result:', result);
        return result;
    }

    /**
     * Parse standard size format: "w:0.5 h:0.2" or "w:100 h:50"
     */
    parseStandardSize(value) {
        // console.log('🔧 Parsing standard size:', value);
        const wMatch = value.match(/w:([\d.-]+)/);
        const hMatch = value.match(/h:([\d.-]+)/);
        
        const result = {
            width: wMatch ? parseFloat(wMatch[1]) : 0,
            height: hMatch ? parseFloat(hMatch[1]) : 0,
            type: 'relative'
        };
        
        // console.log('📐 Parsed standard size result:', result);
        return result;
    }

    /**
     * Parse absolute position/size format
     */
    parseAbsolutePosition(value) {
        const xMatch = value.match(/x:([\d.-]+)/);
        const yMatch = value.match(/y:([\d.-]+)/);
        
        return {
            x: xMatch ? parseFloat(xMatch[1]) : 0,
            y: yMatch ? parseFloat(yMatch[1]) : 0,
            type: 'absolute'
        };
    }

    /**
     * Parse absolute size format
     */
    parseAbsoluteSize(value) {
        const wMatch = value.match(/w:([\d.-]+)/);
        const hMatch = value.match(/h:([\d.-]+)/);
        
        return {
            width: wMatch ? parseFloat(wMatch[1]) : 100,
            height: hMatch ? parseFloat(hMatch[1]) : 100,
            type: 'absolute'
        };
    }

    /**
     * Calculate actual position based on parent and viewport
     * @param {Object} position - Parsed position object
     * @param {Object} parentBounds - Parent element bounds
     * @param {Object} viewportSize - Viewport size
     * @returns {Object} Calculated position {x, y}
     */
    calculatePosition(position, parentBounds = null, viewportSize = null) {
        const viewport = viewportSize || this.defaultViewportSize;
        const parent = parentBounds || { x: 0, y: 0, width: viewport.width, height: viewport.height };

        // ADD VALIDATION: Prevent crazy large values
        if (parent.width > 10000 || parent.height > 10000) {
            // console.warn('⚠️ Parent bounds too large, clamping:', parent);
            parent.width = Math.min(parent.width, viewport.width);
            parent.height = Math.min(parent.height, viewport.height);
        }

        // console.log('🔧 Position calculation input:', { 
        //     position, 
        //     parent, 
        //     viewport,
        //     type: position.type 
        // });

        switch (position.type) {
            case 'unified':
                let x, y;
                
                // Handle X positioning
                if (position.x.anchorRight) {
                    // Position from right edge: right_edge + offset (offset is negative)
                    x = parent.x + parent.width + position.x.offset;
                    // console.log(`🔄 Right-anchored X: ${parent.x} + ${parent.width} + ${position.x.offset} = ${x}`);
                } else {
                    // Normal positioning: left + (scale * width) + offset
                    x = parent.x + (position.x.scale * parent.width) + position.x.offset;
                    // console.log(`📐 Normal X: ${parent.x} + (${position.x.scale} * ${parent.width}) + ${position.x.offset} = ${x}`);
                }
                
                // Handle Y positioning
                if (position.y.anchorBottom) {
                    // Position from bottom edge: bottom_edge + offset (offset is negative)
                    y = parent.y + parent.height + position.y.offset;
                    // console.log(`🔄 Bottom-anchored Y: ${parent.y} + ${parent.height} + ${position.y.offset} = ${y}`);
                } else {
                    // Normal positioning: top + (scale * height) + offset
                    y = parent.y + (position.y.scale * parent.height) + position.y.offset;
                    // console.log(`📐 Normal Y: ${parent.y} + (${position.y.scale} * ${parent.height}) + ${position.y.offset} = ${y}`);
                }

                // VALIDATION: Clamp to reasonable values
                x = Math.max(0, Math.min(x, viewport.width * 2));
                y = Math.max(0, Math.min(y, viewport.height * 2));
                
                // console.log(`✅ Final clamped position: {x: ${x}, y: ${y}}`);
                return { x, y };

            case 'relative':
                const relativeResult = {
                    x: parent.x + (position.x * parent.width),
                    y: parent.y + (position.y * parent.height)
                };
                // console.log(`📐 Relative position calculation: ${parent.x} + (${position.x} * ${parent.width}) = ${relativeResult.x}, ${parent.y} + (${position.y} * ${parent.height}) = ${relativeResult.y}`);
                return relativeResult;

            case 'absolute':
                const absoluteResult = {
                    x: parent.x + position.x,
                    y: parent.y + position.y
                };
                // console.log(`📐 Absolute position calculation: ${parent.x} + ${position.x} = ${absoluteResult.x}, ${parent.y} + ${position.y} = ${absoluteResult.y}`);
                return absoluteResult;

            case 'single-unified':
                // Used for X or Y position only
                return {
                    scale: position.scale,
                    offset: position.offset
                };

            default:
                return { x: parent.x, y: parent.y };
        }
    }

    /**
     * Calculate actual size based on parent and viewport
     * @param {Object} size - Parsed size object
     * @param {Object} parentBounds - Parent element bounds
     * @param {Object} viewportSize - Viewport size
     * @returns {Object} Calculated size {width, height}
     */
    calculateSize(size, parentBounds = null, viewportSize = null) {
        const viewport = viewportSize || this.defaultViewportSize;
        const parent = parentBounds || { width: viewport.width, height: viewport.height };

        // ADD VALIDATION: Prevent crazy large parent values
        if (parent.width > 10000 || parent.height > 10000) {
            // console.warn('⚠️ Parent size too large, clamping:', parent);
            parent.width = Math.min(parent.width, viewport.width);
            parent.height = Math.min(parent.height, viewport.height);
        }

        // console.log('🔢 Calculating size:', { size, parent, viewport });

        switch (size.type) {
            case 'unified':
                let width = Math.max(0, (size.width.scale * parent.width) + size.width.offset);
                let height = Math.max(0, (size.height.scale * parent.height) + size.height.offset);
                
                // VALIDATION: Clamp to reasonable values
                width = Math.min(width, viewport.width * 2);
                height = Math.min(height, viewport.height * 2);
                
                const result = { width, height };
                // console.log('📊 Unified size calculation result (clamped):', result);
                return result;

            case 'relative':
                let relWidth = Math.max(0, size.width * parent.width);
                let relHeight = Math.max(0, size.height * parent.height);
                
                // VALIDATION: Clamp to reasonable values
                relWidth = Math.min(relWidth, viewport.width * 2);
                relHeight = Math.min(relHeight, viewport.height * 2);
                
                const relativeResult = { width: relWidth, height: relHeight };
                // console.log('📊 Relative size calculation result (clamped):', relativeResult);
                return relativeResult;

            case 'absolute':
                const absoluteResult = {
                    width: Math.max(0, Math.min(size.width, viewport.width * 2)),
                    height: Math.max(0, Math.min(size.height, viewport.height * 2))
                };
                // console.log('📊 Absolute size calculation result (clamped):', absoluteResult);
                return absoluteResult;

            default:
                // console.log('⚠️ Unknown size type, using default');
                return { width: 100, height: 100 };
        }
    }

    /**
     * Calculate element bounds including position and size
     * @param {Object} element - Element with position and size properties
     * @param {Object} parentBounds - Parent element bounds
     * @param {Object} viewportSize - Viewport size
     * @returns {Object} Element bounds {x, y, width, height}
     */
    calculateElementBounds(element, parentBounds = null, viewportSize = null) {
        // console.log('🔧 Calculating bounds for:', element.name, {
        //     unifiedPosition: element.unifiedPosition,
        //     unifiedSize: element.unifiedSize,
        //     absolutePosition: element.absolutePosition,
        //     absoluteSize: element.absoluteSize,
        //     parentBounds: parentBounds
        // });

        // Initialize calculation variables
        let calculatedX = 0;
        let calculatedY = 0;
        let calculatedWidth = 100;
        let calculatedHeight = 100;

        // Calculate position with proper priority order according to implementation guide
        // Get parent dimensions for calculations
        const parentX = parentBounds ? parentBounds.x : 0;
        const parentY = parentBounds ? parentBounds.y : 0;
        const parentWidth = parentBounds ? parentBounds.width : (viewportSize || this.defaultViewportSize).width;
        const parentHeight = parentBounds ? parentBounds.height : (viewportSize || this.defaultViewportSize).height;

        // PRIORITY ORDER FOR POSITION (according to implementation guide):
        // 1. UnifiedPosition (highest priority)
        if (element.unifiedPosition) {
            const position = this.parsePosition(element.unifiedPosition);
            const calcPos = this.calculatePosition(position, parentBounds, viewportSize);
            calculatedX = calcPos.x;
            calculatedY = calcPos.y;
            // console.log('📍 Using UnifiedPosition:', element.unifiedPosition);
        }
        // 2. Position property
        else if (element.position) {
            const position = this.parsePosition(element.position);
            const calcPos = this.calculatePosition(position, parentBounds, viewportSize);
            calculatedX = calcPos.x;
            calculatedY = calcPos.y;
            // console.log('📍 Using Position:', element.position);
        }
        // 3. AbsolutePosition
        else if (element.absolutePosition) {
            const position = this.parsePosition(element.absolutePosition);
            const calcPos = this.calculatePosition(position, parentBounds, viewportSize);
            calculatedX = calcPos.x;
            calculatedY = calcPos.y;
            // console.log('📍 Using AbsolutePosition:', element.absolutePosition);
        }
        // 4. Individual X/Y position properties (fallback)
        else {
            if (element.unifiedXPosition) {
                const xPos = this.parseSingleUnified(element.unifiedXPosition);
                calculatedX = parentX + (xPos.scale * parentWidth) + xPos.offset;
            }
            if (element.unifiedYPosition) {
                const yPos = this.parseSingleUnified(element.unifiedYPosition);
                calculatedY = parentY + (yPos.scale * parentHeight) + yPos.offset;
            }
        }

        // PRIORITY ORDER FOR SIZE (according to implementation guide):
        // 1. UnifiedSize (highest priority)
        if (element.unifiedSize) {
            const size = this.parseSize(element.unifiedSize);
            const calcSize = this.calculateSize(size, parentBounds, viewportSize);
            calculatedWidth = calcSize.width;
            calculatedHeight = calcSize.height;
        }
        // 2. Size property
        else if (element.size) {
            const size = this.parseSize(element.size);
            const calcSize = this.calculateSize(size, parentBounds, viewportSize);
            calculatedWidth = calcSize.width;
            calculatedHeight = calcSize.height;
            // console.log('📏 Using Size:', element.size);
        }
        // 3. AbsoluteSize
        else if (element.absoluteSize) {
            const size = this.parseSize(element.absoluteSize);
            const calcSize = this.calculateSize(size, parentBounds, viewportSize);
            calculatedWidth = calcSize.width;
            calculatedHeight = calcSize.height;
            console.log('📏 Using AbsoluteSize:', element.absoluteSize);
        }

        const result = {
            x: calculatedX,
            y: calculatedY,
            width: calculatedWidth,
            height: calculatedHeight
        };

        // Ensure element stays within viewport bounds for root elements
        if (!parentBounds && viewportSize) {
            const viewport = viewportSize;
            
            // Log viewport bounds check
            if (result.x < 0 || result.y < 0 || 
                result.x + result.width > viewport.width || 
                result.y + result.height > viewport.height) {
                console.log(`⚠️ Element ${element.name} extends outside viewport:`, {
                    element: result,
                    viewport: viewport,
                    overflowX: result.x + result.width - viewport.width,
                    overflowY: result.y + result.height - viewport.height
                });
            }
        }

        console.log('📐 Calculated bounds result:', element.name, result);
        return result;
    }

    /**
     * Check if a point is inside element bounds
     * @param {number} x - Point X coordinate
     * @param {number} y - Point Y coordinate
     * @param {Object} bounds - Element bounds
     * @returns {boolean} True if point is inside
     */
    isPointInBounds(x, y, bounds) {
        return x >= bounds.x && 
               x <= bounds.x + bounds.width && 
               y >= bounds.y && 
               y <= bounds.y + bounds.height;
    }

    /**
     * Calculate relative position of point within bounds
     * @param {number} x - Point X coordinate
     * @param {number} y - Point Y coordinate
     * @param {Object} bounds - Element bounds
     * @returns {Object} Relative position {x, y} (0-1 range)
     */
    getRelativePosition(x, y, bounds) {
        return {
            x: bounds.width > 0 ? (x - bounds.x) / bounds.width : 0,
            y: bounds.height > 0 ? (y - bounds.y) / bounds.height : 0
        };
    }

    /**
     * Format bounds for display
     * @param {Object} bounds - Element bounds
     * @returns {string} Formatted string
     */
    formatBounds(bounds) {
        return `${Math.round(bounds.x)}, ${Math.round(bounds.y)} (${Math.round(bounds.width)}×${Math.round(bounds.height)})`;
    }

    /**
     * Set default viewport size
     * @param {number} width - Viewport width
     * @param {number} height - Viewport height
     */
    setViewportSize(width, height) {
        this.defaultViewportSize = { width, height };
    }
}

// Export for use in other modules
window.PositionCalculator = PositionCalculator;
window.positionCalculator = new PositionCalculator();
