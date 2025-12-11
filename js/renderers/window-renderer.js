/**
 * Window Renderer Module for TLBB GUI Renderer
 * Handles rendering of window-type elements
 */

class WindowRenderer extends BaseRenderer {
    constructor() {
        console.log('🏗️ WindowRenderer constructor called');
        console.log('🏗️ BaseRenderer exists:', !!window.BaseRenderer);
        
        super();
        
        this.windowTypes = {
            'DefaultWindow': this.renderDefaultWindow.bind(this),
            'TLBB_MainFrame0': this.renderMainFrame0.bind(this),
            'TLBB_MainFrame1': this.renderMainFrame1.bind(this),
            'TLBB_MainFrame2': this.renderMainFrame2.bind(this),
            'TLBB_MainFrame3': this.renderMainFrame3.bind(this),
            'TLBB_MainFrame4': this.renderMainFrame4.bind(this),
            'TLBB_MainFrameNULL': this.renderMainFrameNull.bind(this),
            'TLBB_SpecialFrame01': this.renderSpecialFrame.bind(this),
            'TLBB_SpecialTitle01': this.renderSpecialTitle.bind(this),
            'TLBB_SpecialClose': this.renderSpecialClose.bind(this),
            'TLBB_StaticImageNULL': this.renderStaticImageNULL.bind(this),
            'TLBB_StaticImageFrame': this.renderStaticImageFrame.bind(this),
        };
    }

    /**
     * Render window element
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @param {number} level - Hierarchy level (default: 0)
     * @returns {HTMLElement} Rendered DOM element
     */
    renderWindow(element, bounds, level = 0) {
        const renderer = this.windowTypes[element.type];
        if (renderer) {
            return renderer(element, bounds, level);
        } else {
            return this.renderDefaultWindow(element, bounds, level);
        }
    }

