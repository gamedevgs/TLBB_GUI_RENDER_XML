/**
 * XML Tree UI Module
 * Handles the XML structure tree display
 */

class XMLTree {
    constructor() {
        this.container = null;
        this.tree = [];
        this.selectedElement = null;
        this.expandedNodes = new Set();
        this.eventCallbacks = new Map();
    }

    /**
     * Initialize XML tree
     * @param {HTMLElement} container - Container element
     */
    init(container) {
        this.container = container;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }

    /**
     * Update tree with new data
     * @param {Array} tree - Tree structure
     */
    updateTree(tree) {
        this.tree = tree;
        this.render();
    }

    /**
     * Render the tree
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = '';
        
        if (this.tree.length === 0) {
            this.container.innerHTML = '<div class="tree-empty">No elements to display</div>';
            return;
        }

        for (const node of this.tree) {
            const treeItem = this.createTreeNode(node, 0);
            this.container.appendChild(treeItem);
        }
    }

    /**
     * Create tree node element
     * @param {Object} node - Tree node
     * @param {number} level - Nesting level
     * @returns {HTMLElement} Tree node element
     */
    createTreeNode(node, level) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.style.marginLeft = `${level * 16}px`;
        nodeElement.setAttribute('data-element-path', node.path);
        nodeElement.setAttribute('data-element-name', node.name);

        // Create node content
        const nodeContent = this.createNodeContent(node);
        nodeElement.appendChild(nodeContent);

        // Create children container
        if (node.children && node.children.length > 0) {
            const childrenContainer = this.createChildrenContainer(node, level);
            nodeElement.appendChild(childrenContainer);
        }

