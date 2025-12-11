/**
 * Button Renderer Module for TLBB GUI Renderer
 * Handles rendering of button-type elements
 */

class ButtonRenderer extends BaseRenderer {
  constructor() {
    // console.log('ButtonRenderer constructor called');
    // console.log('BaseRenderer before super():', typeof BaseRenderer);

    super();

    // console.log('After super() call');
    // console.log('this.createElement after super():', this.createElement);
    // console.log('this instance:', this);
    // console.log('this prototype:', Object.getPrototypeOf(this));

    // Manual check and assignment if inheritance failed
    if (
      !this.createElement &&
      window.BaseRenderer &&
      window.BaseRenderer.prototype.createElement
    ) {
      console.warn(
        "Inheritance failed, manually assigning methods from BaseRenderer"
      );
      const baseProto = window.BaseRenderer.prototype;
      for (let prop of Object.getOwnPropertyNames(baseProto)) {
        if (typeof baseProto[prop] === "function" && prop !== "constructor") {
          this[prop] = baseProto[prop].bind(this);
        }
      }
    }

    this.buttonTypes = {
      TLBB_ButtonNULL: this.renderButtonNull.bind(this),
      TLBB_ButtonCheck: this.renderButtonCheck.bind(this),
      TLBB_ButtonCheckNULL: this.renderButtonCheckNull.bind(this),
      TLBB_ButtonCheckForChatPage: this.renderButtonCheckForChat.bind(this),
      TLBB_ButtonClose: this.renderButtonClose.bind(this),
      TLBB_ButtonHelp: this.renderButtonHelp.bind(this),
      TLBB_ButtonCommon: this.renderButtonCommon.bind(this),
      TLBB_ButtonTurnLeft: this.renderButtonTurnLeft.bind(this),
      TLBB_ButtonTurnRight: this.renderButtonTurnRight.bind(this),
      TLBB_ActionButton: this.renderActionButton.bind(this),
    };

    this.buttonStates = new Map(); // Track button states

    // console.log('ButtonRenderer constructor finished');
  }

