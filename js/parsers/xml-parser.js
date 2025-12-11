/**
 * XML Parser Module for TLBB GUI Renderer
 * Handles parsing and processing TLBB XML layout files
 */

class XMLParser {
    constructor() {
        this.parser = new DOMParser();
        this.serializer = new XMLSerializer();
        this.namespaces = {
            gui: 'http://www.cegui.org.uk/'
        };
    }

    /**
     * Parse XML string into document
     * @param {string} xmlString - XML content as string
     * @returns {Object} Parsed result with document and elements
     */
    parseXML(xmlString) {
        try {
            // Clean up XML string
            const cleanXML = this.preprocessXML(xmlString);
            
            // Parse XML
            const xmlDoc = this.parser.parseFromString(cleanXML, 'text/xml');
            
            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error(`XML parsing error: ${parserError.textContent}`);
            }

            // Extract GUI layout
            const guiLayout = xmlDoc.querySelector('GUILayout');
            if (!guiLayout) {
                throw new Error('No GUILayout element found in XML');
            }

            // Parse all Window elements
            const elements = this.parseElements(guiLayout);
            
            return {
                success: true,
                document: xmlDoc,
                layout: guiLayout,
                elements: elements,
                elementCount: elements.length
            };

        } catch (error) {
            console.error('XML parsing failed:', error);
            return {
                success: false,
                error: error.message,
                elements: [],
                elementCount: 0
            };
        }
    }

    /**
     * Preprocess XML string to handle common issues
     * @param {string} xmlString - Raw XML string
     * @returns {string} Cleaned XML string
     */
    preprocessXML(xmlString) {
        let cleaned = xmlString;

        // Remove BOM if present
        if (cleaned.charCodeAt(0) === 0xFEFF) {
            cleaned = cleaned.slice(1);
        }

        // Fix common encoding issues
        cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Ensure XML declaration
        if (!cleaned.trim().startsWith('<?xml')) {
            cleaned = '<?xml version="1.0" encoding="UTF-8"?>\n' + cleaned;
        }

        // Fix self-closing tags
        cleaned = cleaned.replace(/<(\w+)([^>]*?)\/>/g, '<$1$2></$1>');

        return cleaned;
    }

    /**
     * Parse all Window elements recursively
     * @param {Element} parentElement - Parent XML element
     * @param {string} parentPath - Parent element path
     * @returns {Array} Array of parsed elements
     */
    parseElements(parentElement, parentPath = '') {
        const elements = [];
        const windows = parentElement.querySelectorAll(':scope > Window');

        windows.forEach((window, index) => {
            const element = this.parseWindow(window, parentPath, index);
            elements.push(element);

            // Parse child elements
            const childElements = this.parseElements(window, element.path);
            elements.push(...childElements);
        });

        return elements;
    }

    /**
     * Parse single Window element
     * @param {Element} windowElement - Window XML element
     * @param {string} parentPath - Parent element path
     * @param {number} index - Element index in parent
     * @returns {Object} Parsed window object
     */
    parseWindow(windowElement, parentPath = '', index = 0) {
        // Basic attributes
        const type = windowElement.getAttribute('Type') || 'DefaultWindow';
        const name = windowElement.getAttribute('Name') || `Unnamed_${index}`;
        const path = parentPath ? `${parentPath}/${name}` : name;

        // Parse properties
        const properties = this.parseProperties(windowElement);
        
        // Parse events
        const events = this.parseEvents(windowElement);

        // Count child windows
        const childWindows = windowElement.querySelectorAll(':scope > Window');
        const childCount = childWindows.length;

        // Create element object
        const element = {
            type: type,
            name: name,
            path: path,
            parentPath: parentPath,
            index: index,
            properties: properties,
            events: events,
            childCount: childCount,
            xmlElement: windowElement,
            
            // Quick access to common properties
            text: properties.Text || '',
            visible: this.parseBoolean(properties.Visible, true),
            
            // Position properties for PositionCalculator
            position: properties.Position || properties.UnifiedPosition || properties.AbsolutePosition,
            unifiedPosition: properties.UnifiedPosition,
            absolutePosition: properties.AbsolutePosition,
            unifiedXPosition: properties.UnifiedXPosition,
            unifiedYPosition: properties.UnifiedYPosition,
            
            // Size properties for PositionCalculator
            size: properties.Size || properties.UnifiedSize || properties.AbsoluteSize,
            unifiedSize: properties.UnifiedSize,
            absoluteSize: properties.AbsoluteSize,
            unifiedXSize: properties.UnifiedXSize,
            unifiedYSize: properties.UnifiedYSize,
            textColor: properties.TextColor,
            font: properties.Font,
            image: properties.Image || properties.BackImage,
            backImage: properties.BackImage,
            
            // Layout properties
            mouseHollow: this.parseBoolean(properties.MouseHollow, false),
            draggingEnabled: this.parseBoolean(properties.DraggingEnabled, false),
            alwaysOnTop: this.parseBoolean(properties.AlwaysOnTop, false),
            
            // Visual properties
            normalImage: properties.NormalImage,
            hoverImage: properties.HoverImage,
            pushedImage: properties.PushedImage,
            disabledImage: properties.DisabledImage,
            
            // Text formatting
            horzFormatting: properties.HorzFormatting || 'LeftAligned',
            vertFormatting: properties.VertFormatting || 'TopAligned',
            
            // Special properties
            dragAcceptName: properties.DragAcceptName,
            dragTarget: properties.DragTarget,
            maxTextLength: properties.MaxTextLength,
            checkMode: properties.CheckMode,
            selected: this.parseBoolean(properties.Selected, false)
        };

        return element;
    }

    /**
     * Parse properties from Window element
     * @param {Element} windowElement - Window XML element
     * @returns {Object} Properties object
     */
    parseProperties(windowElement) {
        const properties = {};
        const propertyElements = windowElement.querySelectorAll(':scope > Property');

        propertyElements.forEach(property => {
            const name = property.getAttribute('Name');
            const value = property.getAttribute('Value');
            
            if (name && value !== null) {
                properties[name] = value;
            }
        });

        return properties;
    }

    /**
     * Parse events from Window element
     * @param {Element} windowElement - Window XML element
     * @returns {Object} Events object
     */
    parseEvents(windowElement) {
        const events = {};
        const eventElements = windowElement.querySelectorAll(':scope > Event');

        eventElements.forEach(event => {
            const name = event.getAttribute('Name');
            const func = event.getAttribute('Function');
            
            if (name && func) {
                events[name] = func;
            }
        });

        return events;
    }

    /**
     * Parse boolean value from string
     * @param {string} value - String value
     * @param {boolean} defaultValue - Default value if parsing fails
     * @returns {boolean} Parsed boolean value
     */
    parseBoolean(value, defaultValue = false) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === '1' || lower === 'yes';
        }
        return defaultValue;
    }

    /**
     * Parse numeric value from string
     * @param {string} value - String value
     * @param {number} defaultValue - Default value if parsing fails
     * @returns {number} Parsed numeric value
     */
    parseNumber(value, defaultValue = 0) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? defaultValue : parsed;
        }
        return defaultValue;
    }

    /**
     * Find element by name in parsed elements
     * @param {Array} elements - Array of parsed elements
     * @param {string} name - Element name to find
     * @returns {Object|null} Found element or null
     */
    findElementByName(elements, name) {
        return elements.find(element => element.name === name) || null;
    }

    /**
     * Find elements by type in parsed elements
     * @param {Array} elements - Array of parsed elements
     * @param {string} type - Element type to find
     * @returns {Array} Array of matching elements
     */
    findElementsByType(elements, type) {
        return elements.filter(element => element.type === type);
    }

    /**
     * Find child elements of a parent
     * @param {Array} elements - Array of parsed elements
     * @param {string} parentPath - Parent element path
     * @returns {Array} Array of child elements
     */
    findChildElements(elements, parentPath) {
        return elements.filter(element => element.parentPath === parentPath);
    }

    /**
     * Build element hierarchy tree
     * @param {Array} elements - Array of parsed elements
     * @returns {Array} Tree structure
     */
    buildElementTree(elements) {
        const tree = [];
        const elementMap = new Map();

        // Create map for quick lookup
        elements.forEach(element => {
            elementMap.set(element.path, {
                ...element,
                children: []
            });
        });

        // Build tree structure
        elements.forEach(element => {
            const treeElement = elementMap.get(element.path);
            
            if (element.parentPath) {
                const parent = elementMap.get(element.parentPath);
                if (parent) {
                    parent.children.push(treeElement);
                } else {
                    tree.push(treeElement);
                }
            } else {
                tree.push(treeElement);
            }
        });

        return tree;
    }

    /**
     * Get element statistics
     * @param {Array} elements - Array of parsed elements
     * @returns {Object} Statistics object
     */
    getElementStats(elements) {
        const stats = {
            total: elements.length,
            byType: {},
            hasText: 0,
            hasEvents: 0,
            hasImages: 0,
            visible: 0,
            invisible: 0
        };

        elements.forEach(element => {
            // Count by type
            stats.byType[element.type] = (stats.byType[element.type] || 0) + 1;

            // Count features
            if (element.text) stats.hasText++;
            if (Object.keys(element.events).length > 0) stats.hasEvents++;
            if (element.image) stats.hasImages++;
            if (element.visible) stats.visible++;
            else stats.invisible++;
        });

        return stats;
    }

    /**
     * Validate XML structure
     * @param {Object} parseResult - Result from parseXML
     * @returns {Object} Validation result
     */
    validateXML(parseResult) {
        const validation = {
            valid: true,
            warnings: [],
            errors: []
        };

        if (!parseResult.success) {
            validation.valid = false;
            validation.errors.push(parseResult.error);
            return validation;
        }

        // Check for common issues
        parseResult.elements.forEach(element => {
            // Check for missing names
            if (element.name.startsWith('Unnamed_')) {
                validation.warnings.push(`Element of type ${element.type} has no name`);
            }

            // Check for invalid positions
            if (element.position && !this.isValidPosition(element.position)) {
                validation.warnings.push(`Element ${element.name} has invalid position: ${element.position}`);
            }

            // Check for invalid sizes
            if (element.size && !this.isValidSize(element.size)) {
                validation.warnings.push(`Element ${element.name} has invalid size: ${element.size}`);
            }
        });

        return validation;
    }

    /**
     * Check if position value is valid
     * @param {string} position - Position value
     * @returns {boolean} True if valid
     */
    isValidPosition(position) {
        // Basic validation for common position formats
        return /^(\{\{.*\}\}|[xy]:|.*,.*|\d+)/.test(position);
    }

    /**
     * Check if size value is valid
     * @param {string} size - Size value
     * @returns {boolean} True if valid
     */
    isValidSize(size) {
        // Basic validation for common size formats
        return /^(\{\{.*\}\}|[wh]:|.*,.*|\d+)/.test(size);
    }

    /**
     * Export elements to JSON
     * @param {Array} elements - Array of elements
     * @returns {string} JSON string
     */
    exportToJSON(elements) {
        const exportData = elements.map(element => {
            // Remove xmlElement reference for JSON serialization
            const { xmlElement, ...exportElement } = element;
            return exportElement;
        });

        return JSON.stringify(exportData, null, 2);
    }
}

// Export for use in other modules
window.XMLParser = XMLParser;
window.xmlParser = new XMLParser();