        return nodeElement;
    }

    /**
     * Create node content
     * @param {Object} node - Tree node
     * @returns {HTMLElement} Node content element
     */
    createNodeContent(node) {
        const content = document.createElement('div');
        content.className = 'tree-node-content';

        // Toggle button
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        
        if (node.children && node.children.length > 0) {
            const isExpanded = this.expandedNodes.has(node.path);
            toggle.textContent = isExpanded ? '▼' : '▶';
            toggle.style.cursor = 'pointer';
        } else {
            toggle.textContent = '';
            toggle.style.visibility = 'hidden';
        }

        // Icon
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.textContent = this.getNodeIcon(node.type);

        // Label
        const label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = this.getNodeLabel(node);

        // Info
        const info = document.createElement('span');
        info.className = 'tree-info';
        info.textContent = this.getNodeInfo(node);

        content.appendChild(toggle);
        content.appendChild(icon);
        content.appendChild(label);
        content.appendChild(info);

        return content;
    }

    /**
     * Create children container
     * @param {Object} node - Parent node
     * @param {number} level - Current level
     * @returns {HTMLElement} Children container
     */
    createChildrenContainer(node, level) {
        const container = document.createElement('div');
        container.className = 'tree-children';
        container.setAttribute('data-parent-path', node.path);

        // Check if expanded
        const isExpanded = this.expandedNodes.has(node.path);
        if (!isExpanded) {
            container.style.display = 'none';
        }

        // Add children
        for (const child of node.children) {
            const childNode = this.createTreeNode(child, level + 1);
            container.appendChild(childNode);
        }

        return container;
    }

    /**
     * Get icon for node type
     * @param {string} type - Node type
     * @returns {string} Icon character
     */
    getNodeIcon(type) {
        if (type === 'DefaultWindow') return '📦';
        if (type.includes('MainFrame')) return '🗔';
        if (type.includes('Button')) return '🔘';
        if (type.includes('Text')) return '📝';
        if (type.includes('Image')) return '🖼️';
        if (type.includes('List')) return '📋';
        if (type.includes('Edit')) return '✏️';
        if (type.includes('Progress')) return '📊';
        if (type.includes('Scroll')) return '📜';
        if (type.includes('Action')) return '⚡';
        if (type.includes('Frame')) return '🖼️';
        
        return '📄';
    }

    /**
     * Get label for node
     * @param {Object} node - Tree node
     * @returns {string} Node label
     */
    getNodeLabel(node) {
        return node.name || 'Unnamed';
    }

    /**
     * Get info for node
     * @param {Object} node - Tree node
     * @returns {string} Node info
     */
    getNodeInfo(node) {
        const info = [];
        
        // Type
        info.push(node.type);
        
        // Child count
        if (node.children && node.children.length > 0) {
            info.push(`${node.children.length} children`);
        }
        
        // Visibility
        if (!node.visible) {
            info.push('hidden');
        }
        
        return `(${info.join(', ')})`;
    }

    /**
     * Handle click events
     * @param {Event} event - Click event
     */
    handleClick(event) {
        const target = event.target;
        
        // Handle toggle click
        if (target.classList.contains('tree-toggle')) {
            this.handleToggleClick(target);
            event.stopPropagation();
            return;
        }
        
        // Handle node selection
        const nodeContent = target.closest('.tree-node-content');
        if (nodeContent) {
            this.handleNodeSelection(nodeContent);
            event.stopPropagation();
        }
    }

    /**
     * Handle toggle click
     * @param {HTMLElement} toggle - Toggle element
     */
    handleToggleClick(toggle) {
        const nodeContent = toggle.closest('.tree-node-content');
        const treeNode = nodeContent.closest('.tree-node');
        const elementPath = treeNode.getAttribute('data-element-path');
        const childrenContainer = treeNode.querySelector('.tree-children');
        
        if (!childrenContainer) return;
        
        const isExpanded = this.expandedNodes.has(elementPath);
        
        if (isExpanded) {
            // Collapse
            this.expandedNodes.delete(elementPath);
            childrenContainer.style.display = 'none';
            toggle.textContent = '▶';
        } else {
            // Expand
            this.expandedNodes.add(elementPath);
            childrenContainer.style.display = 'block';
            toggle.textContent = '▼';
        }
        
        this.emit('nodeToggled', { elementPath, expanded: !isExpanded });
    }

    /**
     * Handle node selection
     * @param {HTMLElement} nodeContent - Node content element
     */
    handleNodeSelection(nodeContent) {
        const treeNode = nodeContent.closest('.tree-node');
        const elementPath = treeNode.getAttribute('data-element-path');
        const elementName = treeNode.getAttribute('data-element-name');
        
        // Find element in tree
        const element = this.findElementByPath(elementPath);
        
        if (element) {
            this.selectElement(element);
            this.emit('elementSelected', element);
        }
    }

    /**
     * Find element by path in tree
     * @param {string} path - Element path
     * @returns {Object|null} Found element
     */
    findElementByPath(path) {
        const findInTree = (nodes) => {
            for (const node of nodes) {
                if (node.path === path) {
                    return node;
                }
                if (node.children) {
                    const found = findInTree(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        
        return findInTree(this.tree);
    }

    /**
     * Select element in tree
     * @param {Object} element - Element to select
     */
    selectElement(element) {
        // Remove previous selection
        this.container.querySelectorAll('.tree-node-content.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        if (element) {
            // Find and select element
            const nodeContent = this.container.querySelector(`[data-element-path="${element.path}"] .tree-node-content`);
            if (nodeContent) {
                nodeContent.classList.add('selected');
                nodeContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Expand path to element
            this.expandPathToElement(element.path);
        }
        
        this.selectedElement = element;
    }

    /**
     * Expand path to element
     * @param {string} elementPath - Path to element
     */
    expandPathToElement(elementPath) {
        const pathParts = elementPath.split('/');
        let currentPath = '';
        
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];
            
            if (!this.expandedNodes.has(currentPath)) {
                this.expandedNodes.add(currentPath);
                
                // Update UI
                const toggle = this.container.querySelector(`[data-element-path="${currentPath}"] .tree-toggle`);
                const childrenContainer = this.container.querySelector(`[data-parent-path="${currentPath}"]`);
                
                if (toggle && childrenContainer) {
                    toggle.textContent = '▼';
                    childrenContainer.style.display = 'block';
                }
            }
        }
    }

    /**
     * Expand all nodes
     */
    expandAll() {
        const expandNodes = (nodes) => {
            for (const node of nodes) {
                if (node.children && node.children.length > 0) {
                    this.expandedNodes.add(node.path);
                    expandNodes(node.children);
                }
            }
        };
        
        expandNodes(this.tree);
        this.render();
    }

    /**
     * Collapse all nodes
     */
    collapseAll() {
        this.expandedNodes.clear();
        this.render();
    }

    /**
     * Filter tree by search term
     * @param {string} searchTerm - Search term
     */
    filterTree(searchTerm) {
        if (!searchTerm) {
            // Show all nodes
            this.container.querySelectorAll('.tree-node').forEach(node => {
                node.style.display = 'block';
            });
            return;
        }
        
        const lowerSearch = searchTerm.toLowerCase();
        
        this.container.querySelectorAll('.tree-node').forEach(node => {
            const elementName = node.getAttribute('data-element-name').toLowerCase();
            const label = node.querySelector('.tree-label').textContent.toLowerCase();
            const info = node.querySelector('.tree-info').textContent.toLowerCase();
            
            const matches = elementName.includes(lowerSearch) || 
                          label.includes(lowerSearch) || 
                          info.includes(lowerSearch);
            
            node.style.display = matches ? 'block' : 'none';
        });
    }

    /**
     * Get tree statistics
     * @returns {Object} Statistics
     */
    getStats() {
        const countNodes = (nodes) => {
            let count = 0;
            for (const node of nodes) {
                count++;
                if (node.children) {
                    count += countNodes(node.children);
                }
            }
            return count;
        };
        
        return {
            totalNodes: countNodes(this.tree),
            expandedNodes: this.expandedNodes.size,
            selectedElement: this.selectedElement ? this.selectedElement.name : null
        };
    }

    /**
     * Clear tree
     */
    clear() {
        this.tree = [];
        this.selectedElement = null;
        this.expandedNodes.clear();
        if (this.container) {
            this.container.innerHTML = '<div class="tree-empty">No elements loaded</div>';
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
}

// Export for use in other modules
window.XMLTree = XMLTree;
