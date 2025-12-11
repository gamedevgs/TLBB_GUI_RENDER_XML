/**
 * String Dictionary Module for TLBB GUI Renderer
 * Handles loading and resolving text references from StrDic.txt
 */

class StringDictionary {
    constructor() {
        this.strings = new Map();
        this.loaded = false;
        this.loadingPromise = null;
    }

    /**
     * Load string dictionary from data
     * @param {string} dictText - Content of StrDic.txt file
     */
    loadFromText(dictText) {
        this.strings.clear();
        
        const lines = dictText.split('\n');
        let loadedCount = 0;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && trimmedLine.includes('\t')) {
                const tabIndex = trimmedLine.indexOf('\t');
                const key = trimmedLine.substring(0, tabIndex);
                const value = trimmedLine.substring(tabIndex + 1);
                
                if (key && value) {
                    this.strings.set(key, value);
                    loadedCount++;
                }
            }
        }
        
        this.loaded = true;
        console.log(`Loaded ${loadedCount} strings from dictionary`);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('stringDictionaryLoaded', {
            detail: { count: loadedCount }
        }));
        
        return loadedCount;
    }

    /**
     * Load string dictionary from file
     * @param {string} filePath - Path to StrDic.txt file
     */
    async loadFromFile(filePath) {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load dictionary: ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                return this.loadFromText(text);
            })
            .catch(error => {
                console.error('Error loading string dictionary:', error);
                this.loadingPromise = null;
                throw error;
            });

        return this.loadingPromise;
    }

    /**
     * Get localized string by key
     * @param {string} key - String key
     * @param {string} defaultValue - Default value if key not found
     * @returns {string} Localized string or default value
     */
    getString(key, defaultValue = null) {
        if (!key) return defaultValue || '';
        
        const value = this.strings.get(key);
        return value !== undefined ? value : (defaultValue || key);
    }

    /**
     * Resolve text value with #{KEY} format
     * @param {string} textValue - Text value that may contain references
     * @returns {string} Resolved text value
     */
    resolveTextValue(textValue) {
        if (!textValue || typeof textValue !== 'string') {
            return textValue || '';
        }

        // Handle #{INTERFACE_XML_XXX} format
        if (textValue.startsWith('#{') && textValue.endsWith('}')) {
            const key = textValue.substring(2, textValue.length - 1);
            const resolved = this.getString(key);
            
            // If not found, return original reference
            if (resolved === key) {
                return textValue;
            }
            
            return resolved;
        }

        // Handle multiple references in one string
        return textValue.replace(/#{([^}]+)}/g, (match, key) => {
            const resolved = this.getString(key);
            return resolved === key ? match : resolved;
        });
    }

    /**
     * Check if dictionary has a specific key
     * @param {string} key - String key to check
     * @returns {boolean} True if key exists
     */
    hasKey(key) {
        return this.strings.has(key);
    }

    /**
     * Get all keys in dictionary
     * @returns {string[]} Array of all keys
     */
    getAllKeys() {
        return Array.from(this.strings.keys());
    }

    /**
     * Search for keys containing specific text
     * @param {string} searchText - Text to search for
     * @returns {Object[]} Array of {key, value} objects
     */
    searchKeys(searchText) {
        const results = [];
        const lowerSearch = searchText.toLowerCase();
        
        for (const [key, value] of this.strings) {
            if (key.toLowerCase().includes(lowerSearch) || 
                value.toLowerCase().includes(lowerSearch)) {
                results.push({ key, value });
            }
        }
        
        return results;
    }

    /**
     * Get dictionary statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            totalStrings: this.strings.size,
            loaded: this.loaded,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estimate memory usage of dictionary
     * @returns {number} Estimated memory usage in bytes
     */
    estimateMemoryUsage() {
        let total = 0;
        for (const [key, value] of this.strings) {
            total += (key.length + value.length) * 2; // UTF-16 encoding
        }
        return total;
    }

    /**
     * Clear dictionary
     */
    clear() {
        this.strings.clear();
        this.loaded = false;
        this.loadingPromise = null;
    }

    /**
     * Export dictionary as JSON
     * @returns {string} JSON representation
     */
    exportAsJSON() {
        return JSON.stringify(Object.fromEntries(this.strings), null, 2);
    }

    /**
     * Import dictionary from JSON
     * @param {string} jsonText - JSON representation
     */
    importFromJSON(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            this.strings.clear();
            
            for (const [key, value] of Object.entries(data)) {
                this.strings.set(key, value);
            }
            
            this.loaded = true;
            console.log(`Imported ${this.strings.size} strings from JSON`);
        } catch (error) {
            console.error('Error importing from JSON:', error);
            throw error;
        }
    }
}

// Create global instance
const stringDictionary = new StringDictionary();

// Auto-load dictionary if data file exists
document.addEventListener('DOMContentLoaded', () => {
    // Try to load default dictionary file
    stringDictionary.loadFromFile('data/Config/StrDic.txt')
        .catch(error => {
            console.log('Default dictionary not found, will need to load manually');
        });
});

// Export for use in other modules
window.StringDictionary = StringDictionary;
window.stringDictionary = stringDictionary;
