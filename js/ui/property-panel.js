/**
 * Property Panel UI Module
 * Handles the property panel interface
 */

class PropertyPanel {
    constructor() {
        this.container = null;
        this.currentElement = null;
        this.propertyParser = null;
        this.collapsedGroups = new Set();
    }

    /**
     * Initialize property panel
     * @param {HTMLElement} container - Container element
     * @param {PropertyParser} propertyParser - Property parser instance
     */
    init(container, propertyParser) {
        this.container = container;
        this.propertyParser = propertyParser;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        // Group collapse/expand
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('property-group-header')) {
                this.toggleGroup(e.target);
            }
        });
    }

    /**
     * Update panel with element properties
     * @param {Object} element - Element to display
     */
    updateElement(element) {
        this.currentElement = element;
        
        if (!element) {
            this.showNoSelection();
            return;
        }

        this.renderElement(element);
    }

    /**
     * Show no selection state
     */
    showNoSelection() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="no-selection">
                <p>Select an element to view properties</p>
            </div>
        `;
    }

    /**
     * Render element properties
     * @param {Object} element - Element to render
     */
    renderElement(element) {
        if (!this.container || !this.propertyParser) return;
        // Chỉ hiển thị: Attributes (thuộc tính của tag) + Properties (các <Property ...>)
        const attrs = element.attributes || {};
        const props = element.properties || {};

        let html = '';
        html += this.renderSearchBox();
        // Attributes group
        const attrKeys = Object.keys(attrs);
        if (attrKeys.length) {
            html += this.renderPropertyGroup({ name: 'Attributes', properties: attrs });
        }
        // Properties group
        const propKeys = Object.keys(props);
        if (propKeys.length) {
            html += this.renderPropertyGroup({ name: 'Properties', properties: props });
        }
        if (!attrKeys.length && !propKeys.length) {
            html += `<div class="property-empty">(Không có thuộc tính trực tiếp)</div>`;
        }
        this.container.innerHTML = html;
        this.restoreGroupStates();
        this.setupSearch();
        this.setupEditingHandlers();
    }

    /**
     * Render element info section
     * @param {Object} element - Element
     * @returns {string} HTML string
     */
    renderElementInfo(element) {
        const bounds = this.formatElementBounds(element);
        
        return `
            <div class="element-info">
                <div class="element-name">${this.escapeHtml(element.name)}</div>
                <div class="element-type">${this.escapeHtml(element.type)}</div>
                <div class="element-bounds">${bounds}</div>
            </div>
        `;
    }

    /**
     * Render search box
     * @returns {string} HTML string
     */
    renderSearchBox() {
        return `
            <div class="property-search">
                <input type="text" placeholder="Search properties..." class="property-search-input">
            </div>
        `;
    }

    /**
     * Render property group
     * @param {Object} group - Property group
     * @returns {string} HTML string
     */
    renderPropertyGroup(group) {
        const isCollapsed = this.collapsedGroups.has(group.name);
        const collapsedClass = isCollapsed ? 'collapsed' : '';
        
        let html = `
            <div class="property-group ${collapsedClass}" data-group="${group.name}">
                <div class="property-group-header">${this.escapeHtml(group.name)}</div>
                <div class="property-group-content">
        `;

        for (const [name, value] of Object.entries(group.properties)) {
            const valueType = this.getPropertyValueType(name, value);
            html += this.renderPropertyItem(name, value, valueType);
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render property item
     * @param {string} name - Property name
     * @param {any} value - Property value
     * @param {string} type - Value type
     * @returns {string} HTML string
     */
    renderPropertyItem(name, value, type) {
        const displayValue = this.formatPropertyValue(value, type);
        const editable = this.isEditableProperty(name, type);
        const editAttr = editable ? 'data-editable="true" tabindex="0"' : '';
        const editHint = editable ? '<span class="edit-hint" title="Double-click to edit">✎</span>' : '';
        return `
            <div class="property-item" data-property="${name}" data-type="${type}" ${editable ? 'data-editable-container="true"' : ''}>
                <div class="property-name" data-type="${type}">${this.escapeHtml(name)} ${editHint}</div>
                <div class="property-value ${type}" ${this.getValueAttributes(value, type)} ${editAttr}>${this.escapeHtml(displayValue)}</div>
            </div>
        `;
    }

    /**
     * Format property value for display
     * @param {any} value - Property value
     * @param {string} type - Value type
     * @returns {string} Formatted value
     */
    formatPropertyValue(value, type) {
        if (value === null || value === undefined) {
            return 'null';
        }

        switch (type) {
            case 'boolean':
                return value === true || value === 'True' ? 'True' : 'False';
            
            case 'color':
                if (window.colorParser) {
                    const color = window.colorParser.parseColor(value);
                    return `${value} (${color.hex})`;
                }
                return value;
            
            case 'position':
            case 'size':
                return this.formatPositionSize(value);
            
            case 'text':
                if (window.stringDictionary && value.startsWith('#{') && value.endsWith('}')) {
                    const resolved = window.stringDictionary.resolveTextValue(value);
                    if (resolved !== value) {
                        return `${value} → "${resolved}"`;
                    }
                }
                return value;
            
            default:
                return String(value);
        }
    }

    /**
     * Format position/size values
     * @param {string} value - Position/size value
     * @returns {string} Formatted value
     */
    formatPositionSize(value) {
        if (!value) return 'Not set';
        
        // Try to parse and format nicely
        if (value.includes('{{')) {
            return value; // Keep unified format as-is
        } else if (value.includes(':')) {
            return value; // Keep x:y format as-is
        }
        
        return value;
    }

    /**
     * Get value attributes for styling
     * @param {any} value - Property value
     * @param {string} type - Value type
     * @returns {string} HTML attributes
     */
    getValueAttributes(value, type) {
        if (type === 'color' && window.colorParser) {
            const color = window.colorParser.parseColor(value);
            return `style="--color-preview: ${color.hex}"`;
        }
        return '';
    }

    /**
     * Get property value type
     * @param {string} name - Property name
     * @param {any} value - Property value
     * @returns {string} Value type
     */
    getPropertyValueType(name, value) {
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes('color')) return 'color';
        if (lowerName.includes('position') || lowerName.includes('bounds')) return 'position';
        if (lowerName.includes('size') || lowerName.includes('width') || lowerName.includes('height')) return 'size';
        if (lowerName.includes('text')) return 'text';
        if (lowerName.includes('image')) return 'image';
        if (lowerName.includes('event') || lowerName.includes('function')) return 'event';
        if (value === 'True' || value === 'False' || value === true || value === false) return 'boolean';
        if (!isNaN(parseFloat(value)) && isFinite(value)) return 'number';
        
        return 'text';
    }

    /**
     * Format element bounds
     * @param {Object} element - Element
     * @returns {string} Formatted bounds
     */
    formatElementBounds(element) {
        if (element.bounds) {
            return `${Math.round(element.bounds.x)}, ${Math.round(element.bounds.y)} (${Math.round(element.bounds.width)}×${Math.round(element.bounds.height)})`;
        }
        if (window.positionCalculator) {
            const b = window.positionCalculator.calculateElementBounds(element);
            return `${Math.round(b.x)}, ${Math.round(b.y)} (${Math.round(b.width)}×${Math.round(b.height)})`;
        }
        return 'Bounds unavailable';
    }

    /**
     * Toggle property group
     * @param {HTMLElement} header - Group header element
     */
    toggleGroup(header) {
        const group = header.parentElement;
        const groupName = group.dataset.group;
        
        if (group.classList.contains('collapsed')) {
            group.classList.remove('collapsed');
            this.collapsedGroups.delete(groupName);
        } else {
            group.classList.add('collapsed');
            this.collapsedGroups.add(groupName);
        }
    }

    /**
     * Restore group collapse states
     */
    restoreGroupStates() {
        if (!this.container) return;
        
        for (const groupName of this.collapsedGroups) {
            const group = this.container.querySelector(`[data-group="${groupName}"]`);
            if (group) {
                group.classList.add('collapsed');
            }
        }
    }

    /**
     * Filter properties by search term
     * @param {string} searchTerm - Search term
     */
    filterProperties(searchTerm) {
        if (!this.container) return;
        
        const lowerSearch = searchTerm.toLowerCase();
        const propertyItems = this.container.querySelectorAll('.property-item');
        
        for (const item of propertyItems) {
            const propertyName = item.dataset.property.toLowerCase();
            const propertyValue = item.querySelector('.property-value').textContent.toLowerCase();
            
            const matches = propertyName.includes(lowerSearch) || 
                          propertyValue.includes(lowerSearch);
            
            item.style.display = matches ? 'block' : 'none';
        }
        
        // Hide empty groups
        const groups = this.container.querySelectorAll('.property-group');
        for (const group of groups) {
            const visibleItems = group.querySelectorAll('.property-item[style*="block"], .property-item:not([style*="none"])');
            const content = group.querySelector('.property-group-content');
            if (content) {
                content.style.display = visibleItems.length > 0 ? 'block' : 'none';
            }
        }
    }

    /**
     * Setup search functionality
     */
    setupSearch() {
        const searchInput = this.container.querySelector('.property-search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterProperties(e.target.value);
                }, 300);
            });
        }
    }

    /**
     * Get current element
     * @returns {Object|null} Current element
     */
    getCurrentElement() {
        return this.currentElement;
    }

    /**
     * Clear panel
     */
    clear() {
        this.currentElement = null;
        this.showNoSelection();
    }

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') {
            text = String(text);
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ================= Inline Editing Support =================
    isEditableProperty(name, type) {
        const n = name.toLowerCase();
        if (['text','position','size','unifiedposition','unifiedsize','absoluteposition','absolutesize','unifiedxposition','unifiedyposition','unifiedxsize','unifiedysize'].includes(n)) return true;
        if (type === 'number') return true;
        return false;
    }

    setupEditingHandlers() {
        if (!this.container) return;
        this.container.querySelectorAll('.property-value[data-editable="true"]').forEach(el => {
            el.addEventListener('dblclick', () => this.beginEdit(el));
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.commitEdit(el); }
                else if (e.key === 'Escape') { e.preventDefault(); this.cancelEdit(el); }
            });
            el.addEventListener('blur', () => {
                if (el.dataset.editing === 'true') this.commitEdit(el);
            });
        });
    }

    beginEdit(el){
        if (el.dataset.editing === 'true') return;
        el.dataset.originalValue = el.textContent.trim();
        el.dataset.editing = 'true';
        el.contentEditable = 'true';
        el.classList.add('editing');
        // focus caret at end
        setTimeout(()=>{
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },0);
    }

    cancelEdit(el){
        if (el.dataset.editing !== 'true') return;
        el.textContent = el.dataset.originalValue || el.textContent;
        el.contentEditable = 'false';
        el.classList.remove('editing');
        delete el.dataset.editing;
        delete el.dataset.originalValue;
    }

    commitEdit(el){
        if (el.dataset.editing !== 'true') return;
        const newVal = el.textContent.trim();
        const orig = el.dataset.originalValue;
        el.contentEditable = 'false';
        el.classList.remove('editing');
        delete el.dataset.editing;
        delete el.dataset.originalValue;
        if (newVal === orig) return; // no change
        const item = el.closest('.property-item');
        if (!item) return;
        const propName = item.dataset.property;
        if (!propName || !this.currentElement) return;
        this.applyPropertyChange(this.currentElement, propName, newVal, el);
    }

    applyPropertyChange(element, propName, newValue, el){
        // update direct field & properties map
        element[propName] = newValue;
        if (element.properties && Object.prototype.hasOwnProperty.call(element.properties, propName)) {
            element.properties[propName] = newValue;
        }
        const layoutKeys = ['unifiedposition','unifiedsize','absoluteposition','absolutesize','position','size','unifiedxposition','unifiedyposition','unifiedxsize','unifiedysize'];
        if (layoutKeys.includes(propName.toLowerCase())) {
            try {
                if (window.tlbbGUIRenderer && window.tlbbGUIRenderer.layoutCalculator) {
                    window.tlbbGUIRenderer.layoutCalculator.compute(window.tlbbGUIRenderer.currentElements);
                    if (typeof window.tlbbGUIRenderer.renderElements === 'function') {
                        window.tlbbGUIRenderer.renderElements();
                    } else if (typeof window.tlbbGUIRenderer.redraw === 'function') {
                        window.tlbbGUIRenderer.redraw();
                    }
                }
            } catch(err){
                console.warn('Recompute after edit failed', err);
                el.classList.add('edit-error');
            }
        }
        // refresh panel to show formatted value
        this.updateElement(element);
    }
}

// Export for use in other modules
window.PropertyPanel = PropertyPanel;
