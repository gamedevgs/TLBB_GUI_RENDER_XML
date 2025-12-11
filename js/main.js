/**
 * Main Application Module for TLBB GUI Renderer
 * Updated to follow XML_RENDERING_IMPLEMENTATION.md guidelines
 */

// CONFIG constants for standardized values

class TLBBGUIRenderer {
  // Helper: render a property group
  analyzeUnifiedValue(value) {
    if (typeof value !== "string") {
      return { valid: false, reason: "Not a string" };
    }

    const trimmed = value.trim();

    // Pattern chuẩn
    const regex =
      /^\{\{\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\},\s*\{\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\}\}$/;

    if (regex.test(trimmed)) {
      return { valid: true, reason: "OK" };
    }

    // Đếm số lượng dấu mở và đóng
    const openCount = (trimmed.match(/\{/g) || []).length;
    const closeCount = (trimmed.match(/\}/g) || []).length;

    if (openCount !== closeCount) {
      return {
        valid: false,
        reason: `Lỗi dấu ngoặc: {=${openCount}, }=${closeCount}`,
      };
    }

    return { valid: false, reason: "normal" };
  }

  checkInvalidProperty(name, value) {
    const keysToCheck = [
      "AbsolutePosition",
      "AbsoluteSize",
      "Size",
      "UnifiedPosition",
      "UnifiedSize",
    ];

    if (!keysToCheck.includes(name)) {
      return { name, value, valid: true, reason: "skip" }; // không cần kiểm tra
    }

    const analysis = this.analyzeUnifiedValue(value);

    return analysis.valid
      ? { name, value, valid: true, reason: "normal" } // hợp lệ
      : { name, value, valid: false, reason: analysis.reason }; // không hợp lệ
  }
  _renderPropertyGroup(properties) {
    let loginfo = "";
    const itemsHTML = properties
      .map(([name, value]) => {
        const type = this.getPropertyValueType(name, value);
        const warn = this.checkInvalidProperty(name, value);
        const hasWarn =
          warn && !warn.valid && !["normal", "skip"].includes(warn.reason);
        const warning = hasWarn ? `❌ ${warn.reason}` : "";
        const clsborder = hasWarn ? "red" : "#8cffb1";
        loginfo += `\n${name}: ${value}`;
        const inputType =
          type === "boolean"
            ? "checkbox"
            : type === "number"
            ? "number"
            : "text";
        const inputVal =
          type === "boolean"
            ? value === "True" || value === true
              ? "checked"
              : ""
            : `value="${value}"`;
        const imagets_name = value.replace(/set:(.*)( .*)/gm, "$1");
        const Iname = value.replace(/set:(.*)(image:)(.*)/gm, `$3`);
        const strdic =
          type === "text"
            ? `<span>StrDic: ${window.stringDictionary.resolveTextValue(
                value
              )}</span>`
            : "";

        return `
      <div class="property-item">
        <div class="property-name" data-type="${type}">${name}</div>
        <span class="property-value">Value: ${value}</span><br/>
        <span class="property-warning">${warning}</span><br/>
        <div style="display:flex;margin-bottom:6px;gap:2px;">
          <button type="button" class="view-imageset-btn" data-imagesets="${imagets_name}" data-name="${Iname}" title="Preview imageset" style="cursor: pointer;display:${
          type == "image" ? "block" : "none"
        }">👁</button>
          <input type="${inputType}" ${inputVal}
            class="property-value ${type}" style="width: 100%;border:1px solid ${clsborder}"
            data-prop-name="${name}">
        </div>
        ${strdic}
      </div>`;
      })
      .join("");

    this.log("Thuộc tính hiện có:\n" + loginfo, "success");
    const group = document.createElement("div");
    group.className = "property-group";
    group.innerHTML = `<div class="property-group-header">Thuộc tính</div>
                     <div class="property-group-content">${itemsHTML}</div>`;
    group.querySelectorAll(".view-imageset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const imageset = btn.dataset.imagesets;
        const name = btn.dataset.name;
        window.filterImageSets = name || "";
        this._openImagesetPreviewFromStatus(imageset);
      });
    });
    return group;
  }

  // Helper: render panel header
  _renderPanelHeader(element) {
    document.querySelector(".no-selection").style.display = "none";
    const infoDiv = document.createElement("div");
    infoDiv.className = "element-info";
    infoDiv.innerHTML = `<div class="element-name">${element.name}</div>
      <div class="element-type">${element.type}</div>
      <div class="element-bounds">${this.formatElementBounds(element)}</div>`;
    return infoDiv;
  }

  // Helper: setup auto-save for property inputs
  _setupAutoSave(panel, element) {
    if (!panel || !element) return;

    // Clear any existing auto-save timers
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }

    // Query all inputs that can trigger auto-save
    const inputs = panel.querySelectorAll(
      ".property-value, input[type='checkbox'][data-prop-name]"
    );

    console.log(`🔧 Setting up auto-save for ${inputs.length} inputs...`);

    // Store initial values to track real changes
    const initialValues = new Map();
    inputs.forEach((input) => {
      const propName = input.dataset.propName;
      if (propName) {
        let value;
        if (input.type === "checkbox") {
          value = input.checked ? "True" : "False";
        } else {
          value = (input.value || "").trim();
        }
        initialValues.set(propName, value);
      }
    });

    // Auto-save function with debounce
    const performAutoSave = () => {
      try {
        let changed = false;
        let changes = [];

        console.log(
          `🔍 Auto-save: Checking ${inputs.length} inputs for changes...`
        );

        // Collect all changes first (simplified - no sub-property processing)

        inputs.forEach((input) => {
          const propName = input.dataset.propName;

          // Skip if no property name or input value is undefined
          if (!propName || input.value === undefined) {
            return;
          }

          let newValue;
          if (input.type === "checkbox") {
            newValue = input.checked ? "True" : "False";
          } else {
            newValue = (input.value || "").trim();
          }

          // Simplified: handle all properties as regular properties (no sub-property parsing)
          // Skip empty values unless it's a valid empty state
          if (
            newValue === "" &&
            element.properties &&
            element.properties[propName] !== ""
          ) {
            return; // Don't update to empty
          }

          // Check if property exists and value has changed
          if (
            element.properties &&
            element.properties.hasOwnProperty(propName) &&
            element.properties[propName] != newValue
          ) {
            changes.push({
              prop: propName,
              old: element.properties[propName],
              new: newValue,
            });
            changed = true;
            console.log(
              `📝 Auto-save property change: ${propName} = ${newValue} (was: ${element.properties[propName]})`
            );
          } else {
            console.log(
              `⏭️ Auto-save property unchanged: ${propName} = ${newValue}`
            );
          }
        });

        // Simplified: No sub-property processing needed since we use single inputs

        if (changed) {
          console.log(
            `🔍 Auto-save detected ${changes.length} actual changes:`,
            changes.map((c) => `${c.prop}: "${c.old}" → "${c.new}"`)
          );

          // Show loading indicator only when there are actual changes
          this._showLoadingIndicator();

          // Ensure element has properties object
          if (!element.properties) {
            element.properties = {};
          }

          // Apply changes
          changes.forEach((change) => {
            element.properties[change.prop] = change.new;
          });

          // Mark element as having dirty transform
          element._dirtyTransform = true;

          console.log(
            `🔄 Auto-save: Properties changed for ${element.name}, updating layout and re-rendering...`
          );
          console.log(
            `📋 Auto-save changes:`,
            changes.map((c) => `${c.prop}: ${c.old} → ${c.new}`)
          );

          // Check if position/size properties were changed that would affect layout
          const layoutAffectingProps = [
            "UnifiedPosition",
            "UnifiedSize",
            "AbsolutePosition",
            "AbsoluteSize",
          ];
          const hasLayoutChanges = changes.some((change) =>
            layoutAffectingProps.includes(change.prop)
          );

          if (hasLayoutChanges) {
            console.log(
              `📐 Auto-save: Layout-affecting properties changed, applying to bounds...`
            );
            // Parse and apply new position/size values to bounds
            this._applyPropertiesToBounds(element);
          }

          // Always recompute layout and re-render when properties change
          if (this.layoutCalculator) {
            console.log(`♻️ Auto-save: Recomputing layout for all elements...`);
            this.layoutCalculator.compute(this.currentElements);
          }

          // Force re-render to show visual changes
          if (
            typeof this.renderElements === "function" &&
            this.currentElements
          ) {
            console.log(
              `🎨 Auto-save: Re-rendering GUI to reflect property changes...`
            );
            this.renderElements(this.currentElements);
          }

          // Show success message
          console.log(
            `✅ Auto-saved ${changes.length} property changes for ${element.name}`
          );
          window.__tlbbShowToast &&
            window.__tlbbShowToast(
              `✅ Tự động lưu ${changes.length} thay đổi`,
              1500
            );

          // Record history for undo
          if (typeof this._recordHistory === "function") {
            const b =
              element.bounds ||
              element.boundsOriginal ||
              element._initialBounds ||
              {};
            this._recordHistory("auto-save-properties", element, {
              changes,
              name: element.name,
              path: element.path,
              ts: Date.now(),
              x: b.x || 0,
              y: b.y || 0,
              w: b.width || 0,
              h: b.height || 0,
            });
          }

          // Persist current XML to reflect property changes
          try {
            this.persistCurrentXML();
            console.log(`✅ Auto-save: XML updated for ${element.name}`);
          } catch (e) {
            console.warn("Auto-save: Failed to persist XML:", e);
          }

          // Update input values to reflect computed changes (avoid infinite loop)
          if (this.selectedElement === element) {
            console.log(
              `🔄 Auto-save: Updating input values for ${element.name}`
            );
            this._updatePropertyInputValues(element);
          }

          // Hide loading indicator after successful save
          this._hideLoadingIndicator();
        } else {
          console.log(
            `ℹ️ Auto-save: No changes detected for ${element.name} - skipping save and render`
          );
        }
      } catch (error) {
        console.error("Auto-save error:", error);
        window.__tlbbShowToast &&
          window.__tlbbShowToast("❌ Lỗi tự động lưu!", 2000);

        // Hide loading indicator on error (if it was shown)
        this._hideLoadingIndicator();
      }
    };

    // Debounced auto-save function with quick pre-check
    const debouncedAutoSave = () => {
      if (this._autoSaveTimer) {
        clearTimeout(this._autoSaveTimer);
      }

      // Quick pre-check: see if any input value actually changed from initial
      let hasQuickChange = false;
      inputs.forEach((input) => {
        const propName = input.dataset.propName;
        if (propName) {
          let currentValue;
          if (input.type === "checkbox") {
            currentValue = input.checked ? "True" : "False";
          } else {
            currentValue = (input.value || "").trim();
          }

          const initialValue = initialValues.get(propName) || "";
          if (currentValue !== initialValue) {
            hasQuickChange = true;
          }
        }
      });

      if (!hasQuickChange) {
        console.log(
          `⏭️ Auto-save pre-check: No input changes detected, skipping timer`
        );
        return;
      }

      this._autoSaveTimer = setTimeout(() => {
        performAutoSave();

        // Update initial values after successful save
        inputs.forEach((input) => {
          const propName = input.dataset.propName;
          if (propName) {
            let value;
            if (input.type === "checkbox") {
              value = input.checked ? "True" : "False";
            } else {
              value = (input.value || "").trim();
            }
            initialValues.set(propName, value);
          }
        });
      }, 1000); // 1 second delay
    };

    // Attach event listeners to all inputs
    inputs.forEach((input) => {
      // Remove existing listeners
      input.removeEventListener("input", debouncedAutoSave);
      input.removeEventListener("change", debouncedAutoSave);

      // Add new listeners
      if (input.type === "checkbox") {
        input.addEventListener("change", debouncedAutoSave);
      } else {
        input.addEventListener("input", debouncedAutoSave);
        input.addEventListener("change", debouncedAutoSave);
      }

      console.log(
        `🎯 Auto-save listener attached to ${
          input.dataset.propName || "unnamed"
        } (${input.type})`
      );
    });

    console.log(`✅ Auto-save setup complete for ${element.name}`);
  }

  // Helper: show loading indicator
  _showLoadingIndicator() {
    // Remove existing indicator if any
    this._hideLoadingIndicator();

    // Create loading overlay
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "property-loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang cập nhật giao diện...</div>
      </div>
    `;

    // Add CSS styles
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(2px);
    `;

    const loadingContent = loadingOverlay.querySelector(".loading-content");
    loadingContent.style.cssText = `
      background: #2d3142;
      padding: 20px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      text-align: center;
      color: #e0e6ef;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const spinner = loadingOverlay.querySelector(".loading-spinner");
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 3px solid #444;
      border-top: 3px solid #007acc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px auto;
    `;

    const loadingText = loadingOverlay.querySelector(".loading-text");
    loadingText.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #b8c5d6;
    `;

    // Add CSS animation if not exists
    if (!document.querySelector("#loading-spinner-animation")) {
      const style = document.createElement("style");
      style.id = "loading-spinner-animation";
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(loadingOverlay);
    console.log("🔄 Loading indicator shown");
  }

  // Helper: hide loading indicator
  _hideLoadingIndicator() {
    const existingOverlay = document.getElementById("property-loading-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
      console.log("✅ Loading indicator hidden");
    }
  }

  /**
   * Update property input values without rebuilding the entire panel
   * This prevents infinite loops when auto-save updates properties
   * @param {Object} element - Element with updated properties
   */
  _updatePropertyInputValues(element) {
    if (!element || !element.properties) return;

    const panel = this.elements.propertyPanel;
    if (!panel) return;

    // Find all property inputs in the panel
    const inputs = panel.querySelectorAll(
      '.property-value, input[type="checkbox"][data-prop-name]'
    );

    console.log(
      `🔄 Updating ${inputs.length} property input values for ${element.name}`
    );

    inputs.forEach((input) => {
      const propName = input.dataset.propName;
      if (!propName || !element.properties.hasOwnProperty(propName)) return;

      const newValue = element.properties[propName];

      if (input.type === "checkbox") {
        // Handle boolean properties
        const shouldCheck = newValue === "True" || newValue === true;
        if (input.checked !== shouldCheck) {
          input.checked = shouldCheck;
          console.log(`✅ Updated checkbox ${propName}: ${shouldCheck}`);
        }
      } else {
        // Handle text/number properties
        const currentValue = (input.value || "").trim();
        const targetValue = String(newValue || "").trim();

        if (currentValue !== targetValue) {
          input.value = targetValue;
          console.log(
            `✅ Updated input ${propName}: "${currentValue}" → "${targetValue}"`
          );
        }
      }
    });

    console.log(`✅ Property input values updated for ${element.name}`);
  }

  constructor() {
    // Khởi tạo các class sử dụng window.TenClass cho ngắn gọn
    this.xmlParser = window.XMLParser ? new XMLParser() : null;
    this.propertyParser = window.PropertyParser ? new PropertyParser() : null;
    this.positionCalculator = window.PositionCalculator
      ? new PositionCalculator()
      : null;
    this.layoutCalculator = window.TLBBLayoutCalculator
      ? new TLBBLayoutCalculator({ debug: true })
      : null;
    this.windowRenderer = window.WindowRenderer ? new WindowRenderer() : null;
    this.buttonRenderer = window.ButtonRenderer ? new ButtonRenderer() : null;
    this.textRenderer = window.TextRenderer ? new TextRenderer() : null;
    this.frameRenderer = window.FrameRenderer ? new FrameRenderer() : null;
    this.propertyPanel = window.PropertyPanel ? new PropertyPanel() : null;
    this.xmlTree = window.XMLTree ? new XMLTree() : null;
    this.canvasControls = window.CanvasControls ? new CanvasControls() : null;
    this.zoomManager = window.ZoomManager ? new ZoomManager() : null;
    
    // Initialize GUI Renderer with hierarchical support
    this.guiRenderer = window.GUIRenderer ? new GUIRenderer() : null;
    this.currentElements = [];
    this.currentTree = [];
    this.selectedElement = null;
    this.zoomLevel = 1.0;
    this.displayMode = "element";
    this.currentScale = 1.0;
    this.currentXMLRaw = null;
    this.realImagesEnabled = false; // State for real images toggle
    this.eventCallbacks = new Map();
    this.init();
    this.displayMode = "text";
    this.history = [];
    this._historyMax = 200;
    this._historyKey = "TLBB_TRANSFORM_HISTORY";
    this._loadHistoryFromStorage();
    this._ensureHistoryPanel();
  }
  async init() {
    console.log("Initializing TLBB GUI Renderer...");

    // Check if required modules are available
    this.checkModuleAvailability();

    // Initialize ImagesetLoader
    await this.initializeImagesetLoader();

    // Initialize UI modules
    this.setupDOM();
    this.setupEventListeners();
    this.setupRenderers();
    this.log("TLBB GUI Renderer initialized", "info");
  }
  async initializeImagesetLoader() {
    try {
      //   console.log("Initializing ImagesetLoader...");

      if (window.ImagesetLoader) {
        // Set base path for loading assets - point to current directory, assets are in parent dirs
        window.ImagesetLoader.setBasePath("./");

        // Setup status panel early so on-demand loads can report status
        this._ensureImagesetStatusPanel();
        // Subscribe to events
        window.ImagesetLoader.on("imageset:start", (e) =>
          this._updateImagesetStatus(e)
        );
        window.ImagesetLoader.on("imageset:loaded", (e) =>
          this._updateImagesetStatus(e)
        );
        window.ImagesetLoader.on("imageset:error", (e) =>
          this._updateImagesetStatus(e)
        );

        console.log("ImagesetLoader initialized successfully");
      } else {
        console.warn("ImagesetLoader not available");
      }
    } catch (error) {
      console.error("Failed to initialize ImagesetLoader:", error);
    }
  }
  buildTypePropertyMap(elements) {
    const map = {};
    elements.forEach((el) => {
      if (!el.type || !el.properties) return;
      if (!map[el.type]) map[el.type] = new Set();
      Object.keys(el.properties).forEach((prop) => map[el.type].add(prop));
    });
    Object.keys(map).forEach((type) => {
      map[type] = Array.from(map[type]);
    });
    return map;
  }
  // Undo / Redo public helpers
  canUndo() {
    return this._undoStack && this._undoStack.length > 0;
  }
  canRedo() {
    return this._redoStack && this._redoStack.length > 0;
  }
  undo() {
    if (!this.canUndo()) return;
    const prev = this._undoStack.pop();
    if (!prev) return;
    // Property edit undo
    if (prev.type === "prop") {
      const el = prev.el;
      if (el) {
        el.properties = JSON.parse(JSON.stringify(prev.propsBefore || {}));
        this.persistCurrentXML();
        // Tải lại để đồng bộ (đơn giản, có thể tối ưu sau)
        this.reloadFromStorage();
        // push redo entry
        this._redoStack.push(prev);
      }
      return;
    }
    const dom = this.windowRenderer.renderedElements.get(prev.el);
    if (dom) {
      // push current to redo
      this._redoStack.push({
        el: prev.el,
        x: parseFloat(dom.style.left) || prev.el.bounds.x,
        y: parseFloat(dom.style.top) || prev.el.bounds.y,
        w: parseFloat(dom.style.width) || prev.el.bounds.width,
        h: parseFloat(dom.style.height) || prev.el.bounds.height,
      });
      let hadProtection = false;
      if (dom.__layoutProtectedObserver) {
        try {
          dom.__layoutProtectedObserver.disconnect();
          hadProtection = true;
        } catch (_) {}
      }
      dom.style.position = "absolute";
      dom.style.left = prev.x + "px";
      dom.style.top = prev.y + "px";
      dom.style.width = prev.w + "px";
      dom.style.height = prev.h + "px";
      prev.el.bounds.x = prev.x;
      prev.el.bounds.y = prev.y;
      prev.el.bounds.width = prev.w;
      prev.el.bounds.height = prev.h;
      prev.el.absolutePosition = { x: prev.x, y: prev.y };
      prev.el.absoluteSize = { w: prev.w, h: prev.h };
      prev.el.boundsOriginal = {
        x: prev.x,
        y: prev.y,
        width: prev.w,
        height: prev.h,
      };

      // Update element properties when undoing
      this._updateElementPropertiesFromBounds(prev.el, {
        x: prev.x,
        y: prev.y,
        width: prev.w,
        height: prev.h,
      });

      if (hadProtection && typeof this.protectLayout === "function")
        this.protectLayout(dom, prev.el.boundsOriginal);
      this.updatePropertyPanel(prev.el);
      this._recordHistory("undo", prev.el, prev);
      if (this.selectedElement === prev.el) this.updateCanvasSelection(prev.el);
    }
  }
  redo() {
    if (!this.canRedo()) return;
    const nxt = this._redoStack.pop();
    if (!nxt) return;
    if (nxt.type === "prop") {
      const el = nxt.el;
      if (el) {
        el.properties = JSON.parse(JSON.stringify(nxt.propsAfter || {}));
        this.persistCurrentXML();
        this.reloadFromStorage();
        this._undoStack.push(nxt);
      }
      return;
    }
    const dom = this.windowRenderer.renderedElements.get(nxt.el);
    if (dom) {
      this._undoStack.push({
        el: nxt.el,
        x: parseFloat(dom.style.left) || nxt.el.bounds.x,
        y: parseFloat(dom.style.top) || nxt.el.bounds.y,
        w: parseFloat(dom.style.width) || nxt.el.bounds.width,
        h: parseFloat(dom.style.height) || nxt.el.bounds.height,
      });
      let hadProtection = false;
      if (dom.__layoutProtectedObserver) {
        try {
          dom.__layoutProtectedObserver.disconnect();
          hadProtection = true;
        } catch (_) {}
      }
      dom.style.position = "absolute";
      dom.style.left = nxt.x + "px";
      dom.style.top = nxt.y + "px";
      dom.style.width = nxt.w + "px";
      dom.style.height = nxt.h + "px";
      nxt.el.bounds.x = nxt.x;
      nxt.el.bounds.y = nxt.y;
      nxt.el.bounds.width = nxt.w;
      nxt.el.bounds.height = nxt.h;
      nxt.el.absolutePosition = { x: nxt.x, y: nxt.y };
      nxt.el.absoluteSize = { w: nxt.w, h: nxt.h };
      nxt.el.boundsOriginal = {
        x: nxt.x,
        y: nxt.y,
        width: nxt.w,
        height: nxt.h,
      };

      // Update element properties when redoing
      this._updateElementPropertiesFromBounds(nxt.el, {
        x: nxt.x,
        y: nxt.y,
        width: nxt.w,
        height: nxt.h,
      });

      if (hadProtection && typeof this.protectLayout === "function")
        this.protectLayout(dom, nxt.el.boundsOriginal);
      this.updatePropertyPanel(nxt.el);
      this._recordHistory("redo", nxt.el, nxt);
      if (this.selectedElement === nxt.el) this.updateCanvasSelection(nxt.el);
    }
  }

  /**
   * Load and parse XML
   * @param {string} xmlText - XML content
   */
  async loadXML(xmlText) {
    // Show loading overlay
    this._showLoading && this._showLoading("Đang nạp XML...");
    try {
      // Quản lý bản gốc và phiên bản
      const KEY_ORIGINAL_XML = "TLBB_ORIGINAL_XML";
      const KEY_CURRENT_XML = "TLBB_CURRENT_XML";
      const KEY_VERSIONS = "TLBB_XML_VERSIONS";

      // Nếu chưa có bản gốc thì lưu lại
      if (!localStorage.getItem(KEY_ORIGINAL_XML)) {
        localStorage.setItem(KEY_ORIGINAL_XML, xmlText);
      }
      this.originalXMLRaw = localStorage.getItem(KEY_ORIGINAL_XML);

      // Luôn lưu bản hiện tại vào localStorage
      localStorage.setItem(KEY_CURRENT_XML, xmlText);
      this.currentXMLRaw = xmlText;

      // Parse XML hiện tại
      const parseResult = this.xmlParser.parseXML(xmlText);
      if (!parseResult.success) {
        throw new Error(`XML parsing failed: ${parseResult.error}`);
      }
      this.currentElements = parseResult.elements;
      this.currentTree = this.xmlParser.buildElementTree(this.currentElements);

      // Lưu snapshot đầu tiên vào versions
      let versions = [];
      try {
        versions = JSON.parse(localStorage.getItem(KEY_VERSIONS) || "[]");
      } catch (_) {}
      versions.push({
        ts: Date.now(),
        elements: JSON.parse(JSON.stringify(this.currentElements)),
      });
      localStorage.setItem(KEY_VERSIONS, JSON.stringify(versions.slice(-50)));

      // Pre-load imagesets
      await this.preloadImagesets(xmlText);

      // Update UI
      this.updateElementCount(this.currentElements.length);
      this.updateXMLTree(this.currentTree);
      await this.renderElements(this.currentElements);
      if (this.elements.displayModeSelect) {
        this.elements.displayModeSelect.value = "text";
      }
      this.setDisplayMode("text");
      const stats = this.xmlParser.getElementStats(this.currentElements);
      this.log(
        `Parsed ${stats.total} elements (${stats.visible} visible, ${stats.invisible} invisible)`,
        "info"
      );
    } catch (error) {
      console.error("Error in loadXML:", error);
      throw error;
    } finally {
      this._hideLoading && this._hideLoading();
    }
  }

  // Create panel container if not exists
  _ensureImagesetStatusPanel() {
    if (this.imagesetStatusPanel) return;
    const panel = document.createElement("div");
    panel.id = "imageset-status-panel";
    const container =
      this.elements && this.elements.canvasContent
        ? this.elements.canvasContent
        : null;
    if (container) {
      // ensure container can host absolutely positioned child
      const cs = getComputedStyle(container);
      if (cs.position === "static") container.style.position = "relative";
      panel.style.position = "absolute";
    } else {
      panel.style.position = "fixed";
    }
    const savedPos = JSON.parse(
      localStorage.getItem("IMSET_PANEL_POS") || "{}"
    );
    if (savedPos.x != null && savedPos.y != null) {
      panel.style.left = savedPos.x + "px";
      panel.style.top = savedPos.y + "px";
    } else {
      if (container) {
        panel.style.left = Math.max(0, container.clientWidth - 240) + "px";
        panel.style.top = Math.max(0, container.clientHeight - 260) + "px";
      } else {
        panel.style.right = "250px";
        panel.style.bottom = "50px";
      }
    }
    panel.style.width = "230px";
    panel.style.maxHeight = "250px";
    panel.style.overflow = "auto";
    panel.style.background = "rgba(20,24,28,0.92)";
    panel.style.border = "1px solid #333";
    panel.style.borderRadius = "6px";
    panel.style.font = "11px/1.4 Arial";
    panel.style.color = "#d0d4d8";
    panel.style.zIndex = "9999";
    panel.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
    this.imagesetStatusFilter =
      localStorage.getItem("IMSET_PANEL_FILTER") || "all";
    this.imagesetStatusCollapsed =
      localStorage.getItem("IMSET_PANEL_COLLAPSED") === "1";
    panel.innerHTML = `
			<div id="imageset-status-header" style="position:sticky;top:0;background:#14181c;padding:4px 4px 4px 6px;font-weight:bold;border-bottom:1px solid #2a2f35;display:flex;align-items:center;gap:4px;cursor:move;">
				<span style="flex:1">Imagesets</span>
				<select id="imageset-status-filter" style="font:11px Arial;padding:1px 2px;background:#1f2428;color:#d0d4d8;border:1px solid #2a2f35;border-radius:3px;">
					<option value="all">All</option>
					<option value="pending">Pending</option>
					<option value="errors">Errors</option>
				</select>
				<span id="imageset-status-summary" style="font-weight:normal"></span>
				<button id="imageset-status-export" title="Export JSON" style="background:#264;border:1px solid #486;color:#bfe;font-size:11px;line-height:1;padding:2px 4px;border-radius:3px;cursor:pointer">⇩</button>
				<button id="imageset-status-collapse" title="Collapse / Expand" style="background:#222;border:1px solid #444;color:#ccc;font-size:11px;line-height:1;padding:2px 6px;border-radius:3px;cursor:pointer">−</button>
			</div>
			<div id="imageset-status-list"></div>`;
    if (container) container.appendChild(panel);
    else document.body.appendChild(panel);
    // Prevent right-click from initiating unintended drag or bubbling
    panel.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    this.imagesetStatusPanel = panel;
    const filterSel = panel.querySelector("#imageset-status-filter");
    filterSel.addEventListener("change", () => {
      this.imagesetStatusFilter = filterSel.value;
      localStorage.setItem("IMSET_PANEL_FILTER", this.imagesetStatusFilter);
      this._applyImagesetStatusFilter();
    });
    panel
      .querySelector("#imageset-status-collapse")
      .addEventListener("click", () => {
        this.imagesetStatusCollapsed = !this.imagesetStatusCollapsed;
        panel.querySelector("#imageset-status-list").style.display = this
          .imagesetStatusCollapsed
          ? "none"
          : "block";
        panel.querySelector("#imageset-status-collapse").textContent = this
          .imagesetStatusCollapsed
          ? "+"
          : "−";
        localStorage.setItem(
          "IMSET_PANEL_COLLAPSED",
          this.imagesetStatusCollapsed ? "1" : "0"
        );
      });
    panel
      .querySelector("#imageset-status-export")
      .addEventListener("click", () => this._exportImagesetStatusJSON());
    filterSel.value = this.imagesetStatusFilter;
    if (this.imagesetStatusCollapsed) {
      panel.querySelector("#imageset-status-list").style.display = "none";
      panel.querySelector("#imageset-status-collapse").textContent = "+";
    }
    this._initImagesetPanelDrag(panel);
    this._refreshImagesetStatusSummary();
  }

  _updateImagesetStatus(evt) {
    if (!this.imagesetStatusPanel || !window.ImagesetLoader) return;
    const listDiv = this.imagesetStatusPanel.querySelector(
      "#imageset-status-list"
    );
    const entryId = "imageset-status-" + evt.name;
    let row = listDiv.querySelector("#" + entryId);
    if (!row) {
      row = document.createElement("div");
      row.id = entryId;
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "4px";
      row.style.padding = "3px 6px";
      row.style.borderBottom = "1px solid #222";
      row.innerHTML = `<span class="st-dot" style="width:8px;height:8px;border-radius:50%;background:#555;display:inline-block"></span><span class="st-name" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span><span class="st-info" style="color:#888;font-size:10px"></span><button class="st-retry" title="Retry" style="display:none;background:#422;border:1px solid #633;color:#faa;font-size:10px;padding:1px 4px;border-radius:3px;cursor:pointer">⟳</button>`;
      listDiv.appendChild(row);
      // add interactions
      row.addEventListener("dblclick", () => {
        this._openImagesetPreviewFromStatus(evt.name);
      });
      row.querySelector(".st-retry").addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._retryImageset(evt.name);
      });
    }
    const dot = row.querySelector(".st-dot");
    const nameSpan = row.querySelector(".st-name");
    const infoSpan = row.querySelector(".st-info");
    const retryBtn = row.querySelector(".st-retry");
    nameSpan.textContent = evt.name;
    if (evt.count != null) {
      let extra = "";
      if (evt.texW && evt.texH) extra = ` ${evt.texW}x${evt.texH}`;
      infoSpan.textContent = evt.count + extra;
    }
    if (evt.error) infoSpan.textContent = "ERR";
    if (evt.error) {
      dot.style.background = "#d33";
    } else if (evt.count != null) {
      dot.style.background = "#2fa84f";
    } else {
      dot.style.background = "#f0c040";
    }
    row.dataset.state = evt.error
      ? "error"
      : evt.count != null
      ? "loaded"
      : "pending";
    if (evt.path) row.dataset.path = evt.path;
    if (evt.error) row.dataset.error = evt.error;
    row.title = `${evt.name}\n${evt.path || ""}${
      evt.error ? "\nError: " + evt.error : ""
    }`.trim();
    retryBtn.style.display = evt.error ? "inline-block" : "none";
    if (!evt.error && evt.count != null) {
      row.animate(
        [{ backgroundColor: "#204020" }, { backgroundColor: "transparent" }],
        { duration: 800 }
      );
    }
    this._refreshImagesetStatusSummary();
    this._applyImagesetStatusFilter();
  }

  _refreshImagesetStatusSummary() {
    if (!this.imagesetStatusPanel || !window.ImagesetLoader) return;
    const summaryEl = this.imagesetStatusPanel.querySelector(
      "#imageset-status-summary"
    );
    const st = window.ImagesetLoader.status || new Map();
    let total = 0,
      loaded = 0,
      errors = 0;
    st.forEach((v) => {
      total++;
      if (v.state === "loaded") loaded++;
      else if (v.state === "error") errors++;
    });
    summaryEl.textContent = `${loaded}/${total}${errors ? " ✖" + errors : ""}`;
  }

  _applyImagesetStatusFilter() {
    if (!this.imagesetStatusPanel) return;
    const filter = this.imagesetStatusFilter || "all";
    this.imagesetStatusPanel
      .querySelectorAll("#imageset-status-list > div")
      .forEach((row) => {
        const st = row.dataset.state;
        let show = true;
        if (filter === "pending") show = st === "pending";
        else if (filter === "errors") show = st === "error";
        row.style.display = show ? "flex" : "none";
      });
  }

  _clampImagesetPanel() {
    if (!this.imagesetStatusPanel) return;
    const container =
      this.elements && this.elements.canvasContent
        ? this.elements.canvasContent
        : null;
    if (!container || this.imagesetStatusPanel.style.position !== "absolute")
      return; // only clamp when inside canvas
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const pw = this.imagesetStatusPanel.offsetWidth;
    const ph = this.imagesetStatusPanel.offsetHeight;
    let left = parseInt(this.imagesetStatusPanel.style.left || "0", 10);
    let top = parseInt(this.imagesetStatusPanel.style.top || "0", 10);
    if (isNaN(left)) left = 0;
    if (isNaN(top)) top = 0;
    left = Math.min(Math.max(0, left), Math.max(0, cw - pw));
    top = Math.min(Math.max(0, top), Math.max(0, ch - ph));
    this.imagesetStatusPanel.style.left = left + "px";
    this.imagesetStatusPanel.style.top = top + "px";
    // persist
    localStorage.setItem(
      "IMSET_PANEL_POS",
      JSON.stringify({ x: left, y: top })
    );
  }

  _initImagesetPanelDrag(panel) {
    const header = panel.querySelector("#imageset-status-header");
    let dragging = false,
      startX = 0,
      startY = 0,
      origX = 0,
      origY = 0;
    header.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // only left button initiates drag
      if (
        e.target.id === "imageset-status-filter" ||
        e.target.id === "imageset-status-collapse" ||
        e.target.id === "imageset-status-export"
      )
        return;
      dragging = true;
      panel.style.right = "";
      panel.style.bottom = "";
      origX = panel.offsetLeft;
      origY = panel.offsetTop;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newL = origX + dx;
      let newT = origY + dy;
      // clamp within container if applicable
      const container =
        this.elements && this.elements.canvasContent
          ? this.elements.canvasContent
          : null;
      if (container && panel.style.position === "absolute") {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const pw = panel.offsetWidth;
        const ph = panel.offsetHeight;
        newL = Math.min(Math.max(0, newL), Math.max(0, cw - pw));
        newT = Math.min(Math.max(0, newT), Math.max(0, ch - ph));
      }
      panel.style.left = newL + "px";
      panel.style.top = newT + "px";
    });
    window.addEventListener("mouseup", () => {
      if (dragging) {
        dragging = false;
        this._clampImagesetPanel();
      }
    });
  }

  _retryImageset(name) {
    if (!window.ImagesetLoader) return;
    window.ImagesetLoader.status.set(name, { state: "pending", path: "retry" });
    this._updateImagesetStatus({ name, path: "retry" });
    window.ImagesetLoader.imagesets.delete(name);
    window.ImagesetLoader.loadingPromises.delete(name);
    window.ImagesetLoader.loadImagesetByNameGuess(name).catch(() => {});
  }

  _openImagesetPreviewFromStatus(name) {
    if (!window.ImagesetLoader) return;
    const st = window.ImagesetLoader.status.get(name);
    if (st && st.path) {
      fetch(st.path)
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then((txt) => this.renderImagesetPreview(txt, st.path, true)) // Show as modal
        .catch(() => {});
    }
  }

  _exportImagesetStatusJSON() {
    if (!window.ImagesetLoader) return;
    const arr = [];
    window.ImagesetLoader.status.forEach((v, k) => arr.push({ name: k, ...v }));
    const blob = new Blob([JSON.stringify(arr, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "imageset-status.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * Check module availability
   */
  checkModuleAvailability() {
    const requiredModules = [
      "XMLParser",
      "PropertyParser",
      "PositionCalculator",
      "WindowRenderer",
      "ButtonRenderer",
      "PropertyPanel",
      "XMLTree",
      "CanvasControls",
      "ZoomManager",
    ];

    const missingModules = [];

    requiredModules.forEach((moduleName) => {
      if (typeof window[moduleName] === "undefined") {
        missingModules.push(moduleName);
      }
    });

    if (missingModules.length > 0) {
      console.warn("Missing modules:", missingModules);
    } else {
      console.log("All required modules are available");
    }
  }

  /**
   * Setup DOM references
   */
  setupDOM() {
    this.elements = {
      loadXmlBtn: document.getElementById("loadXmlBtn"),
      loadXmlFolderBtn: document.getElementById("loadXmlFolderBtn"),
      saveXmlBtn: document.getElementById("saveXmlBtn"),
      copyXmlBtn: document.getElementById("copyXmlBtn"),
      checkErrXmlBtn: document.getElementById("checkErrXmlBtn"),
      testXmlBtn: document.getElementById("btnTest"),
      testImagesetsBtn: document.getElementById("btnTestImagesets"),
      xmlFileInput: document.getElementById("xmlFileInput"),
      xmlFolderInput: document.getElementById("xmlFolderInput"),
      displayModeSelect: document.getElementById("displayModeSelect"),
      viewportSelect: document.getElementById("viewportSelect"),
      customViewportInputs: document.getElementById("customViewportInputs"),
      customWidth: document.getElementById("customWidth"),
      customHeight: document.getElementById("customHeight"),
      zoomInBtn: document.getElementById("zoomInBtn"),
      zoomOutBtn: document.getElementById("zoomOutBtn"),
      resetZoomBtn: document.getElementById("resetZoomBtn"),
      toggleHierarchyBtn: document.getElementById("toggleHierarchyBtn"),
      debugHierarchyBtn: document.getElementById("debugHierarchyBtn"),
      toggleImagesetBtn: document.getElementById("toggleImagesetBtn"),
      imagesetOnlyBtn: document.getElementById("imagesetOnlyBtn"),
      toggleRealImagesBtn: document.getElementById("toggleRealImagesBtn"),
      clearCacheBtn: document.getElementById("clearCacheBtn"),
      canvasContent: document.getElementById("canvasContent"),
      xmlStructureTree: document.getElementById("xmlStructureTree"),
      propertyPanel: document.getElementById("propertyPanel"),
      logPanel: document.getElementById("logPanel"),
      statusText: document.getElementById("statusText"),
      elementCount: document.getElementById("elementCount"),
      zoomLevel: document.getElementById("zoomLevel"),
      mousePosition: document.getElementById("mousePosition"),
      viewportSize: document.getElementById("viewportSize"),
      xmlStructureSearch: document.getElementById("xmlStructureSearch"),
      undoBtn: document.getElementById("undoBtn"),
      redoBtn: document.getElementById("redoBtn"),
      toggleRenderModeBtn: document.getElementById("toggleRenderModeBtn"),
    };

    // Initialize hierarchy levels as enabled by default
    // this.elements.canvasContent.classList.add('show-hierarchy');
    // this.elements.toggleHierarchyBtn.classList.add('active');

    // Initialize imageset elements as visible by default
    this.elements.canvasContent.classList.add("show-imageset");
    this.elements.toggleImagesetBtn.classList.add("active");

    // Initialize viewport settings with proper size application
    this.setViewport(CONFIG.VIRTUAL_WIDTH, CONFIG.VIRTUAL_HEIGHT); // Use CONFIG constants

    // Apply initial auto-scaling after DOM is ready
    setTimeout(() => this.applyAutoScaling(), 100);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Rút gọn event listeners
    const el = this.elements;
    [
      [el.loadXmlBtn, "click", () => el.xmlFileInput.click()],
      [el.saveXmlBtn, "click", () => this.saveCurrentXML(true)],
      [
        el.copyXmlBtn,
        "click",
        async () => {
          const xml = this.persistCurrentXML();
          try {
            await navigator.clipboard.writeText(xml);
            this.log("Đã copy XML vào clipboard", "success");
            window.__tlbbShowToast &&
              window.__tlbbShowToast("Đã copy XML vào clipboard", 1800);
          } catch (err) {
            const ta = document.createElement("textarea");
            ta.value = xml;
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
              window.__tlbbShowToast &&
                window.__tlbbShowToast("Copy (fallback) thành công", 1800);
            } catch (e) {
              window.__tlbbShowToast &&
                window.__tlbbShowToast("Không thể copy", 1800);
            } finally {
              ta.remove();
            }
          }
        },
      ],
      [
        el.loadXmlFolderBtn,
        "click",
        () => el.xmlFolderInput && el.xmlFolderInput.click(),
      ],
      [el.checkErrXmlBtn, "click", () => this.handleCheckXmlErrors()],
      [el.testXmlBtn, "click", () => this.handleTestLayout()],
      [el.testImagesetsBtn, "click", () => this.handleTestImagesets()],
      [
        el.toggleRenderModeBtn || document.getElementById('toggleRenderModeBtn'),
        "click",
        () => this.handleToggleRenderMode(),
      ],
      [el.xmlFileInput, "change", (e) => this.handleFileLoad(e)],
      [el.xmlFolderInput, "change", (e) => this.handleFolderLoad(e)],
      [
        el.clearCacheBtn,
        "click",
        () => {
          if (
            !confirm(
              "Xóa TẤT CẢ dữ liệu localStorage của ứng dụng này? (Bao gồm mọi phiên bản XML, thiết lập panel, v.v.)"
            )
          )
            return;
          try {
            localStorage.clear();
            this.clearCanvas();
            this.updateElementCount(0);
            this.setStatus("All localStorage cleared");
            this.log("Đã xóa toàn bộ localStorage.", "warning");
            alert("Đã xóa toàn bộ dữ liệu. Trang sẽ tải lại.");
            location.reload();
          } catch (err) {
            alert("Không thể xóa localStorage: " + err);
          }
        },
      ],
      [
        el.displayModeSelect,
        "change",
        (e) => this.setDisplayMode(e.target.value),
      ],
      [
        el.viewportSelect,
        "change",
        (e) => {
          this.handleViewportChange(e.target.value);
          el.customViewportInputs.style.display =
            e.target.value === "custom" ? "flex" : "none";
        },
      ],
      [el.zoomInBtn, "click", () => this.setZoomLevel(this.zoomLevel * 1.2)],
      [el.zoomOutBtn, "click", () => this.setZoomLevel(this.zoomLevel / 1.2)],
      [el.resetZoomBtn, "click", () => this.setZoomLevel(1.0)],
      [el.toggleHierarchyBtn, "click", () => this.toggleHierarchyLevels()],
      [el.debugHierarchyBtn, "click", () => this.toggleDebugHierarchy()],
      [el.toggleImagesetBtn, "click", () => this.toggleImagesetElements()],
      [el.imagesetOnlyBtn, "click", () => this.toggleImagesetOnly()],
      [el.toggleRealImagesBtn, "click", () => this.toggleRealImages()],
      [el.canvasContent, "mousemove", (e) => this.updateMousePosition(e)],
      [
        el.canvasContent,
        "click",
        (e) => {
          if (e.target === el.canvasContent) this.selectElement(null);
        },
      ],
      [
        el.canvasContent,
        "mousedown",
        (e) => {
          if (this._spacePanning && e.button === 0 && this.zoomManager) {
            e.preventDefault();
            this.zoomManager.startPan(e.clientX, e.clientY);
          }
        },
      ],
    ].forEach(([target, evt, fn]) => {
      if (target) target.addEventListener(evt, fn);
    });

    window.addEventListener("resize", () => this.handleResize());
    window.addEventListener("keydown", (e) => {
      if (
        ["INPUT", "TEXTAREA"].includes(e.target.tagName) ||
        e.target.isContentEditable
      )
        return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && key === "z") {
        this.undo();
        e.preventDefault();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && key === "z") || key === "y")
      ) {
        this.redo();
        e.preventDefault();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.repeat) {
        this._spacePanning = true;
        el.canvasContent && (el.canvasContent.style.cursor = "grab");
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this._spacePanning = false;
        el.canvasContent && (el.canvasContent.style.cursor = "");
      }
    });
    window.addEventListener("stringDictionaryLoaded", (e) => {
      this.log(
        `String dictionary loaded: ${e.detail.count} strings`,
        "success"
      );
    });
  }

  /**
   * Quick XML syntax + structural sanity checks
   * - Unclosed tags
   * - Duplicate Name attributes in same parent scope
   * - Missing required Property Value attributes
   * - Malformed UnifiedPosition/UnifiedSize patterns
   * Provides auto-fix suggestions (non-destructive) displayed in popup.
   */
  handleCheckXmlErrors() {
    const raw =
      localStorage.getItem("TLBB_CURRENT_XML") ||
      localStorage.getItem("TLBB_ORIGINAL_XML");
    if (!raw) {
      alert("Chưa có XML trong bộ nhớ. Hãy Load XML trước.");
      return;
    }
    const report = this.analyzeXml(raw);
    this.showXmlErrorModal(report, raw);
  }

  analyzeXml(xmlText) {
    const lines = xmlText.split(/\r?\n/);
    const stack = [];
    const issues = [];
    const nameScopeStack = [new Set()];
    const unifiedRegex = /\{\{[-\d.]+,[-\d.]+\},\{[-\d.]+,[-\d.]+\}\}/;
    lines.forEach((line, idx) => {
      const ln = idx + 1;
      // crude tag detection
      const tagMatches = [
        ...line.matchAll(/<\/?\s*([A-Za-z0-9_:-]+)([^>]*)>/g),
      ];
      tagMatches.forEach((m) => {
        const full = m[0];
        const tag = m[1];
        const attrs = m[2] || "";
        const closing = full.startsWith("</");
        const selfClose = /\/>\s*$/.test(full);
        if (!closing) {
          // push
          stack.push({ tag, line: ln });
          nameScopeStack.push(new Set());
          const nameAttr = attrs.match(/Name\s*=\s*"([^"]+)"/i);
          if (nameAttr) {
            const curScope = nameScopeStack[nameScopeStack.length - 2]; // previous scope holds siblings
            if (curScope.has(nameAttr[1])) {
              issues.push({
                type: "DuplicateName",
                line: ln,
                detail: `Name '${nameAttr[1]}' trùng trong cùng parent`,
                fix: "Đổi tên hoặc bỏ trùng",
              });
            } else curScope.add(nameAttr[1]);
          }
          if (selfClose) {
            stack.pop();
            nameScopeStack.pop();
          }
        } else {
          // closing
          let last = stack.pop();
          nameScopeStack.pop();
          if (!last || last.tag !== tag) {
            issues.push({
              type: "MismatchedTag",
              line: ln,
              detail: `Đóng </${tag}> nhưng mở là <${
                last ? last.tag : "NONE"
              }>`,
              fix: "Sửa tên tag hoặc thứ tự",
            });
          }
        }
      });
      // Unified pattern validation
      if (/Unified(Position|Size)/.test(line) && !unifiedRegex.test(line)) {
        // Run detailed bracket analysis similar to python xml_auto_fixer
        const valueMatch = line.match(
          /Name="Unified(?:Position|Size)"\s+Value="([^"]*)"/
        );
        if (valueMatch) {
          const inner = valueMatch[1];
          const openCount = (inner.match(/\{/g) || []).length;
          const closeCount = (inner.match(/\}/g) || []).length;
          if (openCount === 4 && closeCount > 4) {
            issues.push({
              type: "excess_closing_brackets",
              line: ln,
              detail: "Thừa dấu }",
              original: inner,
              excess: closeCount - 4,
              fix: `Remove ${closeCount - 4} }`,
              fixValue: inner.slice(0, inner.length - (closeCount - 4)),
            });
          } else if (openCount === 4 && closeCount < 4) {
            issues.push({
              type: "missing_closing_brackets",
              line: ln,
              detail: "Thiếu dấu }",
              original: inner,
              missing: 4 - closeCount,
              fix: `Add ${4 - closeCount} }`,
              fixValue: inner + "}".repeat(4 - closeCount),
            });
          } else if (openCount !== 4 || closeCount !== 4) {
            let fixValue = inner;
            let desc = "Unbalanced";
            if (openCount > closeCount) {
              fixValue = inner + "}".repeat(openCount - closeCount);
              desc = `Add ${openCount - closeCount} }`;
            } else if (closeCount > openCount) {
              fixValue = inner.slice(
                0,
                inner.length - (closeCount - openCount)
              );
              desc = `Remove ${closeCount - openCount} }`;
            }
            issues.push({
              type: "unbalanced_brackets",
              line: ln,
              detail: "Mất cân bằng { }",
              original: inner,
              fix: desc,
              fixValue,
            });
          } else {
            issues.push({
              type: "MalformedUnified",
              line: ln,
              detail: "Sai định dạng UnifiedPosition/Size",
              fix: "Dạng chuẩn: {{rel,abs},{rel,abs}}",
            });
          }
        } else {
          issues.push({
            type: "MalformedUnified",
            line: ln,
            detail: "Sai định dạng UnifiedPosition/Size",
            fix: "Dạng chuẩn: {{rel,abs},{rel,abs}}",
          });
        }
      }
      // Property missing Value attr
      if (/<Property\b/.test(line) && !/Value=/.test(line)) {
        issues.push({
          type: "MissingValue",
          line: ln,
          detail: 'Property thiếu Value=""',
          fix: "Thêm Value",
        });
      }
    });
    if (stack.length > 0) {
      stack.reverse().forEach((unclosed) => {
        issues.push({
          type: "UnclosedTag",
          line: unclosed.line,
          detail: `Tag <${unclosed.tag}> chưa đóng`,
          fix: `Thêm </${unclosed.tag}>`,
        });
      });
    }
    return {
      issues,
      issueCount: issues.length,
      generated: new Date().toISOString(),
    };
  }

  showXmlErrorModal(report, originalXml) {
    // build simple modal (reuse existing if any)
    let modal = document.getElementById("xmlErrorModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "xmlErrorModal";
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.background = "#222";
      modal.style.color = "#eee";
      modal.style.padding = "16px";
      modal.style.border = "1px solid #555";
      modal.style.maxWidth = "800px";
      modal.style.maxHeight = "70vh";
      modal.style.overflow = "auto";
      modal.style.zIndex = "4000";
      document.body.appendChild(modal);
    }
    const rows = report.issues
      .map(
        (iss, i) =>
          `<tr><td>${i + 1}</td><td>${iss.type}</td><td>${iss.line}</td><td>${
            iss.detail
          }</td><td>${iss.fix || ""}</td></tr>`
      )
      .join("");
    modal.innerHTML = `<h3>XML Error Check (${report.issueCount})</h3>
			<div style="margin:4px 0;">
				<button id="xmlErrCloseBtn">Đóng</button>
				<button id="xmlErrDownloadBtn" ${
          report.issueCount ? "" : "disabled"
        }>Backup & Save (Giữ nguyên)</button>
				<button id="xmlErrAutoFixBtn" ${
          report.issueCount ? "" : "disabled"
        }>Tạo Bản Fix Cơ Bản</button>
			</div>
			<table style="width:100%;border-collapse:collapse;font-size:12px;">
				<thead><tr><th>#</th><th>Loại</th><th>Dòng</th><th>Chi tiết</th><th>Gợi ý</th></tr></thead>
				<tbody>${
          rows ||
          '<tr><td colspan="5" style="text-align:center;">Không phát hiện lỗi</td></tr>'
        }</tbody>
			</table>`;
    modal.querySelector("#xmlErrCloseBtn").onclick = () => modal.remove();
    modal.querySelector("#xmlErrDownloadBtn").onclick = () => {
      const backupName = "xml_backup_" + Date.now() + ".xml";
      this.downloadText(backupName, originalXml);
      alert("Đã tạo backup " + backupName + " (người dùng tự lưu).");
    };
    modal.querySelector("#xmlErrAutoFixBtn").onclick = () => {
      const fixed = this.applyBasicFixes(originalXml, report.issues);
      const backupName = "xml_autofix_backup_" + Date.now() + ".xml";
      this.downloadText(backupName, originalXml);
      this.downloadText("xml_fixed_" + Date.now() + ".xml", fixed);
      localStorage.setItem("TLBB_CURRENT_XML", fixed);
      alert("Đã xuất file fix & backup. Reload để áp dụng bản fix.");
    };
  }

  downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  applyBasicFixes(xmlText, issues) {
    let lines = xmlText.split(/\r?\n/);
    // Add empty Value for MissingValue
    issues
      .filter((i) => i.type === "MissingValue")
      .forEach((i) => {
        lines[i.line - 1] = lines[i.line - 1].replace(
          /<Property([^>]*?)>/,
          (m, g) => `<Property${g} Value="">`
        );
      });
    // Unified bracket fixes
    issues
      .filter((i) => i.fixValue && i.original)
      .forEach((i) => {
        const idx = i.line - 1;
        if (!lines[idx]) return;
        // Replace only inside the Value="..."
        lines[idx] = lines[idx].replace(i.original, i.fixValue);
      });
    // Close unclosed simple tags at EOF (append)
    const unclosed = issues.filter((i) => i.type === "UnclosedTag");
    if (unclosed.length) {
      lines.push("<!-- Auto-added closing tags -->");
      unclosed.forEach((u) =>
        lines.push(`</${u.detail.match(/<([^>]+)>/)[1]}>`)
      );
    }
    return lines.join("\n");
  }

  /**
   * Setup renderers
   */
  setupRenderers() {
    // console.log("Setting up renderers...");
    // console.log("windowRenderer:", this.windowRenderer);
    // console.log("buttonRenderer:", this.buttonRenderer);

    if (
      this.windowRenderer &&
      typeof this.windowRenderer.setContainer === "function"
    ) {
      this.windowRenderer.setContainer(this.elements.canvasContent);
    } else {
      console.warn("windowRenderer.setContainer is not available");
    }

    if (
      this.buttonRenderer &&
      typeof this.buttonRenderer.setContainer === "function"
    ) {
      this.buttonRenderer.setContainer(this.elements.canvasContent);
    } else {
      //   console.warn("buttonRenderer.setContainer is not available");
    }

    // Initialize GUI Renderer
    if (this.guiRenderer && this.elements.canvasContent) {
      this.guiRenderer.init(this.elements.canvasContent);
      
      // Register renderers with GUI Renderer
      if (this.windowRenderer) {
        this.guiRenderer.registerRenderer('window', this.windowRenderer);
      }
      if (this.buttonRenderer) {
        this.guiRenderer.registerRenderer('button', this.buttonRenderer);
      }
      if (this.textRenderer) {
        this.guiRenderer.registerRenderer('text', this.textRenderer);
      }
      if (this.frameRenderer) {
        this.guiRenderer.registerRenderer('frame', this.frameRenderer);
      }
      
      console.log('✅ GUI Renderer initialized and configured');
    } else {
      console.warn('❌ GUI Renderer or canvas content not available');
    }

    // Setup renderer event listeners
    if (this.windowRenderer && typeof this.windowRenderer.on === "function") {
      this.windowRenderer.on("elementSelected", (data) => {
        this.selectElement(data.element);
      });
    }

    if (this.buttonRenderer && typeof this.buttonRenderer.on === "function") {
      this.buttonRenderer.on("elementSelected", (data) => {
        this.selectElement(data.element);
      });

      // Generic element click -> select
      this.buttonRenderer.on("elementClick", ({ element }) => {
        if (element) this.selectElement(element);
      });

      this.buttonRenderer.on("buttonClicked", (data) => {
        this.log(
          `Button clicked: ${data.element.name} -> ${data.event}`,
          "info"
        );
      });

      this.buttonRenderer.on("checkboxToggled", (data) => {
        this.log(
          `Checkbox toggled: ${data.element.name} -> ${data.checked}`,
          "info"
        );
      });
    }

    // Initialize unified property panel (click on any element updates)
    if (
      this.propertyPanel &&
      this.elements.propertyPanel &&
      this.propertyParser
    ) {
      this.propertyPanel.init(this.elements.propertyPanel, this.propertyParser);
    }

    // Window renderer element click binding
    if (this.windowRenderer && typeof this.windowRenderer.on === "function") {
      this.windowRenderer.on("elementClick", ({ element }) => {
        if (element) this.selectElement(element);
      });
    }

    // Undo / Redo buttons
    if (this.elements.undoBtn) {
      this.elements.undoBtn.addEventListener("click", () => this.undo());
    }
    if (this.elements.redoBtn) {
      this.elements.redoBtn.addEventListener("click", () => this.redo());
    }
  }
  async handleTestLayout() {
    this.log(`Loading Test XML file: SelfEquip`, "info");
    this.setStatus("Loading Test XML file...");

    await this.loadXML(XMlFileContent);

    this.log(`Successfully loaded: SelfEquip`, "success");
    this.setStatus(`Loaded: SelfEquip`);
  }

  /**
   * Handle test imagesets layout
   */
  async handleTestImagesets() {
    this.log(`Loading Test Imagesets XML file`, "info");
    this.setStatus("Loading Test Imagesets XML file...");

    try {
      const response = await fetch("./test-imageset.xml");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const xmlContent = await response.text();

      console.log(
        "🔄 Loading test imagesets XML content:",
        xmlContent.substring(0, 200) + "..."
      );

      await this.renderImagesetPreview(xmlContent, "Test Imageset");
      this.log(`Successfully loaded Test Imagesets XML`, "success");
      this.setStatus(`Loaded: Test Imagesets XML`);

      console.log("✅ Test imagesets XML loaded successfully");
    } catch (error) {
      this.log(`Failed to load test imagesets: ${error.message}`, "error");
      this.setStatus(`Error: ${error.message}`);
      console.error("❌ Failed to load test imagesets:", error);
    }
  }

  /**
   * Handle toggle render mode between flat and hierarchical
   */
  handleToggleRenderMode() {
    if (!this.guiRenderer) {
      this.log('GUI Renderer not initialized', 'error');
      return;
    }

    const currentMode = this.guiRenderer.isHierarchicalMode();
    const newMode = !currentMode;
    const modeText = newMode ? 'Hierarchical' : 'Flat';
    
    this.guiRenderer.setHierarchicalMode(newMode);
    
    this.log(`Switched to ${modeText} rendering mode`, 'info');
    this.setStatus(`Render Mode: ${modeText}`);
    
    // Update status bar
    const statusElement = document.getElementById('renderModeStatus');
    if (statusElement) {
      statusElement.textContent = `Mode: ${modeText}`;
    }
    
    // Update button text
    const btn = document.getElementById('toggleRenderModeBtn');
    if (btn) {
      const icon = btn.querySelector('i');
      const textNodes = Array.from(btn.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      if (icon) {
        icon.className = newMode ? 'fa-solid fa-sitemap' : 'fa-solid fa-layer-group';
      }
      if (textNodes.length > 0) {
        textNodes[textNodes.length - 1].textContent = newMode ? 'Switch to Flat Mode' : 'Switch to Hierarchical Mode';
      }
    }
    
    // Show toast notification if available
    if (window.__tlbbShowToast) {
      window.__tlbbShowToast(`Switched to ${modeText} Mode`, 2000);
    }
  }

  /**
   * Load XML directly without localStorage interference (for testing)
   * @param {string} xmlText - XML content
   */
  async loadXMLDirect(xmlText) {
    try {
      console.log("🔄 Loading XML directly (bypassing localStorage)...");

      // Parse XML directly
      const parseResult = this.xmlParser.parseXML(xmlText);
      if (!parseResult.success) {
        throw new Error(`XML parsing failed: ${parseResult.error}`);
      }

      this.currentElements = parseResult.elements;
      this.currentTree = this.xmlParser.buildElementTree(this.currentElements);

      // Pre-load imagesets
      await this.preloadImagesets(xmlText);

      // Update UI
      this.updateElementCount(this.currentElements.length);
      this.updateXMLTree(this.currentTree);
      await this.renderElements(this.currentElements);

      console.log("✅ Direct XML loading completed");
    } catch (error) {
      console.error("❌ Direct XML loading failed:", error);
      throw error;
    }
  }

  /**
   * Handle file loading
   * @param {Event} event - File input change event
   */
  async handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.log(`Loading XML file: ${file.name}`, "info");
      this.setStatus("Loading XML file...");

      const xmlText = await this.readFileAsText(file);
      if (/\.imageset\.xml$/i.test(file.name)) {
        await this.renderImagesetPreview(xmlText, file.name);
        this.setStatus("Preview imageset: " + file.name);
      } else {
        await this.loadXML(xmlText);
        await this._loadReferencedImagesetsForXML(xmlText);
        this.log(`Successfully loaded: ${file.name}`, "success");
        this.setStatus(`Loaded: ${file.name}`);
      }
    } catch (error) {
      this.log(`Error loading file: ${error.message}`, "error");
      this.setStatus("Error loading file");
    }
  }

  /**
   * Handle folder loading (multiple XML files)
   */
  async handleFolderLoad(event) {
    const fileList = Array.from(event.target.files || []).filter((f) =>
      /\.xml$/i.test(f.name)
    );
    if (!fileList.length) {
      alert("Folder không có file XML");
      return;
    }
    // Build in-memory map
    this._xmlFolderFiles = {};
    for (const file of fileList) {
      try {
        const text = await this.readFileAsText(file);
        this._xmlFolderFiles[file.webkitRelativePath || file.name] = text;
      } catch (err) {
        console.warn("Read fail", file.name, err);
      }
    }
    this.renderXmlFileList();
    // Auto-load first file
    const firstKey = Object.keys(this._xmlFolderFiles)[0];
    if (firstKey) {
      const content = this._xmlFolderFiles[firstKey];
      if (/\.imageset\.xml$/i.test(firstKey)) {
        await this.renderImagesetPreview(content, firstKey);
        this.setStatus("Preview imageset: " + firstKey);
      } else {
        await this.loadXML(content);
        await this._loadReferencedImagesetsForXML(content);
        this.setStatus(
          "Loaded folder: " + fileList.length + " files. Showing " + firstKey
        );
        this.log(
          "Loaded folder with " + fileList.length + " XML files",
          "success"
        );
      }
    }
  }

  renderXmlFileList() {
    const listEl = document.getElementById("xmlFileList");
    const searchEl = document.getElementById("xmlFileSearch");
    if (!listEl) {
      return;
    }
    listEl.innerHTML = "";
    if (!this._xmlFolderFiles) {
      listEl.innerHTML = "<em>No folder loaded</em>";
      return;
    }
    const allKeys = Object.keys(this._xmlFolderFiles).sort();
    let filter = "";
    if (searchEl) {
      filter = (searchEl.value || "").trim().toLowerCase();
      // attach input listener once
      if (!searchEl._bound) {
        searchEl.addEventListener("input", () => this.renderXmlFileList());
        searchEl._bound = true;
      }
    }
    const filtered = filter
      ? allKeys.filter((k) => k.toLowerCase().includes(filter))
      : allKeys;
    if (!filtered.length) {
      listEl.innerHTML = "<em>No match</em>";
      return;
    }
    const frag = document.createDocumentFragment();
    filtered.forEach((key) => {
      const btn = document.createElement("div");
      const fileName = key.split(/\\|\//).slice(-1)[0];
      const lower = fileName.toLowerCase();
      let icon = "📄";
      if (lower.endsWith(".layout.xml")) icon = "🧩";
      else if (lower.endsWith(".imageset.xml")) icon = "🖼️";
      else if (lower.includes("backup")) icon = "🗂️";
      btn.innerHTML = `<span class="xml-file-icon" style="opacity:.9;margin-right:4px;">${icon}</span><span class="xml-file-name">${fileName}</span>`;
      btn.title = key;
      btn.style.cursor = "pointer";
      btn.style.padding = "3px 4px 3px 6px";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.gap = "4px";
      btn.style.borderBottom = "1px solid #2d2d2d";
      btn.style.fontFamily = "Consolas,monospace";
      btn.style.fontSize = "12px";
      btn.dataset.fileKey = key;
      btn.addEventListener("mouseenter", () => {
        btn.style.background = "#2a2f38";
      });
      btn.addEventListener("mouseleave", () => {
        if (!btn.classList.contains("active")) btn.style.background = "";
        else btn.style.background = "#39424f";
      });
      btn.addEventListener("click", async () => {
        console.log("Clicked file:", key);
        const content = this._xmlFolderFiles[key];
        this.currentFileKey = key; // remember for save naming
        // Detect imageset xml
        if (/\.imageset\.xml$/i.test(key)) {
          await this.renderImagesetPreview(content, key);
          this.setStatus("Preview imageset: " + key);
        } else {
          await this.loadXML(content);
          this.setStatus("Loaded file: " + key);
          await this._loadReferencedImagesetsForXML(content);
        }
        // highlight selection
        [...listEl.children].forEach((c) => {
          c.classList.remove("active");
          c.style.background = "";
        });
        btn.classList.add("active");
        btn.style.background = "#39424f";
      });
      frag.appendChild(btn);
    });
    listEl.appendChild(frag);
  }

  /**
   * Read file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Failed to read file"));
      reader.readAsText(file, "utf-8");
    });
  }

  /**
   * Analyze XML content to detect all imageset references
   * @param {string} xmlText - XML content to analyze
   * @returns {Set} Set of imageset names found
   */
  analyzeImagesetReferences(xmlText) {
    const imagesetPattern = /set:([A-Za-z0-9_]+)/g;
    const imagesets = new Set();
    let match;

    while ((match = imagesetPattern.exec(xmlText)) !== null) {
      imagesets.add(match[1]);
    }

    console.log("🔍 Found imageset references:", Array.from(imagesets));
    return imagesets;
  }

  /**
   * Load only imagesets referenced in provided layout XML text.
   * Clears current imageset status panel before loading.
   */
  async _loadReferencedImagesetsForXML(xmlText) {
    if (!window.ImagesetLoader) return;
    // Reset status & panel list
    if (window.ImagesetLoader.status) {
      window.ImagesetLoader.status.clear();
    }
    if (this.imagesetStatusPanel) {
      const listDiv = this.imagesetStatusPanel.querySelector(
        "#imageset-status-list"
      );
      if (listDiv) listDiv.innerHTML = "";
      this._refreshImagesetStatusSummary();
    }
    const refs = this.analyzeImagesetReferences(xmlText);
    if (!refs.size) {
      this.log("No imageset references found in file.", "info");
      return;
    }
    refs.forEach((name) => {
      this._updateImagesetStatus({ name }); // show pending row immediately
      window.ImagesetLoader.loadImagesetByNameGuess(name).catch((err) => {
        console.warn("[ImagesetLoadFail]", name, err.message);
      });
    });
  }

  /**
   * Pre-load all imagesets referenced in XML
   * @param {string} xmlText - XML content to analyze
   */
  async preloadImagesets(xmlText) {
    if (!window.ImagesetLoader) {
      console.warn("ImagesetLoader not available for preloading");
      return;
    }

    try {
      // Analyze XML to find all imageset references
      const imagesetNames = this.analyzeImagesetReferences(xmlText);

      if (imagesetNames.size === 0) {
        console.log("No imageset references found in XML");
        return;
      }

      // Load each imageset
      const loadPromises = Array.from(imagesetNames).map(
        async (imagesetName) => {
          try {
            console.log(`📦 Loading imageset: ${imagesetName}`);
            await window.ImagesetLoader.loadImagesetByNameGuess(imagesetName);
            console.log(`✅ Loaded imageset: ${imagesetName}`);
          } catch (error) {
            console.warn(
              `⚠️ Failed to load imageset ${imagesetName}:`,
              error.message
            );
          }
        }
      );

      // Wait for all imagesets to load
      await Promise.all(loadPromises);
      console.log("🎉 All imagesets preloaded successfully");
    } catch (error) {
      console.error("Error during imageset preloading:", error);
    }
  }

  /**
   * Load and parse XML
   * @param {string} xmlText - XML content
   */
  async loadXML(xmlText) {
    // Show loading overlay
    this._showLoading && this._showLoading("Đang nạp XML...");
    try {
      // New file load => clear history (fresh context)
      if (this.history && this.history.length) {
        this.history = [];
        this._saveHistoryToStorage();
        const hl = document.getElementById("history-list");
        if (hl) hl.innerHTML = "";
      }
      if (!this.xmlParser) {
        throw new Error("XMLParser not available");
      }
      // =========== LocalStorage orchestration ===========
      // Keys
      const KEY_CURRENT_XML = "TLBB_CURRENT_XML";
      const KEY_ORIGINAL_XML = "TLBB_ORIGINAL_XML";
      const KEY_VERSIONS = "TLBB_XML_VERSIONS";

      // If first time (no current xml stored) -> persist original & current
      const existingCurrent = localStorage.getItem(KEY_CURRENT_XML);
      // Always treat newly provided xmlText as the active 'current' when coming from file / folder selection
      // Preserve very first loaded file as ORIGINAL if not yet set
      if (!localStorage.getItem(KEY_ORIGINAL_XML)) {
        localStorage.setItem(KEY_ORIGINAL_XML, xmlText);
        // initialize versions list baseline
        let versions = [];
        try {
          versions = JSON.parse(localStorage.getItem(KEY_VERSIONS) || "[]");
        } catch (_) {}
        versions.push({ ts: Date.now(), label: "initial", xml: xmlText });
        localStorage.setItem(KEY_VERSIONS, JSON.stringify(versions));
      }
      // Always update CURRENT xml when loadXML invoked explicitly (manual file click)
      if (xmlText && xmlText !== existingCurrent) {
        localStorage.setItem(KEY_CURRENT_XML, xmlText);
        // Save version entry
        let versions = [];
        try {
          versions = JSON.parse(localStorage.getItem(KEY_VERSIONS) || "[]");
        } catch (_) {}
        versions.push({
          ts: Date.now(),
          label: "load:" + new Date().toLocaleTimeString(),
          xml: xmlText,
        });
        localStorage.setItem(KEY_VERSIONS, JSON.stringify(versions.slice(-50))); // keep last 50
      }

      // Load from just stored current
      const sourceXML = localStorage.getItem(KEY_CURRENT_XML) || xmlText;
      this.currentXMLRaw = sourceXML;

      // Pre-load imagesets first
      console.log("🔄 Pre-loading imagesets from XML (from localStorage)...");
      await this.preloadImagesets(sourceXML);

      // Parse XML from localStorage
      console.log("Parsing XML (localStorage source)...");
      const parseResult = this.xmlParser.parseXML(sourceXML);
      // IMPORTANT: giữ currentXMLRaw = sourceXML (đang ở localStorage). KHÔNG ghi đè bằng tham số xmlText nữa
      // (trước đây dòng dưới đã bị remove vì làm mất bản đã chỉnh sửa)
      // this.currentXMLRaw = xmlText;

      if (!parseResult.success) {
        throw new Error(`XML parsing failed: ${parseResult.error}`);
      }

      console.log("Building element tree (from localStorage source)...");
      this.currentElements = parseResult.elements;
      // Capture original unified & bounds snapshot for later change detection
      this.currentElements.forEach((el) => {
        if (el.unifiedPosition)
          el._originalUnifiedPosition = el.unifiedPosition;
        if (el.unifiedSize) el._originalUnifiedSize = el.unifiedSize;
        if (el.boundsOriginal) el._initialBounds = { ...el.boundsOriginal };
      });
      this.currentTree = this.xmlParser.buildElementTree(this.currentElements);

      // Update UI
      console.log("Updating UI...");
      this.updateElementCount(this.currentElements.length);
      this.updateXMLTree(this.currentTree);

      // Render elements
      console.log("Rendering elements (localStorage-based)...");
      await this.renderElements(this.currentElements);

      // After successful render, ensure an initial snapshot stored (if not yet in current versions)
      try {
        const versionsRaw = localStorage.getItem(KEY_VERSIONS);
        let versions = [];
        if (versionsRaw) versions = JSON.parse(versionsRaw);
        const hasInitialSnapshot = versions.some(
          (v) => v.label === "initial" && v.snapshot
        );
        if (!hasInitialSnapshot) {
          const snap = this.saveSnapshot();
          const idx = versions.findIndex((v) => v.label === "initial");
          if (idx >= 0) versions[idx].snapshot = snap;
          else
            versions.push({
              ts: Date.now(),
              label: "initial",
              snapshot: snap,
              xml: sourceXML,
            });
          localStorage.setItem(KEY_VERSIONS, JSON.stringify(versions));
          console.log("💾 Stored initial snapshot");
        }
      } catch (e) {
        console.warn("Failed to store initial snapshot", e);
      }

      // Force display mode to text on every load (always show localized text)
      if (this.elements.displayModeSelect) {
        this.elements.displayModeSelect.value = "text";
      }
      this.setDisplayMode("text");

      // Auto-load all imagesets referenced in current layout before continuing (non-blocking for speed)
      try {
        if (window.ImagesetLoader && this.currentTree) {
          const imagesetNames = new Set();
          const stack = [this.currentTree];
          while (stack.length) {
            const node = stack.pop();
            if (node && node.element && node.element.properties) {
              const props = node.element.properties;
              [
                "Image",
                "BackImage",
                "BackImageNormal",
                "BackImageHover",
                "BackImageDown",
              ].forEach((k) => {
                const ref = props[k];
                if (typeof ref === "string") {
                  const m = ref.match(/set:(\S+)\s+image:(\S+)/);
                  if (m) imagesetNames.add(m[1]);
                }
              });
            }
            if (node && node.children)
              node.children.forEach((ch) => stack.push(ch));
          }
          if (imagesetNames.size) {
            console.log(
              "[AutoImageset] Detected in layout:",
              Array.from(imagesetNames)
            );
            for (const name of imagesetNames) {
              if (!window.ImagesetLoader.imagesets.has(name)) {
                window.ImagesetLoader.loadImagesetByNameGuess(name).catch((e) =>
                  console.warn("[AutoImageset] Failed", name, e.message)
                );
              }
            }
          }
        }
      } catch (autoErr) {
        console.warn("Auto imageset loading error", autoErr);
      }

      // Show statistics
      const stats = this.xmlParser.getElementStats(this.currentElements);
      this.log(
        `Parsed ${stats.total} elements (${stats.visible} visible, ${stats.invisible} invisible)`,
        "info"
      );
    } catch (error) {
      console.error("Error in loadXML:", error);
      throw error;
    } finally {
      this._hideLoading && this._hideLoading();
    }
  }

  /**
   * Render a preview for a .imageset.xml file instead of GUI layout
   * Optimized to use ImagesetLoader for texture loading
   * @param {string} imagesetXmlText - XML content of the imageset
   * @param {string} fileKey - File key/name for identification
   * @param {boolean} asModal - If true, render as popup modal; if false, render in canvas
   */
  async renderImagesetPreview(imagesetXmlText, fileKey, asModal = false) {
    let imagesetName = "";
    let imageFile = "";
    try {
      // Parse imageset metadata
      const { name, imagefile, images } = this._parseImagesetXML(
        imagesetXmlText,
        fileKey
      );
      imagesetName = name;
      imageFile = imagefile;

      // Create UI components
      const { wrapper, atlasPanel, listPanel, controls } =
        this._createImagesetUI(imagesetName, imageFile, images.length, asModal);

      // Load texture and setup atlas
      const { baseImgEl, textureWidth, textureHeight } =
        await this._loadImagesetTexture(imageFile);
      const atlasInner = this._setupAtlasDisplay(
        atlasPanel,
        baseImgEl,
        textureWidth,
        textureHeight
      );

      // Setup controls and interactions
      this._setupImagesetControls(
        controls,
        atlasInner,
        textureWidth,
        textureHeight,
        async () => {
          const reloaded = await this._loadImagesetTexture(imageFile);
          this._updateAtlasTexture(atlasInner, reloaded.baseImgEl);
        }
      );

      // Create image regions and list
      this._createImageRegions(atlasInner, images);
      this._createImageList(listPanel, images, atlasInner);

      // Display the preview
      if (asModal) {
        const { imageListContainer } = this._showImagesetModal(
          wrapper,
          imagesetName
        );
        // Move image list to modal's container
        if (imageListContainer && listPanel.children.length > 0) {
          while (listPanel.firstChild) {
            imageListContainer.appendChild(listPanel.firstChild);
          }
        }
      } else {
        // Clear canvas first for non-modal display
        this.clearCanvas();
        this.elements.canvasContent.appendChild(wrapper);
      }

      this.log(
        `Rendered imageset preview: ${imagesetName} (${images.length} images)`,
        "info"
      );
    } catch (err) {
      console.error("renderImagesetPreview failed", err);
      this.setStatus("Imageset preview error");
      this._showImagesetPreviewError(err, imagesetName, imageFile, asModal);
    }
  }

  /**
   * Parse imageset XML to extract metadata and images
   * @private
   */
  _parseImagesetXML(imagesetXmlText, fileKey) {
    const nameMatch = imagesetXmlText.match(/<Imageset[^>]*Name="([^"]+)"/i);
    const imageFileMatch = imagesetXmlText.match(
      /<Imageset[^>]*Imagefile="([^"]+)"/i
    );

    const name = nameMatch
      ? nameMatch[1]
      : (fileKey.split(/\\|\//).pop() || "").replace(/\.imageset\.xml$/i, "");
    const imagefile = imageFileMatch ? imageFileMatch[1] : "";

    // Extract images
    const imageRegex =
      /<Image[^>]*Name="([^"]+)"[^>]*XPos="(\d+)"[^>]*YPos="(\d+)"[^>]*Width="(\d+)"[^>]*Height="(\d+)"[^>]*>/gi;
    const images = [];
    let match;
    while ((match = imageRegex.exec(imagesetXmlText))) {
      images.push({
        name: match[1],
        x: parseInt(match[2]),
        y: parseInt(match[3]),
        w: parseInt(match[4]),
        h: parseInt(match[5]),
      });
    }

    return { name, imagefile, images };
  }

  /**
   * Create imageset UI components
   * @private
   */
  _createImagesetUI(imagesetName, imageFile, imageCount, asModal) {
    const wrapper = document.createElement("div");
    const baseStyle =
      "position:relative;color:#ccc;font:12px/1.4 Arial,sans-serif;";

    if (asModal) {
      // For modal, don't limit size, let it display naturally
      wrapper.style.cssText = baseStyle + "overflow: visible;";
    } else {
      wrapper.style.cssText = baseStyle + "padding:8px;";
    }

    // Header
    const header = document.createElement("div");
    header.innerHTML = `<strong>Imageset:</strong> ${imagesetName} <strong>Texture:</strong> ${
      imageFile || "(none)"
    } <strong>Images:</strong> ${imageCount}`;
    header.style.cssText =
      "margin-bottom:6px;padding:4px;background:rgba(0,0,0,0.3);border-radius:4px;";
    wrapper.appendChild(header);

    // Controls
    const controls = document.createElement("div");
    controls.style.cssText =
      "margin:6px 0 8px;padding:4px;background:rgba(0,0,0,0.2);border-radius:4px;";
    controls.innerHTML = `
      Scale: <input type="range" class="atlas-scale-range" min="0.25" max="4" value="1" step="0.25" style="vertical-align:middle;width:120px;">
      <span class="atlas-scale-val">1.00x</span>
    `;
    wrapper.appendChild(controls);

    // Content container - for modal, only show atlas centered
    const content = document.createElement("div");
    if (asModal) {
      content.style.cssText =
        "display:flex;justify-content:center;align-items:flex-start;padding:8px;";
    } else {
      content.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;";
    }
    wrapper.appendChild(content);

    // Atlas panel
    const atlasPanel = document.createElement("div");
    if (asModal) {
      // In modal, atlas should be centered with responsive sizing
      atlasPanel.style.cssText = `
        position: relative;
        border: 1px solid #444;
        background: #111;
        max-width: 90%;
        max-height: 60vh;
        overflow: auto;
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;
      `;
    } else {
      atlasPanel.style.cssText =
        "position:relative;border:1px solid #444;background:#111;max-width:512px;max-height:512px;overflow:auto;flex-shrink:0;";
    }
    content.appendChild(atlasPanel);

    // List panel - only for non-modal
    const listPanel = document.createElement("div");
    if (!asModal) {
      listPanel.style.cssText =
        "max-height:512px;overflow:auto;min-width:200px;border:1px solid #444;background:#1b1f24;padding:4px;flex:1;";
      content.appendChild(listPanel);
    }

    return { wrapper, atlasPanel, listPanel, controls };
  }

  /**
   * Load imageset texture using optimized ImagesetLoader
   * @private
   */
  async _loadImagesetTexture(imageFile) {
    console.log("🔄 [ImagesetPreview] Loading texture:", imageFile);

    if (!imageFile || !window.ImagesetLoader) {
      return this._createPlaceholderTexture(imageFile, 0);
    }

    try {
      const texture = await window.ImagesetLoader._preloadTexture(imageFile);
      if (texture && !texture.isPlaceholder) {
        const width = texture.width || texture.naturalWidth || 512;
        const height = texture.height || texture.naturalHeight || 512;
        console.log(`✅ [ImagesetPreview] Loaded texture: ${width}x${height}`);
        return {
          baseImgEl: texture,
          textureWidth: width,
          textureHeight: height,
        };
      }
    } catch (error) {
      console.warn("[ImagesetPreview] ImagesetLoader failed:", error.message);
    }

    return this._createPlaceholderTexture(imageFile, 0);
  }

  /**
   * Create placeholder texture
   * @private
   */
  _createPlaceholderTexture(imageFile, imageCount) {
    console.log("🎨 [ImagesetPreview] Creating placeholder texture");
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#2a2a2a");
    gradient.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Grid pattern
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Text overlay
    ctx.fillStyle = "#888";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No Texture", 256, 240);
    ctx.font = "12px Arial";
    ctx.fillText(imageFile || "Missing imagefile", 256, 260);
    if (imageCount > 0) {
      ctx.fillText(`${imageCount} sub-images`, 256, 280);
    }

    return { baseImgEl: canvas, textureWidth: 512, textureHeight: 512 };
  }

  /**
   * Setup atlas display container
   * @private
   */
  _setupAtlasDisplay(atlasPanel, baseImgEl, textureWidth, textureHeight) {
    const atlasInner = document.createElement("div");

    // Calculate optimal size - fit within container while maintaining aspect ratio
    const maxWidth = Math.min(450, textureWidth); // Max 450px for modal
    const maxHeight = Math.min(400, textureHeight); // Max 400px for modal

    const widthRatio = maxWidth / textureWidth;
    const heightRatio = maxHeight / textureHeight;
    const optimalScale = Math.min(widthRatio, heightRatio, 1); // Don't scale up

    const displayWidth = textureWidth * optimalScale;
    const displayHeight = textureHeight * optimalScale;

    atlasInner.style.cssText = `
      position: relative;
      display: inline-block;
      width: ${displayWidth}px;
      height: ${displayHeight}px;
    `;

    atlasInner.appendChild(baseImgEl);
    baseImgEl.style.cssText =
      "display:block;width:100%;height:100%;object-fit:contain;";

    // Store original dimensions for scaling
    atlasInner.__originalWidth = textureWidth;
    atlasInner.__originalHeight = textureHeight;
    atlasInner.__currentScale = optimalScale;

    atlasPanel.appendChild(atlasInner);
    return atlasInner;
  }

  /**
   * Setup imageset controls and interactions
   * @private
   */
  _setupImagesetControls(
    controls,
    atlasInner,
    textureWidth,
    textureHeight,
    reloadCallback
  ) {
    let currentScale = 1;

    const applyAtlasScale = () => {
      // Use stored original dimensions
      const originalWidth = atlasInner.__originalWidth || textureWidth;
      const originalHeight = atlasInner.__originalHeight || textureHeight;
      const baseScale = atlasInner.__currentScale || 1;

      // Calculate final scale combining base scale and user scale
      const finalScale = baseScale * currentScale;
      const scaledWidth = originalWidth * finalScale;
      const scaledHeight = originalHeight * finalScale;

      // Get the image element from the atlas container
      const baseImgEl = atlasInner.querySelector("img, canvas");
      if (!baseImgEl) {
        console.warn("No image element found in atlas container");
        return;
      }

      // Scale the container
      atlasInner.style.width = scaledWidth + "px";
      atlasInner.style.height = scaledHeight + "px";

      // No need for transform, let container handle sizing
      baseImgEl.style.transform = "none";

      // Update region overlays with correct positioning
      atlasInner.querySelectorAll(".imageset-region").forEach((r) => {
        const info = r.__info;
        if (!info) return;

        // Position regions based on final scale
        r.style.left = info.x * finalScale + "px";
        r.style.top = info.y * finalScale + "px";
        r.style.width = info.w * finalScale + "px";
        r.style.height = info.h * finalScale + "px";

        // Adjust border visibility based on scale
        if (finalScale < 0.5) {
          r.style.borderWidth = "2px";
          r.style.opacity = "0.8";
        } else if (finalScale < 1) {
          r.style.borderWidth = "1px";
          r.style.opacity = "0.9";
        } else {
          r.style.borderWidth = "1px";
          r.style.opacity = "1";
        }
      });

      const scaleVal = controls.querySelector(".atlas-scale-val");
      if (scaleVal) scaleVal.textContent = currentScale.toFixed(2) + "x";
    };

    // Scale control
    const scaleRange = controls.querySelector(".atlas-scale-range");
    if (scaleRange) {
      scaleRange.addEventListener("input", () => {
        currentScale = parseFloat(scaleRange.value) || 1;
        applyAtlasScale();
      });
    }

    // Reload button
    const reloadBtn = controls.querySelector(".reload-atlas-btn");
    if (reloadBtn) {
      reloadBtn.addEventListener("click", async () => {
        console.log("🔄 [ImagesetPreview] Manual texture reload");
        await reloadCallback();
        applyAtlasScale();
      });
    }

    // Close modal button
    const closeBtn = controls.querySelector(".close-modal-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        const modal = controls.closest(".imageset-modal");
        if (modal) modal.remove();
      });
    }

    // Initial scale application
    applyAtlasScale();
  }

  /**
   * Update atlas texture after reload
   * @private
   */
  _updateAtlasTexture(atlasInner, newBaseImgEl) {
    const oldImg = atlasInner.querySelector("img, canvas");
    if (oldImg) {
      atlasInner.replaceChild(newBaseImgEl, oldImg);
      newBaseImgEl.style.cssText =
        "display:block;width:100%;height:100%;object-fit:contain;";
    }
  }

  /**
   * Create image regions overlay
   * @private
   */
  _createImageRegions(atlasInner, images) {
    // Get current scale from atlasInner
    const currentScale = atlasInner.__currentScale || 1;

    images.forEach((info, index) => {
      const box = document.createElement("div");
      box.className = "imageset-region";
      box.style.cssText = `
        position: absolute;
        box-sizing: border-box;
        pointer-events: auto;
        border: 1px solid #04fc74ff;
        transition: all 0.2s ease;
        left: ${info.x * currentScale}px;
        top: ${info.y * currentScale}px;
        width: ${info.w * currentScale}px;
        height: ${info.h * currentScale}px;
        z-index: 10;
        cursor: pointer;
      `;

      // Store complete info for precise matching
      box.__info = {
        name: info.name,
        x: info.x,
        y: info.y,
        w: info.w,
        h: info.h,
        index: index,
      };

      box.title = `${info.name} (${info.w}x${info.h}) at (${info.x},${info.y})`;
      box.setAttribute("data-image-name", info.name);
      box.setAttribute("data-image-index", index);

      // Add hover effect directly to the region
      box.addEventListener("mouseenter", () => {
        box.style.zIndex = "20";

        // Also highlight corresponding list item
        const listItems = document.querySelectorAll(".image-item");
        listItems.forEach((item) => {
          if (item.getAttribute("data-image-name") === info.name) {
            item.style.background = "#007acc";
            item.style.color = "white";
          }
        });
      });

      box.addEventListener("mouseleave", () => {
        box.style.zIndex = "10";

        // Remove highlight from list item
        const listItems = document.querySelectorAll(".image-item");
        listItems.forEach((item) => {
          if (item.getAttribute("data-image-name") === info.name) {
            item.style.background = "";
            item.style.color = "";
          }
        });
      });

      atlasInner.appendChild(box);
    });
  }

  /**
   * Create image list with interactions
   * @private
   */
  _createImageList(listPanel, images, atlasInner) {
    images.forEach((info) => {
      const row = document.createElement("div");
      row.className = "image-item";
      row.style.cssText =
        "padding:2px 4px;cursor:pointer;border-bottom:1px solid #2a2f32;font-family:Consolas,monospace;font-size:11px;transition:background-color 0.2s ease;";

      // Create name span for search highlighting
      const nameSpan = document.createElement("span");
      nameSpan.className = "image-name";
      nameSpan.textContent = `${info.name} (${info.w}×${info.h})`;
      row.appendChild(nameSpan);

      // Store info for easier access and search
      row.__imageInfo = info;
      row.setAttribute("data-image-name", info.name);

      // Hover effects
      row.addEventListener("mouseenter", () => {
        // Find corresponding region by matching image info
        const regions = atlasInner.querySelectorAll(".imageset-region");
        let targetRegion = null;

        for (const region of regions) {
          const regionInfo = region.__info;
          if (
            regionInfo &&
            regionInfo.name === info.name &&
            regionInfo.x === info.x &&
            regionInfo.y === info.y &&
            regionInfo.w === info.w &&
            regionInfo.h === info.h
          ) {
            targetRegion = region;
            break;
          }
        }

        if (targetRegion) {
          targetRegion.style.border = "1px solid #ffff00";
          targetRegion.style.background = "rgba(255, 255, 0, 0.2)";
          targetRegion.style.zIndex = "20";
        }

        row.style.background = "#007acc";
        row.style.color = "white";
      });

      row.addEventListener("mouseleave", () => {
        // Clear highlight from corresponding region
        const regions = atlasInner.querySelectorAll(".imageset-region");
        for (const region of regions) {
          const regionInfo = region.__info;
          if (
            regionInfo &&
            regionInfo.name === info.name &&
            regionInfo.x === info.x &&
            regionInfo.y === info.y &&
            regionInfo.w === info.w &&
            regionInfo.h === info.h
          ) {
            region.style.border = "1px solid #04fc74ff";
            region.style.background = "none";
            region.style.zIndex = "10";
            break;
          }
        }

        row.style.background = "";
        row.style.color = "";
      });

      // Click to focus
      row.addEventListener("click", () => {
        // Clear previous selections
        atlasInner.querySelectorAll(".imageset-region").forEach((r) => {
          r.style.background = "";
          r.classList.remove("selected");
        });
        listPanel.querySelectorAll("div").forEach((r) => {
          r.style.background = "";
          r.classList.remove("selected");
        });

        // Find and highlight selected region
        const regions = atlasInner.querySelectorAll(".imageset-region");
        for (const region of regions) {
          const regionInfo = region.__info;
          if (
            regionInfo &&
            regionInfo.name === info.name &&
            regionInfo.x === info.x &&
            regionInfo.y === info.y &&
            regionInfo.w === info.w &&
            regionInfo.h === info.h
          ) {
            region.style.background = "rgba(255,255,0,0.25)";
            region.classList.add("selected");
            region.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });
            break;
          }
        }

        row.style.background = "#39424f";
        row.classList.add("selected");
      });

      listPanel.appendChild(row);
    });
  }

  /**
   * Show imageset preview as modal
   * @private
   */
  _showImagesetModal(wrapper, imagesetName) {
    // Remove existing modal if any
    const existing = document.querySelector(".imageset-modal");
    if (existing) existing.remove();

    // Modal content positioned like imageset-status-panel (no backdrop)
    const modalContent = document.createElement("div");
    modalContent.className = "imageset-modal";
    modalContent.style.cssText = `
      position: fixed;
      right: 250px;
      top: 50px;
      width: 500px;
      height: calc(100vh - 100px);
      background: rgba(20,24,28,0.95);
      border: 1px solid #333;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font: 11px/1.4 Arial;
      color: #d0d4d8;
      z-index: 9999;
    `;

    // Create header similar to imageset-status-panel
    const header = document.createElement("div");
    header.style.cssText = `
      position: sticky;
      top: 0;
      background: #14181c;
      padding: 4px 4px 4px 6px;
      font-weight: bold;
      border-bottom: 1px solid #2a2f35;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: move;
      user-select: none;
    `;

    const title = document.createElement("span");
    title.style.cssText = "flex: 1; font-size: 12px;";
    title.textContent = `Imageset Preview: ${imagesetName}`;

    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = `
      background: #444;
      border: 1px solid #666;
      color: #ccc;
      font-size: 11px;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 3px;
      cursor: pointer;
    `;
    closeBtn.textContent = "×";
    closeBtn.title = "Close";

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content area
    const contentArea = document.createElement("div");
    contentArea.style.cssText = `
      flex: 1;
      overflow: hidden;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // Atlas section (always visible, no scrolling)
    const atlasSection = document.createElement("div");
    atlasSection.style.cssText = `
      flex-shrink: 0;
      overflow: visible;
    `;
    atlasSection.appendChild(wrapper);

    // Add search section
    const searchSection = document.createElement("div");
    searchSection.style.cssText = `
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 6px;
      background: #1f2428;
      border: 1px solid #2a2f35;
      border-radius: 4px;
    `;

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search images...";
    const initFilter = (window.filterImageSets || "").toString();
    searchInput.value = initFilter;
    searchInput.style.cssText = `
      flex: 1;
      padding: 4px 6px;
      font: 11px Arial;
      background: transparent;
      color: #d0d4d8;
      border: none;
      outline: none;
    `;

    const searchInfo = document.createElement("span");
    searchInfo.style.cssText = `
      font-size: 10px;
      color: #888;
      min-width: 60px;
      text-align: right;
      white-space: nowrap;
    `;

    searchSection.appendChild(searchInput);
    searchSection.appendChild(searchInfo);

    // Image list container (scrollable)
    const imageListContainer = document.createElement("div");
    imageListContainer.style.cssText = `
      flex: 1; 
      overflow: auto;
      min-height: 200px;
    `;

    contentArea.appendChild(atlasSection);
    contentArea.appendChild(searchSection);
    contentArea.appendChild(imageListContainer);

    modalContent.appendChild(header);
    modalContent.appendChild(contentArea);

    // Make modal draggable by header (not search input)
    this._makeModalDraggable(modalContent, header);

    // Setup search functionality - pass imageListContainer instead of contentArea
    this._setupImagesetSearch(searchInput, searchInfo, imageListContainer);
    if (initFilter) {
      setTimeout(() => {
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        try {
          delete window.filterImageSets;
        } catch (_) {
          window.filterImageSets = undefined;
        }
      }, 10);
    }
    // Close handlers
    const closeModal = () => {
      modalContent.remove();
      document.removeEventListener("keydown", escapeHandler);
    };

    closeBtn.addEventListener("click", closeModal);

    const escapeHandler = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", escapeHandler);

    document.body.appendChild(modalContent);
    console.log(`📱 Showing imageset panel: ${imagesetName}`);

    // Return imageListContainer for moving image list items
    return { imageListContainer };
  }

  /**
   * Setup search functionality for imageset preview
   * @private
   */
  _setupImagesetSearch(searchInput, searchInfo, contentArea) {
    let allImageItems = [];
    let filteredCount = 0;
    let totalCount = 0;

    // Initialize search data
    const updateSearchInfo = () => {
      if (allImageItems.length === 0) {
        allImageItems = Array.from(contentArea.querySelectorAll(".image-item"));
        totalCount = allImageItems.length;
      }
      searchInfo.textContent =
        filteredCount === totalCount
          ? `${totalCount} items`
          : `${filteredCount}/${totalCount}`;
    };

    // Search function
    const performSearch = (query) => {
      if (allImageItems.length === 0) {
        allImageItems = Array.from(contentArea.querySelectorAll(".image-item"));
        totalCount = allImageItems.length;
      }

      const searchTerm = query.toLowerCase().trim();
      filteredCount = 0;

      allImageItems.forEach((item) => {
        const imageName = item.getAttribute("data-image-name") || "";
        const isVisible =
          searchTerm === "" || imageName.toLowerCase().includes(searchTerm);

        item.style.display = isVisible ? "" : "none";
        if (isVisible) filteredCount++;

        // Also hide/show corresponding regions on atlas
        const regions = contentArea.querySelectorAll(".imageset-region");
        regions.forEach((region) => {
          if (region.getAttribute("data-image-name") === imageName) {
            region.style.display = isVisible ? "" : "none";
          }
        });
      });

      updateSearchInfo();

      // Highlight search term in visible items
      if (searchTerm) {
        allImageItems.forEach((item) => {
          if (item.style.display !== "none") {
            const nameSpan = item.querySelector(".image-name");
            if (nameSpan) {
              const originalName =
                nameSpan.getAttribute("data-original-name") ||
                nameSpan.textContent;
              if (!nameSpan.hasAttribute("data-original-name")) {
                nameSpan.setAttribute("data-original-name", originalName);
              }

              const highlightedName = originalName.replace(
                new RegExp(
                  `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                  "gi"
                ),
                '<span style="background: #ff6; color: #000; padding: 0 1px;">$1</span>'
              );
              nameSpan.innerHTML = highlightedName;
            }
          }
        });
      } else {
        // Remove highlights
        allImageItems.forEach((item) => {
          const nameSpan = item.querySelector(".image-name");
          if (nameSpan && nameSpan.hasAttribute("data-original-name")) {
            nameSpan.textContent = nameSpan.getAttribute("data-original-name");
          }
        });
      }
    };

    // Search input events
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(e.target.value);
      }, 200);
    });

    // Focus search with Ctrl+F
    document.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "f" &&
        contentArea.contains(document.activeElement)
      ) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    // Initialize count
    setTimeout(() => {
      updateSearchInfo();
    }, 100);
  }

  /**
   * Make modal draggable by header
   * @private
   */
  _makeModalDraggable(modalContent, header) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = modalContent.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // Change cursor
      header.style.cursor = "grabbing";

      // Prevent text selection
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep modal within viewport bounds
      const maxX = window.innerWidth - modalContent.offsetWidth;
      const maxY = window.innerHeight - modalContent.offsetHeight;

      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      modalContent.style.position = "fixed";
      modalContent.style.left = clampedX + "px";
      modalContent.style.top = clampedY + "px";
      modalContent.style.transform = "none";
      modalContent.style.margin = "0";
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = "move";
      }
    });
  }

  /**
   * Show error UI for imageset preview failures
   * @private
   */
  _showImagesetPreviewError(err, imagesetName, imageFile, asModal = false) {
    try {
      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "padding:10px;margin:8px;border:1px solid #552222;background:linear-gradient(#2b1d1d,#1e1414);font:12px/1.4 Arial,sans-serif;color:#f2dede;box-shadow:0 0 4px rgba(0,0,0,0.5);";

      wrapper.innerHTML = `
        <div style="font-weight:bold;margin-bottom:6px;color:#ffb3b3;">Imageset Preview Error</div>
        <div><strong>Imageset:</strong> ${imagesetName || "(unknown)"}</div>
        <div><strong>Texture:</strong> ${imageFile || "(none)"}</div>
        <div style="margin-top:6px;padding:6px;background:#3a2424;border:1px solid #703737;border-radius:4px;white-space:pre-wrap;max-height:140px;overflow:auto;">
          ${err && err.message ? err.message : String(err)}
        </div>
        <div style="margin-top:8px;font-size:11px;color:#ffcccc;">Cannot render imageset preview. Check texture path or XML syntax.</div>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
          <button class="retry-btn" style="background:#663333;border:1px solid #aa5555;color:#ffdada;padding:4px 10px;cursor:pointer;">Retry</button>
          <button class="close-err-btn" style="background:#444;border:1px solid #777;color:#ddd;padding:4px 10px;cursor:pointer;">Close</button>
        </div>`;

      // Event handlers
      wrapper.querySelector(".close-err-btn").onclick = () => {
        if (asModal) {
          const modal = wrapper.closest(".imageset-modal");
          if (modal) modal.remove();
        } else {
          wrapper.remove();
        }
      };

      wrapper.querySelector(".retry-btn").onclick = () => {
        console.log("Retry imageset preview requested");
      };

      if (asModal) {
        this._showImagesetModal(
          wrapper,
          "Error: " + (imagesetName || "Unknown")
        );
      } else {
        if (this.elements && this.elements.canvasContent) {
          this.elements.canvasContent.appendChild(wrapper);
        } else {
          document.body.appendChild(wrapper);
        }
      }
    } catch (uiErr) {
      console.warn("Failed to render imageset error panel", uiErr);
    }
  }

  /**
   * Render elements to canvas
   * @param {Array} elements - Elements to render
   */
  renderElementsToCanvas(elements) {
    if (
      !this.elements ||
      !this.elements.canvas ||
      !this.elements.canvasContext
    ) {
      console.warn("Canvas not available for rendering elements");
      return;
    }

    const canvas = this.elements.canvas;
    const ctx = this.elements.canvasContext;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!elements || elements.length === 0) {
      // Draw "no elements" message
      ctx.fillStyle = "#888";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "No elements to render",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    // Render each element
    elements.forEach((element) => {
      try {
        this._renderElement(ctx, element);
      } catch (err) {
        console.warn("Failed to render element:", element, err);
      }
    });
  }

  /**
   * Render single element to canvas context
   * @private
   */
  _renderElement(ctx, element) {
    if (!element || !element.texture) return;

    const x = parseFloat(element.x) || 0;
    const y = parseFloat(element.y) || 0;
    const width = parseFloat(element.width) || 32;
    const height = parseFloat(element.height) || 32;

    // Draw element background
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, width, height);

    // Draw element border
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Draw element name if available
    if (element.name) {
      ctx.fillStyle = "#fff";
      ctx.font = "10px Arial";
      ctx.textAlign = "left";
      ctx.fillText(element.name, x + 2, y + 12);
    }
  }

  /**
   * Calculate bounds for all elements
   * @param {Array} elements - Array of elements
   * @returns {Array} Elements with calculated bounds
   */
  calculateElementBounds(elements) {
    const elementsWithBounds = [];
    const boundsCache = new Map();

    for (const element of elements) {
      try {
        let bounds;
        const elementId = element.id || element.name || "unnamed";

        if (boundsCache.has(elementId)) {
          bounds = boundsCache.get(elementId);
        } else {
          bounds = this._calculateSingleElementBounds(element);
          boundsCache.set(elementId, bounds);
        }

        elementsWithBounds.push({
          ...element,
          bounds: bounds,
        });
      } catch (error) {
        console.warn("Error calculating bounds for element:", element, error);
        elementsWithBounds.push(element);
      }
    }

    return elementsWithBounds;
  }

  /**
   * Calculate bounds for single element
   * @private
   */
  _calculateSingleElementBounds(element) {
    const bounds = {
      x: parseFloat(element.x) || 0,
      y: parseFloat(element.y) || 0,
      width: parseFloat(element.width) || 32,
      height: parseFloat(element.height) || 32,
    };

    if (
      this.layoutCalculator &&
      typeof this.layoutCalculator.calculateElementBounds === "function"
    ) {
      try {
        const parentBox = { x: 0, y: 0, width: 1024, height: 768 };
        const calculatedBounds = this.layoutCalculator.calculateElementBounds(
          element,
          parentBox
        );
        if (calculatedBounds) {
          Object.assign(bounds, calculatedBounds);
        }
      } catch (error) {
        console.warn("Layout calculator error:", error);
      }
    }

    return bounds;
  }

  /**
   * Render all elements
   * @param {Array} elements - Array of elements to render
   */
  async renderElements(elements) {
    this.setStatus("Ensuring imagesets are loaded...");

    // Make sure imagesets are loaded before rendering
    if (window.ImagesetLoader) {
      try {
        this._ensureImagesetStatusPanel();
      } catch (error) {
        console.warn("Error ensuring imagesets loaded:", error);
      }
    }

    this.setStatus("Rendering elements...");
    this.clearCanvas();

    // Use GUI Renderer if available, otherwise fall back to legacy rendering
    if (this.guiRenderer) {
      try {
        console.log('🔄 Using GUI Renderer for hierarchical rendering');
        await this.guiRenderer.renderElements(elements);
        
        this.setStatus(`Rendered ${elements.length} elements (Hierarchical)`);
        this.log(`Rendered ${elements.length} elements using GUI Renderer`, "success");
        return;
      } catch (error) {
        console.error('❌ GUI Renderer failed, falling back to legacy rendering:', error);
        this.log(`GUI Renderer failed: ${error.message}. Using legacy rendering.`, "warning");
      }
    }

    // Legacy rendering fallback
    let elementsWithBounds;
    if (this.layoutCalculator) {
      const computed = this.layoutCalculator.compute(elements);
      elementsWithBounds = computed.map((el) => ({
        element: el,
        bounds: el.bounds,
      }));
    } else {
      elementsWithBounds = this.calculateElementBounds(elements);
    }
    // Xóa toàn bộ nội dung cũ trước khi render mới
    if (this.elements.canvasContent) {
      this.elements.canvasContent.innerHTML = "";
    }
    const frag = document.createDocumentFragment();
    // Cache currentElements để tra cứu nhanh khi click
    const elementMap = new Map();
    elementsWithBounds.forEach(({ element, bounds }) => {
      const dom = this.renderSingleElement(element, bounds);
      if (dom) {
        frag.appendChild(dom);
        if (element.path) elementMap.set(element.path, element);
        if (element.name) elementMap.set(element.name, element);
      }
    });
    this.elements.canvasContent.appendChild(frag);
    // Bind event click một lần, tra cứu qua map
    if (!this._canvasClickBound) {
      this._canvasClickBound = true;
      this.elements.canvasContent.addEventListener("click", (e) => {
        const target = e.target.closest(".tlbb-element");
        if (!target) return;
        const path = target.getAttribute("data-tlbb-path");
        const name = target.getAttribute("data-tlbb-name");
        let elObj = elementMap.get(path) || elementMap.get(name);
        if (elObj) this.selectElement(elObj);
      });
    }
    this.setStatus(`Rendered ${elements.length} elements (Legacy)`);
    this.log(`Rendered ${elements.length} elements using legacy renderer`, "success");
  }

  /**
   * Calculate bounds for all elements
   * @param {Array} elements - Array of elements
   * @returns {Array} Elements with calculated bounds
   */
  calculateElementBounds(elements) {
    // legacy path (kept for comparison)
    const elementsWithBounds = [];
    const boundsCache = new Map();

    console.log("🔧 Calculating bounds for", elements.length, "elements");
    console.log("🔧 Current viewport:", this.currentViewport);
    console.log("🔧 LayoutCalculator instance:", this.layoutCalculator);

    if (!this.positionCalculator) {
      console.error("❌ PositionCalculator not available!");
      return [];
    }

    // Sort elements by hierarchy depth to ensure parents are calculated first
    const sortedElements = [...elements].sort((a, b) => {
      const aDepth = (a.parentPath || "").split("/").filter((p) => p).length;
      const bDepth = (b.parentPath || "").split("/").filter((p) => p).length;
      return aDepth - bDepth;
    });

    for (const element of sortedElements) {
      let parentBounds = null;

      // Find parent bounds if element has parent
      if (element.parentPath) {
        parentBounds = boundsCache.get(element.parentPath);
        if (parentBounds) {
          console.log(
            `🔗 Found parent bounds for ${element.name}:`,
            parentBounds
          );
        } else {
          console.warn(
            `⚠️ Parent bounds not found for ${element.name}, parent path: ${element.parentPath}`
          );
        }
      }

      console.log("🧮 Calculating bounds for element:", {
        name: element.name,
        type: element.type,
        unifiedPosition: element.unifiedPosition,
        unifiedSize: element.unifiedSize,
        absolutePosition: element.absolutePosition,
        absoluteSize: element.absoluteSize,
        parentBounds: parentBounds,
      });

      // Calculate bounds with current viewport
      let bounds;
      if (this.layoutCalculator) {
        // Dùng layoutCalculator một lần /cache/ sau đó chỉ đọc
        // (Tối ưu: tính tất cả ngoài vòng lặp – nhưng giữ backward compatibility)
        if (!element.__layoutComputed) {
          // compute single element using parent (ad‑hoc)
          bounds = this.layoutCalculator.calculateElementBounds(
            element,
            parentBounds || {
              x: 0,
              y: 0,
              width: this.currentViewport.width,
              height: this.currentViewport.height,
            }
          );
          element.bounds = bounds;
          element.boundsOriginal = { ...bounds };
          element.__layoutComputed = true;
        } else {
          bounds = element.bounds;
        }
      } else if (this.positionCalculator) {
        bounds = this.positionCalculator.calculateElementBounds(
          element,
          parentBounds,
          this.currentViewport
        );
      } else {
        bounds = { x: 0, y: 0, width: 0, height: 0 };
      }

      console.log(`✅ Calculated bounds for ${element.name}:`, bounds);

      // Validate bounds - add safety check
      if (
        bounds.width > 5000 ||
        bounds.height > 5000 ||
        bounds.x > 5000 ||
        bounds.y > 5000
      ) {
        console.warn(
          `⚠️ Suspicious bounds for ${element.name}, clamping:`,
          bounds
        );
        bounds.width = Math.min(bounds.width, 1024);
        bounds.height = Math.min(bounds.height, 768);
        bounds.x = Math.max(0, Math.min(bounds.x, 1024));
        bounds.y = Math.max(0, Math.min(bounds.y, 768));
        console.log(`🛡️ Clamped bounds for ${element.name}:`, bounds);
      }

      // Cache bounds by element path
      boundsCache.set(element.path, bounds);

      elementsWithBounds.push({ element, bounds });
    }

    return elementsWithBounds;
  }

  /**
   * Calculate hierarchy level for element based on its path
   * @param {Object} element - Element object
   * @returns {number} Hierarchy level (0 for root, 1 for first level children, etc.)
   */
  calculateElementLevel(element) {
    if (!element.path) return 0;

    // Count the number of separators in the path to determine hierarchy level
    // Example: "Root" = level 0, "Root/Child" = level 1, "Root/Child/SubChild" = level 2
    const pathParts = element.path.split("/").filter((part) => part.length > 0);
    return Math.max(0, pathParts.length - 1);
  }

  /**
   * Render single element
   * @param {Object} element - Element to render
   * @param {Object} bounds - Element bounds
   */
  renderSingleElement(element, bounds) {
    // Apply properties to bounds first (sync properties -> bounds)
    this._applyPropertiesToBounds(element);

    // Calculate hierarchy level based on element path
    const level = this.calculateElementLevel(element);

    let domElement = null;
    if (this.windowRenderer.isWindowType(element.type)) {
      domElement = this.windowRenderer.renderWindow(element, bounds, level);
    } else if (this.buttonRenderer.isButtonType(element.type)) {
      domElement = this.buttonRenderer.renderButton(element, bounds, level);
    } else {
      domElement = this.windowRenderer.renderDefaultWindow(
        element,
        bounds,
        level
      );
    }
    if (!domElement) return null;

    // Ensure hierarchy attributes are set if not already set by renderer
    if (!domElement.hasAttribute("data-level")) {
      domElement.setAttribute("data-level", level.toString());
    }

    // Set child count if not already set
    if (!domElement.hasAttribute("data-child-count")) {
      const childCount = element.children ? element.children.length : 0;
      if (childCount > 0) {
        domElement.setAttribute("data-has-children", "true");
        domElement.setAttribute("data-child-count", childCount.toString());
      } else {
        domElement.setAttribute("data-has-children", "false");
      }
    }

    if (element.path) domElement.dataset.tlbbPath = element.path;
    if (element.name) domElement.dataset.tlbbName = element.name;
    try {
      const props = element.properties || {};
      if (
        element.type === "TLBB_StaticImageNULL" &&
        props.Image &&
        window.ImagesetLoader
      ) {
        const cssInfo = window.ImagesetLoader.getImageCSS(props.Image);

        if (cssInfo) {
          let imgLayer = domElement.querySelector(
            ":scope > .tlbb-staticimage-layer"
          );
          if (!imgLayer) {
            imgLayer = document.createElement("div");
            imgLayer.className = "tlbb-staticimage-layer";
            imgLayer.style.position = "absolute";
            imgLayer.style.left = "0";
            imgLayer.style.top = "0";
            imgLayer.style.pointerEvents = "none";
            domElement.appendChild(imgLayer);
          }
          imgLayer.style.width = cssInfo.width;
          imgLayer.style.height = cssInfo.height;
          imgLayer.style.backgroundImage = cssInfo.backgroundImage;
          imgLayer.style.backgroundRepeat = cssInfo.backgroundRepeat;
          imgLayer.style.backgroundPosition = cssInfo.backgroundPosition;
          if (cssInfo.backgroundSize)
            imgLayer.style.backgroundSize = cssInfo.backgroundSize;
          imgLayer.title = props.Image;
          if (cssInfo.isPlaceholder) imgLayer.style.outline = "1px dashed #555";
        }
      }
    } catch (e) {
      console.warn("Imageset image apply failed", e);
    }
    if (element.boundsOriginal && !domElement.__layoutProtected) {
      this.protectLayout(domElement, element.boundsOriginal);
    }
    this.windowRenderer.renderedElements.set(element, domElement);
    if (
      (bounds.width < 3 || bounds.height < 3) &&
      !domElement.querySelector(".tlbb-small-indicator")
    ) {
      const warn = document.createElement("div");
      warn.classList.add("tlbb-small-indicator");
      warn.title = `Very small element (${bounds.width}x${bounds.height})`;
      domElement.appendChild(warn);
    }
    return domElement;
  }

  /**
   * Protect layout (left, top, width, height) from accidental mutation by styling
   */
  protectLayout(domElement, originalBounds) {
    // Store mutable reference so we can update later when user edits size/position
    domElement.__layoutOriginalBounds = { ...originalBounds };
    const enforce = () => {
      const ob = domElement.__layoutOriginalBounds;
      if (!ob) return;
      const s = domElement.style;
      if (parseFloat(s.left) !== ob.x) s.left = ob.x + "px";
      if (parseFloat(s.top) !== ob.y) s.top = ob.y + "px";
      if (parseFloat(s.width) !== ob.width) s.width = ob.width + "px";
      if (parseFloat(s.height) !== ob.height) s.height = ob.height + "px";
    };
    enforce();
    // Reuse existing observer if present
    if (domElement.__layoutProtectedObserver)
      domElement.__layoutProtectedObserver.disconnect();
    const mo = new MutationObserver(() => enforce());
    mo.observe(domElement, { attributes: true, attributeFilter: ["style"] });
    domElement.__layoutProtectedObserver = mo;
    domElement.__layoutProtected = true;
  }

  /**
   * Apply updated computed bounds to already rendered DOM elements (after edits)
   */
  applyRecomputedBounds() {
    if (!this.currentElements) return;
    for (const el of this.currentElements) {
      const dom = this.windowRenderer.renderedElements.get(el);
      if (!dom || !el.bounds) continue;
      // Update mutable original bounds reference used by protection
      if (dom.__layoutOriginalBounds) {
        Object.assign(dom.__layoutOriginalBounds, el.bounds);
      }
      // Apply visual size (respect visualWidth/visualHeight)
      dom.style.left = el.bounds.x + "px";
      dom.style.top = el.bounds.y + "px";
      dom.style.width = (el.bounds.visualWidth ?? el.bounds.width) + "px";
      dom.style.height = (el.bounds.visualHeight ?? el.bounds.height) + "px";
    }
  }

  /**
   * Update XML tree display
   * @param {Array} tree - Tree structure
   */
  updateXMLTree(tree) {
    if (!this.elements || !this.elements.xmlStructureTree) return;
    const container = this.elements.xmlStructureTree;
    container.innerHTML = "";
    // Map element object -> DOM tree item for quick highlight sync
    this._treeItemMap = new Map(); // legacy (object reference)
    this._treeItemByPath = new Map(); // NEW: reliable path based mapping
    this._treeElementList = [];
    const filterText =
      (this.elements.xmlStructureSearch &&
        this.elements.xmlStructureSearch.value.trim().toLowerCase()) ||
      "";
    // Debounced search binding
    if (
      this.elements.xmlStructureSearch &&
      !this.elements.xmlStructureSearch._bound
    ) {
      let to;
      this.elements.xmlStructureSearch.addEventListener("input", () => {
        clearTimeout(to);
        to = setTimeout(() => this.updateXMLTree(this.currentTree), 150);
      });
      this.elements.xmlStructureSearch._bound = true;
    }
    // Recursive builder
    const build = (node, parentEl) => {
      const item = this.createTreeItem(node);
      // Filter by name/type (keep parents of matches)
      const name = (node.name || "").toLowerCase();
      const type = (node.type || "").toLowerCase();
      let visible = true;
      if (filterText) {
        const selfMatch =
          name.includes(filterText) || type.includes(filterText);
        if (!selfMatch) {
          // Check descendant match
          const descHas = (function checkDesc(n) {
            if (!n.children) return false;
            return n.children.some(
              (ch) =>
                (ch.name || "").toLowerCase().includes(filterText) ||
                (ch.type || "").toLowerCase().includes(filterText) ||
                checkDesc(ch)
            );
          })(node);
          visible = selfMatch || descHas;
        }
      }
      if (!visible) return; // skip whole branch if no match anywhere
      parentEl.appendChild(item);
      // Map for highlight (prefer underlying element if present)
      const elemObj = node.element || node;
      this._treeItemMap.set(elemObj, item);
      const pth = (elemObj && elemObj.path) || node.path;
      if (pth) this._treeItemByPath.set(pth, item);
      if (node.children && node.children.length) {
        const childWrap = document.createElement("div");
        childWrap.className = "tree-children";
        childWrap.style.marginLeft = "14px";
        item.appendChild(childWrap);
        node.children.forEach((ch) => build(ch, childWrap));
      }
    };
    tree.forEach((rootNode) => build(rootNode, container));
  }

  /**
   * Create tree item
   * @param {Object} node - Tree node
   * @param {number} level - Nesting level
   * @returns {HTMLElement} Tree item element
   */
  createTreeItem(node, level = 0) {
    const item = document.createElement("div");
    item.className = "tree-item";
    item.dataset.path = node.path || "";
    // Row header
    const row = document.createElement("div");
    row.className = "tree-row";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.cursor = "pointer";
    row.style.userSelect = "none";
    // Toggle arrow
    const hasChildren = node.children && node.children.length > 0;
    const toggle = document.createElement("span");
    toggle.className = "tree-toggle";
    toggle.textContent = hasChildren ? "▼" : "•";
    toggle.style.width = "16px";
    toggle.style.display = "inline-block";
    toggle.style.textAlign = "center";
    toggle.style.opacity = hasChildren ? "0.85" : "0.4";
    // Label
    const label = document.createElement("span");
    label.className = "tree-content";
    label.textContent = `${node.name} (${node.type})`;
    label.style.flex = "1";
    label.style.fontSize = "12px";
    label.style.padding = "2px 4px";
    row.appendChild(toggle);
    row.appendChild(label);
    item.appendChild(row);
    // Selection click
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      const elObj = node.element || node; // underlying parsed element
      this.selectElement(elObj);
      // highlight handled in selectElement now
    });
    // Expand / collapse
    if (hasChildren) {
      let collapsed = false;
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        collapsed = !collapsed;
        toggle.textContent = collapsed ? "▶" : "▼";
        const childWrap = item.querySelector(":scope > .tree-children");
        if (childWrap) childWrap.style.display = collapsed ? "none" : "block";
      });
      // Double-click row also toggles
      row.addEventListener("dblclick", () => toggle.click());
    }
    return item;
  }

  /**
   * Select element
   * @param {Object} element - Element to select
   */
  selectElement(element) {
    this.selectedElement = element;
    // Update property panel
    this.updatePropertyPanel(element);

    // Update canvas selection
    this.updateCanvasSelection(element);
    // Highlight in tree if mapping exists
    if (element) {
      this.elements.xmlStructureTree
        .querySelectorAll(".tree-item.selected")
        .forEach((el) => el.classList.remove("selected"));
      let treeItem = null;
      if (this._treeItemByPath && element.path) {
        treeItem = this._treeItemByPath.get(element.path);
        if (!treeItem && element.path) {
          // Try partial ancestor path if full not found (debug aid)
          const parts = element.path.split("/");
          while (!treeItem && parts.length > 1) {
            parts.pop();
            const partial = parts.join("/");
            treeItem = this._treeItemByPath.get(partial);
          }
        }
      }
      if (!treeItem && this._treeItemMap) {
        treeItem = this._treeItemMap.get(element); // fallback object ref
      }
      if (treeItem) {
        treeItem.classList.add("selected");
        // Ensure all ancestors expanded
        let parent = treeItem.parentElement;
        while (parent && parent !== this.elements.xmlStructureTree) {
          if (parent.classList.contains("tree-children")) {
            const owner = parent.parentElement; // item
            const tg =
              owner && owner.querySelector(":scope > .tree-row > .tree-toggle");
            if (tg && tg.textContent === "▶") tg.click();
          }
          parent = parent.parentElement;
        }
        // Scroll into view (tree side)
        treeItem.scrollIntoView({ block: "center" });
      } else {
        console.debug(
          "[XMLTree] No tree item found for selection path",
          element.path,
          element.name
        );
      }
    }
    this.emit("elementSelected", element);
  }

  /**
   * Update property panel
   * @param {Object} element - Selected element
   */
  updatePropertyPanel(element) {
    const panel = this.elements.propertyPanel;
    if (!element) {
      panel.innerHTML = `<p class="no-selection">Chọn một phần tử để xem thuộc tính</p>
                        <div id="propertyContent"></div>`;
      return;
    }
    // Build typePropertyMap and detect new types/properties
    let typePropertyMap = {};
    if (this.propertyParser) {
      typePropertyMap = this.buildTypePropertyMap(this.currentElements || []);
      if (window.Global_typePropertyMap) {
        const newTypes = [];
        for (const type in typePropertyMap) {
          if (!window.Global_typePropertyMap[type]) {
            newTypes.push(type);
          } else {
            const newProps = typePropertyMap[type].filter(
              (p) => !window.Global_typePropertyMap[type].includes(p)
            );
            if (newProps.length) {
              newTypes.push(type + ": " + newProps.join(", "));
            }
          }
        }
        if (newTypes.length) {
          this.log(
            "[typePropertyMap] Phát hiện mới: " + newTypes.join("; "),
            "info"
          );
        }
      }
    }
    const propertyContent = document.getElementById("propertyContent");
    propertyContent.innerHTML = "";
    const frag = document.createDocumentFragment();
    frag.appendChild(this._renderPanelHeader(element));
    const properties = Object.entries(element.properties || {});
    frag.appendChild(this._renderPropertyGroup(properties));
    propertyContent.appendChild(frag);
    this._setupAutoSave(panel, element);
  }
  // Undo/Redo phiên bản
  undoVersion() {
    const KEY_VERSIONS = "TLBB_XML_VERSIONS";
    let versions = [];
    try {
      versions = JSON.parse(localStorage.getItem(KEY_VERSIONS) || "[]");
    } catch (_) {}
    if (versions.length < 2) return;
    versions.pop(); // bỏ bản hiện tại
    const last = versions[versions.length - 1];
    if (last && last.elements) {
      this.currentElements = JSON.parse(JSON.stringify(last.elements));
      this.currentTree = this.xmlParser.buildElementTree(this.currentElements);
      this.renderElements(this.currentElements);
      localStorage.setItem(KEY_VERSIONS, JSON.stringify(versions));
    }
  }

  restoreOriginalXML() {
    const KEY_ORIGINAL_XML = "TLBB_ORIGINAL_XML";
    const xml = localStorage.getItem(KEY_ORIGINAL_XML);
    if (xml) {
      this.loadXML(xml);
      window.__tlbbShowToast &&
        window.__tlbbShowToast("Đã khôi phục về bản gốc!", 1800);
    }
  }

  // ===== Snapshot Versioning =====
  saveSnapshot() {
    return {
      ts: Date.now(),
      elements: this.currentElements.map((e) => ({
        // shallow serialize needed fields
        name: e.name,
        path: e.path,
        parentPath: e.parentPath,
        type: e.type,
        visible: e.visible !== false,
        unifiedPosition: e.unifiedPosition,
        unifiedSize: e.unifiedSize,
        unifiedXPosition: e.unifiedXPosition,
        unifiedYPosition: e.unifiedYPosition,
        unifiedXSize: e.unifiedXSize,
        unifiedYSize: e.unifiedYSize,
        absolutePosition: e.absolutePosition,
        absoluteSize: e.absoluteSize,
        position: e.position,
        size: e.size,
        text: e.text,
        font: e.font,
        textColor: e.textColor,
        image: e.image,
        normalImage: e.normalImage,
        hoverImage: e.hoverImage,
        pushedImage: e.pushedImage,
        disabledImage: e.disabledImage,
        properties: { ...(e.properties || {}) },
        events: { ...(e.events || {}) },
      })),
    };
  }
  loadSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.elements)) return;
    // Replace current elements
    this.currentElements = snapshot.elements.map((raw) => ({
      events: {},
      ...raw,
      events: raw.events || {},
    }));
    // Rebuild tree (names & parentPath already present)
    this.currentTree = this.xmlParser
      ? this.xmlParser.buildElementTree(this.currentElements)
      : [];
    // Recompute layout & re-render
    if (this.layoutCalculator)
      this.layoutCalculator.compute(this.currentElements);
    this.clearCanvas();
    this.renderElements(this.currentElements);
  }

  // Generate simplified XML from currentElements (lossy but preserves edited properties)
  generateXMLFromElements(elements) {
    // Build parent map for ratio calculations
    const parentMap = new Map();
    elements.forEach((e) => parentMap.set(e.path, e));
    const vw =
      (this.layoutCalculator && this.layoutCalculator.virtualWidth) || 1024;
    const vh =
      (this.layoutCalculator && this.layoutCalculator.virtualHeight) || 768;
    const fmt = (n) => {
      // Use 6 decimals for TLBB format precision
      return (Math.abs(n) < 1e-8 ? 0 : n).toFixed(6);
    };
    elements.forEach((el) => {
      if (!el.properties) return; // Skip elements without properties
      const b = el.bounds || el.boundsOriginal || el._initialBounds;
      if (b) {
        // Decide if moved/resized compared to initial
        const init = el._initialBounds;
        const changed =
          !init ||
          Math.round(init.x) !== Math.round(b.x) ||
          Math.round(init.y) !== Math.round(b.y) ||
          Math.round(init.width) !== Math.round(b.width) ||
          Math.round(init.height) !== Math.round(b.height);
        // Nếu có original unified và chưa bị đánh dấu dirtyTransform thì giữ nguyên original
        const allowRecompute =
          el._dirtyTransform ||
          !el._originalUnifiedSize ||
          !el._originalUnifiedPosition;
        if (changed && allowRecompute) {
          // Compute unified from current bounds
          let pb;
          if (el.parentPath && parentMap.has(el.parentPath)) {
            const p = parentMap.get(el.parentPath);
            pb = p.bounds ||
              p.boundsOriginal ||
              p._initialBounds || { x: 0, y: 0, width: vw, height: vh };
          } else {
            pb = { x: 0, y: 0, width: vw, height: vh };
          }
          const localX = b.x - (pb.x || 0);
          const localY = b.y - (pb.y || 0);
          const relX = pb.width ? localX / pb.width : 0;
          const relY = pb.height ? localY / pb.height : 0;
          const relW = pb.width ? b.width / pb.width : 0;
          const relH = pb.height ? b.height / pb.height : 0;

          // Only update properties that already exist, use TLBB format {{rel,abs},{rel,abs}}
          if (el.properties.UnifiedPosition !== undefined) {
            const uPos = `{{${fmt(relX)},${fmt(localX)}},{${fmt(relY)},${fmt(
              localY
            )}}}`;
            el.properties.UnifiedPosition = uPos;
            el.unifiedPosition = uPos;
          }
          if (el.properties.UnifiedSize !== undefined) {
            const uSize = `{{${fmt(relW)},${fmt(b.width)}},{${fmt(relH)},${fmt(
              b.height
            )}}}`;
            el.properties.UnifiedSize = uSize;
            el.unifiedSize = uSize;
          }
        } else {
          // Keep original unified if existed
          if (
            el._originalUnifiedPosition &&
            el.properties.UnifiedPosition !== undefined
          )
            el.properties.UnifiedPosition = el._originalUnifiedPosition;
          if (
            el._originalUnifiedSize &&
            el.properties.UnifiedSize !== undefined
          )
            el.properties.UnifiedSize = el._originalUnifiedSize;
        }
        // Only drop Absolute* when Unified exists and was originally there
        if (
          el.properties.UnifiedPosition &&
          el.properties.AbsolutePosition !== undefined
        ) {
          delete el.properties.AbsolutePosition;
        }
        if (
          el.properties.UnifiedSize &&
          el.properties.AbsoluteSize !== undefined
        ) {
          delete el.properties.AbsoluteSize;
        }
      }
      if (el.visible === false) el.properties.Visible = "False";
      else if (el.visible === true) el.properties.Visible = "True";
    });
    const escape = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    // Build tree map
    const byPath = new Map();
    const roots = [];
    elements.forEach((el) => {
      byPath.set(el.path, { el, children: [] });
    });
    byPath.forEach((node) => {
      const parentPath = node.el.parentPath;
      if (parentPath && byPath.has(parentPath)) {
        byPath.get(parentPath).children.push(node);
      } else {
        roots.push(node);
      }
    });
    const renderNode = (node, depth) => {
      const { el, children } = node;
      const indent = "  ".repeat(depth);
      let xml = `${indent}<Window Type="${escape(el.type)}" Name="${escape(
        el.name
      )}">\n`;
      const props = el.properties || {};
      Object.entries(props).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        xml += `${indent}  <Property Name="${escape(k)}" Value="${escape(
          v
        )}"/>\n`;
      });
      children.forEach((ch) => {
        xml += renderNode(ch, depth + 1);
      });
      xml += `${indent}</Window>\n`;
      return xml;
    };
    let out = '<?xml version="1.0" encoding="UTF-8"?>\n<GUILayout>\n';
    roots.forEach((r) => {
      out += renderNode(r, 1);
    });
    out += "</GUILayout>";
    return out;
  }

  persistCurrentXML() {
    try {
      const xml = this.generateXMLFromElements(this.currentElements);
      localStorage.setItem("TLBB_CURRENT_XML", xml);
      this.currentXMLRaw = xml;
      return xml;
    } catch (e) {
      console.warn("persistCurrentXML failed", e);
    }
  }

  saveCurrentXML(download = true) {
    const xml = this.persistCurrentXML();
    if (download && xml) {
      // Derive filename
      let base = "layout_saved.xml";
      if (this.currentFileKey) {
        const fileName = this.currentFileKey.split(/\\|\//).pop();
        if (fileName) base = fileName.replace(/\.xml$/i, "") + "_edited.xml";
      }
      this.downloadText(base, xml);
      this.log("Đã xuất XML: " + base, "success");
      this.setStatus("Saved " + base);
      if (window.__tlbbShowToast)
        window.__tlbbShowToast("Đã xuất file: " + base, 2200);
    }
    return xml;
  }

  // Reload purely from what is in localStorage (ignores any passed file content)
  reloadFromStorage() {
    const stored = localStorage.getItem("TLBB_CURRENT_XML");
    if (!stored) {
      console.warn("reloadFromStorage: no TLBB_CURRENT_XML");
      return;
    }
    return this.loadXML(stored);
  }

  /**
   * Format element bounds for display
   * @param {Object} element - Element
   * @returns {string} Formatted bounds
   */
  formatElementBounds(element) {
    if (!element) return "";
    // Prefer already computed bounds from layoutCalculator
    let b = element.bounds;
    if (!b) {
      // Attempt to compute with proper parent context
      const parent = element.parentPath
        ? this.currentElements.find((e) => e.path === element.parentPath)
        : null;
      const parentBox =
        parent && parent.bounds
          ? parent.bounds
          : {
              x: 0,
              y: 0,
              width: this.currentViewport?.width || 1024,
              height: this.currentViewport?.height || 768,
            };
      try {
        if (
          this.layoutCalculator &&
          typeof this.layoutCalculator.calculateElementBounds === "function"
        ) {
          b = this.layoutCalculator.calculateElementBounds(element, parentBox);
        } else if (
          this.positionCalculator &&
          typeof this.positionCalculator.calculateElementBounds === "function"
        ) {
          b = this.positionCalculator.calculateElementBounds(
            element,
            parentBox,
            this.currentViewport
          );
        }
      } catch (e) {
        console.warn("formatElementBounds fallback calc failed", e);
      }
    }
    if (!b) return "";
    return `${Math.round(b.x)}, ${Math.round(b.y)} (${Math.round(
      b.width
    )}×${Math.round(b.height)})`;
  }

  /**
   * Get property value type for styling
   * @param {string} name - Property name
   * @param {any} value - Property value
   * @returns {string} Value type
   */
  getPropertyValueType(name, value) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("color")) return "color";
    if (lowerName.includes("position") || lowerName.includes("bounds"))
      return "position";
    if (
      lowerName.includes("size") ||
      lowerName.includes("width") ||
      lowerName.includes("height")
    )
      return "size";
    if (lowerName.includes("text")) return "text";
    if (lowerName.includes("image")) return "image";
    if (lowerName.includes("event") || lowerName.includes("function"))
      return "event";
    if (
      value === "True" ||
      value === "False" ||
      value === true ||
      value === false
    )
      return "boolean";
    if (!isNaN(parseFloat(value)) && isFinite(value)) return "number";

    return "text";
  }

  /**
   * Update canvas selection
   * @param {Object} element - Selected element
   */
  updateCanvasSelection(element) {
    // Remove previous selection
    this.elements.canvasContent
      .querySelectorAll(".tlbb-element.selected")
      .forEach((el) => {
        el.classList.remove("selected");
        const hs = el.querySelector(".tlbb-transform-handles");
        if (hs) hs.remove();
      });

    if (element) {
      const domElement = this.elements.canvasContent.querySelector(
        `[data-tlbb-name="${element.name}"]`
      );
      if (domElement) {
        domElement.classList.add("selected");
        domElement.classList.add("blink-highlight");
        setTimeout(() => domElement?.classList?.remove("blink-highlight"), 900);
        this._attachTransformHandles(domElement, element);
        domElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  /**
   * Update element properties based on current bounds (for properties panel display)
   * Only updates existing properties, doesn't create new ones
   * @param {Object} element - Element to update
   * @param {Object} bounds - Current bounds {x, y, width, height}
   */
  _updateElementPropertiesFromBounds(element, bounds) {
    if (!element.properties) return; // Không tạo properties mới nếu chưa có

    // Get viewport dimensions
    const vw =
      (this.layoutCalculator && this.layoutCalculator.virtualWidth) || 1024;
    const vh =
      (this.layoutCalculator && this.layoutCalculator.virtualHeight) || 768;

    // Helper function to format numbers (6 decimal places for precision)
    const fmt = (n) => {
      return (Math.abs(n) < 1e-8 ? 0 : n).toFixed(6);
    };

    // Find parent bounds for relative calculations
    let parentBounds = { x: 0, y: 0, width: vw, height: vh };
    if (element.parentPath && this.currentElements) {
      const parent = this.currentElements.find(
        (e) => e.path === element.parentPath
      );
      if (parent && parent.bounds) {
        parentBounds = parent.bounds;
      }
    }

    // Calculate relative position and size
    const localX = bounds.x - (parentBounds.x || 0);
    const localY = bounds.y - (parentBounds.y || 0);
    const relX = parentBounds.width ? localX / parentBounds.width : 0;
    const relY = parentBounds.height ? localY / parentBounds.height : 0;
    const relW = parentBounds.width ? bounds.width / parentBounds.width : 0;
    const relH = parentBounds.height ? bounds.height / parentBounds.height : 0;

    // Only update properties that already exist
    let updated = false;

    // Check and update UnifiedPosition if it exists
    if (element.properties.UnifiedPosition !== undefined) {
      const uPos = `{{${fmt(relX)},${fmt(localX)}},{${fmt(relY)},${fmt(
        localY
      )}}}`;
      element.properties.UnifiedPosition = uPos;
      element.unifiedPosition = uPos;
      updated = true;
    }

    // Check and update UnifiedSize if it exists
    if (element.properties.UnifiedSize !== undefined) {
      const uSize = `{{${fmt(relW)},${fmt(bounds.width)}},{${fmt(relH)},${fmt(
        bounds.height
      )}}}`;
      element.properties.UnifiedSize = uSize;
      element.unifiedSize = uSize;
      updated = true;
    }

    // Check and update AbsolutePosition if it exists
    if (element.properties.AbsolutePosition !== undefined) {
      element.properties.AbsolutePosition = `{${bounds.x},${bounds.y}}`;
      updated = true;
    }

    // Check and update AbsoluteSize if it exists
    if (element.properties.AbsoluteSize !== undefined) {
      element.properties.AbsoluteSize = `{${bounds.width},${bounds.height}}`;
      updated = true;
    }

    // Only mark as dirty and log if something was actually updated
    if (updated) {
      element._dirtyTransform = true;

      // Log for debugging
      console.log(`🔄 Updated existing properties for ${element.name}:`, {
        UnifiedPosition: element.properties.UnifiedPosition,
        UnifiedSize: element.properties.UnifiedSize,
        bounds: bounds,
        parentBounds: parentBounds,
      });

      // Update property panel if this element is currently selected
      if (this.selectedElement === element) {
        console.log(
          `🔄 Updating property panel inputs after bounds change for ${element.name}`
        );
        this._updatePropertyInputValues(element);
      }

      // Emit event for testing
      this.emit("propertiesUpdated", { element, bounds });
    } else {
      console.log(
        `ℹ️ No position/size properties to update for ${element.name}`
      );
    }
  }

  /**
   * Apply UnifiedPosition/Size properties back to element bounds
   * @param {Object} element - Element to apply properties to
   */
  _applyPropertiesToBounds(element) {
    if (!element.properties) return;

    try {
      // Get viewport dimensions
      const vw =
        (this.layoutCalculator && this.layoutCalculator.virtualWidth) || 1024;
      const vh =
        (this.layoutCalculator && this.layoutCalculator.virtualHeight) || 768;

      // Find parent bounds
      let parentBounds = { x: 0, y: 0, width: vw, height: vh };
      if (element.parentPath && this.currentElements) {
        const parent = this.currentElements.find(
          (e) => e.path === element.parentPath
        );
        if (parent && parent.bounds) {
          parentBounds = parent.bounds;
        }
      }

      // Parse UnifiedPosition if exists
      if (element.properties.UnifiedPosition) {
        const uPos = element.properties.UnifiedPosition;
        // Parse format like {{0.150000,150.000000},{0.200000,200.000000}}
        const matches = uPos.match(
          /\{\{([^,]+),([^}]+)\},\{([^,]+),([^}]+)\}\}/
        );
        if (matches) {
          const relX = parseFloat(matches[1]) || 0;
          const absX = parseFloat(matches[2]) || 0;
          const relY = parseFloat(matches[3]) || 0;
          const absY = parseFloat(matches[4]) || 0;

          // Calculate actual position
          const x = parentBounds.x + relX * parentBounds.width + absX;
          const y = parentBounds.y + relY * parentBounds.height + absY;

          if (!element.bounds) element.bounds = {};
          element.bounds.x = x;
          element.bounds.y = y;
        }
      }

      // Parse UnifiedSize if exists
      if (element.properties.UnifiedSize) {
        const uSize = element.properties.UnifiedSize;
        // Parse format like {{0.350000,350.000000},{0.180000,180.000000}}
        const matches = uSize.match(
          /\{\{([^,]+),([^}]+)\},\{([^,]+),([^}]+)\}\}/
        );
        if (matches) {
          const relW = parseFloat(matches[1]) || 0;
          const absW = parseFloat(matches[2]) || 0;
          const relH = parseFloat(matches[3]) || 0;
          const absH = parseFloat(matches[4]) || 0;

          // Calculate actual size
          const width = relW * parentBounds.width + absW;
          const height = relH * parentBounds.height + absH;

          if (!element.bounds) element.bounds = {};
          element.bounds.width = width;
          element.bounds.height = height;
        }
      }

      // Handle AbsolutePosition as fallback
      if (
        element.properties.AbsolutePosition &&
        !element.properties.UnifiedPosition
      ) {
        const aPos = element.properties.AbsolutePosition;
        const matches = aPos.match(/\{([^,]+),([^}]+)\}/);
        if (matches) {
          const x = parseFloat(matches[1]) || 0;
          const y = parseFloat(matches[2]) || 0;

          if (!element.bounds) element.bounds = {};
          element.bounds.x = x;
          element.bounds.y = y;
        }
      }

      // Handle AbsoluteSize as fallback
      if (element.properties.AbsoluteSize && !element.properties.UnifiedSize) {
        const aSize = element.properties.AbsoluteSize;
        const matches = aSize.match(/\{([^,]+),([^}]+)\}/);
        if (matches) {
          const width = parseFloat(matches[1]) || 0;
          const height = parseFloat(matches[2]) || 0;

          if (!element.bounds) element.bounds = {};
          element.bounds.width = width;
          element.bounds.height = height;
        }
      }

      // Update boundsOriginal to sync with new bounds
      if (element.bounds) {
        element.boundsOriginal = { ...element.bounds };
      }
    } catch (error) {
      console.warn(
        `⚠️ Failed to apply properties to bounds for ${element.name}:`,
        error
      );
    }
  }

  _attachTransformHandles(domEl, element) {
    // Build handles wrapper
    const wrap = document.createElement("div");
    wrap.className = "tlbb-transform-handles";
    const positions = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    positions.forEach((pos) => {
      const h = document.createElement("div");
      h.className = "tlbb-resize-handle " + pos;
      h.dataset.pos = pos;
      wrap.appendChild(h);
    });
    domEl.appendChild(wrap);
    // Toast helper (global singleton)
    if (!window.__tlbbShowToast) {
      window.__tlbbShowToast = (msg, dur = 1500) => {
        let cont = document.getElementById("tlbb-toast-container");
        if (!cont) {
          cont = document.createElement("div");
          cont.id = "tlbb-toast-container";
          document.body.appendChild(cont);
        }
        const item = document.createElement("div");
        item.className = "tlbb-toast";
        item.textContent = msg;
        cont.appendChild(item);
        // trigger animation
        requestAnimationFrame(() => item.classList.add("show"));
        setTimeout(() => {
          item.classList.remove("show");
          setTimeout(() => item.remove(), 300);
        }, dur);
      };
    }
    const showBoundaryWarn = () => {
      const now = Date.now();
      if (!this._lastBoundaryWarnAt || now - this._lastBoundaryWarnAt > 800) {
        this._lastBoundaryWarnAt = now;
        window.__tlbbShowToast("Không được vượt quá kích thước phần tử cha");
      }
    };
    // Drag move (on element body if not on handle)
    let startX,
      startY,
      origX,
      origY,
      origW,
      origH,
      mode = null,
      handlePos = null,
      origAspect = 1;
    // Prepare undo stack containers
    if (!this._undoStack) {
      this._undoStack = [];
      this._redoStack = [];
    }
    const pushUndo = (prev) => {
      this._undoStack.push(prev);
      if (this._undoStack.length > 100) this._undoStack.shift();
      this._redoStack.length = 0;
    };
    // Add global keyboard shortcuts once
    if (!this._transformShortcutsBound) {
      this._transformShortcutsBound = true;
      window.addEventListener("keydown", (e) => {
        // Arrow move only (skip inputs)
        if (
          ["INPUT", "TEXTAREA"].includes(e.target.tagName) ||
          e.target.isContentEditable
        )
          return;
        if (!this.selectedElement) return;
        const el = this.selectedElement;
        const dom = this.windowRenderer.renderedElements.get(el);
        if (!dom) return;
        if (
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
        ) {
          const step = e.shiftKey ? 10 : 1;
          const prev = {
            el,
            x: parseFloat(dom.style.left) || el.bounds.x || 0,
            y: parseFloat(dom.style.top) || el.bounds.y || 0,
            w: parseFloat(dom.style.width) || el.bounds.width,
            h: parseFloat(dom.style.height) || el.bounds.height,
          };
          let nx = prev.x,
            ny = prev.y;
          if (e.key === "ArrowLeft") nx = prev.x - step;
          if (e.key === "ArrowRight") nx = prev.x + step;
          if (e.key === "ArrowUp") ny = prev.y - step;
          if (e.key === "ArrowDown") ny = prev.y + step;
          if (nx !== prev.x || ny !== prev.y) {
            dom.style.left = nx + "px";
            dom.style.top = ny + "px";
            el.bounds.x = nx;
            el.bounds.y = ny;
            el.absolutePosition = { x: nx, y: ny };
            el.boundsOriginal = {
              x: nx,
              y: ny,
              width: el.bounds.width,
              height: el.bounds.height,
            };

            // Update element properties when moving with keyboard
            this._updateElementPropertiesFromBounds(el, {
              x: nx,
              y: ny,
              width: el.bounds.width,
              height: el.bounds.height,
            });

            pushUndo(prev);
            this.updatePropertyPanel(el);
            e.preventDefault();
          }
        }
      });
    }
    const onMouseMove = (e) => {
      if (!mode) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const parent = domEl.parentElement;
      const pW = parent ? parent.clientWidth : Infinity;
      const pH = parent ? parent.clientHeight : Infinity;
      if (mode === "move") {
        const nx = origX + dx;
        const ny = origY + dy;
        const snap = e.altKey ? 1 : e.shiftKey ? 10 : 5; // Shift= coarse, Alt=free, default=5
        const sx = Math.round(nx / snap) * snap;
        const sy = Math.round(ny / snap) * snap;
        let finalX = sx;
        let finalY = sy;
        let clamped = false;
        const curW = parseFloat(domEl.style.width) || domEl.offsetWidth;
        const curH = parseFloat(domEl.style.height) || domEl.offsetHeight;
        if (finalX < 0) {
          finalX = 0;
          clamped = true;
        }
        if (finalY < 0) {
          finalY = 0;
          clamped = true;
        }
        if (finalX + curW > pW) {
          finalX = pW - curW;
          clamped = true;
        }
        if (finalY + curH > pH) {
          finalY = pH - curH;
          clamped = true;
        }
        domEl.style.left = finalX + "px";
        domEl.style.top = finalY + "px";
        if (clamped) showBoundaryWarn();
      } else if (mode === "resize") {
        let x = origX,
          y = origY,
          w = origW,
          h = origH;
        if (/w/.test(handlePos)) {
          x = origX + dx;
          w = origW - dx;
        }
        if (/n/.test(handlePos)) {
          y = origY + dy;
          h = origH - dy;
        }
        if (/e/.test(handlePos)) {
          w = origW + dx;
        }
        if (/s/.test(handlePos)) {
          h = origH + dy;
        }
        // Aspect lock with Shift (when resizing) keeping original aspect
        if (e.shiftKey && !/^(n|s|e|w)$/.test(handlePos)) {
          const aspect = origAspect || origW / Math.max(1, origH);
          if (w / h > aspect) {
            w = Math.round(h * aspect);
          } else {
            h = Math.round(w / aspect);
          }
          if (/w/.test(handlePos)) x = origX + (origW - w); // adjust anchor
          if (/n/.test(handlePos)) y = origY + (origH - h);
        }
        const snap = e.altKey ? 1 : 5;
        w = Math.max(1, Math.round(w / snap) * snap);
        h = Math.max(1, Math.round(h / snap) * snap);
        x = Math.round(x / snap) * snap;
        y = Math.round(y / snap) * snap;
        w = Math.max(1, w);
        h = Math.max(1, h);
        let clamped = false;
        // Clamp within parent bounds
        if (x < 0) {
          w += x;
          x = 0;
          clamped = true;
        }
        if (y < 0) {
          h += y;
          y = 0;
          clamped = true;
        }
        if (x + w > pW) {
          w = pW - x;
          clamped = true;
        }
        if (y + h > pH) {
          h = pH - y;
          clamped = true;
        }
        w = Math.max(1, w);
        h = Math.max(1, h);
        domEl.style.left = x + "px";
        domEl.style.top = y + "px";
        domEl.style.width = w + "px";
        domEl.style.height = h + "px";
        if (clamped) showBoundaryWarn();
      }
    };
    const onMouseUp = () => {
      if (!mode) return;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      domEl.classList.remove("dragging", "resizing");
      // Persist back to element model & recompute layout snapshot
      const nx = parseFloat(domEl.style.left) || 0;
      const ny = parseFloat(domEl.style.top) || 0;
      const nw = parseFloat(domEl.style.width) || 0;
      const nh = parseFloat(domEl.style.height) || 0;
      pushUndo({ el: element, x: origX, y: origY, w: origW, h: origH });
      if (!element.bounds)
        element.bounds = { x: nx, y: ny, width: nw, height: nh };
      element.bounds.x = nx;
      element.bounds.y = ny;
      element.bounds.width = nw;
      element.bounds.height = nh;
      // Update unified / absolute fallback props for future recalcs (simple assignment)
      element.absolutePosition = { x: nx, y: ny };
      element.absoluteSize = { w: nw, h: nh };
      // Update original bounds for protection & re-enable observer
      element.boundsOriginal = { x: nx, y: ny, width: nw, height: nh };
      if (domEl.__layoutProtectedObserverPaused) {
        // Reapply protection with new bounds
        this.protectLayout(domEl, element.boundsOriginal);
        delete domEl.__layoutProtectedObserverPaused;
      }

      // Update element.properties when resize/move to reflect in properties panel
      this._updateElementPropertiesFromBounds(element, {
        x: nx,
        y: ny,
        width: nw,
        height: nh,
      });

      console.log(element);

      this.updatePropertyPanel(element);
      // After each transform commit, enable undo button state and show hint once
      if (!this._undoHintShown) {
        this._undoHintShown = true;
        if (window.__tlbbShowToast)
          window.__tlbbShowToast("Dùng Ctrl+Z để Undo thay đổi gần nhất");
      }
      // Đánh dấu phần tử đã thay đổi transform để cho phép regenerate unified
      element._dirtyTransform = true;
      // Record history entry
      this._recordHistory(mode === "move" ? "move" : "resize", element, {
        x: nx,
        y: ny,
        w: nw,
        h: nh,
      });
      mode = null;
    };
    const startMove = (e, m, hp = null) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      // Use element.bounds as canonical instead of viewport rect to avoid offset issues
      const b = element.bounds || {
        x: 0,
        y: 0,
        width: parseFloat(domEl.style.width) || domEl.offsetWidth,
        height: parseFloat(domEl.style.height) || domEl.offsetHeight,
      };
      // Ensure style reflects current bounds before transform
      if (!domEl.style.left) domEl.style.left = b.x + "px";
      if (!domEl.style.top) domEl.style.top = b.y + "px";
      if (!domEl.style.width)
        domEl.style.width = (b.width || domEl.offsetWidth) + "px";
      if (!domEl.style.height)
        domEl.style.height = (b.height || domEl.offsetHeight) + "px";
      origX = parseFloat(domEl.style.left) || b.x || 0;
      origY = parseFloat(domEl.style.top) || b.y || 0;
      origW = parseFloat(domEl.style.width) || b.width || domEl.offsetWidth;
      origH = parseFloat(domEl.style.height) || b.height || domEl.offsetHeight;
      origAspect = origW / Math.max(1, origH);
      mode = m;
      handlePos = hp;
      domEl.classList.add(m === "move" ? "dragging" : "resizing");
      // Pause layout protection (disconnect observer) so user drag isn't reverted
      if (domEl.__layoutProtectedObserver) {
        domEl.__layoutProtectedObserver.disconnect();
        domEl.__layoutProtectedObserverPaused = true;
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
    domEl.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("tlbb-resize-handle")) return; // handled separately
      if (e.button !== 0) return;
      startMove(e, "move");
    });
    wrap.querySelectorAll(".tlbb-resize-handle").forEach((h) => {
      h.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        startMove(e, "resize", h.dataset.pos);
      });
    });
  }

  _recordHistory(action, el, state) {
    if (!el) return;
    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      ts: Date.now(),
      action,
      name: el.name || el.attributes?.Name || "(unnamed)",
      path: el.path || el.__path || "",
      x: state.x,
      y: state.y,
      w: state.w,
      h: state.h,
    };
    this.history.push(entry);
    if (this.history.length > this._historyMax) this.history.shift();
    this._saveHistoryToStorage();
    this._appendHistoryEntry(entry);
  }
  _saveHistoryToStorage() {
    try {
      localStorage.setItem(this._historyKey, JSON.stringify(this.history));
    } catch (e) {
      console.warn("Save history failed", e);
    }
  }
  _loadHistoryFromStorage() {
    try {
      const raw = localStorage.getItem(this._historyKey);
      if (raw) {
        this.history = JSON.parse(raw) || [];
      }
    } catch (e) {
      this.history = [];
    }
  }
  _ensureHistoryPanel() {
    if (document.getElementById("history-panel")) return;
    const panel = document.createElement("div");
    panel.id = "history-panel";
    panel.style.cssText =
      "position:fixed;right:250px;top:65px;width:240px;max-height:320px;background:#11181e;color:#cfd6dc;font:12px Arial;border:1px solid #233038;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.45);z-index:3500;display:flex;flex-direction:column;";
    panel.innerHTML = `<div id="history-header" style="position:sticky;top:0;background:#14181c;padding:4px 6px;font-weight:bold;border-bottom:1px solid #2a2f35;display:flex;align-items:center;gap:6px;cursor:move;">
      <span style="flex:1;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-clock-rotate-left" style="opacity:.85;"></i>Lịch sử</span>
      <button id="history-clear" title="Clear" style="background:#262b33;border:1px solid #39424a;color:#c9d0d6;font-size:11px;padding:2px 6px;border-radius:3px;cursor:pointer">✕</button>
      <button id="history-collapse" title="Collapse / Expand" style="background:#222;border:1px solid #444;color:#ccc;font-size:11px;padding:2px 6px;border-radius:3px;cursor:pointer">−</button>
    </div>
    <div style="padding:4px 6px 0;">
      <input id="history-filter" placeholder="Lọc tên..." style="width:100%;box-sizing:border-box;background:#1c252b;border:1px solid #2d363d;color:#cfd6dc;font-size:11px;padding:3px 6px;border-radius:4px;" />
    </div>
    <div id="history-list" style="overflow:auto;padding:4px 4px 6px;flex:1;display:flex;flex-direction:column;gap:4px;"></div>`;
    document.body.appendChild(panel);
    // Drag header
    const header = panel.querySelector("#history-header");
    let drag = false,
      sx,
      sy,
      sl,
      st;
    header.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      drag = true;
      sx = e.clientX;
      sy = e.clientY;
      const r = panel.getBoundingClientRect();
      sl = r.left;
      st = r.top;
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!drag) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      panel.style.left = sl + dx + "px";
      panel.style.top = st + dy + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    });
    window.addEventListener("mouseup", () => (drag = false));
    // Collapse
    panel.querySelector("#history-collapse").addEventListener("click", () => {
      const list = panel.querySelector("#history-list");
      const collapsed = list.style.display === "none";
      list.style.display = collapsed ? "flex" : "none";
      panel.querySelector("#history-collapse").textContent = collapsed
        ? "−"
        : "+";
    });
    // Clear
    panel.querySelector("#history-clear").addEventListener("click", () => {
      if (!confirm("Xóa toàn bộ lịch sử?")) return;
      this.history = [];
      this._saveHistoryToStorage();
      panel.querySelector("#history-list").innerHTML = "";
    });
    // Populate existing
    this.history.forEach((h) => this._appendHistoryEntry(h));
    // Filter listener
    const filterInput = panel.querySelector("#history-filter");
    if (filterInput) {
      filterInput.addEventListener("input", () =>
        this._applyHistoryFilter(filterInput.value.trim().toLowerCase())
      );
    }
  }
  _applyHistoryFilter(text) {
    const list = document.getElementById("history-list");
    if (!list) return;
    [...list.children].forEach((div) => {
      if (!text) {
        div.style.display = "flex";
        return;
      }
      const nameDiv = div.querySelector("div:nth-child(2)");
      const name = nameDiv ? nameDiv.textContent.toLowerCase() : "";
      div.style.display = name.includes(text) ? "flex" : "none";
    });
  }
  _appendHistoryEntry(entry) {
    const list = document.getElementById("history-list");
    if (!list) return;
    const div = document.createElement("div");
    div.className = "history-entry";
    div.style.cssText =
      "background:#1d252b;border:1px solid #2d363d;padding:4px 6px;border-radius:4px;line-height:1.25;cursor:pointer;display:flex;flex-direction:column;gap:2px;";
    const time = new Date(entry.ts).toLocaleTimeString();
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <span style="color:#8ab4ff;">${entry.action}</span>
        <span style="font-size:10px;color:#68727b;">${time}</span>
      </div>
      <div style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${entry.name}</div>
      <div style="font-size:10px;color:#9aa4ad;">x:${entry.x} y:${entry.y} w:${entry.w} h:${entry.h}</div>`;
    div.title = `${entry.action} ${entry.name}\nPath: ${entry.path}\n(${entry.x},${entry.y},${entry.w},${entry.h})\nClick để áp dụng lại.`;
    div.addEventListener("click", () => {
      // Apply stored state to element if still exists
      const el = this.currentElements.find(
        (e) => (e.path || e.__path) === entry.path || e.name === entry.name
      );
      if (!el) {
        if (window.__tlbbShowToast)
          window.__tlbbShowToast("Element không còn tồn tại");
        return;
      }
      const dom = this.windowRenderer.renderedElements.get(el);
      if (!dom) {
        if (window.__tlbbShowToast) window.__tlbbShowToast("DOM chưa render");
        return;
      }
      // push current to undo
      this._undoStack = this._undoStack || [];
      this._redoStack = this._redoStack || [];
      this._undoStack.push({
        el,
        x: parseFloat(dom.style.left) || el.bounds.x,
        y: parseFloat(dom.style.top) || el.bounds.y,
        w: parseFloat(dom.style.width) || el.bounds.width,
        h: parseFloat(dom.style.height) || el.bounds.height,
      });
      // Pause layout protection if active
      let hadProtection = false;
      if (dom.__layoutProtectedObserver) {
        try {
          dom.__layoutProtectedObserver.disconnect();
          hadProtection = true;
        } catch (_) {}
      }
      dom.style.position = "absolute";
      dom.style.left = entry.x + "px";
      dom.style.top = entry.y + "px";
      dom.style.width = entry.w + "px";
      dom.style.height = entry.h + "px";
      // Update element bounds & originals so protection won't revert
      if (!el.bounds)
        el.bounds = { x: entry.x, y: entry.y, width: entry.w, height: entry.h };
      el.bounds.x = entry.x;
      el.bounds.y = entry.y;
      el.bounds.width = entry.w;
      el.bounds.height = entry.h;
      el.absolutePosition = { x: entry.x, y: entry.y };
      el.absoluteSize = { w: entry.w, h: entry.h };
      el.boundsOriginal = {
        x: entry.x,
        y: entry.y,
        width: entry.w,
        height: entry.h,
      };
      // Re-apply protection if it existed
      if (hadProtection && typeof this.protectLayout === "function") {
        this.protectLayout(dom, el.boundsOriginal);
      }
      this.updatePropertyPanel(el);
      // Reselect to refresh transform handles
      if (this.selectedElement === el) this.updateCanvasSelection(el);
      else this.selectElement(el);
      if (window.__tlbbShowToast)
        window.__tlbbShowToast("Áp dụng trạng thái lịch sử");
    });
    list.prepend(div); // newest on top
  }

  /**
   * Set display mode
   * @param {string} mode - Display mode
   */
  setDisplayMode(mode) {
    // Normalize mode (allow 'none' / 'off')
    const normalized = !mode || mode === "off" ? "none" : mode;
    // Remember previous for restoration logic
    const prev = this.displayMode;
    this.displayMode = normalized;
    // Determine if we need to restore because we are leaving an inline replacement mode entirely
    if (
      this.isInlineDisplayMode(prev) &&
      !this.isInlineDisplayMode(normalized)
    ) {
      this.restoreOriginalTextContent();
    }
    // Propagate to sub renderers (they may apply their own logic)
    if (this.windowRenderer && this.windowRenderer.setDisplayMode) {
      this.windowRenderer.setDisplayMode(normalized);
    }
    if (this.buttonRenderer && this.buttonRenderer.setDisplayMode) {
      this.buttonRenderer.setDisplayMode(normalized);
    }
    // Inject minimal style once
    if (!document.getElementById("tlbb-display-mode-style")) {
      const style = document.createElement("style");
      style.id = "tlbb-display-mode-style";
      style.textContent = `.tlbb-display-overlay{position:absolute;top:2px;left:2px;z-index:1001;padding:1px 4px;background:rgba(0,0,0,.55);color:#fff;font:11px/1 Arial,Helvetica,sans-serif;border-radius:3px;pointer-events:none;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}`; // legacy overlay style (may be unused now)
      document.head.appendChild(style);
    }
    // Update overlays on all currently rendered elements
    this.updateDisplayModeOverlays();
    this.log(`Display mode changed to: ${normalized}`, "info");
  }

  /** Which modes replace inner content instead of overlay */
  isInlineDisplayMode(mode) {
    return ["element", "type", "position", "size", "text"].includes(mode);
  }

  /** Compute display text for an element given current mode */
  getDisplayModeText(element) {
    const mode = this.displayMode;
    if (!mode || mode === "none") return "";
    switch (mode) {
      case "element":
        return element.name || "";
      case "type":
        return element.type || "";
      case "position": {
        const b = element.bounds || element.boundsOriginal || {};
        return b.x != null && b.y != null
          ? `${Math.round(b.x)},${Math.round(b.y)}`
          : element.position || "";
      }
      case "size": {
        const b = element.bounds || element.boundsOriginal || {};
        return b.width != null && b.height != null
          ? `${Math.round(b.width)}×${Math.round(b.height)}`
          : element.size || "";
      }
      case "text": {
        if (element.text) {
          if (
            window.stringDictionary &&
            window.stringDictionary.resolveTextValue
          ) {
            try {
              return (
                window.stringDictionary.resolveTextValue(element.text) ||
                element.text
              );
            } catch (e) {
              return element.text;
            }
          }
          return element.text;
        }
        return "";
      }
      default:
        return element.name || "";
    }
  }

  /** Parse TLBB style inline color codes (#cRRGGBB) and return HTML with spans */
  buildColoredHTMLFromText(raw) {
    if (!raw) return "";
    const escape = (s) =>
      this.escapeHtml
        ? this.escapeHtml(s)
        : String(s).replace(
            /[&<>"']/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              }[c])
          );
    let i = 0;
    let color = null;
    let buf = "";
    const segments = [];
    const str = String(raw);
    const isHex = (c) => /[0-9a-fA-F]/.test(c);
    while (i < str.length) {
      if (str[i] == "#" && str[i + 1] == "c") {
        let hex = str.slice(i + 2, i + 8);
        if (hex.length === 6 && [...hex].every(isHex)) {
          // push previous buffer
          if (buf) {
            segments.push({ color, text: buf });
            buf = "";
          }
          color = "#" + hex.toLowerCase();
          i += 8; // skip token
          continue;
        }
      }
      buf += str[i];
      i++;
    }
    if (buf) segments.push({ color, text: buf });
    // Build HTML
    return segments
      .map((seg) => {
        const t = escape(seg.text);
        if (!seg.color) return t;
        return `<span style="color:${seg.color}">${t}</span>`;
      })
      .join("");
  }

  /** Apply a single overlay for display mode */
  applyDisplayModeOverlay(element, domElement) {
    if (!domElement) return;
    // Remove old overlay
    const old = domElement.querySelector(".tlbb-display-overlay");
    if (old) old.remove();
    if (!this.displayMode || this.displayMode === "none") return;
    const text = this.getDisplayModeText(element);
    if (this.isInlineDisplayMode(this.displayMode)) {
      // Store original only once
      if (domElement.__originalHTML == null)
        domElement.__originalHTML = domElement.innerHTML;
      if (this.displayMode === "text") {
        // Render colored spans if color codes present
        const html = this.buildColoredHTMLFromText(text);
        domElement.innerHTML = html || "";
      } else {
        domElement.textContent = text || "";
      }
      return;
    }
    // Fallback overlay path (kept for compatibility if new modes added later)
    if (!text) return;
    const div = document.createElement("div");
    div.className = "tlbb-display-overlay";
    div.textContent = text.length > 60 ? text.slice(0, 57) + "..." : text;
    domElement.appendChild(div);
  }

  /** Update overlays for all elements after mode change */
  updateDisplayModeOverlays() {
    // Iterate through renderer maps (window + button)
    const maps = [];
    if (this.windowRenderer && this.windowRenderer.renderedElements)
      maps.push(this.windowRenderer.renderedElements);
    if (this.buttonRenderer && this.buttonRenderer.renderedElements)
      maps.push(this.buttonRenderer.renderedElements);
    maps.forEach((m) => {
      m.forEach((dom, el) => this.applyDisplayModeOverlay(el, dom));
    });
  }

  /** Restore original HTML for elements after leaving inline modes */
  restoreOriginalTextContent() {
    const maps = [];
    if (this.windowRenderer && this.windowRenderer.renderedElements)
      maps.push(this.windowRenderer.renderedElements);
    if (this.buttonRenderer && this.buttonRenderer.renderedElements)
      maps.push(this.buttonRenderer.renderedElements);
    maps.forEach((m) => {
      m.forEach((dom) => {
        if (dom.__originalHTML != null) {
          // Only restore if current content was replaced
          dom.innerHTML = dom.__originalHTML;
          delete dom.__originalHTML;
        }
      });
    });
  }

  /**
   * Set zoom level
   * @param {number} zoom - Zoom level
   */
  setZoomLevel(zoom) {
    this.zoomLevel = Math.max(0.1, Math.min(5.0, zoom));
    this.windowRenderer.setZoomLevel(this.zoomLevel);
    this.buttonRenderer.setZoomLevel(this.zoomLevel);
    this.elements.zoomLevel.textContent = `${Math.round(
      this.zoomLevel * 100
    )}%`;
    this.log(`Zoom level: ${Math.round(this.zoomLevel * 100)}%`, "info");
  }

  /**
   * Toggle imageset only mode (hide non-imageset elements)
   */
  toggleImagesetOnly() {
    const canvasContent = this.elements.canvasContent;
    const toggleBtn = this.elements.imagesetOnlyBtn;

    if (canvasContent.classList.contains("imageset-only")) {
      canvasContent.classList.remove("imageset-only");
      toggleBtn.classList.remove("active");
      this.log("Imageset-only mode disabled - showing all elements", "info");
    } else {
      // Auto-enable show-imageset if not already enabled
      if (!canvasContent.classList.contains("show-imageset")) {
        canvasContent.classList.add("show-imageset");
        this.elements.toggleImagesetBtn.classList.add("active");
      }
      canvasContent.classList.add("imageset-only");
      toggleBtn.classList.add("active");
      this.log(
        "Imageset-only mode enabled - hiding non-imageset elements",
        "info"
      );
    }
  }

  /**
   * Toggle imageset elements visibility
   */
  toggleImagesetElements() {
    const canvasContent = this.elements.canvasContent;
    const toggleBtn = this.elements.toggleImagesetBtn;

    if (canvasContent.classList.contains("show-imageset")) {
      canvasContent.classList.remove("show-imageset");
      toggleBtn.classList.remove("active");
      this.log("Imageset elements hidden", "info");
    } else {
      canvasContent.classList.add("show-imageset");
      toggleBtn.classList.add("active");
      this.log("Imageset elements shown", "info");
    }
  }

  /**
   * Toggle hierarchy levels visibility
   */
  toggleHierarchyLevels() {
    const canvasContent = this.elements.canvasContent;
    const toggleBtn = this.elements.toggleHierarchyBtn;

    if (canvasContent.classList.contains("show-hierarchy")) {
      canvasContent.classList.remove("show-hierarchy");
      toggleBtn.classList.remove("active");
      this.log("Hierarchy levels hidden", "info");
    } else {
      canvasContent.classList.add("show-hierarchy");
      toggleBtn.classList.add("active");
      this.log(
        "Hierarchy levels shown - elements styled by level depth",
        "info"
      );
    }
  }

  /**
   * Toggle debug hierarchy mode
   */
  toggleDebugHierarchy() {
    const canvasContent = this.elements.canvasContent;
    const debugBtn = this.elements.debugHierarchyBtn;

    if (canvasContent.classList.contains("debug-hierarchy")) {
      canvasContent.classList.remove("debug-hierarchy");
      debugBtn.classList.remove("active");
      this.log("Debug hierarchy disabled", "info");
    } else {
      canvasContent.classList.add("debug-hierarchy");
      debugBtn.classList.add("active");
      this.log("Debug hierarchy enabled - showing level indicators", "info");
    }
  }

  /**
   * Update mouse position display
   * @param {MouseEvent} event - Mouse event
   */
  updateMousePosition(event) {
    const rect = this.elements.canvasContent.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / this.zoomLevel);
    const y = Math.round((event.clientY - rect.top) / this.zoomLevel);
    this.elements.mousePosition.textContent = `${x}, ${y}`;
  }

  /**
   * Update element count display
   * @param {number} count - Element count
   */
  updateElementCount(count) {
    this.elements.elementCount.textContent = `Elements: ${count}`;
  }

  /**
   * Clear canvas
   */
  clearCanvas() {
    this.elements.canvasContent.innerHTML = "";
    this.windowRenderer.clear();
    this.buttonRenderer.clear();
  }

  /** Show loading overlay */
  showLoadingOverlay(durationMs = 3000, message = "Đang tải lại...") {
    let overlay = document.getElementById("tlbb-loading-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "tlbb-loading-overlay";
      overlay.innerHTML = `<div class="spinner"><div></div><div></div><div></div><div></div></div><div class="msg"></div>`;
      document.body.appendChild(overlay);
      // Basic styles (inline to avoid needing separate css file)
      const style = document.createElement("style");
      style.id = "tlbb-loading-style";
      style.textContent = `#tlbb-loading-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:Arial;color:#fff;font-size:14px;}
			#tlbb-loading-overlay .msg{margin-top:14px;letter-spacing:.5px;}
			#tlbb-loading-overlay .spinner{display:inline-block;position:relative;width:80px;height:80px;}
			#tlbb-loading-overlay .spinner div{box-sizing:border-box;display:block;position:absolute;width:64px;height:64px;margin:8px;border:6px solid #4fc3f7;border-radius:50%;animation:tlbb-spin 1.2s cubic-bezier(.5,.1,.5,.9) infinite;border-color:#4fc3f7 transparent transparent transparent;}
			#tlbb-loading-overlay .spinner div:nth-child(1){animation-delay:-.45s}
			#tlbb-loading-overlay .spinner div:nth-child(2){animation-delay:-.3s}
			#tlbb-loading-overlay .spinner div:nth-child(3){animation-delay:-.15s}
			@keyframes tlbb-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;
      document.head.appendChild(style);
    }
    overlay.querySelector(".msg").textContent = message;
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity .2s";
    requestAnimationFrame(() => (overlay.style.opacity = "1"));
    clearTimeout(overlay.__hideTimer);
    overlay.__hideTimer = setTimeout(
      () => this.hideLoadingOverlay(),
      durationMs
    );
  }
  /** Hide loading overlay */
  hideLoadingOverlay() {
    const overlay = document.getElementById("tlbb-loading-overlay");
    if (!overlay) return;
    overlay.style.opacity = "0";
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 250);
  }

  /**
   * Set status text
   * @param {string} text - Status text
   */
  setStatus(text) {
    this.elements.statusText.textContent = text;
  }

  /**
   * Log message
   * @param {string} message - Log message
   * @param {string} type - Log type (info, warning, error, success)
   */
  log(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement("div");
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;

    this.elements.logPanel.appendChild(logEntry);
    this.elements.logPanel.scrollTop = this.elements.logPanel.scrollHeight;

    // Limit log entries
    while (this.elements.logPanel.children.length > 100) {
      this.elements.logPanel.removeChild(this.elements.logPanel.firstChild);
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update auto-scaling when window is resized
    this.applyAutoScaling();
    this.log("Window resized", "info");
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (typeof text !== "string") return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Event emitter functionality
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

  /**
   * Handle viewport change
   * @param {string} value - Viewport value (e.g., "1024x768" or "custom")
   */
  handleViewportChange(value) {
    if (value === "custom") {
      // Custom inputs will be shown automatically
      return;
    }

    const [width, height] = value.split("x").map(Number);
    this.setViewport(width, height);
  }

  /**
   * Set viewport size
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   */
  setViewport(width, height) {
    // Use CONFIG constants as fallbacks
    const finalWidth = width || CONFIG.VIRTUAL_WIDTH;
    const finalHeight = height || CONFIG.VIRTUAL_HEIGHT;

    this.currentViewport = { width: finalWidth, height: finalHeight };
    this.updateViewportDisplay();

    // Update canvas content container size using CONFIG constants
    this.elements.canvasContent.style.width = finalWidth + "px";
    this.elements.canvasContent.style.height = finalHeight + "px";
    this.elements.canvasContent.setAttribute(
      "data-viewport-size",
      `${finalWidth}×${finalHeight}`
    );

    // Apply automatic scaling to fit in available space
    this.applyAutoScaling();

    // Clear any existing elements
    this.elements.canvasContent.innerHTML = "";

    // Re-render if we have elements loaded
    if (this.currentElements.length > 0) {
      this.renderElements(this.currentElements);
    }

    this.log(`Viewport changed to ${finalWidth}×${finalHeight}`, "info");
  }

  /**
   * Apply automatic scaling to canvas content to fit available space
   */
  applyAutoScaling() {
    const canvas = this.elements.canvasContent;
    const container = canvas.parentElement;

    if (!container) return;

    // Get container dimensions (excluding padding)
    const containerRect = container.getBoundingClientRect();
    const containerPadding = 40; // 20px padding on each side
    const availableWidth = containerRect.width - containerPadding;
    const availableHeight = containerRect.height - containerPadding;

    // Calculate scale factors
    const scaleX = availableWidth / this.currentViewport.width;
    const scaleY = availableHeight / this.currentViewport.height;

    // Use the smaller scale to maintain aspect ratio
    const scale = Math.min(scaleX, scaleY, 1.0); // Don't scale up, only down

    // Apply the scale transform
    if (Auto_SCALE_FACTOR) {
      canvas.style.transform = `scale(${scale})`;
    }

    // console.log(`🔍 Auto-scaling applied: ${Math.round(scale * 100)}%`, {
    //   container: { width: availableWidth, height: availableHeight },
    //   viewport: this.currentViewport,
    //   scale: scale,
    // });

    // Store scale for coordinate calculations
    this.currentScale = scale;
  }

  /**
   * Update viewport display
   */
  updateViewportDisplay() {
    this.elements.viewportSize.textContent = `${this.currentViewport.width}×${this.currentViewport.height}`;
  }

  /**
   * Get application statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      elementsLoaded: this.currentElements.length,
      selectedElement: this.selectedElement ? this.selectedElement.name : null,
      zoomLevel: this.zoomLevel,
      displayMode: this.displayMode,
      viewport: this.currentViewport,
      rendererStats: {
        window: this.windowRenderer.getStats(),
        button: this.buttonRenderer.getStats(),
      },
    };
  }

  // ===== Loading Overlay Helpers (added) =====
  _ensureLoadingStyles() {
    if (document.getElementById("tlbb-loading-style")) return;
    const style = document.createElement("style");
    style.id = "tlbb-loading-style";
    style.textContent = `@keyframes tlbb-spin{to{transform:rotate(360deg)}}
    .tlbb-loading-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10000;font-family:Arial, sans-serif;backdrop-filter:blur(2px);} 
    .tlbb-loading-box{background:#1f252b;border:1px solid #3a4450;padding:18px 28px;border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:14px;box-shadow:0 4px 14px rgba(0,0,0,0.45);} 
    .tlbb-loading-spinner{width:54px;height:54px;border:6px solid #2e3942;border-top-color:#3db3ff;border-radius:50%;animation:tlbb-spin .8s linear infinite;box-shadow:0 0 6px rgba(61,179,255,0.6);} 
    .tlbb-loading-text{color:#d9e2ec;font-size:13px;letter-spacing:.5px;text-shadow:0 1px 2px #000;} 
    .tlbb-loading-sub{color:#8fa3b5;font-size:11px;margin-top:-8px;} 
    `;
    document.head.appendChild(style);
  }
  _showLoading(msg) {
    try {
      this._ensureLoadingStyles();
    } catch (_) {}
    if (!this._loadingOverlay) {
      const wrap = document.createElement("div");
      wrap.className = "tlbb-loading-overlay";
      wrap.innerHTML = `<div class="tlbb-loading-box"><div class="tlbb-loading-spinner"></div><div class="tlbb-loading-text tlbb-loading-msg"></div><div class="tlbb-loading-sub">Đang xử lý...</div></div>`;
      document.body.appendChild(wrap);
      this._loadingOverlay = wrap;
    }
    const el = this._loadingOverlay.querySelector(".tlbb-loading-msg");
    if (el) el.textContent = msg || "Loading...";
    this._loadingOverlay.style.display = "flex";
  }
  _hideLoading() {
    if (this._loadingOverlay) {
      this._loadingOverlay.style.display = "none";
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.tlbbGUIRenderer = new TLBBGUIRenderer();
  // Tối ưu menu-bar: tự động đóng submenu sau khi bấm nút
  const menuBar = document.querySelector(".menu-bar");
  if (menuBar) {
    // Đóng tất cả submenu
    function closeAllMenus() {
      menuBar.querySelectorAll(".menu-item.has-sub").forEach((item) => {
        item.classList.remove("open");
      });
    }
    // Mở menu khi click vào menu-top
    menuBar
      .querySelectorAll('.menu-item.has-sub > span[role="menuitem"]')
      .forEach((span) => {
        span.addEventListener("click", (e) => {
          e.stopPropagation();
          closeAllMenus();
          span.parentElement.classList.add("open");
        });
      });
    // Đóng menu khi click ra ngoài
    document.addEventListener("click", (e) => {
      if (!menuBar.contains(e.target)) closeAllMenus();
    });
    // Đóng menu sau khi bấm nút trong submenu
    menuBar.querySelectorAll(".submenu button").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTimeout(closeAllMenus, 100);
      });
    });
  }
});
