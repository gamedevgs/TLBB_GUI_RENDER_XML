/**
 * Frame Renderer Module
 * Handles rendering of frame and container elements
 */

class FrameRenderer extends BaseRenderer {
    constructor() {
        super();
        this.type = 'frame';
    }

    /**
     * Check if this renderer can handle the element
     * @param {Object} element - XML element object
     * @returns {boolean} Can handle
     */
    canRender(element) {
        const frameTypes = [
            'DefaultWindow',
            'FrameWindow',
            'StaticFrame',
            'GroupBox',
            'TabControl',
            'TabButton',
            'TabContentPane',
            'ScrollablePane',
            'ClippedContainer',
            'HorizontalLayoutContainer',
            'VerticalLayoutContainer',
            'GridLayoutContainer'
        ];
        return frameTypes.includes(element.type);
    }

    /**
     * Render element
     * @param {Object} element - Element data
     * @param {HTMLElement} parent - Parent container
     * @returns {HTMLElement} Rendered element
     */
    render(element, parent) {
        const container = this.createBaseElement(element, level);
        
        // Apply frame-specific styling
        this.applyFrameStyling(container, element);
        
        // Handle specific frame types
        this.handleSpecificType(container, element);
        
        // Apply common properties
        this.applyCommonProperties(container, element);
        
        return container;
    }

