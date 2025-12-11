/**\n * GUI Renderer Core Module - Viewport-Based Positioning\n * Main rendering orchestrator with viewport-aware positioning\n */\n\nclass GUIRenderer {\n    constructor() {\n        this.renderers = new Map();\n        this.container = null;\n        this.elements = [];
        this.renderedElements = new Map();
        this.displayMode = 'element';
        this.zoomLevel = 1.0;
        this.eventCallbacks = new Map();
        this.hierarchicalMode = true; // Default to hierarchical rendering
        this.debugMode = false; // Debug logging flag
        this.absoluteBoundsCache = new Map(); // Cache for parent bounds lookup
        
        // Legacy position calculator (kept for fallback) and new unified layout
        this.positionCalculator = new PositionCalculator();
                this.layoutCalculator = typeof TLBBLayoutCalculator !== 'undefined' ? new TLBBLayoutCalculator({ debug: false }) : null;
    }

    /**
     * Get viewport size
     * @returns {Object} Viewport size
     */
    getViewportSize() {
        if (this.container) {
            const containerRect = this.container.getBoundingClientRect();
            return {
                width: containerRect.width || this.container.clientWidth || 1024,
                height: containerRect.height || this.container.clientHeight || 768
            };
        }
        
        return { width: 1024, height: 768 };
    }
    }

    /**
     * Initialize renderer
     * @param {HTMLElement} container - Container element
     */
    init(container) {
        this.container = container;
        this.setupContainer();
        this.registerDefaultRenderers();
    }

    /**
     * Setup container element
     */
    setupContainer() {
        if (!this.container) return;
        
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.innerHTML = '';
    }

    /**
     * Register default renderers
     */
    registerDefaultRenderers() {
        // Register built-in renderers
        this.registerRenderer('window', new WindowRenderer());
        this.registerRenderer('button', new ButtonRenderer());
    }

    /**
     * Register a renderer
     * @param {string} name - Renderer name
     * @param {Object} renderer - Renderer instance
     */
    registerRenderer(name, renderer) {
        this.renderers.set(name, renderer);
        
        // Setup renderer
        if (renderer.setContainer) {
            renderer.setContainer(this.container);
        }
        
        // Setup event forwarding
        if (renderer.on) {
            renderer.on('elementSelected', (data) => {
                this.emit('elementSelected', data);
            });
            
            renderer.on('elementHover', (data) => {
                this.emit('elementHover', data);
            });
        }
    }

    /**
     * Get renderer by name
     * @param {string} name - Renderer name
     * @returns {Object|null} Renderer instance
     */
    getRenderer(name) {
        return this.renderers.get(name) || null;
    }

    /**
     * Clear rendered elements and container
     */
    clear() {
        if (this.container) {
            // Clear all child elements
            this.container.innerHTML = '';
            
            // Reset container styles that might interfere with positioning
            this.container.style.position = 'relative';
            this.container.style.overflow = 'visible';
            this.container.style.margin = '0';
            this.container.style.padding = '0';
            this.container.style.border = 'none';
            this.container.style.boxSizing = 'border-box';
            this.container.style.transform = 'none';
            
            // Set up viewport-aware container
            const viewport = this.getViewportSize();
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.container.style.minWidth = Math.max(viewport.width, 1024) + 'px';
            this.container.style.minHeight = Math.max(viewport.height, 768) + 'px';
            
            // Set container as viewport reference
            this.container.setAttribute('data-viewport-width', viewport.width);
            this.container.setAttribute('data-viewport-height', viewport.height);
            
            if (this.debugMode) {
                console.log('Container setup with viewport:', {
                    viewport: `${viewport.width}x${viewport.height}`,
                    containerSize: `${this.container.style.minWidth} x ${this.container.style.minHeight}`,
                    position: this.container.style.position
                });
            }
        }
        
        // Clear internal tracking
        this.renderedElements.clear();
        this.absoluteBoundsCache.clear();
        
        // Clear all renderers
        for (const renderer of this.renderers.values()) {
            if (renderer.clear) {
                renderer.clear();
            }
        }
    }

    /**
     * Render elements
     * @param {Array} elements - Elements to render
     */
    async renderElements(elements) {
        this.elements = elements;
        this.clear();
        
        // Check and fix container positioning before rendering
        this.checkContainerPositioning();
        
        // Calculate all bounds using new layout calculator when available
        let elementsWithBounds;
        if (this.layoutCalculator) {
            const laidOut = this.layoutCalculator.compute(elements);
            elementsWithBounds = laidOut.map(el => ({ element: el, bounds: el.bounds }));
        } else {
            elementsWithBounds = this.calculateAllBounds(elements);
        }
        
        // Render hierarchically or flat based on mode
        if (this.hierarchicalMode) {
            await this.renderElementsHierarchically(elementsWithBounds);
        } else {
            // Legacy flat rendering
            await this.renderElementsFlat(elementsWithBounds);
        }
        
        this.emit('renderComplete', { elementCount: elements.length });
    }

    /**
     * Render elements flat (legacy mode - all elements at same DOM level)
     * @param {Array} elementsWithBounds - Elements with calculated bounds
     */
    async renderElementsFlat(elementsWithBounds) {
        // Render elements in order (legacy behavior)
        for (const { element, bounds } of elementsWithBounds) {
            await this.renderElement(element, bounds, false);
        }
    }

    /**
     * Set rendering mode
     * @param {boolean} hierarchical - True for hierarchical, false for flat
     */
    setHierarchicalMode(hierarchical) {
        if (this.hierarchicalMode === hierarchical) return;
        
        this.hierarchicalMode = hierarchical;
        
        // Re-render if we have elements
        if (this.elements.length > 0) {
            this.renderElements(this.elements);
        }
    }

    /**
     * Get current rendering mode
     * @returns {boolean} True if hierarchical mode
     */
    isHierarchicalMode() {
        return this.hierarchicalMode;
    }

    /**
     * Set debug mode
     * @param {boolean} debug - True to enable debug logging
     */
    setDebugMode(debug) {
        this.debugMode = debug;
        
        // Inject debug CSS if needed
        if (debug && !document.getElementById('tlbb-debug-styles')) {
            this.injectDebugCSS();
        }
    }
    
    /**
     * Inject CSS styles to ensure proper rendering
     */
    injectDebugCSS() {
        const style = document.createElement('style');
        style.id = 'tlbb-debug-styles';
        style.textContent = `
            .tlbb-element {
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .tlbb-root-element {
                position: absolute !important;
            }
            
            .tlbb-child-element {
                position: absolute !important;
            }
            
            .tlbb-element[data-element-type*="Frame"],
            .tlbb-element[data-element-type*="Window"] {
                overflow: visible !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Get absolute bounds for parent element
     * @param {string} parentPath - Parent element path
     * @returns {Object|null} Parent bounds
     */
    getParentAbsoluteBounds(parentPath) {
        // Use cached absolute bounds
        if (this.absoluteBoundsCache && this.absoluteBoundsCache.has(parentPath)) {
            return this.absoluteBoundsCache.get(parentPath);
        }
        
        // Fallback: Find parent element in rendered elements
        for (const [element, domElement] of this.renderedElements) {
            if (element.path === parentPath) {
                const boundsStr = domElement.getAttribute('data-bounds');
                if (boundsStr) {
                    try {
                        return JSON.parse(boundsStr);
                    } catch (e) {
                        console.warn('Failed to parse parent bounds:', e);
                    }
                }
                break;
            }
        }
        return null;
    }
    
    /**
     * Check and fix container positioning to ensure accurate child positioning
     */
    checkContainerPositioning() {
        if (!this.container) return;
        
        const containerRect = this.container.getBoundingClientRect();
        const containerStyle = getComputedStyle(this.container);
        
        if (this.debugMode) {
            console.log('Container positioning check:');
            console.log('  - Bounds:', containerRect);
            console.log('  - Computed styles:', {
                position: containerStyle.position,
                top: containerStyle.top,
                left: containerStyle.left,
                margin: containerStyle.margin,
                padding: containerStyle.padding,
                transform: containerStyle.transform
            });
        }
        
        // Ensure container is properly positioned for absolute children
        if (containerStyle.position === 'static') {
            this.container.style.position = 'relative';
        }
    }
    
    /**
     * Diagnose positioning issues by logging element information
     */
    diagnosePositioning() {
        console.log('=== POSITIONING DIAGNOSIS ===');
        console.log('Container:', this.container);
        console.log('Container bounds:', this.container?.getBoundingClientRect());
        
        this.checkContainerPositioning();
        
        const elements = this.container?.querySelectorAll('.tlbb-element');
        if (elements) {
            elements.forEach((el, index) => {
                console.log(`Element ${index}:`, {
                    name: el.getAttribute('data-element-name'),
                    type: el.getAttribute('data-element-type'),
                    parentPath: el.getAttribute('data-parent-path'),
                    bounds: el.getAttribute('data-bounds'),
                    computedStyle: {
                        position: getComputedStyle(el).position,
                        left: getComputedStyle(el).left,
                        top: getComputedStyle(el).top,
                        width: getComputedStyle(el).width,
                        height: getComputedStyle(el).height,
                        zIndex: getComputedStyle(el).zIndex
                    },
                    actualBounds: el.getBoundingClientRect()
                });
            });
        }
        console.log('=== END DIAGNOSIS ===');
    }

    /**
     * Render elements hierarchically (parent-child structure)
     * @param {Array} elementsWithBounds - Elements with calculated bounds
     */
    async renderElementsHierarchically(elementsWithBounds) {
        if (this.debugMode) {
            console.log('Starting hierarchical rendering with', elementsWithBounds.length, 'elements');
        }
        
        // Create a map for quick element lookup
        const elementMap = new Map();
        const boundsMap = new Map();
        
        // Populate maps
        for (const { element, bounds } of elementsWithBounds) {
            elementMap.set(element.path, element);
            boundsMap.set(element.path, bounds);
        }
        
        // Find root elements (no parent or parent not found)
        const rootElements = [];
        for (const { element } of elementsWithBounds) {
            if (!element.parentPath || !elementMap.has(element.parentPath)) {
                rootElements.push(element);
            }
        }
        
        if (this.debugMode) {
            console.log('Found', rootElements.length, 'root elements:', rootElements.map(e => e.name));
        }
        
        // Render root elements and their children recursively
        for (const rootElement of rootElements) {
            if (this.debugMode) {
                console.log('Rendering root element:', rootElement.name, 'at path:', rootElement.path);
            }
            await this.renderElementHierarchy(rootElement, this.container, elementMap, boundsMap);
        }
        
        if (this.debugMode) {
            console.log('Hierarchical rendering complete');
        }
    }

    /**
     * Render element and its children recursively
     * @param {Object} element - Element to render
     * @param {HTMLElement} parentContainer - Parent DOM container
     * @param {Map} elementMap - Map of all elements by path
     * @param {Map} boundsMap - Map of all bounds by path
     */
    async renderElementHierarchy(element, parentContainer, elementMap, boundsMap) {
        const bounds = boundsMap.get(element.path);
        if (!bounds) {
            console.warn(`Bounds not found for element: ${element.path}`);
            return;
        }

        if (this.debugMode) {
            console.log(`Rendering element: ${element.name} (${element.type}) at bounds:`, bounds);
        }

        // Render current element
        const domElement = await this.renderElement(element, bounds, true);
        if (!domElement) {
            console.warn(`Failed to render element: ${element.path}`);
            return;
        }

        // Set up proper container structure and positioning
        this.setupHierarchicalElement(domElement, element, bounds, parentContainer);
        
        // Add to parent container
        parentContainer.appendChild(domElement);

        // Find and render child elements
        const childElements = [];
        for (const [path, childElement] of elementMap) {
            if (childElement.parentPath === element.path) {
                childElements.push(childElement);
            }
        }

        // Sort children by index to maintain XML order
        childElements.sort((a, b) => (a.index || 0) - (b.index || 0));

        if (this.debugMode && childElements.length > 0) {
            console.log(`Element ${element.name} has ${childElements.length} children:`, childElements.map(c => c.name));
        }

        // Render children recursively
        for (const childElement of childElements) {
            await this.renderElementHierarchy(childElement, domElement, elementMap, boundsMap);
        }
    }

    /**
     * Setup hierarchical element with proper positioning and container structure
     * @param {HTMLElement} domElement - DOM element
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @param {HTMLElement} parentContainer - Parent container
     */
    setupHierarchicalElement(domElement, element, bounds, parentContainer) {
        // Reset any existing styles that might interfere
        domElement.style.margin = '0';
        domElement.style.padding = '0';
        domElement.style.border = 'none';
        domElement.style.outline = 'none';
        domElement.style.boxSizing = 'border-box';
        
        // Set dimensions first
        if (bounds.width && bounds.width > 0) {
            domElement.style.width = bounds.width + 'px';
        }
        if (bounds.height && bounds.height > 0) {
            domElement.style.height = bounds.height + 'px';
        }
        
        // Get viewport size for proper scaling
        const viewport = this.getViewportSize();
        
        // Calculate positioning based on container type and viewport
        let left, top;
        
        if (element.parentPath && parentContainer !== this.container) {
            // Child element: calculate position relative to parent container
            // Get parent's absolute bounds
            const parentBounds = this.getParentAbsoluteBounds(element.parentPath);
            
            if (parentBounds) {
                // For hierarchical mode, use direct relative positioning
                // The PositionCalculator should have already calculated relative positions
                left = bounds.left - parentBounds.left;
                top = bounds.top - parentBounds.top;
                
                // Ensure positioning is within reasonable bounds
                if (left < -parentBounds.width || left > parentBounds.width * 2) {
                    console.warn(`Suspicious left position for ${element.name}: ${left}, parent width: ${parentBounds.width}`);
                }
                if (top < -parentBounds.height || top > parentBounds.height * 2) {
                    console.warn(`Suspicious top position for ${element.name}: ${top}, parent height: ${parentBounds.height}`);
                }
            } else {
                // Fallback: position relative to viewport if no parent bounds
                left = (bounds.left / viewport.width) * viewport.width;
                top = (bounds.top / viewport.height) * viewport.height;
            }
            
            if (this.debugMode) {
                console.log(`Child element ${element.name}:`);
                console.log(`  - Viewport: ${viewport.width}x${viewport.height}`);
                console.log(`  - Element bounds: left=${bounds.left}, top=${bounds.top}, w=${bounds.width}, h=${bounds.height}`);
                console.log(`  - Parent bounds:`, parentBounds);
                console.log(`  - Final position: left=${left}, top=${top}`);
            }
        } else {
            // Root element: position absolute to viewport
            // Scale position based on viewport if needed
            left = bounds.left;
            top = bounds.top;
            
            // Ensure root elements are positioned within viewport bounds
            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left > viewport.width - (bounds.width || 0)) {
                left = Math.max(0, viewport.width - (bounds.width || 0));
            }
            if (top > viewport.height - (bounds.height || 0)) {
                top = Math.max(0, viewport.height - (bounds.height || 0));
            }
            
            if (this.debugMode) {
                console.log(`Root element ${element.name}:`);
                console.log(`  - Viewport: ${viewport.width}x${viewport.height}`);
                console.log(`  - Original bounds: left=${bounds.left}, top=${bounds.top}`);
                console.log(`  - Final position: left=${left}, top=${top}`);
            }
        }
        
        // Apply positioning with potential container offset adjustment
        domElement.style.position = 'absolute';
        domElement.style.left = left + 'px';
        domElement.style.top = top + 'px';
        
        // Additional debug info for positioning
        if (this.debugMode) {
            console.log(`Applied CSS: left=${left}px, top=${top}px for ${element.name}`);
        }
        
        // Ensure parent elements can contain children properly
        if (element.type.includes('Frame') || element.type.includes('Window') || element.type === 'DefaultWindow') {
            domElement.style.overflow = 'visible';
            domElement.style.position = 'absolute';
        }
        
        // Add z-index based on hierarchy depth to prevent stacking issues
        const depth = (element.path || '').split('/').length;
        domElement.style.zIndex = Math.max(1, depth);
        
        // Prevent text selection and other interactions that might interfere
        domElement.style.userSelect = 'none';
        domElement.style.pointerEvents = 'auto';
        
        // Add some debug info for troubleshooting
        domElement.setAttribute('data-element-path', element.path);
        domElement.setAttribute('data-element-name', element.name);
        domElement.setAttribute('data-parent-path', element.parentPath || 'root');
        domElement.setAttribute('data-element-type', element.type);
        domElement.setAttribute('data-bounds', JSON.stringify({
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height
        }));
        
        // Add CSS class for styling
        domElement.classList.add('tlbb-element');
        if (element.parentPath) {
            domElement.classList.add('tlbb-child-element');
        } else {
            domElement.classList.add('tlbb-root-element');
        }
        
        // Add debug border if in debug mode
        if (this.debugMode) {
            domElement.style.border = '1px solid ' + (element.parentPath ? 'blue' : 'red');
            domElement.style.backgroundColor = element.parentPath ? 'rgba(0,0,255,0.1)' : 'rgba(255,0,0,0.1)';
        }
    }

    /**
     * Calculate bounds for all elements
     * @param {Array} elements - Elements array
     * @returns {Array} Elements with bounds
     */
    calculateAllBounds(elements) {
        const boundsCache = new Map();
        const result = [];
        
        // Clear any previous absolute bounds cache
        this.absoluteBoundsCache = new Map();
        
        // Sort elements by hierarchy depth to ensure parents are calculated first
        const sortedElements = [...elements].sort((a, b) => {
            const aDepth = (a.parentPath || '').split('/').length;
            const bDepth = (b.parentPath || '').split('/').length;
            return aDepth - bDepth;
        });
        
        for (const element of sortedElements) {
            let parentBounds = null;
            
            // Find parent bounds
            if (element.parentPath) {
                parentBounds = this.absoluteBoundsCache.get(element.parentPath);
                if (!parentBounds) {
                    console.warn(`Parent bounds not found for ${element.name}, parent: ${element.parentPath}`);
                }
            }
            
            // Calculate absolute bounds using our instance
            const absoluteBounds = this.positionCalculator.calculateElementBounds(
                element,
                parentBounds,
                this.getViewportSize()
            );
            
            // Store absolute bounds for parent lookup during hierarchical rendering
            this.absoluteBoundsCache.set(element.path, absoluteBounds);
            boundsCache.set(element.path, absoluteBounds);
            result.push({ element, bounds: absoluteBounds });
            
            if (this.debugMode) {
                console.log(`Element ${element.name}: bounds(${absoluteBounds.left}, ${absoluteBounds.top}, ${absoluteBounds.width}, ${absoluteBounds.height})`);
            }
        }
        
        return result;
    }

    /**
     * Render single element
     * @param {Object} element - Element to render
     * @param {Object} bounds - Element bounds
     * @param {boolean} hierarchical - Whether this is hierarchical rendering
     */
    async renderElement(element, bounds, hierarchical = false) {
        const renderer = this.getElementRenderer(element);
        if (!renderer) {
            console.warn(`No renderer found for element type: ${element.type}`);
            return;
        }
        
        let domElement = null;
        
        // For hierarchical rendering, pass bounds without positioning
        // as positioning will be handled by setupHierarchicalElement
        const renderBounds = hierarchical ? {
            ...bounds,
            // Don't apply position in renderer for hierarchical mode
            left: 0,
            top: 0
        } : bounds;
        
        // Use appropriate render method
        if (renderer.renderWindow && this.isWindowType(element.type)) {
            domElement = renderer.renderWindow(element, renderBounds);
        } else if (renderer.renderButton && this.isButtonType(element.type)) {
            domElement = renderer.renderButton(element, renderBounds);
        } else if (renderer.renderElement) {
            domElement = renderer.renderElement(element, renderBounds);
        }
        
        if (domElement) {
            // Store reference
            this.renderedElements.set(element, domElement);
            
            // Apply display mode
            this.applyDisplayMode(domElement, element);
            
            // Mark as hierarchical for CSS styling if needed
            if (hierarchical) {
                domElement.setAttribute('data-hierarchical', 'true');
                // Don't remove positioning here - let setupHierarchicalElement handle it
            }
            
            // Only append to main container in flat rendering mode
            if (!hierarchical) {
                this.container.appendChild(domElement);
            }
        }
        
        return domElement;
    }    /**
     * Get appropriate renderer for element
     * @param {Object} element - Element
     * @returns {Object|null} Renderer
     */
    getElementRenderer(element) {
        if (this.isButtonType(element.type)) {
            return this.getRenderer('button');
        } else if (this.isWindowType(element.type)) {
            return this.getRenderer('window');
        }
        
        // Default to window renderer
        return this.getRenderer('window');
    }

    /**
     * Check if element type is a window
     * @param {string} type - Element type
     * @returns {boolean} True if window type
     */
    isWindowType(type) {
        return type === 'DefaultWindow' || 
               type.startsWith('TLBB_MainFrame') || 
               type.startsWith('TLBB_Special') ||
               type.includes('Frame');
    }

    /**
     * Check if element type is a button
     * @param {string} type - Element type
     * @returns {boolean} True if button type
     */
    isButtonType(type) {
        return type.includes('Button') || type === 'TLBB_ActionButton';
    }

    /**
     * Set display mode
     * @param {string} mode - Display mode
     */
    setDisplayMode(mode) {
        this.displayMode = mode;
        
        // Update all renderers
        for (const renderer of this.renderers.values()) {
            if (renderer.setDisplayMode) {
                renderer.setDisplayMode(mode);
            }
        }
        
        // Update existing elements
        this.updateAllDisplayModes();
    }

    /**
     * Update display mode for all rendered elements
     */
    updateAllDisplayModes() {
        for (const [element, domElement] of this.renderedElements) {
            this.applyDisplayMode(domElement, element);
        }
    }

    /**
     * Apply display mode to element
     * @param {HTMLElement} domElement - DOM element
     * @param {Object} element - TLBB element
     */
    applyDisplayMode(domElement, element) {
        // Remove existing overlay
        const existingOverlay = domElement.querySelector('.text-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create new overlay
        const overlay = this.createTextOverlay(element);
        if (overlay) {
            if (overlay) { domElement.appendChild(overlay); }
        }
    }

    /**
     * Create text overlay for display mode
     * @param {Object} element - TLBB element
     * @returns {HTMLElement|null} Overlay element
     */
    createTextOverlay(element) {
        const overlay = document.createElement('div');
        overlay.className = `text-overlay ${this.displayMode}`;
        
        let displayText = this.getDisplayText(element);
        
        // Truncate long text
        if (displayText.length > 30) {
            displayText = displayText.substring(0, 30) + '...';
        }
        
        overlay.textContent = displayText;
        
        // Position overlay
        overlay.style.position = 'absolute';
        overlay.style.top = '2px';
        overlay.style.left = '2px';
        overlay.style.zIndex = '1001';
        overlay.style.pointerEvents = 'none';
        
        return overlay;
    }

    /**
     * Get display text for element based on mode
     * @param {Object} element - TLBB element
     * @returns {string} Display text
     */
    getDisplayText(element) {
        switch (this.displayMode) {
            case 'element':
                return element.name;
            
            case 'type':
                return element.type;
            
            case 'position':
                return element.position || 'No position';
            
            case 'size':
                return element.size || 'No size';
            
            case 'text':
                if (element.text) {
                    return window.stringDictionary ? 
                        window.stringDictionary.resolveTextValue(element.text) : 
                        element.text;
                }
                return 'No text';
            
            default:
                return element.name;
        }
    }

    /**
     * Set zoom level
     * @param {number} zoom - Zoom level
     */
    setZoomLevel(zoom) {
        this.zoomLevel = Math.max(0.1, Math.min(5.0, zoom));
        
        // Update all renderers
        for (const renderer of this.renderers.values()) {
            if (renderer.setZoomLevel) {
                renderer.setZoomLevel(this.zoomLevel);
            }
        }
        
        // Apply zoom to container
        if (this.container) {
            this.container.style.transform = `scale(${this.zoomLevel})`;
            this.container.style.transformOrigin = '0 0';
        }
    }

    /**
     * Get viewport size
     * @returns {Object} Viewport size
     */
    getViewportSize() {
        if (this.container) {
            return {
                width: this.container.offsetWidth / this.zoomLevel,
                height: this.container.offsetHeight / this.zoomLevel
            };
        }
        
        return { width: 1024, height: 768 };
    }

    /**
     * Find element by name
     * @param {string} name - Element name
     * @returns {Object|null} Element
     */
    findElement(name) {
        return this.elements.find(el => el.name === name) || null;
    }

    /**
     * Get rendered DOM element for TLBB element
     * @param {Object} element - TLBB element
     * @returns {HTMLElement|null} DOM element
     */
    getRenderedElement(element) {
        return this.renderedElements.get(element) || null;
    }

    /**
     * Select element
     * @param {Object} element - Element to select
     */
    selectElement(element) {
        // Remove previous selection
        this.container.querySelectorAll('.tlbb-element.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        if (element) {
            const domElement = this.getRenderedElement(element);
            if (domElement) {
                domElement.classList.add('selected');
                domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        this.emit('elementSelected', element);
    }



    /**
     * Get render statistics
     * @returns {Object} Statistics
     */
    getStats() {
        const rendererStats = {};
        for (const [name, renderer] of this.renderers) {
            if (renderer.getStats) {
                rendererStats[name] = renderer.getStats();
            }
        }
        
        return {
            totalElements: this.elements.length,
            renderedElements: this.renderedElements.size,
            displayMode: this.displayMode,
            zoomLevel: this.zoomLevel,
            viewportSize: this.getViewportSize(),
            renderers: rendererStats
        };
    }

    /**
     * Event emitter methods
     */
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for ${event}:`, error);
                }
            });
        }
    }
}

// Export for use in other modules
window.GUIRenderer = GUIRenderer;
