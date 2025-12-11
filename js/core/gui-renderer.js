/**
 * GUI Renderer Core Module
 * Main rendering orchestrator
 */

class GUIRenderer {
    constructor() {
        this.renderers = new Map();
        this.container = null;
        this.elements = [];
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
     * Setup container element with viewport-aware sizing
     */
    setupContainer() {
        if (!this.container) return;
        
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
        
        this.container.innerHTML = '';
    }

    /**
     * Setup hierarchical element with viewport-based positioning
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
            const parentBounds = this.getParentAbsoluteBounds(element.parentPath);
            
            if (parentBounds) {
                // For hierarchical mode, use direct relative positioning
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
        
        // Apply positioning with viewport awareness
        domElement.style.position = 'absolute';
        domElement.style.left = left + 'px';
        domElement.style.top = top + 'px';
        
        // Add viewport-aware z-index
        const depth = (element.path || '').split('/').length;
        domElement.style.zIndex = Math.max(1, depth);
        
        // Add debug info
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
        domElement.setAttribute('data-final-position', JSON.stringify({ left, top }));
        
        // Add CSS classes
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
     * Get absolute bounds for parent element
     * @param {string} parentPath - Parent element path
     * @returns {Object|null} Parent bounds
     */
    getParentAbsoluteBounds(parentPath) {
        // Use cached absolute bounds
        if (this.absoluteBoundsCache && this.absoluteBoundsCache.has(parentPath)) {
            return this.absoluteBoundsCache.get(parentPath);
        }
        
        return null;
    }

    /**
     * Set debug mode
     * @param {boolean} debug - True to enable debug logging
     */
    setDebugMode(debug) {
        this.debugMode = debug;
    }

    /**
     * Set hierarchical mode
     * @param {boolean} hierarchical - True for hierarchical, false for flat
     */
    setHierarchicalMode(hierarchical) {
        this.hierarchicalMode = hierarchical;
        
        // Re-render if we have elements
        if (this.elements && this.elements.length > 0) {
            this.renderElements(this.elements);
        }
    }

    /**
     * Get current hierarchical mode
     * @returns {boolean} True if hierarchical mode is enabled
     */
    isHierarchicalMode() {
        return this.hierarchicalMode;
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
        
        console.log(`Registered renderer: ${name}`);
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
     * Emit event to callbacks
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const callbacks = this.eventCallbacks.get(event) || [];
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event callback for ${event}:`, error);
            }
        });
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    /**
     * Clear rendered elements and container
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
            this.setupContainer(); // Reset container with viewport awareness
        }
        
        this.renderedElements.clear();
        this.absoluteBoundsCache.clear();
    }

    /**
     * Register default renderers
     */
    registerDefaultRenderers() {
        // These would be implemented based on your existing renderers
        console.log('Default renderers registered');
    }

    /**
     * Render elements with viewport-based positioning
     * @param {Array} elements - Elements to render
     */
    async renderElements(elements) {
        this.elements = elements;
        this.clear();
        
        // Calculate bounds for all elements
        const elementsWithBounds = this.calculateAllBounds(elements);
        
        // Render based on mode
        if (this.hierarchicalMode) {
            await this.renderElementsHierarchically(elementsWithBounds);
        } else {
            await this.renderElementsFlat(elementsWithBounds);
        }
    }

    /**
     * Calculate bounds for all elements with viewport awareness
     * @param {Array} elements - Elements array
     * @returns {Array} Elements with bounds
     */
    calculateAllBounds(elements) {
        const result = [];
        this.absoluteBoundsCache.clear();
        
        // Sort by hierarchy depth
        const sortedElements = [...elements].sort((a, b) => {
            const aDepth = (a.parentPath || '').split('/').length;
            const bDepth = (b.parentPath || '').split('/').length;
            return aDepth - bDepth;
        });
        
        for (const element of sortedElements) {
            let parentBounds = null;
            
            if (element.parentPath) {
                parentBounds = this.absoluteBoundsCache.get(element.parentPath);
            }
            
            // Calculate bounds using position calculator
            const bounds = this.positionCalculator.calculateElementBounds(
                element,
                parentBounds,
                this.getViewportSize()
            );
            
            this.absoluteBoundsCache.set(element.path, bounds);
            result.push({ element, bounds });
        }
        
        return result;
    }

    /**
     * Render elements hierarchically
     * @param {Array} elementsWithBounds - Elements with bounds
     */
    async renderElementsHierarchically(elementsWithBounds) {
        const elementMap = new Map();
        const boundsMap = new Map();
        
        // Build maps
        for (const { element, bounds } of elementsWithBounds) {
            elementMap.set(element.path, element);
            boundsMap.set(element.path, bounds);
        }
        
        // Find root elements
        const rootElements = [];
        for (const { element } of elementsWithBounds) {
            if (!element.parentPath || !elementMap.has(element.parentPath)) {
                rootElements.push(element);
            }
        }
        
        // Render root elements and their children
        for (const rootElement of rootElements) {
            await this.renderElementHierarchy(rootElement, this.container, elementMap, boundsMap);
        }
    }

    /**
     * Render elements flat
     * @param {Array} elementsWithBounds - Elements with bounds
     */
    async renderElementsFlat(elementsWithBounds) {
        for (const { element, bounds } of elementsWithBounds) {
            await this.renderElement(element, bounds, false);
        }
    }

    /**
     * Render element hierarchy recursively
     * @param {Object} element - Element to render
     * @param {HTMLElement} parentContainer - Parent container
     * @param {Map} elementMap - Element map
     * @param {Map} boundsMap - Bounds map
     */
    async renderElementHierarchy(element, parentContainer, elementMap, boundsMap) {
        const bounds = boundsMap.get(element.path);
        if (!bounds) return;

        const domElement = await this.renderElement(element, bounds, true);
        if (!domElement) return;

        this.setupHierarchicalElement(domElement, element, bounds, parentContainer);
        parentContainer.appendChild(domElement);

        // Render children
        const children = [];
        for (const [path, child] of elementMap) {
            if (child.parentPath === element.path) {
                children.push(child);
            }
        }

        children.sort((a, b) => (a.index || 0) - (b.index || 0));

        for (const child of children) {
            await this.renderElementHierarchy(child, domElement, elementMap, boundsMap);
        }
    }

    /**
     * Render single element
     * @param {Object} element - Element to render
     * @param {Object} bounds - Element bounds
     * @param {boolean} hierarchical - Hierarchical mode flag
     */
    async renderElement(element, bounds, hierarchical = false) {
        // Create a basic div element as placeholder
        const domElement = document.createElement('div');
        domElement.className = 'tlbb-element';
        domElement.textContent = element.name || element.type;
        
        // Store reference
        this.renderedElements.set(element, domElement);
        
        if (!hierarchical) {
            this.container.appendChild(domElement);
        }
        
        return domElement;
    }

    /**
     * Diagnose positioning issues
     */
    diagnosePositioning() {
        console.log('=== VIEWPORT-BASED POSITIONING DIAGNOSIS ===');
        const viewport = this.getViewportSize();
        console.log('Viewport size:', viewport);
        console.log('Container:', this.container);
        console.log('Container bounds:', this.container?.getBoundingClientRect());
        
        const elements = this.container?.querySelectorAll('.tlbb-element');
        if (elements) {
            elements.forEach((el, index) => {
                console.log(`Element ${index}:`, {
                    name: el.getAttribute('data-element-name'),
                    type: el.getAttribute('data-element-type'),
                    originalBounds: el.getAttribute('data-bounds'),
                    finalPosition: el.getAttribute('data-final-position'),
                    computedStyle: {
                        left: getComputedStyle(el).left,
                        top: getComputedStyle(el).top,
                        width: getComputedStyle(el).width,
                        height: getComputedStyle(el).height
                    }
                });
            });
        }
        console.log('=== END DIAGNOSIS ===');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GUIRenderer;
}