    /**
     * Apply frame-specific styling
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    applyFrameStyling(element, data) {
        // Background
        this.applyBackground(element, data);
        
        // Border
        this.applyBorder(element, data);
        
        // Frame properties
        this.applyFrameProperties(element, data);
        
        // Layout properties
        this.applyLayoutProperties(element, data);
    }

    /**
     * Apply background styling
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    applyBackground(element, data) {
        // Background color
        if (data.BackgroundColour && data.BackgroundColour !== 'FF000000') {
            element.style.backgroundColor = this.parseColor(data.BackgroundColour);
        }
        
        // Background image
        if (data.BackgroundImage || data.Image) {
            const imagePath = data.BackgroundImage || data.Image;
            element.style.backgroundImage = `url('${imagePath}')`;
            
            // Background repeat
            if (data.BackgroundImageRepeat) {
                element.style.backgroundRepeat = this.parseBackgroundRepeat(data.BackgroundImageRepeat);
            } else {
                element.style.backgroundRepeat = 'no-repeat';
            }
            
            // Background position
            if (data.BackgroundImagePosition) {
                element.style.backgroundPosition = data.BackgroundImagePosition;
            } else {
                element.style.backgroundPosition = 'center';
            }
            
            // Background size
            if (data.BackgroundImageSize) {
                element.style.backgroundSize = data.BackgroundImageSize;
            } else if (data.ImageFit) {
                element.style.backgroundSize = this.parseImageFit(data.ImageFit);
            }
        }
        
        // Background effects
        if (data.BackgroundEnabled === 'false') {
            element.style.backgroundColor = 'transparent';
            element.style.backgroundImage = 'none';
        }
    }

    /**
     * Apply border styling
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    applyBorder(element, data) {
        // Frame border
        if (data.FrameEnabled === 'true' || data.BorderEnabled === 'true') {
            let borderWidth = '1px';
            let borderStyle = 'solid';
            let borderColor = '#808080';
            
            if (data.BorderWidth) {
                borderWidth = data.BorderWidth + 'px';
            }
            
            if (data.BorderStyle) {
                borderStyle = this.parseBorderStyle(data.BorderStyle);
            }
            
            if (data.BorderColour || data.FrameColour) {
                borderColor = this.parseColor(data.BorderColour || data.FrameColour);
            }
            
            element.style.border = `${borderWidth} ${borderStyle} ${borderColor}`;
        }
        
        // Individual border sides
        if (data.TopBorder) {
            element.style.borderTop = this.parseBorderSide(data.TopBorder);
        }
        if (data.RightBorder) {
            element.style.borderRight = this.parseBorderSide(data.RightBorder);
        }
        if (data.BottomBorder) {
            element.style.borderBottom = this.parseBorderSide(data.BottomBorder);
        }
        if (data.LeftBorder) {
            element.style.borderLeft = this.parseBorderSide(data.LeftBorder);
        }
        
        // Border radius
        if (data.BorderRadius || data.CornerRadius) {
            const radius = data.BorderRadius || data.CornerRadius;
            element.style.borderRadius = radius + 'px';
        }
    }

    /**
     * Apply frame properties
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    applyFrameProperties(element, data) {
        // Padding
        if (data.Padding) {
            element.style.padding = data.Padding + 'px';
        } else {
            // Individual padding values
            const paddingTop = data.PaddingTop || data.TopPadding || '0';
            const paddingRight = data.PaddingRight || data.RightPadding || '0';
            const paddingBottom = data.PaddingBottom || data.BottomPadding || '0';
            const paddingLeft = data.PaddingLeft || data.LeftPadding || '0';
            
            element.style.padding = `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;
        }
        
        // Margin
        if (data.Margin) {
            element.style.margin = data.Margin + 'px';
        }
        
        // Overflow handling
        if (data.ClipChildren === 'true' || data.type === 'ClippedContainer') {
            element.style.overflow = 'hidden';
        } else if (data.AutoScroll === 'true' || data.type === 'ScrollablePane') {
            element.style.overflow = 'auto';
        }
        
        // Transparency
        if (data.Alpha) {
            const alpha = parseFloat(data.Alpha);
            element.style.opacity = alpha / 255; // TLBB uses 0-255, CSS uses 0-1
        }
        
        // Z-index
        if (data.ZOrder) {
            element.style.zIndex = data.ZOrder;
        }
    }

    /**
     * Apply layout properties
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    applyLayoutProperties(element, data) {
        // Layout type specific styling
        if (data.type === 'HorizontalLayoutContainer') {
            element.style.display = 'flex';
            element.style.flexDirection = 'row';
            
            if (data.Spacing) {
                element.style.gap = data.Spacing + 'px';
            }
        } else if (data.type === 'VerticalLayoutContainer') {
            element.style.display = 'flex';
            element.style.flexDirection = 'column';
            
            if (data.Spacing) {
                element.style.gap = data.Spacing + 'px';
            }
        } else if (data.type === 'GridLayoutContainer') {
            element.style.display = 'grid';
            
            if (data.Columns) {
                element.style.gridTemplateColumns = `repeat(${data.Columns}, 1fr)`;
            }
            if (data.Rows) {
                element.style.gridTemplateRows = `repeat(${data.Rows}, 1fr)`;
            }
            if (data.ColumnSpacing || data.RowSpacing) {
                const colSpacing = data.ColumnSpacing || '0';
                const rowSpacing = data.RowSpacing || '0';
                element.style.gap = `${rowSpacing}px ${colSpacing}px`;
            }
        }
        
        // Child alignment
        if (data.ChildAlignment) {
            this.applyChildAlignment(element, data.ChildAlignment);
        }
    }

    /**
     * Handle specific frame types
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    handleSpecificType(element, data) {
        switch (data.type) {
            case 'DefaultWindow':
                this.setupDefaultWindow(element, data);
                break;
            case 'FrameWindow':
                this.setupFrameWindow(element, data);
                break;
            case 'GroupBox':
                this.setupGroupBox(element, data);
                break;
            case 'TabControl':
                this.setupTabControl(element, data);
                break;
            case 'TabButton':
                this.setupTabButton(element, data);
                break;
            case 'TabContentPane':
                this.setupTabContentPane(element, data);
                break;
            case 'ScrollablePane':
                this.setupScrollablePane(element, data);
                break;
            default:
                this.setupStaticFrame(element, data);
                break;
        }
    }

    /**
     * Setup default window
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupDefaultWindow(element, data) {
        element.classList.add('tlbb-default-window');
        
        // Window styling
        element.style.backgroundColor = element.style.backgroundColor || '#f0f0f0';
        element.style.border = element.style.border || '1px solid #808080';
        
        // Window title bar
        if (data.Caption || data.Title) {
            this.createTitleBar(element, data.Caption || data.Title);
        }
        
        // Window controls
        if (data.CloseButton === 'true') {
            this.createCloseButton(element);
        }
        
        // Window modality
        if (data.Modal === 'true') {
            element.classList.add('modal-window');
        }
        
        // Window state
        if (data.Minimizable === 'true') {
            element.classList.add('minimizable');
        }
        if (data.Maximizable === 'true') {
            element.classList.add('maximizable');
        }
    }

    /**
     * Setup frame window
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupFrameWindow(element, data) {
        element.classList.add('tlbb-frame-window');
        
        // Similar to default window but without system controls
        element.style.backgroundColor = element.style.backgroundColor || 'transparent';
        
        if (data.ShowBorder !== 'false') {
            element.style.border = element.style.border || '1px solid #808080';
        }
    }

    /**
     * Setup group box
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupGroupBox(element, data) {
        element.classList.add('tlbb-group-box');
        
        // Group box styling
        element.style.border = element.style.border || '1px solid #808080';
        element.style.padding = element.style.padding || '16px 8px 8px 8px';
        
        // Group title
        if (data.Caption || data.Text) {
            const title = document.createElement('div');
            title.className = 'tlbb-group-title';
            title.textContent = data.Caption || data.Text;
            title.style.position = 'absolute';
            title.style.top = '-8px';
            title.style.left = '8px';
            title.style.backgroundColor = element.style.backgroundColor || '#f0f0f0';
            title.style.padding = '0 4px';
            title.style.fontSize = '12px';
            
            element.style.position = 'relative';
            element.appendChild(title);
        }
    }

    /**
     * Setup tab control
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupTabControl(element, data) {
        element.classList.add('tlbb-tab-control');
        
        // Tab control layout
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        
        // Create tab header container
        const tabHeader = document.createElement('div');
        tabHeader.className = 'tlbb-tab-header';
        tabHeader.style.display = 'flex';
        tabHeader.style.borderBottom = '1px solid #ccc';
        element.appendChild(tabHeader);
        
        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tlbb-tab-content';
        tabContent.style.flex = '1';
        tabContent.style.padding = '8px';
        element.appendChild(tabContent);
        
        // Process tab buttons and content panes
        if (data.children) {
            let activeTabIndex = 0;
            
            data.children.forEach((child, index) => {
                if (child.type === 'TabButton') {
                    const tabButton = this.createTabButton(child, index);
                    tabHeader.appendChild(tabButton);
                    
                    if (child.Selected === 'true') {
                        activeTabIndex = index;
                    }
                }
            });
            
            // Set active tab
            this.setActiveTab(element, activeTabIndex);
        }
    }

    /**
     * Setup tab button
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupTabButton(element, data) {
        element.classList.add('tlbb-tab-button');
        
        // Tab button styling
        element.style.padding = '8px 16px';
        element.style.border = '1px solid #ccc';
        element.style.borderBottom = 'none';
        element.style.backgroundColor = '#f0f0f0';
        element.style.cursor = 'pointer';
        element.style.userSelect = 'none';
        
        // Tab text
        if (data.Caption || data.Text) {
            element.textContent = data.Caption || data.Text;
        }
        
        // Tab states
        if (data.Selected === 'true') {
            element.classList.add('active');
            element.style.backgroundColor = '#fff';
            element.style.borderBottom = '1px solid #fff';
        }
        
        // Tab events
        element.addEventListener('click', () => {
            this.selectTab(element);
        });
    }

    /**
     * Setup tab content pane
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupTabContentPane(element, data) {
        element.classList.add('tlbb-tab-content-pane');
        
        // Content pane styling
        element.style.display = 'none'; // Hidden by default
        element.style.width = '100%';
        element.style.height = '100%';
        
        // Show if this is the selected tab
        if (data.Selected === 'true') {
            element.style.display = 'block';
        }
    }

    /**
     * Setup scrollable pane
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupScrollablePane(element, data) {
        element.classList.add('tlbb-scrollable-pane');
        
        // Scrollable styling
        element.style.overflow = 'auto';
        element.style.border = element.style.border || '1px solid #ccc';
        
        // Scroll bars
        if (data.HorizontalScrollbar === 'false') {
            element.style.overflowX = 'hidden';
        }
        if (data.VerticalScrollbar === 'false') {
            element.style.overflowY = 'hidden';
        }
        
        // Auto scroll to bottom
        if (data.AutoScrollToBottom === 'true') {
            element.scrollTop = element.scrollHeight;
        }
    }

    /**
     * Setup static frame
     * @param {HTMLElement} element - DOM element
     * @param {Object} data - Element data
     */
    setupStaticFrame(element, data) {
        element.classList.add('tlbb-static-frame');
        
        // Basic frame styling
        if (data.FrameEnabled !== 'false') {
            element.style.border = element.style.border || '1px solid #ccc';
        }
    }

