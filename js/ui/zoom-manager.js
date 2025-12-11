/**
 * Zoom Manager Module
 * Handles canvas zoom and pan functionality
 */

class ZoomManager {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.zoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 5.0;
        this.zoomStep = 0.1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.eventCallbacks = new Map();
    }

    /**
     * Initialize zoom manager
     * @param {HTMLElement} container - Container element
     * @param {HTMLElement} canvas - Canvas element
     */
    init(container, canvas) {
        this.container = container;
        this.canvas = canvas;
        this.setupEventListeners();
        this.updateTransform();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        // Wheel event for zooming
        this.container.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Mouse events for panning
        this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.container.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.container.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Touch events for mobile
        this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    /**
     * Handle wheel events (zooming)
     * @param {WheelEvent} event - Wheel event
     */
    handleWheel(event) {
        event.preventDefault();

        if (event.ctrlKey || event.metaKey) {
            // Zoom with Ctrl+Wheel
            const rect = this.container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const zoomDirection = event.deltaY > 0 ? -1 : 1;
            this.zoomAtPoint(mouseX, mouseY, zoomDirection);
        } else {
            // Pan with Wheel
            this.pan(-event.deltaX, -event.deltaY);
        }
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        // Middle mouse button or Space+Click for panning
        if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
            event.preventDefault();
            this.startPan(event.clientX, event.clientY);
        }
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
        if (this.isPanning) {
            event.preventDefault();
            this.updatePan(event.clientX, event.clientY);
        }
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event) {
        if (this.isPanning) {
            this.endPan();
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case '0':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.resetZoom();
                }
                break;
            case '=':
            case '+':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.zoomIn();
                }
                break;
            case '-':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.zoomOut();
                }
                break;
            case '1':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.fitToCanvas();
                }
                break;
            case '2':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.fitToContent();
                }
                break;
        }
    }

    /**
     * Handle touch start events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
        if (event.touches.length === 1) {
            // Single touch - start panning
            const touch = event.touches[0];
            this.startPan(touch.clientX, touch.clientY);
        } else if (event.touches.length === 2) {
            // Two fingers - prepare for pinch zoom
            this.lastTouchDistance = this.getTouchDistance(event.touches);
        }
    }

    /**
     * Handle touch move events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchMove(event) {
        event.preventDefault();

        if (event.touches.length === 1 && this.isPanning) {
            // Single touch - pan
            const touch = event.touches[0];
            this.updatePan(touch.clientX, touch.clientY);
        } else if (event.touches.length === 2) {
            // Two fingers - pinch zoom
            const currentDistance = this.getTouchDistance(event.touches);
            if (this.lastTouchDistance) {
                const scale = currentDistance / this.lastTouchDistance;
                const rect = this.container.getBoundingClientRect();
                const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
                const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;
                
                this.zoomAtPoint(centerX, centerY, scale > 1 ? 1 : -1);
            }
            this.lastTouchDistance = currentDistance;
        }
    }

    /**
     * Handle touch end events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchEnd(event) {
        if (event.touches.length < 2) {
            this.lastTouchDistance = null;
        }
        if (event.touches.length === 0) {
            this.endPan();
        }
    }

    /**
     * Get distance between two touches
     * @param {TouchList} touches - Touch list
     * @returns {number} Distance
     */
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Start panning
     * @param {number} x - Start X coordinate
     * @param {number} y - Start Y coordinate
     */
    startPan(x, y) {
        this.isPanning = true;
        this.lastMouseX = x;
        this.lastMouseY = y;
        this.container.style.cursor = 'grabbing';
    }

    /**
     * Update panning
     * @param {number} x - Current X coordinate
     * @param {number} y - Current Y coordinate
     */
    updatePan(x, y) {
        if (!this.isPanning) return;

        const deltaX = x - this.lastMouseX;
        const deltaY = y - this.lastMouseY;

        this.pan(deltaX, deltaY);

        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    /**
     * End panning
     */
    endPan() {
        this.isPanning = false;
        this.container.style.cursor = '';
    }

    /**
     * Pan by delta
     * @param {number} deltaX - X delta
     * @param {number} deltaY - Y delta
     */
    pan(deltaX, deltaY) {
        this.panX += deltaX;
        this.panY += deltaY;
        this.updateTransform();
        this.emit('pan', { panX: this.panX, panY: this.panY });
    }

    /**
     * Set pan position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setPan(x, y) {
        this.panX = x;
        this.panY = y;
        this.updateTransform();
        this.emit('pan', { panX: this.panX, panY: this.panY });
    }

    /**
     * Zoom in
     */
    zoomIn() {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.zoomAtPoint(centerX, centerY, 1);
    }

    /**
     * Zoom out
     */
    zoomOut() {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.zoomAtPoint(centerX, centerY, -1);
    }

    /**
     * Zoom at specific point
     * @param {number} x - X coordinate (relative to container)
     * @param {number} y - Y coordinate (relative to container)
     * @param {number} direction - Zoom direction (1 for in, -1 for out)
     */
    zoomAtPoint(x, y, direction) {
        const oldZoom = this.zoom;
        const newZoom = this.calculateNewZoom(direction);

        if (newZoom === oldZoom) return;

        // Calculate the point in canvas coordinates before zoom
        const canvasX = (x - this.panX) / oldZoom;
        const canvasY = (y - this.panY) / oldZoom;

        // Apply new zoom
        this.zoom = newZoom;

        // Adjust pan to keep the point under the cursor
        this.panX = x - canvasX * this.zoom;
        this.panY = y - canvasY * this.zoom;

        this.updateTransform();
        this.emit('zoom', { zoom: this.zoom, panX: this.panX, panY: this.panY });
    }

    /**
     * Calculate new zoom level
     * @param {number} direction - Zoom direction
     * @returns {number} New zoom level
     */
    calculateNewZoom(direction) {
        let newZoom;
        
        if (direction > 0) {
            newZoom = Math.min(this.maxZoom, this.zoom + this.zoomStep);
        } else {
            newZoom = Math.max(this.minZoom, this.zoom - this.zoomStep);
        }

        return Math.round(newZoom * 10) / 10; // Round to 1 decimal place
    }

    /**
     * Set zoom level
     * @param {number} zoom - New zoom level
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     */
    setZoom(zoom, centerX = null, centerY = null) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        
        if (centerX !== null && centerY !== null) {
            // Calculate the point in canvas coordinates before zoom
            const canvasX = (centerX - this.panX) / this.zoom;
            const canvasY = (centerY - this.panY) / this.zoom;

            // Apply new zoom
            this.zoom = newZoom;

            // Adjust pan to keep the point centered
            this.panX = centerX - canvasX * this.zoom;
            this.panY = centerY - canvasY * this.zoom;
        } else {
            this.zoom = newZoom;
        }

        this.updateTransform();
        this.emit('zoom', { zoom: this.zoom, panX: this.panX, panY: this.panY });
    }

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.updateTransform();
        this.emit('zoom', { zoom: this.zoom, panX: this.panX, panY: this.panY });
    }

    /**
     * Fit canvas to container
     */
    fitToCanvas() {
        if (!this.canvas || !this.container) return;

        const containerRect = this.container.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();

        const scaleX = containerRect.width / canvasRect.width;
        const scaleY = containerRect.height / canvasRect.height;
        const newZoom = Math.min(scaleX, scaleY) * 0.9; // 90% to add some margin

        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        this.setZoom(newZoom, centerX, centerY);
    }

    /**
     * Fit content to view
     */
    fitToContent() {
        if (!this.canvas || !this.container) return;

        const elements = this.canvas.querySelectorAll('.tlbb-element');
        if (elements.length === 0) {
            this.resetZoom();
            return;
        }

        // Calculate bounding box of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            
            const left = rect.left - canvasRect.left;
            const top = rect.top - canvasRect.top;
            const right = left + rect.width;
            const bottom = top + rect.height;

            minX = Math.min(minX, left);
            minY = Math.min(minY, top);
            maxX = Math.max(maxX, right);
            maxY = Math.max(maxY, bottom);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;

        const containerRect = this.container.getBoundingClientRect();
        const scaleX = containerRect.width / contentWidth;
        const scaleY = containerRect.height / contentHeight;
        const newZoom = Math.min(scaleX, scaleY) * 0.8; // 80% to add margin

        // Center content in container
        this.setZoom(newZoom);
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        this.panX = centerX - contentCenterX * this.zoom;
        this.panY = centerY - contentCenterY * this.zoom;

        this.updateTransform();
        this.emit('zoom', { zoom: this.zoom, panX: this.panX, panY: this.panY });
    }

    /**
     * Update canvas transform
     */
    updateTransform() {
        if (!this.canvas) return;

        const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        this.canvas.style.transform = transform;
        this.canvas.style.transformOrigin = '0 0';
    }

    /**
     * Get current zoom level
     * @returns {number} Current zoom level
     */
    getZoom() {
        return this.zoom;
    }

    /**
     * Get current pan position
     * @returns {Object} Pan position {x, y}
     */
    getPan() {
        return { x: this.panX, y: this.panY };
    }

    /**
     * Get zoom bounds
     * @returns {Object} Zoom bounds {min, max}
     */
    getZoomBounds() {
        return { min: this.minZoom, max: this.maxZoom };
    }

    /**
     * Set zoom bounds
     * @param {number} minZoom - Minimum zoom
     * @param {number} maxZoom - Maximum zoom
     */
    setZoomBounds(minZoom, maxZoom) {
        this.minZoom = Math.max(0.01, minZoom);
        this.maxZoom = Math.min(10, maxZoom);
        
        // Constrain current zoom
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
        this.updateTransform();
    }

    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} Canvas coordinates {x, y}
     */
    screenToCanvas(screenX, screenY) {
        const rect = this.container.getBoundingClientRect();
        const containerX = screenX - rect.left;
        const containerY = screenY - rect.top;
        
        return {
            x: (containerX - this.panX) / this.zoom,
            y: (containerY - this.panY) / this.zoom
        };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     * @param {number} canvasX - Canvas X coordinate
     * @param {number} canvasY - Canvas Y coordinate
     * @returns {Object} Screen coordinates {x, y}
     */
    canvasToScreen(canvasX, canvasY) {
        const rect = this.container.getBoundingClientRect();
        
        return {
            x: rect.left + canvasX * this.zoom + this.panX,
            y: rect.top + canvasY * this.zoom + this.panY
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
window.ZoomManager = ZoomManager;
