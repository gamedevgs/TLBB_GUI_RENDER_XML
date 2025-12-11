/**
 * Canvas Controls UI Module
 * Handles canvas interaction controls and user interface
 */

class CanvasControls {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.selectedElement = null;
        this.dragState = {
            isDragging: false,
            element: null,
            startX: 0,
            startY: 0,
            originalX: 0,
            originalY: 0
        };
        this.selectionBox = null;
        this.eventCallbacks = new Map();
    }

    /**
     * Initialize canvas controls
     * @param {HTMLElement} container - Canvas container
     * @param {HTMLElement} canvas - Canvas element
     */
    init(container, canvas) {
        this.container = container;
        this.canvas = canvas;
        this.setupEventListeners();
        this.createSelectionBox();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

        // Context menu
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // Keyboard events (when canvas is focused)
        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Prevent default drag behavior
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
    }

    /**
     * Create selection box overlay
     */
    createSelectionBox() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'canvas-selection-box';
        this.selectionBox.style.cssText = `
            position: absolute;
            border: 2px solid #007acc;
            background: rgba(0, 122, 204, 0.1);
            pointer-events: none;
            display: none;
            z-index: 1000;
        `;

        if (this.container) {
            this.container.appendChild(this.selectionBox);
        }
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        const element = this.getElementFromPoint(event.clientX, event.clientY);
        
        if (element && this.isElementDraggable(element)) {
            this.startDrag(element, event);
        }

        // Update selection
        this.selectElement(element);
        
        // Focus canvas for keyboard events
        this.canvas.focus();
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
        if (this.dragState.isDragging) {
            this.updateDrag(event);
        } else {
            this.updateHover(event);
        }
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event) {
        if (this.dragState.isDragging) {
            this.endDrag(event);
        }
    }

    /**
     * Handle click events
     * @param {MouseEvent} event - Mouse event
     */
    handleClick(event) {
        // Click handling is done in mousedown for better responsiveness
        event.preventDefault();
    }

    /**
     * Handle double click events
     * @param {MouseEvent} event - Mouse event
     */
    handleDoubleClick(event) {
        const element = this.getElementFromPoint(event.clientX, event.clientY);
        
        if (element) {
            this.emit('elementDoubleClicked', { element, event });
        }
    }

    /**
     * Handle context menu events
     * @param {MouseEvent} event - Mouse event
     */
    handleContextMenu(event) {
        event.preventDefault();
        
        const element = this.getElementFromPoint(event.clientX, event.clientY);
        
        this.emit('contextMenu', {
            element,
            x: event.clientX,
            y: event.clientY,
            canvasX: event.offsetX,
            canvasY: event.offsetY
        });
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        if (!this.selectedElement) return;

        const moveDistance = event.shiftKey ? 10 : 1;
        
        switch (event.key) {
            case 'ArrowUp':
                this.moveSelectedElement(0, -moveDistance);
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.moveSelectedElement(0, moveDistance);
                event.preventDefault();
                break;
            case 'ArrowLeft':
                this.moveSelectedElement(-moveDistance, 0);
                event.preventDefault();
                break;
            case 'ArrowRight':
                this.moveSelectedElement(moveDistance, 0);
                event.preventDefault();
                break;
            case 'Delete':
                this.deleteSelectedElement();
                event.preventDefault();
                break;
            case 'Escape':
                this.clearSelection();
                event.preventDefault();
                break;
        }
    }

    /**
     * Get element from point coordinates
     * @param {number} clientX - Client X coordinate
     * @param {number} clientY - Client Y coordinate
     * @returns {HTMLElement|null} Element at point
     */
    getElementFromPoint(clientX, clientY) {
        // Convert client coordinates to canvas coordinates
        const canvasRect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - canvasRect.left;
        const canvasY = clientY - canvasRect.top;

        // Find element at this position
        const elements = this.canvas.querySelectorAll('.tlbb-element');
        
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            const rect = element.getBoundingClientRect();
            const relativeRect = {
                left: rect.left - canvasRect.left,
                top: rect.top - canvasRect.top,
                right: rect.right - canvasRect.left,
                bottom: rect.bottom - canvasRect.top
            };

            if (canvasX >= relativeRect.left && canvasX <= relativeRect.right &&
                canvasY >= relativeRect.top && canvasY <= relativeRect.bottom) {
                return element;
            }
        }

        return null;
    }

    /**
     * Check if element is draggable
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Is draggable
     */
    isElementDraggable(element) {
        if (!element) return false;
        
        // Check if element has draggable attribute or class
        return !element.classList.contains('no-drag') && 
               !element.hasAttribute('data-no-drag');
    }

    /**
     * Start drag operation
     * @param {HTMLElement} element - Element to drag
     * @param {MouseEvent} event - Mouse event
     */
    startDrag(element, event) {
        this.dragState.isDragging = true;
        this.dragState.element = element;
        this.dragState.startX = event.clientX;
        this.dragState.startY = event.clientY;
        
        // Get current position
        const style = window.getComputedStyle(element);
        this.dragState.originalX = parseInt(style.left) || 0;
        this.dragState.originalY = parseInt(style.top) || 0;

        // Add dragging class
        element.classList.add('dragging');
        this.canvas.classList.add('dragging');

        // Change cursor
        document.body.style.cursor = 'move';

        this.emit('dragStart', { element, event });
    }

    /**
     * Update drag operation
     * @param {MouseEvent} event - Mouse event
     */
    updateDrag(event) {
        if (!this.dragState.isDragging || !this.dragState.element) return;

        const deltaX = event.clientX - this.dragState.startX;
        const deltaY = event.clientY - this.dragState.startY;

        const newX = this.dragState.originalX + deltaX;
        const newY = this.dragState.originalY + deltaY;

        // Apply constraints
        const constrainedPos = this.constrainPosition(newX, newY, this.dragState.element);

        // Update element position
        this.dragState.element.style.left = constrainedPos.x + 'px';
        this.dragState.element.style.top = constrainedPos.y + 'px';

        this.emit('dragUpdate', {
            element: this.dragState.element,
            x: constrainedPos.x,
            y: constrainedPos.y,
            deltaX,
            deltaY
        });
    }

    /**
     * End drag operation
     * @param {MouseEvent} event - Mouse event
     */
    endDrag(event) {
        if (!this.dragState.isDragging) return;

        const element = this.dragState.element;

        // Remove dragging classes
        if (element) {
            element.classList.remove('dragging');
        }
        this.canvas.classList.remove('dragging');

        // Reset cursor
        document.body.style.cursor = '';

        this.emit('dragEnd', { element, event });

        // Reset drag state
        this.dragState = {
            isDragging: false,
            element: null,
            startX: 0,
            startY: 0,
            originalX: 0,
            originalY: 0
        };
    }

    /**
     * Update hover state
     * @param {MouseEvent} event - Mouse event
     */
    updateHover(event) {
        const element = this.getElementFromPoint(event.clientX, event.clientY);
        
        // Remove previous hover
        this.canvas.querySelectorAll('.tlbb-element.hover').forEach(el => {
            el.classList.remove('hover');
        });

        // Add hover to current element
        if (element && element !== this.selectedElement) {
            element.classList.add('hover');
        }

        // Update cursor
        if (element && this.isElementDraggable(element)) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * Constrain position within bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {HTMLElement} element - Element being positioned
     * @returns {Object} Constrained position
     */
    constrainPosition(x, y, element) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const minX = 0;
        const minY = 0;
        const maxX = canvasRect.width - elementRect.width;
        const maxY = canvasRect.height - elementRect.height;

        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    }

    /**
     * Select element
     * @param {HTMLElement} element - Element to select
     */
    selectElement(element) {
        // Clear previous selection
        this.clearSelection();

        if (element) {
            this.selectedElement = element;
            element.classList.add('selected');
            this.showSelectionBox(element);
            
            // Make canvas focusable
            this.canvas.setAttribute('tabindex', '0');
        }

        this.emit('elementSelected', element);
    }

    /**
     * Clear selection
     */
    clearSelection() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
        }
        
        this.hideSelectionBox();
        this.emit('selectionCleared');
    }

    /**
     * Show selection box around element
     * @param {HTMLElement} element - Element to highlight
     */
    showSelectionBox(element) {
        if (!this.selectionBox || !element) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const left = elementRect.left - canvasRect.left - 2;
        const top = elementRect.top - canvasRect.top - 2;
        const width = elementRect.width + 4;
        const height = elementRect.height + 4;

        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
        this.selectionBox.style.display = 'block';
    }

    /**
     * Hide selection box
     */
    hideSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.style.display = 'none';
        }
    }

    /**
     * Move selected element
     * @param {number} deltaX - X movement
     * @param {number} deltaY - Y movement
     */
    moveSelectedElement(deltaX, deltaY) {
        if (!this.selectedElement) return;

        const style = window.getComputedStyle(this.selectedElement);
        const currentX = parseInt(style.left) || 0;
        const currentY = parseInt(style.top) || 0;

        const newX = currentX + deltaX;
        const newY = currentY + deltaY;

        const constrainedPos = this.constrainPosition(newX, newY, this.selectedElement);

        this.selectedElement.style.left = constrainedPos.x + 'px';
        this.selectedElement.style.top = constrainedPos.y + 'px';

        this.showSelectionBox(this.selectedElement);

        this.emit('elementMoved', {
            element: this.selectedElement,
            x: constrainedPos.x,
            y: constrainedPos.y,
            deltaX,
            deltaY
        });
    }

    /**
     * Delete selected element
     */
    deleteSelectedElement() {
        if (!this.selectedElement) return;

        const element = this.selectedElement;
        this.clearSelection();
        
        this.emit('elementDeleted', element);
    }

    /**
     * Get element bounds
     * @param {HTMLElement} element - Element
     * @returns {Object} Element bounds
     */
    getElementBounds(element) {
        if (!element) return null;

        const canvasRect = this.canvas.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        return {
            left: elementRect.left - canvasRect.left,
            top: elementRect.top - canvasRect.top,
            right: elementRect.right - canvasRect.left,
            bottom: elementRect.bottom - canvasRect.top,
            width: elementRect.width,
            height: elementRect.height
        };
    }

    /**
     * Update selection box position (call when canvas is scrolled/zoomed)
     */
    updateSelectionBox() {
        if (this.selectedElement) {
            this.showSelectionBox(this.selectedElement);
        }
    }

    /**
     * Enable/disable canvas controls
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        if (enabled) {
            this.canvas.style.pointerEvents = 'auto';
        } else {
            this.canvas.style.pointerEvents = 'none';
            this.clearSelection();
        }
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

    /**
     * Cleanup
     */
    destroy() {
        if (this.selectionBox && this.selectionBox.parentNode) {
            this.selectionBox.parentNode.removeChild(this.selectionBox);
        }
        
        this.clearSelection();
        this.eventCallbacks.clear();
    }
}

// Export for use in other modules
window.CanvasControls = CanvasControls;