    /**
     * Create title bar
     * @param {HTMLElement} window - Window element
     * @param {string} title - Title text
     */
    createTitleBar(window, title) {
        const titleBar = document.createElement('div');
        titleBar.className = 'tlbb-title-bar';
        titleBar.textContent = title;
        titleBar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 24px;
            line-height: 24px;
            padding: 0 8px;
            background: linear-gradient(to bottom, #f0f0f0, #d0d0d0);
            border-bottom: 1px solid #808080;
            font-size: 12px;
            font-weight: bold;
            cursor: move;
            user-select: none;
        `;
        
        // Adjust window content area
        window.style.paddingTop = '25px';
        window.style.position = 'relative';
        
        window.appendChild(titleBar);
        
        // Make window draggable by title bar
        this.makeDraggable(window, titleBar);
    }

    /**
     * Create close button
     * @param {HTMLElement} window - Window element
     */
    createCloseButton(window) {
        const closeButton = document.createElement('div');
        closeButton.className = 'tlbb-close-button';
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 2px;
            right: 4px;
            width: 20px;
            height: 20px;
            line-height: 18px;
            text-align: center;
            background: #ff6b6b;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            border-radius: 2px;
        `;
        
        closeButton.addEventListener('click', () => {
            window.style.display = 'none';
        });
        
        window.appendChild(closeButton);
    }

    /**
     * Helper methods for parsing values
     */
    parseBackgroundRepeat(value) {
        const repeatMap = {
            'NoRepeat': 'no-repeat',
            'Repeat': 'repeat',
            'RepeatX': 'repeat-x',
            'RepeatY': 'repeat-y'
        };
        return repeatMap[value] || 'no-repeat';
    }

    parseImageFit(value) {
        const fitMap = {
            'Stretch': '100% 100%',
            'Cover': 'cover',
            'Contain': 'contain',
            'Fill': '100% 100%'
        };
        return fitMap[value] || 'contain';
    }

    parseBorderStyle(value) {
        const styleMap = {
            'Solid': 'solid',
            'Dashed': 'dashed',
            'Dotted': 'dotted',
            'Double': 'double',
            'None': 'none'
        };
        return styleMap[value] || 'solid';
    }

    parseBorderSide(value) {
        // Parse border side format like "1px solid #808080"
        return value;
    }

    applyChildAlignment(element, alignment) {
        const alignmentMap = {
            'Left': 'flex-start',
            'Center': 'center',
            'Right': 'flex-end',
            'Top': 'flex-start',
            'Middle': 'center',
            'Bottom': 'flex-end'
        };
        
        if (element.style.display === 'flex') {
            element.style.justifyContent = alignmentMap[alignment] || 'flex-start';
            element.style.alignItems = alignmentMap[alignment] || 'flex-start';
        }
    }

    /**
     * Make element draggable
     * @param {HTMLElement} element - Element to make draggable
     * @param {HTMLElement} handle - Drag handle (optional)
     */
    makeDraggable(element, handle = null) {
        const dragHandle = handle || element;
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left) || 0;
            startTop = parseInt(element.style.top) || 0;
            
            element.style.position = 'absolute';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            element.style.left = (startLeft + deltaX) + 'px';
            element.style.top = (startTop + deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * Tab control methods
     */
    createTabButton(data, index) {
        const button = document.createElement('div');
        button.className = 'tlbb-tab-button';
        button.textContent = data.Caption || data.Text || `Tab ${index + 1}`;
        button.setAttribute('data-tab-index', index);
        
        return button;
    }

    setActiveTab(tabControl, index) {
        const buttons = tabControl.querySelectorAll('.tlbb-tab-button');
        const panes = tabControl.querySelectorAll('.tlbb-tab-content-pane');
        
        buttons.forEach((button, i) => {
            if (i === index) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        panes.forEach((pane, i) => {
            if (i === index) {
                pane.style.display = 'block';
            } else {
                pane.style.display = 'none';
            }
        });
    }

    selectTab(button) {
        const tabControl = button.closest('.tlbb-tab-control');
        const index = parseInt(button.getAttribute('data-tab-index'));
        
        this.setActiveTab(tabControl, index);
    }
}

// Export for use in other modules
window.FrameRenderer = FrameRenderer;
