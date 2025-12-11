/**
 * TLBB Multi-State Images Utility
 * Provides convenient methods for working with multi-state button images
 */

class TLBBMultiStateImageHelper {
    constructor(imagesetLoader) {
        this.imagesetLoader = imagesetLoader;
        this.presets = new Map();
        this.initializePresets();
    }

    /**
     * Initialize common button presets
     */
    initializePresets() {
        // Common TLBB button patterns
        this.presets.set('levelup', {
            normal: 'set:Button5 image:BtnLevelup_Normal',
            hover: 'set:Button5 image:BtnLevelup_Hover', 
            pushed: 'set:Button5 image:BtnLevelup_Pushed',
            disabled: 'set:Button5 image:BtnLevelup_Disabled'
        });

        this.presets.set('ok', {
            normal: 'set:Common image:Btn_OK_Normal',
            hover: 'set:Common image:Btn_OK_Hover',
            pushed: 'set:Common image:Btn_OK_Pushed',
            disabled: 'set:Common image:Btn_OK_Disabled'
        });

        this.presets.set('cancel', {
            normal: 'set:Common image:Btn_Cancel_Normal',
            hover: 'set:Common image:Btn_Cancel_Hover',
            pushed: 'set:Common image:Btn_Cancel_Pushed',
            disabled: 'set:Common image:Btn_Cancel_Disabled'
        });

        this.presets.set('close', {
            normal: 'set:Common image:Btn_Close_Normal',
            hover: 'set:Common image:Btn_Close_Hover',
            pushed: 'set:Common image:Btn_Close_Pushed',
            disabled: 'set:Common image:Btn_Close_Disabled'
        });
    }

    /**
     * Create a button with multi-state images using a preset
     * @param {string} presetName - Name of the preset
     * @param {Object} options - Additional options
     * @returns {HTMLElement} Configured button element
     */
    createButton(presetName, options = {}) {
        const {
            text = '',
            className = 'tlbb-button',
            onClick = null,
            disabled = false,
            customStates = null
        } = options;

        const button = document.createElement('button');
        button.textContent = text;
        button.className = className;
        button.disabled = disabled;

        if (onClick) {
            button.addEventListener('click', onClick);
        }

        // Get image states (use custom or preset)
        const imageStates = customStates || this.presets.get(presetName);
        
        if (!imageStates) {
            console.warn(`Preset '${presetName}' not found`);
            return button;
        }

        // Apply multi-state images
        try {
            this.imagesetLoader.applyMultiStateImages(button, imageStates);
        } catch (error) {
            console.error(`❌ Failed to apply ${presetName} preset:`, error);
        }

        return button;
    }

    /**
     * Apply a preset to an existing element
     * @param {HTMLElement} element - Element to apply preset to
     * @param {string} presetName - Name of the preset
     * @param {Object} customStates - Custom states to override preset
     */
    applyPreset(element, presetName, customStates = null) {
        const imageStates = customStates || this.presets.get(presetName);
        
        if (!imageStates) {
            console.warn(`Preset '${presetName}' not found`);
            return false;
        }

        try {
            this.imagesetLoader.applyMultiStateImages(element, imageStates);
            return true;
        } catch (error) {
            console.error(`❌ Failed to apply ${presetName} preset:`, error);
            return false;
        }
    }

    /**
     * Create image states from a base pattern
     * @param {string} imagesetName - Name of the imageset
     * @param {string} baseImageName - Base name for images (without state suffix)
     * @param {Array} states - Array of state suffixes
     * @returns {Object} Image states object
     */
    createImageStatesFromPattern(imagesetName, baseImageName, states = ['Normal', 'Hover', 'Pushed', 'Disabled']) {
        const imageStates = {};
        
        states.forEach(state => {
            const stateLower = state.toLowerCase();
            imageStates[stateLower] = `set:${imagesetName} image:${baseImageName}_${state}`;
        });

        return imageStates;
    }

    /**
     * Register a new preset
     * @param {string} name - Preset name
     * @param {Object} imageStates - Image states object
     */
    registerPreset(name, imageStates) {
        this.presets.set(name, imageStates);
        console.log(`✅ Registered preset '${name}'`);
    }

    /**
     * Get all available presets
     * @returns {Array} Array of preset names
     */
    getAvailablePresets() {
        return Array.from(this.presets.keys());
    }

    /**
     * Get preset definition
     * @param {string} name - Preset name
     * @returns {Object|null} Preset definition or null if not found
     */
    getPreset(name) {
        return this.presets.get(name) || null;
    }

    /**
     * Validate all presets
     * @returns {Object} Validation results for all presets
     */
    validateAllPresets() {
        const results = {};
        
        for (const [name, states] of this.presets) {
            results[name] = this.imagesetLoader.validateMultiStateImages(states);
        }

        return results;
    }


    /**
     * Create a button factory for a specific imageset
     * @param {string} imagesetName - Name of the imageset
     * @param {Object} buttonDefinitions - Object mapping button names to image patterns
     * @returns {Object} Factory object with create methods
     */
    createButtonFactory(imagesetName, buttonDefinitions) {
        const factory = {};

        Object.entries(buttonDefinitions).forEach(([buttonName, pattern]) => {
            factory[`create${buttonName.charAt(0).toUpperCase() + buttonName.slice(1)}`] = (options = {}) => {
                const imageStates = this.createImageStatesFromPattern(imagesetName, pattern);
                return this.createButton('custom', { ...options, customStates: imageStates });
            };
        });

        return factory;
    }

    /**
     * Batch apply presets to multiple elements
     * @param {Array} elements - Array of {element, preset} objects
     * @returns {Array} Results array
     */
    batchApplyPresets(elements) {
        const results = [];

        elements.forEach(({ element, preset, customStates }, index) => {
            try {
                const success = this.applyPreset(element, preset, customStates);
                results.push({ index, element, preset, success });
            } catch (error) {
                results.push({ index, element, preset, success: false, error: error.message });
            }
        });

        return results;
    }

    /**
     * Auto-detect and apply appropriate preset based on element properties
     * @param {HTMLElement} element - Element to analyze
     * @returns {boolean} True if preset was applied
     */
    autoApplyPreset(element) {
        // Check element text/class/id for hints
        const text = element.textContent?.toLowerCase() || '';
        const className = element.className?.toLowerCase() || '';
        const id = element.id?.toLowerCase() || '';
        
        const combined = `${text} ${className} ${id}`;

        // Simple heuristics for auto-detection
        if (combined.includes('ok') || combined.includes('confirm')) {
            return this.applyPreset(element, 'ok');
        } else if (combined.includes('cancel') || combined.includes('no')) {
            return this.applyPreset(element, 'cancel');
        } else if (combined.includes('close') || combined.includes('exit')) {
            return this.applyPreset(element, 'close');
        } else if (combined.includes('levelup') || combined.includes('upgrade')) {
            return this.applyPreset(element, 'levelup');
        }

        console.warn('Could not auto-detect appropriate preset for element:', element);
        return false;
    }

    /**
     * Debug information about current state
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            presetsCount: this.presets.size,
            availablePresets: this.getAvailablePresets(),
            imagesetLoaderStatus: {
                loadedImagesets: this.imagesetLoader.getLoadedImagesets(),
                imageCacheSize: this.imagesetLoader.imageCache?.size || 0
            }
        };
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.TLBBMultiStateImageHelper = TLBBMultiStateImageHelper;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TLBBMultiStateImageHelper;
}