    /**
     * Render default window
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @param {number} level - Hierarchy level (default: 0)
     * @returns {HTMLElement} Rendered DOM element
     */
    renderDefaultWindow(element, bounds, level = 0) {
        if (!this.createElement) {
            console.error('❌ createElement method not found');
            return document.createElement('div'); // Fallback
        }
        
        const domElement = this.createElement(element, bounds, level);
        
        // Apply basic window styling
        domElement.style.border = '1px dashed rgba(255, 255, 255, 0.1)';
        domElement.style.background = 'transparent';
        
        // Apply text if present
        this.applyText(domElement, element);
        
        // Apply background image if present
        this.applyBackgroundImage(domElement, element.image);
        
        // Add text overlay
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render main frame type 0 (invisible container)
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderMainFrame0(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        // Invisible container frame
        domElement.style.background = 'transparent';
        domElement.style.border = 'none';
        
        // Add text overlay for editing
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render main frame type 1 (standard window with border)
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @param {number} level - Hierarchy level (default: 0)
     * @returns {HTMLElement} Rendered DOM element
     */
    renderMainFrame1(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        // Main window styling
        domElement.style.background = 'linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%)';
        domElement.style.border = '2px solid #5a5a5a';
        domElement.style.borderRadius = '4px';
        domElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        
        // Add title bar if this is a top-level window
        if (!element.parentPath || element.parentPath === '') {
            this.addTitleBar(domElement, element);
        }
        
        // Apply text if present
        this.applyText(domElement, element);
        
        // Apply background image if present
        this.applyBackgroundImage(domElement, element.image);
        
        // Add text overlay
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render main frame type 2
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderMainFrame2(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        domElement.style.background = 'linear-gradient(135deg, #4a4a4a 0%, #3d3d3d 100%)';
        domElement.style.border = '1px solid #6a6a6a';
        domElement.style.borderRadius = '6px';
        
        this.applyText(domElement, element);
        this.applyBackgroundImage(domElement, element.image);
        
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render main frame type 3
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderMainFrame3(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        domElement.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #1d1d1d 100%)';
        domElement.style.border = '3px solid #7a7a7a';
        domElement.style.borderRadius = '8px';
        
        this.applyText(domElement, element);
        this.applyBackgroundImage(domElement, element.image);
        
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render main frame type 4
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderMainFrame4(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        domElement.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)';
        domElement.style.border = '2px solid #8a8a8a';
        domElement.style.borderRadius = '10px';
        
        this.applyText(domElement, element);
        this.applyBackgroundImage(domElement, element.image);
        
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render main frame null (invisible main container)
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderMainFrameNull(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        // Invisible main container with dashed border for editing
        domElement.style.background = 'transparent';
        domElement.style.border = '1px dashed rgba(255, 255, 255, 0.2)';
        
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render special frame
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderSpecialFrame(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        domElement.style.background = 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)';
        domElement.style.border = '3px solid #663399';
        domElement.style.borderRadius = '12px';
        domElement.style.boxShadow = '0 0 12px rgba(142, 68, 173, 0.3)';
        
        this.applyText(domElement, element);
        this.applyBackgroundImage(domElement, element.image);
        
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render special title
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderSpecialTitle(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        domElement.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        domElement.style.color = 'white';
        domElement.style.fontWeight = 'bold';
        domElement.style.textAlign = 'center';
        domElement.style.borderRadius = '6px 6px 0 0';
        domElement.style.display = 'flex';
        domElement.style.alignItems = 'center';
        domElement.style.justifyContent = 'center';
        
        this.applyText(domElement, element);
        
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render special close button
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderSpecialClose(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        domElement.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        domElement.style.border = '1px solid #a93226';
        domElement.style.borderRadius = '50%';
        domElement.style.color = 'white';
        domElement.style.fontWeight = 'bold';
        domElement.style.textAlign = 'center';
        domElement.style.lineHeight = `${bounds.height - 2}px`;
        domElement.style.cursor = 'pointer';
        
        // Add X symbol
        domElement.textContent = '×';
        
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render static image element (TLBB_StaticImageNULL)
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderStaticImageNULL(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        // Static image container
        domElement.style.overflow = 'hidden';
        domElement.style.backgroundSize = 'contain';
        domElement.style.backgroundRepeat = 'no-repeat';
        domElement.style.backgroundPosition = 'center';
        
        // Apply image property specifically
        if (element.properties && element.properties.Image) {
            console.log('Rendering TLBB_StaticImageNULL with Image:', element.properties.Image);
            this.applyBackgroundImage(domElement, element.properties.Image);
        }
        
        // Apply other common properties
        this.applyCommonProperties(domElement, element);
        
        // Add text overlay for identification
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Render static image frame (TLBB_StaticImageFrame)
     * @param {Object} element - TLBB element
     * @param {Object} bounds - Element bounds
     * @returns {HTMLElement} Rendered DOM element
     */
    renderStaticImageFrame(element, bounds, level = 0) {
        const domElement = this.createElement(element, bounds, level);
        
        // Frame container
        domElement.style.position = 'relative';
        domElement.style.overflow = 'hidden';
        
        // Apply frame image
        if (element.properties && element.properties.Image) {
            console.log('Rendering TLBB_StaticImageFrame with Image:', element.properties.Image);
            this.applyBackgroundImage(domElement, element.properties.Image);
        }
        
        // Frame specific styling
        domElement.style.backgroundSize = '100% 100%'; // Stretch to fit frame
        domElement.style.backgroundRepeat = 'no-repeat';
        
        // Apply other common properties
        this.applyCommonProperties(domElement, element);
        
        // Add text overlay
        const overlay = this.createTextOverlay(element, domElement);
        if (overlay) { domElement.appendChild(overlay); }
        
        return domElement;
    }

    /**
     * Add title bar to window
     * @param {HTMLElement} domElement - Window DOM element
     * @param {Object} element - TLBB element
     */
    addTitleBar(domElement, element) {
        const titleBar = document.createElement('div');
        titleBar.className = 'window-title-bar';
        titleBar.style.position = 'absolute';
        titleBar.style.top = '0';
        titleBar.style.left = '0';
        titleBar.style.right = '0';
        titleBar.style.height = '24px';
        titleBar.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
        titleBar.style.borderBottom = '1px solid #7f8c8d';
        titleBar.style.color = 'white';
        titleBar.style.fontWeight = '600';
        titleBar.style.fontSize = '12px';
        titleBar.style.display = 'flex';
        titleBar.style.alignItems = 'center';
        titleBar.style.padding = '0 8px';
        titleBar.style.cursor = 'move';
        titleBar.style.userSelect = 'none';
        
        // Add title text
        const titleText = element.text ? 
            (window.stringDictionary ? 
                window.stringDictionary.resolveTextValue(element.text) : 
                element.text) : 
            element.name;
        
        titleBar.textContent = titleText;
        
        // Add close button
        const closeBtn = document.createElement('div');
        closeBtn.style.marginLeft = 'auto';
        closeBtn.style.width = '16px';
        closeBtn.style.height = '16px';
        closeBtn.style.background = '#e74c3c';
        closeBtn.style.borderRadius = '2px';
        closeBtn.style.display = 'flex';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.fontSize = '10px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.textContent = '×';
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`Close window: ${element.name}`);
        });
        
        titleBar.appendChild(closeBtn);
        domElement.appendChild(titleBar);
        
        // Make window draggable by title bar
        this.makeDraggable(domElement, titleBar);
    }

    /**
     * Make window draggable
     * @param {HTMLElement} window - Window element
     * @param {HTMLElement} handle - Drag handle element
     */
    makeDraggable(window, handle) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.style.left, 10) || 0;
            startTop = parseInt(window.style.top, 10) || 0;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            window.style.left = `${startLeft + deltaX}px`;
            window.style.top = `${startTop + deltaY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * Check if element type is a window
     * @param {string} type - Element type
     * @returns {boolean} True if window type
     */
    isWindowType(type) {
        return type === 'DefaultWindow' || 
               type.startsWith('TLBB_MainFrame') || 
               type.startsWith('TLBB_Special');
    }

    /**
     * Get window type info
     * @param {string} type - Element type
     * @returns {Object} Window type info
     */
    getWindowTypeInfo(type) {
        const info = {
            isContainer: true,
            hasTitle: false,
            isVisible: true,
            canDrag: false
        };

        switch (type) {
            case 'TLBB_MainFrame0':
            case 'TLBB_MainFrameNULL':
                info.isVisible = false;
                break;
                
            case 'TLBB_MainFrame1':
            case 'TLBB_MainFrame2':
            case 'TLBB_MainFrame3':
            case 'TLBB_MainFrame4':
                info.hasTitle = true;
                info.canDrag = true;
                break;
                
            case 'TLBB_SpecialFrame01':
                info.hasTitle = true;
                info.canDrag = true;
                break;
        }

        return info;
    }
}

// Export for use in other modules
window.WindowRenderer = WindowRenderer;
