/**
 * Event Manager Module
 * Handles global event coordination between UI components
 */

class EventManager {
    constructor() {
        this.eventBus = new Map();
        this.components = new Map();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.isRecordingHistory = true;
    }

    /**
     * Initialize event manager
     */
    init() {
        this.setupGlobalEventListeners();
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
        
        // Window events
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        window.addEventListener('resize', () => this.emit('windowResize'));
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            this.emit('visibilityChange', { hidden: document.hidden });
        });
    }

    /**
     * Register a component with the event manager
     * @param {string} name - Component name
     * @param {Object} component - Component instance
     */
    registerComponent(name, component) {
        this.components.set(name, component);
        this.emit('componentRegistered', { name, component });
    }

    /**
     * Unregister a component
     * @param {string} name - Component name
     */
    unregisterComponent(name) {
        const component = this.components.get(name);
        if (component) {
            this.components.delete(name);
            this.emit('componentUnregistered', { name, component });
        }
    }

    /**
     * Get registered component
     * @param {string} name - Component name
     * @returns {Object|null} Component instance
     */
    getComponent(name) {
        return this.components.get(name) || null;
    }

    /**
     * Handle global keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleGlobalKeyDown(event) {
        const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
        const modifiers = { ctrlKey, metaKey, shiftKey, altKey };

        // Emit global keyboard event
        this.emit('globalKeyDown', { key, modifiers, event });

        // Handle specific shortcuts
        if (ctrlKey || metaKey) {
            switch (key.toLowerCase()) {
                case 'z':
                    if (shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    event.preventDefault();
                    break;
                case 'y':
                    this.redo();
                    event.preventDefault();
                    break;
                case 's':
                    this.emit('save');
                    event.preventDefault();
                    break;
                case 'o':
                    this.emit('open');
                    event.preventDefault();
                    break;
                case 'n':
                    this.emit('new');
                    event.preventDefault();
                    break;
            }
        }

        // Escape key for canceling operations
        if (key === 'Escape') {
            this.emit('cancel');
        }
    }

    /**
     * Handle before unload event
     * @param {BeforeUnloadEvent} event - Before unload event
     */
    handleBeforeUnload(event) {
        const hasUnsavedChanges = this.emit('checkUnsavedChanges');
        
        if (hasUnsavedChanges.some(result => result === true)) {
            event.preventDefault();
            event.returnValue = '';
            return '';
        }
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} options - Options
     */
    on(event, callback, options = {}) {
        if (!this.eventBus.has(event)) {
            this.eventBus.set(event, []);
        }
        
        const subscription = {
            callback,
            once: options.once || false,
            priority: options.priority || 0,
            component: options.component || null
        };
        
        this.eventBus.get(event).push(subscription);
        
        // Sort by priority (higher priority first)
        this.eventBus.get(event).sort((a, b) => b.priority - a.priority);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} options - Options
     */
    once(event, callback, options = {}) {
        this.on(event, callback, { ...options, once: true });
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.eventBus.has(event)) return;
        
        const subscriptions = this.eventBus.get(event);
        const index = subscriptions.findIndex(sub => sub.callback === callback);
        
        if (index > -1) {
            subscriptions.splice(index, 1);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     * @returns {Array} Array of return values from callbacks
     */
    emit(event, data = null) {
        if (!this.eventBus.has(event)) return [];
        
        const subscriptions = this.eventBus.get(event);
        const results = [];
        const toRemove = [];
        
        for (let i = 0; i < subscriptions.length; i++) {
            const subscription = subscriptions[i];
            
            try {
                const result = subscription.callback(data);
                results.push(result);
                
                if (subscription.once) {
                    toRemove.push(i);
                }
            } catch (error) {
                console.error(`Error in event callback for '${event}':`, error);
            }
        }
        
        // Remove 'once' subscriptions (in reverse order to maintain indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            subscriptions.splice(toRemove[i], 1);
        }
        
        return results;
    }

    /**
     * Add action to history
     * @param {Object} action - Action object
     */
    addToHistory(action) {
        if (!this.isRecordingHistory) return;
        
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add new action
        this.history.push({
            ...action,
            timestamp: Date.now(),
            id: this.generateId()
        });
        
        // Maintain max history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.emit('historyChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentAction: this.getCurrentAction()
        });
    }

    /**
     * Undo last action
     */
    undo() {
        if (!this.canUndo()) return;
        
        const action = this.history[this.historyIndex];
        this.historyIndex--;
        
        try {
            if (action.undo && typeof action.undo === 'function') {
                action.undo();
            }
            
            this.emit('undo', action);
            this.emit('historyChanged', {
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                currentAction: this.getCurrentAction()
            });
        } catch (error) {
            console.error('Error during undo:', error);
        }
    }

    /**
     * Redo next action
     */
    redo() {
        if (!this.canRedo()) return;
        
        this.historyIndex++;
        const action = this.history[this.historyIndex];
        
        try {
            if (action.redo && typeof action.redo === 'function') {
                action.redo();
            } else if (action.execute && typeof action.execute === 'function') {
                action.execute();
            }
            
            this.emit('redo', action);
            this.emit('historyChanged', {
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                currentAction: this.getCurrentAction()
            });
        } catch (error) {
            console.error('Error during redo:', error);
        }
    }

    /**
     * Check if undo is possible
     * @returns {boolean} Can undo
     */
    canUndo() {
        return this.historyIndex >= 0;
    }

    /**
     * Check if redo is possible
     * @returns {boolean} Can redo
     */
    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    /**
     * Get current action
     * @returns {Object|null} Current action
     */
    getCurrentAction() {
        if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
            return this.history[this.historyIndex];
        }
        return null;
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        
        this.emit('historyChanged', {
            canUndo: false,
            canRedo: false,
            currentAction: null
        });
    }

    /**
     * Set history recording state
     * @param {boolean} recording - Recording state
     */
    setHistoryRecording(recording) {
        this.isRecordingHistory = recording;
    }

    /**
     * Create action creators for common operations
     */
    createElementMoveAction(element, oldPosition, newPosition) {
        return {
            type: 'element.move',
            description: `Move ${element.name || 'element'}`,
            element,
            execute: () => {
                element.style.left = newPosition.x + 'px';
                element.style.top = newPosition.y + 'px';
                this.emit('elementMoved', { element, position: newPosition });
            },
            undo: () => {
                element.style.left = oldPosition.x + 'px';
                element.style.top = oldPosition.y + 'px';
                this.emit('elementMoved', { element, position: oldPosition });
            },
            redo: function() { this.execute(); }
        };
    }

    createElementResizeAction(element, oldSize, newSize) {
        return {
            type: 'element.resize',
            description: `Resize ${element.name || 'element'}`,
            element,
            execute: () => {
                element.style.width = newSize.width + 'px';
                element.style.height = newSize.height + 'px';
                this.emit('elementResized', { element, size: newSize });
            },
            undo: () => {
                element.style.width = oldSize.width + 'px';
                element.style.height = oldSize.height + 'px';
                this.emit('elementResized', { element, size: oldSize });
            },
            redo: function() { this.execute(); }
        };
    }

    createPropertyChangeAction(element, property, oldValue, newValue) {
        return {
            type: 'property.change',
            description: `Change ${property} of ${element.name || 'element'}`,
            element,
            property,
            execute: () => {
                this.setElementProperty(element, property, newValue);
                this.emit('propertyChanged', { element, property, value: newValue });
            },
            undo: () => {
                this.setElementProperty(element, property, oldValue);
                this.emit('propertyChanged', { element, property, value: oldValue });
            },
            redo: function() { this.execute(); }
        };
    }

    /**
     * Set element property helper
     * @param {HTMLElement} element - Element
     * @param {string} property - Property name
     * @param {*} value - Property value
     */
    setElementProperty(element, property, value) {
        if (property.includes('.')) {
            // Nested property
            const parts = property.split('.');
            let obj = element;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
        } else {
            element[property] = value;
        }
    }

    /**
     * Batch multiple actions into one history entry
     * @param {Array} actions - Array of actions
     * @param {string} description - Batch description
     */
    batchActions(actions, description = 'Batch actions') {
        if (actions.length === 0) return;
        
        const batchAction = {
            type: 'batch',
            description,
            actions,
            execute: () => {
                actions.forEach(action => {
                    if (action.execute) action.execute();
                });
            },
            undo: () => {
                // Undo in reverse order
                for (let i = actions.length - 1; i >= 0; i--) {
                    if (actions[i].undo) actions[i].undo();
                }
            },
            redo: function() { this.execute(); }
        };
        
        this.addToHistory(batchAction);
    }

    /**
     * Get history information
     * @returns {Object} History info
     */
    getHistoryInfo() {
        return {
            total: this.history.length,
            current: this.historyIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            actions: this.history.map(action => ({
                type: action.type,
                description: action.description,
                timestamp: action.timestamp
            }))
        };
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Cleanup event manager
     */
    destroy() {
        // Clear all event subscriptions
        this.eventBus.clear();
        
        // Clear components
        this.components.clear();
        
        // Clear history
        this.clearHistory();
        
        // Remove global listeners
        document.removeEventListener('keydown', this.handleGlobalKeyDown);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
}

// Create global instance
window.eventManager = new EventManager();

// Export for use in other modules
window.EventManager = EventManager;