  /**
   * Render button element
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButton(element, bounds, level = 0) {
    // console.log('renderButton called with type:', element.type);
    // console.log('Available button types:', Object.keys(this.buttonTypes));

    const renderer =
      this.buttonTypes[element.type] || this.buttonTypes["TLBB_ButtonNULL"];
    // console.log('Selected renderer:', renderer);
    // console.log('this in renderButton:', this);

    if (!renderer) {
      // console.error('No renderer found for button type:', element.type);
      return this.renderButtonNull(element, bounds, (level = 0));
    }

    return renderer.call(this, element, bounds);
  }

  /**
   * Render basic button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonNull(element, bounds, level = 0) {
    const domElement = this.createElement(element, bounds, level);
    // Apply text
    this.applyText(domElement, element);
    // Add button interactions
    let imgdefault = element.disabledImage || element.normalImage;
    this.applyBackgroundImage(domElement, imgdefault);
    // Add text overlay
    const overlay = this.createTextOverlay(element, domElement);
    if (overlay) {
      domElement.appendChild(overlay);
    }

    return domElement;
  }

  /**
   * Render checkbox button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonCheck(element, bounds, level = 0) {
    const domElement = this.createElement(element, bounds, level);

    // Checkbox button styling
    domElement.style.background =
      "linear-gradient(135deg, #e2a44a 0%, #bd9135 100%)";
    domElement.style.border = "1px solid #8a6d2c";
    domElement.style.borderRadius = "4px";
    domElement.style.color = "white";
    domElement.style.fontWeight = "600";
    domElement.style.cursor = "pointer";
    domElement.style.display = "flex";
    domElement.style.alignItems = "center";
    domElement.style.justifyContent = "center";
    domElement.style.position = "relative";

    // Apply text
    this.applyText(domElement, element);

    // Add checkbox state
    this.addCheckboxState(domElement, element);

    // Add checkbox interactions
    this.addCheckboxInteractions(domElement, element);

    // Add text overlay
    const overlay = this.createTextOverlay(element, domElement);
    if (overlay) {
      domElement.appendChild(overlay);
    }

    return domElement;
  }

  /**
   * Render checkbox null button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonCheckNull(element, bounds, level = 0) {
    const domElement = this.renderButtonCheck(element, bounds, (level = 0));

    // Different styling for null variant
    domElement.style.background =
      "linear-gradient(135deg, #7a7a7a 0%, #6a6a6a 100%)";
    domElement.style.border = "1px solid #5a5a5a";

    return domElement;
  }

  /**
   * Render chat page checkbox button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonCheckForChat(element, bounds, level = 0) {
    const domElement = this.renderButtonCheck(element, bounds, (level = 0));

    // Chat-specific styling
    domElement.style.background =
      "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)";
    domElement.style.border = "1px solid #2c5d8a";
    domElement.style.fontSize = "11px";

    return domElement;
  }

  /**
   * Render close button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonClose(element, bounds, level = 0) {
    const domElement = this.createElement(element, bounds, level);

    // Close button styling
    domElement.style.background =
      "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)";
    domElement.style.border = "1px solid #a93226";
    domElement.style.borderRadius = "2px";
    domElement.style.color = "white";
    domElement.style.fontWeight = "bold";
    domElement.style.cursor = "pointer";
    domElement.style.display = "flex";
    domElement.style.alignItems = "center";
    domElement.style.justifyContent = "center";
    domElement.style.fontSize = "10px";

    // Add X symbol
    domElement.textContent = "×";

    // Add button interactions
    this.addButtonInteractions(domElement, element);

    // Add text overlay
    const overlay = this.createTextOverlay(element, domElement);
    if (overlay) {
      domElement.appendChild(overlay);
    }

    return domElement;
  }

  /**
   * Render help button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonHelp(element, bounds, level = 0) {
    const domElement = this.createElement(element, bounds, level);

    // Help button styling
    domElement.style.background =
      "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)";
    domElement.style.border = "1px solid #d68910";
    domElement.style.borderRadius = "2px";
    domElement.style.color = "white";
    domElement.style.fontWeight = "bold";
    domElement.style.cursor = "pointer";
    domElement.style.display = "flex";
    domElement.style.alignItems = "center";
    domElement.style.justifyContent = "center";
    domElement.style.fontSize = "10px";

    // Add ? symbol
    domElement.textContent = "?";

    // Add button interactions
    this.addButtonInteractions(domElement, element);

    // Add text overlay
    const overlay = this.createTextOverlay(element, domElement);
    if (overlay) {
      domElement.appendChild(overlay);
    }

    return domElement;
  }

  /**
   * Render common button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonCommon(element, bounds, level = 0) {
    const domElement = this.createElement(element, bounds, level);

    // Common button styling
    domElement.style.background =
      "linear-gradient(135deg, #27ae60 0%, #229954 100%)";
    domElement.style.border = "1px solid #1e8449";
    domElement.style.borderRadius = "4px";
    domElement.style.color = "white";
    domElement.style.fontWeight = "600";
    domElement.style.cursor = "pointer";
    domElement.style.display = "flex";
    domElement.style.alignItems = "center";
    domElement.style.justifyContent = "center";

    // Apply text
    this.applyText(domElement, element);

    // Add button interactions
    this.addButtonInteractions(domElement, element);

    // Add text overlay
    const overlay = this.createTextOverlay(element, domElement);
    if (overlay) {
      domElement.appendChild(overlay);
    }

    return domElement;
  }

  /**
   * Render turn left button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonTurnLeft(element, bounds, level = 0) {
    const domElement = this.renderButtonCommon(element, bounds, (level = 0));

    // Add left arrow
    domElement.textContent = "◀";
    domElement.style.fontSize = "12px";

    return domElement;
  }

  /**
   * Render turn right button
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderButtonTurnRight(element, bounds, level = 0) {
    const domElement = this.renderButtonCommon(element, bounds, (level = 0));

    // Add right arrow
    domElement.textContent = "▶";
    domElement.style.fontSize = "12px";

    return domElement;
  }

  /**
   * Render action button (for items/skills)
   * @param {Object} element - TLBB element
   * @param {Object} bounds - Element bounds
   * @returns {HTMLElement} Rendered DOM element
   */
  renderActionButton(element, bounds, level = 0) {
    const domElement = this.createElement(element, bounds, level);

    // Action button styling
    domElement.style.background =
      "linear-gradient(135deg, #34495e 0%, #2c3e50 100%)";
    domElement.style.border = "2px solid #7f8c8d";
    domElement.style.borderRadius = "4px";
    domElement.style.cursor = "pointer";
    domElement.style.position = "relative";
    domElement.style.transition = "all 0.2s";

    // Check if empty
    const isEmpty = element.properties && element.properties.Empty === "True";
    if (isEmpty) {
      domElement.style.background = "rgba(255, 255, 255, 0.1)";
      domElement.style.borderStyle = "dashed";
      domElement.classList.add("empty");
    }
    // Add drag and drop support
    this.addDragDropSupport(domElement, element);

    // Add button interactions
    this.addButtonInteractions(domElement, element);

    // Add text overlay
    const overlay = this.createTextOverlay(element, domElement);
    if (overlay) {
      domElement.appendChild(overlay);
    }

    return domElement;
  }

