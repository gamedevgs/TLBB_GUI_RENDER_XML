/**
 * Base Renderer Module for TLBB GUI Renderer
 * Provides base functionality for all renderers
 */

class BaseRenderer {
  constructor() {
    this.container = null;
    this.renderedElements = new Map();
    this.eventCallbacks = new Map();
    this.displayMode = "element";
  }

  /**
   * Initialize renderer
   * @param {HTMLElement} container - Parent container
   */
  init(container) {
    this.container = container;
  }

  /**
     * Set container (alias for init fo        // Parse TLBB image format: "set:SetName image:ImageName"
        const imageResult = this.parseTLBBImagePath(imagePath);
        
        console.log('🔍 parseTLBBImagePath result:', imageResult);
        
        if (!imageResult) {
            console.warn('❌ Could not parse image path or imageset not loaded:', imageData);
            // Create a simple placeholder instead of trying to load image
            this.createSimplePlaceholder(domElement, imagePath);
            return;
        }lity)
     * @param {HTMLElement} container - Parent container
     */
  setContainer(container) {
    this.init(container);
  }

  /**
   * Set display mode
   * @param {string} mode - Display mode ('element' or 'wireframe')
   */
  setDisplayMode(mode) {
    this.displayMode = mode;
    this.refreshAllElements();
  }

  /**
   * Check if this renderer can handle the element
   * @param {Object} element - XML element object
   * @returns {boolean} Can handle
   */
  canRender(element) {
    return false; // Override in child classes
  }

  /**
   * Render element - must be implemented by child classes
   * @param {Object} element - Element data
   * @param {HTMLElement} parent - Parent container
   * @returns {HTMLElement} Rendered element
   */
  render(element, parent) {
    throw new Error("render() method must be implemented by child classes");
  }

  /**
   * Create DOM element for TLBB element
   * @param {Object} element - TLBB element data
   * @param {Object} bounds - Element bounds
   * @param {number} level - Hierarchy level (default: 0)
   * @param {HTMLElement} parentElement - Parent DOM element (for hierarchy context)
   * @returns {HTMLElement} DOM element
   */
  createElement(element, bounds, level = 0, parentElement = null) {
    // Check if document is available
    if (typeof document === "undefined") {
      throw new Error(
        "Document object is not available. Make sure this code runs in a browser context."
      );
    }

    const domElement = document.createElement("div");

    // Set basic attributes
    domElement.id = `tlbb-${element.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    domElement.className = this.getElementClasses(element);
    domElement.setAttribute("data-tlbb-name", element.name);
    domElement.setAttribute("data-tlbb-type", element.type);
    domElement.setAttribute("data-tlbb-path", element.path);

    // Add hierarchy attributes
    domElement.setAttribute("data-level", level.toString());
    
    // Add parent path if exists (for hierarchical mode support)
    if (element.parentPath) {
      domElement.setAttribute("data-parent-path", element.parentPath);
    }

    // Initialize imageset attribute as false (will be set to true if imageset is applied)
    domElement.setAttribute("data-has-imageset", "false");

    // Calculate child count if children exist
    const childCount = element.children ? element.children.length : 0;
    if (childCount > 0) {
      domElement.setAttribute("data-has-children", "true");
      domElement.setAttribute("data-child-count", childCount.toString());
    } else {
      domElement.setAttribute("data-has-children", "false");
    }

    // Add parent reference if exists
    if (parentElement) {
      domElement.setAttribute("data-parent-id", parentElement.id);
    }

    const isVisible =
      element.visible === undefined || element.visible === null
        ? true
        : !!element.visible;
    if (element.visible === undefined) element.visible = isVisible; // normalize
    domElement.setAttribute("data-visible", isVisible.toString());

    // Set position and size
    this.applyBounds(domElement, bounds);

    // Set visibility
    if (!element.visible) {
      domElement.style.opacity = "0.3";
    }

    // Add click handler
    domElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleElementClick(element, domElement);
    });

    // Add hover handlers
    domElement.addEventListener("mouseenter", () => {
      this.handleElementHover(element, domElement, true);
    });

    domElement.addEventListener("mouseleave", () => {
      this.handleElementHover(element, domElement, false);
    });

    return domElement;
  }

  /**
   * Create base element without bounds
   * @param {Object} element - Element data
   * @param {number} level - Hierarchy level (default: 0)
   * @param {HTMLElement} parentElement - Parent DOM element (for hierarchy context)
   * @returns {HTMLElement} DOM element
   */
  createBaseElement(element, level = 0, parentElement = null) {
    // Check if document is available
    if (typeof document === "undefined") {
      throw new Error(
        "Document object is not available. Make sure this code runs in a browser context."
      );
    }

    const domElement = document.createElement("div");

    // Set basic attributes
    domElement.id = `tlbb-${element.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    domElement.className = this.getElementClasses(element);
    domElement.setAttribute("data-tlbb-name", element.name);
    domElement.setAttribute("data-tlbb-type", element.type);
    domElement.setAttribute("data-tlbb-path", element.path);

    // Add hierarchy attributes
    domElement.setAttribute("data-level", level.toString());
    
    // Add parent path if exists (for hierarchical mode support)
    if (element.parentPath) {
      domElement.setAttribute("data-parent-path", element.parentPath);
    }

    // Calculate child count if children exist
    const childCount = element.children ? element.children.length : 0;
    if (childCount > 0) {
      domElement.setAttribute("data-has-children", "true");
      domElement.setAttribute("data-child-count", childCount.toString());
    } else {
      domElement.setAttribute("data-has-children", "false");
    }

    // Add parent reference if exists
    if (parentElement) {
      domElement.setAttribute("data-parent-id", parentElement.id);
    }

    const isVisible2 =
      element.visible === undefined || element.visible === null
        ? true
        : !!element.visible;
    if (element.visible === undefined) element.visible = isVisible2;
    domElement.setAttribute("data-visible", isVisible2.toString());

    // Set visibility
    if (!element.visible) {
      domElement.style.opacity = "0.3";
    }

    // Add click handler
    domElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleElementClick(element, domElement);
    });

