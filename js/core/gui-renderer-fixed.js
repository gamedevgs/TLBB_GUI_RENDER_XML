// Tạm thời copy phần đầu của class để test
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
        
        // Legacy position calculator (kept for fallback) and new unified layout
        this.positionCalculator = new PositionCalculator();
        this.layoutCalculator = typeof TLBBLayoutCalculator !== 'undefined' ? new TLBBLayoutCalculator({ debug:false }) : null;
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
     * Diagnose positioning issues by logging element information
     */
    diagnosePositioning() {
        console.log('=== POSITIONING DIAGNOSIS ===');
        console.log('Container:', this.container);
        console.log('Container bounds:', this.container?.getBoundingClientRect());
        
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
}