  /**
   * Add checkbox state indicator
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} element - TLBB element
   */
  addCheckboxState(domElement, element) {
    const isChecked =
      element.selected || element.properties.Selected === "True";

    if (isChecked) {
      const checkmark = document.createElement("div");
      checkmark.style.position = "absolute";
      checkmark.style.right = "4px";
      checkmark.style.top = "2px";
      checkmark.style.color = "#4caf50";
      checkmark.style.fontWeight = "bold";
      checkmark.style.fontSize = "12px";
      checkmark.style.pointerEvents = "none";
      checkmark.textContent = "✓";

      domElement.appendChild(checkmark);
      domElement.classList.add("checked");
    }

    // Store checkbox state
    this.buttonStates.set(domElement, {
      type: "checkbox",
      checked: isChecked,
      checkMode: element.checkMode || "0",
    });
  }

  /**
   * Add button interactions
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} element - TLBB element
   */
  addButtonInteractions(domElement, element) {
    this.applyBackgroundImage(domElement, element.backImage);
  }

  /**
   * Add checkbox interactions
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} element - TLBB element
   */
  addCheckboxInteractions(domElement, element) {
    this.addButtonInteractions(domElement, element);

    // Toggle checkbox state on click
    domElement.addEventListener("click", () => {
      const state = this.buttonStates.get(domElement);
      if (state && state.type === "checkbox") {
        state.checked = !state.checked;

        // Update visual state
        const existingCheck = domElement.querySelector("div");
        if (state.checked && !existingCheck) {
          this.addCheckboxState(domElement, { ...element, selected: true });
        } else if (!state.checked && existingCheck) {
          existingCheck.remove();
          domElement.classList.remove("checked");
        }

        this.emit("checkboxToggled", { element, checked: state.checked });
      }
    });
  }

  /**
   * Add drag and drop support
   * @param {HTMLElement} domElement - DOM element
   * @param {Object} element - TLBB element
   */
  addDragDropSupport(domElement, element) {
    if (element.draggingEnabled) {
      domElement.draggable = true;

      domElement.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", element.name);
        domElement.style.opacity = "0.5";
        this.emit("dragStart", { element, event: e });
      });

      domElement.addEventListener("dragend", () => {
        domElement.style.opacity = "";
        this.emit("dragEnd", { element });
      });
    }

    if (element.dragAcceptName) {
      domElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        domElement.style.borderColor = "#3498db";
      });

      domElement.addEventListener("dragleave", () => {
        domElement.style.borderColor = "";
      });

      domElement.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedName = e.dataTransfer.getData("text/plain");
        domElement.style.borderColor = "";
        this.emit("drop", { element, draggedName, event: e });
      });
    }
  }

  /**
   * Check if element type is a button
   * @param {string} type - Element type
   * @returns {boolean} True if button type
   */
  isButtonType(type) {
    return type.includes("Button") || type === "TLBB_ActionButton";
  }

  /**
   * Get button state
   * @param {HTMLElement} domElement - DOM element
   * @returns {Object} Button state
   */
  getButtonState(domElement) {
    return this.buttonStates.get(domElement) || null;
  }

  /**
   * Set button enabled/disabled state
   * @param {HTMLElement} domElement - DOM element
   * @param {boolean} enabled - Enabled state
   */
  setButtonEnabled(domElement, enabled) {
    if (enabled) {
      domElement.style.opacity = "";
      domElement.style.pointerEvents = "";
    } else {
      domElement.style.opacity = "0.5";
      domElement.style.pointerEvents = "none";

      const disabledImage = domElement.getAttribute("data-disabled-image");
      if (disabledImage) {
        this.applyBackgroundImage(domElement, disabledImage);
      }
    }
  }
}

// Export for use in other modules
window.ButtonRenderer = ButtonRenderer;