    return domElement;
  }

  /**
   * Get CSS classes for element
   * @param {Object} element - TLBB element
   * @returns {string} CSS classes
   */
  getElementClasses(element) {
    const classes = ["tlbb-element"];

    // Add type-specific class
    const typeClass = element.type.toLowerCase().replace(/_/g, "-");
    classes.push(typeClass);

    // Add state classes
    if (!element.visible) {
      classes.push("invisible");
    }

    if (this.displayMode === "wireframe") {
      classes.push("wireframe");
    }

    return classes.join(" ");
  }

  /**
   * Apply bounds to DOM element
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} bounds - Bounds object
   */
  applyBounds(domElement, bounds) {
    if (!bounds) return;

    // console.log('🎨 Applying bounds to element:', domElement.className, bounds);

    // Position
    if (bounds.x !== undefined) {
      domElement.style.left = bounds.x + "px";
    }
    if (bounds.y !== undefined) {
      domElement.style.top = bounds.y + "px";
    }

    // Size
    // Dùng visualWidth/visualHeight nếu tồn tại để đảm bảo element nhỏ vẫn thấy,
    // nhưng không thay đổi dữ liệu logic (bounds.width / bounds.height)
    if (bounds.visualWidth !== undefined) {
      domElement.style.width = bounds.visualWidth + "px";
    } else if (bounds.width !== undefined) {
      domElement.style.width = bounds.width + "px";
    }
    if (bounds.visualHeight !== undefined) {
      domElement.style.height = bounds.visualHeight + "px";
    } else if (bounds.height !== undefined) {
      domElement.style.height = bounds.height + "px";
    }

    // Make element positioned
    domElement.style.position = "absolute";
  }

  /**
   * Apply common properties to element
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} element - Element data
   */
  applyCommonProperties(domElement, element) {
    // Text content
    if (element.text) {
      domElement.textContent = element.text;
    }

    // Apply all image properties (Image, BackImage, NormalImage, etc.)
    this.applyImageProperties(domElement, element);

    // Background color
    if (element.properties && element.properties.BackgroundColour) {
      const color = this.parseColor(element.properties.BackgroundColour);
      if (color !== "transparent") {
        domElement.style.backgroundColor = color;
      }
    }

    // Text color
    if (
      element.properties &&
      (element.properties.TextColour || element.textColor)
    ) {
      const color = this.parseColor(
        element.properties.TextColour || element.textColor
      );
      domElement.style.color = color;
    }

    // Font
    if (element.font || (element.properties && element.properties.Font)) {
      domElement.style.font = element.font || element.properties.Font;
    }

    // Tooltip
    if (element.properties && element.properties.Tooltip) {
      domElement.title = element.properties.Tooltip;
    }

    // Alpha/Opacity
    if (element.properties && element.properties.Alpha) {
      const alpha = parseFloat(element.properties.Alpha);
      domElement.style.opacity = alpha / 255; // TLBB uses 0-255, CSS uses 0-1
    }

    // Z-order
    if (element.properties && element.properties.ZOrder) {
      domElement.style.zIndex = element.properties.ZOrder;
    }
  }

  /**
   * Apply text content and styling to element
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} element - Element data
   */
  applyText(domElement, element) {
    // Apply text content
    const textContent = this.getTextContent(element);
    if (textContent) {
      domElement.textContent = textContent;
    }

    // Apply text color
    if (element.properties && element.properties.TextColour) {
      const color = this.parseColor(element.properties.TextColour);
      if (color !== "transparent") {
        domElement.style.color = color;
      }
    }

    // Apply font
    if (element.properties && element.properties.Font) {
      domElement.style.fontFamily = element.properties.Font;
    }

    // Apply text alignment
    if (element.properties && element.properties.TextAlign) {
      const align = element.properties.TextAlign.toLowerCase();
      switch (align) {
        case "left":
          domElement.style.textAlign = "left";
          break;
        case "center":
        case "centre":
          domElement.style.textAlign = "center";
          break;
        case "right":
          domElement.style.textAlign = "right";
          break;
      }
    }

    // Apply vertical alignment
    if (element.properties && element.properties.VertAlign) {
      const align = element.properties.VertAlign.toLowerCase();
      domElement.style.display = "flex";
      switch (align) {
        case "top":
          domElement.style.alignItems = "flex-start";
          break;
        case "center":
        case "centre":
          domElement.style.alignItems = "center";
          break;
        case "bottom":
          domElement.style.alignItems = "flex-end";
          break;
      }
    }
  }

  /**
   * Get text content for element
   * @param {Object} element - Element data
   * @returns {string} Text content
   */
  getTextContent(element) {
    // Direct text property
    if (element.text) {
      return this.processTextString(element.text);
    }

    // Text from properties
    if (element.properties) {
      if (element.properties.Text) {
        return this.processTextString(element.properties.Text);
      }
      if (element.properties.Caption) {
        return this.processTextString(element.properties.Caption);
      }
    }

    return "";
  }

  /**
   * Process text string (handle localization keys)
   * @param {string} text - Raw text
   * @returns {string} Processed text
   */
  processTextString(text) {
    if (!text) return "";

    // Handle localization strings like #{INTERFACE_XML_XXXX}
    const localizationRegex = /#{([^}]+)}/g;
    return text.replace(localizationRegex, (match, key) => {
      // Try to get from string dictionary if available
      if (window.StringDictionary && window.StringDictionary.get) {
        const translated = window.StringDictionary.get(key);
        if (translated) {
          return translated;
        }
      }

      // Fallback to original key
      return key;
    });
  }

  /**
   * Apply all image properties to element (Image, BackImage, NormalImage, etc.)
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} element - Element data
   */
  applyImageProperties(domElement, element) {
    if (!element.properties) return;

    const imageProperties = [
      "Image", // Main image for static elements
      "BackImage", // Background image
      "NormalImage", // Normal state for buttons
      "HoverImage", // Hover state for buttons
      "PushedImage", // Pushed state for buttons
      "DisabledImage", // Disabled state for buttons
      "SelectedImage", // Selected state
      "TopImage", // Top image for frames
      "BottomImage", // Bottom image for frames
      "LeftImage", // Left image for frames
      "RightImage", // Right image for frames
      "MiddleImage", // Middle image for frames
      "CenterImage", // Center image for frames
      "TopFrameImage", // Top frame
      "BottomFrameImage", // Bottom frame
      "LeftFrameImage", // Left frame
      "RightFrameImage", // Right frame
      "BackgroundImage", // Background
    ];

    // Find the primary image property
    let primaryImageProp = null;
    let primaryImageValue = null;

    for (const prop of imageProperties) {
      if (element.properties[prop]) {
        primaryImageProp = prop;
        primaryImageValue = element.properties[prop];
        break;
      }
    }

    if (primaryImageValue) {
      console.log(`🎯 Applying ${primaryImageProp}:`, primaryImageValue);
      this.applyBackgroundImage(domElement, primaryImageValue);

      // Add data attribute to track image type
      domElement.setAttribute("data-image-type", primaryImageProp);
    } else {
      console.log("❌ No image properties found in element:", element.name);
    }

    // For button elements, store other image states as data attributes
    if (
      element.type === "TLBB_ActionButton" ||
      element.type === "TLBB_CheckButton"
    ) {
      const buttonStates = [
        "NormalImage",
        "HoverImage",
        "PushedImage",
        "DisabledImage",
      ];
      buttonStates.forEach((state) => {
        if (element.properties[state]) {
          domElement.setAttribute(
            `data-${state.toLowerCase()}`,
            element.properties[state]
          );
        }
      });
    }
  }

  renderTLBBImage(imageResult, container) {
    if (!imageResult) return;
      const img = new Image();
      img.src = imageResult.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1')

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = imageResult.imageInfo.width;
        canvas.height = imageResult.imageInfo.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          img,
          imageResult.imageInfo.xPos,
          imageResult.imageInfo.yPos,
          imageResult.imageInfo.width,
          imageResult.imageInfo.height,
          0,
          0,
          imageResult.imageInfo.width,
          imageResult.imageInfo.height
        );
        container.appendChild(canvas);
      };
   
  }
  applyBackgroundImage(domElement, imageData) {
    if (!imageData) return;

    let imagePath = "";

    // Handle string path
    if (typeof imageData === "string") {
      imagePath = imageData;
    }
    // Handle object with imageset property
    else if (typeof imageData === "object" && imageData.imageset) {
      imagePath = imageData.imageset;
    }
    // Handle object with src property
    else if (typeof imageData === "object" && imageData.src) {
      imagePath = imageData.src;
    }

    if (!imagePath) return;

    // Mark element as having imageset if it's TLBB format
    if (imagePath.includes("set:") && imagePath.includes("image:")) {
      domElement.classList.add("has-backimage");
      ``;
      domElement.setAttribute("data-has-imageset", "true");
    }

    // Parse TLBB image format: "set:SetName image:ImageName"
    const imageResult = this.parseTLBBImagePath(imagePath);
    this.renderTLBBImage(imageResult, domElement);

    // If imageResult is a string, it's a direct path (shouldn't happen with our new logic)
    // this.createSimplePlaceholder(domElement, imagePath);
  }

  /**
   * Create simple placeholder for missing images
   * @param {HTMLElement} domElement - DOM element
   * @param {string} imagePath - Original image path
   */
  createSimplePlaceholder(domElement, imagePath) {
    // Set visible placeholder background với màu sáng để dễ thấy
    domElement.style.setProperty("background-color", "#ff6b6b", "important");
    domElement.style.setProperty("border", "2px solid #fff", "important");
    domElement.style.setProperty("background-image", "none", "important");
    domElement.style.setProperty("min-width", "50px", "important");
    domElement.style.setProperty("min-height", "30px", "important");
    domElement.style.setProperty("display", "block", "important");

    // Add placeholder classes
    domElement.classList.add("placeholder", "missing-imageset");

    // Ensure element is marked as having imageset
    domElement.setAttribute("data-has-imageset", "true");

    // Add tooltip with imageset info
    const imageInfo = this.parseImagesetInfo(imagePath);
    domElement.title = `Missing imageset: ${imageInfo.setName} -> ${imageInfo.imageName}`;

    // Add text content to show what's missing
    if (!domElement.textContent || domElement.textContent.trim() === "") {
      domElement.textContent = `IMG: ${imageInfo.imageName || "MISSING"}`;
      domElement.style.setProperty("color", "#fff", "important");
      domElement.style.setProperty("font-size", "10px", "important");
      domElement.style.setProperty("text-align", "center", "important");
    }

    console.log("🔴 Created visible placeholder for:", imagePath);

    // Add visual indicator
    if (!domElement.querySelector(".missing-image-indicator")) {
      const indicator = document.createElement("div");
      indicator.className = "missing-image-indicator";
      indicator.style.cssText = `
                position: absolute;
                top: 2px;
                left: 2px;
                font-size: 8px;
                color: #ff6b6b;
                pointer-events: none;
                z-index: 1000;
                background: rgba(0,0,0,0.7);
                padding: 1px 3px;
                border-radius: 2px;
            `;
      indicator.textContent = "📷❌";
      domElement.style.position = "relative";
      domElement.appendChild(indicator);
    }

    console.log("Created placeholder for:", imagePath);
  }

  /**
   * Parse imageset info from path
   * @param {string} imagePath - Image path like "set:CommonWindow image:Btn_Close"
   * @returns {Object} Parsed info
   */
  parseImagesetInfo(imagePath) {
    const setMatch = imagePath.match(/set:([^\s]+)/);
    const imageMatch = imagePath.match(/image:([^\s]+)/);

    return {
      setName: setMatch ? setMatch[1] : "Unknown",
      imageName: imageMatch ? imageMatch[1] : "Unknown",
      fullPath: imagePath,
    };
  }

  /**
   * Parse TLBB image path format and apply via ImagesetLoader
   * @param {string} imagePath - Raw image path
   * @returns {string|Object} Processed image path or CSS properties
   */
  parseTLBBImagePath(imagePath) {
    if (!imagePath) return "";

    // Handle absolute paths
    if (imagePath.startsWith("http") || imagePath.startsWith("/")) {
      return imagePath;
    }

    // Handle TLBB format: "set:SetName image:ImageName"
    if (imagePath.includes("set:") && imagePath.includes("image:")) {
      // Use ImagesetLoader to get proper CSS properties
      if (window.ImagesetLoader) {
        const imageCSS = window.ImagesetLoader.getImageCSS(imagePath);
        if (imageCSS) {
          return imageCSS;
        }
        // Return null instead of fallback to prevent 404 errors
        return null;
      } else {
        return null;
      }
    }

    // For non-imageset paths, still return null to avoid 404s
    // console.warn('Non-imageset path detected, returning null:', imagePath);
    return null;
  }

  /**
   * Create text overlay for element
   * @param {Object} element - Element data
   * @param {HTMLElement} parentElement - Parent DOM element
   * @returns {HTMLElement} Text overlay element
   */
  createTextOverlay(element, parentElement) {
    const textContent = this.getTextContent(element);
    if (!textContent) return null;

    const overlay = document.createElement("div");
    overlay.className = "tlbb-text-overlay";
    overlay.textContent = textContent;

    // Position overlay
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.pointerEvents = "none"; // Allow clicks to pass through
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1";

    // Apply text styling
    this.applyTextStyling(overlay, element);

    // Append to parent
    if (parentElement) {
      parentElement.appendChild(overlay);
    }

    return overlay;
  }

  /**
   * Apply text styling to element
   * @param {HTMLElement} element - DOM element
   * @param {Object} data - Element data
   */
  applyTextStyling(element, data) {
    // Text color
    if (data.properties && data.properties.TextColour) {
      const color = this.parseColor(data.properties.TextColour);
      if (color !== "transparent") {
        element.style.color = color;
      }
    }

    // Font
    if (data.properties && data.properties.Font) {
      element.style.fontFamily = data.properties.Font;
    }

    // Font size
    if (data.properties && data.properties.FontSize) {
      element.style.fontSize = data.properties.FontSize + "px";
    }

    // Text alignment
    if (data.properties && data.properties.TextAlign) {
      const align = data.properties.TextAlign.toLowerCase();
      switch (align) {
        case "left":
          element.style.textAlign = "left";
          element.style.justifyContent = "flex-start";
          break;
        case "center":
        case "centre":
          element.style.textAlign = "center";
          element.style.justifyContent = "center";
          break;
        case "right":
          element.style.textAlign = "right";
          element.style.justifyContent = "flex-end";
          break;
      }
    }

    // Vertical alignment
    if (data.properties && data.properties.VertAlign) {
      const align = data.properties.VertAlign.toLowerCase();
      switch (align) {
        case "top":
          element.style.alignItems = "flex-start";
          break;
        case "center":
        case "centre":
          element.style.alignItems = "center";
          break;
        case "bottom":
          element.style.alignItems = "flex-end";
          break;
      }
    }

    // Text effects
    if (data.properties && data.properties.Bold) {
      element.style.fontWeight = "bold";
    }

    if (data.properties && data.properties.Italic) {
      element.style.fontStyle = "italic";
    }

    if (data.properties && data.properties.Underline) {
      element.style.textDecoration = "underline";
    }
  }

  /**
   * Parse color string to CSS color
   * @param {string} colorStr - Color string (ARGB format)
   * @returns {string} CSS color
   */
  parseColor(colorStr) {
    if (!colorStr) return "transparent";

    // Handle hex colors (ARGB format: AARRGGBB)
    if (colorStr.startsWith("#") || /^[0-9A-Fa-f]{8}$/.test(colorStr)) {
      let hex = colorStr.replace("#", "");

      if (hex.length === 8) {
        // ARGB format
        const a = parseInt(hex.substr(0, 2), 16) / 255;
        const r = parseInt(hex.substr(2, 2), 16);
        const g = parseInt(hex.substr(4, 2), 16);
        const b = parseInt(hex.substr(6, 2), 16);

        if (a < 1) {
          return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
        } else {
          return `rgb(${r}, ${g}, ${b})`;
        }
      } else if (hex.length === 6) {
        // RGB format
        return `#${hex}`;
      }
    }

    // Handle named colors
    const namedColors = {
      white: "#ffffff",
      black: "#000000",
      red: "#ff0000",
      green: "#00ff00",
      blue: "#0000ff",
      yellow: "#ffff00",
      cyan: "#00ffff",
      magenta: "#ff00ff",
      gray: "#808080",
      grey: "#808080",
    };

    const lowerColor = colorStr.toLowerCase();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }

    // Return as-is for other formats
    return colorStr;
  }

  /**
   * Handle element click
   * @param {Object} element - Element data
   * @param {HTMLElement} domElement - DOM element
   */
  handleElementClick(element, domElement) {
    this.emit("elementClick", { element, domElement });
  }

  /**
   * Handle element hover
   * @param {Object} element - Element data
   * @param {HTMLElement} domElement - DOM element
   * @param {boolean} isHovering - Is hovering
   */
  handleElementHover(element, domElement, isHovering) {
    if (isHovering) {
      domElement.classList.add("hover");
    } else {
      domElement.classList.remove("hover");
    }

    this.emit("elementHover", { element, domElement, isHovering });
  }

  /**
   * Update element in DOM
   * @param {Object} element - Element data
   * @param {HTMLElement} domElement - DOM element
   */
  updateElement(element, domElement) {
    // Update attributes
    domElement.setAttribute("data-visible", element.visible.toString());

    // Update visibility
    if (!element.visible) {
      domElement.style.opacity = "0.3";
    } else {
      domElement.style.opacity = "";
    }

    // Update text if changed
    if (element.text && domElement.textContent !== element.text) {
      domElement.textContent = element.text;
    }

    this.emit("elementUpdate", { element, domElement });
  }

  /**
   * Remove element from DOM
   * @param {HTMLElement} domElement - DOM element
   */
  removeElement(domElement) {
    if (domElement && domElement.parentNode) {
      domElement.parentNode.removeChild(domElement);
    }

    this.emit("elementRemove", { domElement });
  }

  /**
   * Refresh all rendered elements
   */
  refreshAllElements() {
    this.renderedElements.forEach((domElement, element) => {
      this.updateElement(element, domElement);
    });
  }

  /**
   * Get renderer statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      renderedElements: this.renderedElements.size,
      displayMode: this.displayMode,
    };
  }

  /**
   * Clear all rendered elements
   */
  clear() {
    this.renderedElements.forEach((domElement) => {
      this.removeElement(domElement);
    });
    this.renderedElements.clear();
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
      this.eventCallbacks.get(event).forEach((callback) => {
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
window.BaseRenderer = BaseRenderer;
