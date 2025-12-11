/**
 * Imageset Loader Module for TLBB GUI Renderer
 * Loads and manages TLBB .imageset.xml files for proper image rendering
 *
 * Path Configuration:
 * - .imageset.xml files: PATH_IMAGESET_XML (data/Interface/Common/)
 * - .tga/.dds texture files: PATH_TEXTURE_FILES (data/Material/Common/)
 */

class ImagesetLoader {
  constructor() {
    this.imagesets = new Map(); // Store loaded imagesets
    this.imageCache = new Map(); // Cache for loaded images
    this.loadingPromises = new Map(); // Track loading promises
    this.basePath = ""; // Base path for assets
    this.placeholderCache = new Map(); // Cache for generated placeholders
    this.useConvertedImages = false; // Disabled - no converted PNG/JPG loading
    this.convertedPath = ""; // Not used anymore
    this._listeners = new Map(); // event listeners
    this.status = new Map(); // imagesetName -> {state, path, count?, error?}
    // Optimized configuration for TGA/DDS decoding
    this.autoFallbackFormats = false; // No PNG/JPG fallbacks
    this.stripTGAPrefix = false; // No prefix stripping needed
    this.skipNativeTGADDSFetch = false; // Try to decode TGA/DDS first
    this.preferRealImages = true; // Prefer decoded TGA/DDS over placeholders
    this.enableTGADecoding = true; // Enable TGA decoding
    this.enableDDSDecoding = true; // Enable DDS decoding

    // Validate that required constants are available
    this._validateConstants();
  }

  /**
   * Validate that required path constants are available
   * @private
   */
  _validateConstants() {
    if (typeof PATH_IMAGESET_XML === "undefined") {
      console.error(
        "❌ PATH_IMAGESET_XML constant not found! Please include constants.js"
      );
      throw new Error("Missing PATH_IMAGESET_XML constant");
    }
    if (typeof PATH_TEXTURE_FILES === "undefined") {
      console.error(
        "❌ PATH_TEXTURE_FILES constant not found! Please include constants.js"
      );
      throw new Error("Missing PATH_TEXTURE_FILES constant");
    }
    console.log("✅ Path constants loaded:", {
      imagesetXml: PATH_IMAGESET_XML,
      textureFiles: PATH_TEXTURE_FILES,
    });
  }

  /**
   * Get current path configuration for debugging
   * @returns {Object} Current path settings
   */
  getPathConfig() {
    return {
      imagesetXmlPath: PATH_IMAGESET_XML,
      textureFilesPath: PATH_TEXTURE_FILES,
      basePath: this.basePath,
      description: {
        imagesetXml: "Path for .imageset.xml files",
        textureFiles: "Path for .tga/.dds texture files",
        basePath: "Base path prefix for all assets",
      },
    };
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
  }
  off(event, handler) {
    if (this._listeners.has(event)) this._listeners.get(event).delete(handler);
  }
  _emit(event, payload) {
    const set = this._listeners.get(event);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.warn("ImagesetLoader listener error", e);
        }
      });
    }
  }

  /**
   * Attempt to load an imageset just by name using common path guesses.
   * Tries several candidate paths until one succeeds.
   * @param {string} imagesetName
   * @returns {Promise<Object>} Loaded imageset data
   */
  async loadImagesetByNameGuess(imagesetName) {
    // Already loaded or loading
    if (this.imagesets.has(imagesetName))
      return this.imagesets.get(imagesetName);
    if (this.loadingPromises.has(imagesetName))
      return this.loadingPromises.get(imagesetName);

    // Simplified name variants - prioritize exact match and simple pluralization
    const nameVariants = [imagesetName]; // Start with exact name

    // Only add the most likely variant: Button5 -> Buttons5
    const m = imagesetName.match(/^(.*?)(\d+)$/);
    if (m) {
      nameVariants.push(m[1] + "s" + m[2]);
    }

    // Simplified directory list - prioritize most common locations
    const dirs = [
      PATH_IMAGESET_XML.replace(/\/$/, ""), // Use constant for imageset XML files
    ];

    const candidatePaths = [];
    nameVariants.forEach((n) => {
      dirs.forEach((d) => candidatePaths.push(`${d}/${n}.imageset.xml`));
    });

    // Try candidates in order of priority
    const tried = [];
    for (const p of candidatePaths) {
      tried.push(p);
      try {
        const result = await this.loadImageset(imagesetName, p);
        console.log(
          `[ImagesetLoader] Auto-loaded imageset '${imagesetName}' from ${p}`
        );
        return result;
      } catch (e) {
        /* continue */
      }
    }
    console.warn(
      `[ImagesetLoader] Failed to auto-load imageset '${imagesetName}'. Tried:`,
      tried
    );
    throw new Error("Imageset not found: " + imagesetName);
  }

  /**
   * Set base path for asset loading
   * @param {string} path - Base path to assets
   */
  setBasePath(path) {
    this.basePath = path.endsWith("/") ? path : path + "/";
  }

  /**
   * Load an imageset file
   * @param {string} imagesetName - Name of the imageset (e.g., "UIIcons")
   * @param {string} imagesetPath - Path to the .imageset.xml file
   * @returns {Promise<Object>} Loaded imageset data
   */
  async loadImageset(imagesetName, imagesetPath) {
    // If caller omitted path, delegate to guesser
    if (!imagesetPath) {
      return this.loadImagesetByNameGuess(imagesetName);
    }
    // Return cached imageset if already loaded
    if (this.imagesets.has(imagesetName)) {
      return this.imagesets.get(imagesetName);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(imagesetName)) {
      return this.loadingPromises.get(imagesetName);
    }

    // Start loading
    this.status.set(imagesetName, { state: "pending", path: imagesetPath });
    this._emit("imageset:start", { name: imagesetName, path: imagesetPath });
    const loadingPromise = this._loadImagesetFromXML(
      imagesetName,
      imagesetPath
    );
    this.loadingPromises.set(imagesetName, loadingPromise);

    try {
      const imageset = await loadingPromise;
      this.imagesets.set(imagesetName, imageset);
      this.loadingPromises.delete(imagesetName);
      // Try derive texture dimensions from cache
      let texW = null,
        texH = null;
      try {
        const texPath = imageset.resolvedImagefile || imageset.imagefile;
        if (texPath) {
          const key = this.basePath + texPath;
          const img = this.imageCache.get(key);
          if (img) {
            texW = img.naturalWidth || img.width || null;
            texH = img.naturalHeight || img.height || null;
          }
        }
      } catch (_) {}
      this.status.set(imagesetName, {
        state: "loaded",
        path: imagesetPath,
        count: imageset.images.size,
        texW,
        texH,
      });
      this._emit("imageset:loaded", {
        name: imagesetName,
        path: imagesetPath,
        count: imageset.images.size,
        texW,
        texH,
      });
      console.log(
        `Loaded imageset: ${imagesetName} with ${imageset.images.size} images`
      );
      return imageset;
    } catch (error) {
      this.loadingPromises.delete(imagesetName);
      this.status.set(imagesetName, {
        state: "error",
        path: imagesetPath,
        error: error.message,
      });
      this._emit("imageset:error", {
        name: imagesetName,
        path: imagesetPath,
        error: error.message,
      });
      console.error(`Failed to load imageset ${imagesetName}:`, error);
      throw error;
    }
  }

  /**
   * Load imageset from XML file
   * @param {string} imagesetName - Name of the imageset
   * @param {string} imagesetPath - Path to the XML file
   * @returns {Promise<Object>} Imageset data
   * @private
   */
  async _loadImagesetFromXML(imagesetName, imagesetPath) {
    console.log(
      `[ImagesetLoader] Loading imageset '${imagesetName}' from ${imagesetPath}`
    );
    try {
      // Load XML file
      const response = await fetch(this.basePath + imagesetPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error(`XML parsing error: ${parserError.textContent}`);
      }

      // Parse imageset
      const imagesetElement = xmlDoc.querySelector("Imageset");
      if (!imagesetElement) {
        throw new Error("No Imageset element found in XML");
      }

      // Extract imageset properties
      const imageset = {
        name: imagesetElement.getAttribute("Name") || imagesetName,
        imagefile: imagesetElement.getAttribute("Imagefile") || "",
        nativeHorzRes:
          parseInt(imagesetElement.getAttribute("NativeHorzRes")) || 1024,
        nativeVertRes:
          parseInt(imagesetElement.getAttribute("NativeVertRes")) || 768,
        autoScaled: imagesetElement.getAttribute("AutoScaled") === "true",
        images: new Map(),
      };

      // Parse individual images
      const imageElements = xmlDoc.querySelectorAll("Image");
      imageElements.forEach((imageElement) => {
        const image = {
          name: imageElement.getAttribute("Name"),
          xPos: parseInt(imageElement.getAttribute("XPos")) || 0,
          yPos: parseInt(imageElement.getAttribute("YPos")) || 0,
          width: parseInt(imageElement.getAttribute("Width")) || 0,
          height: parseInt(imageElement.getAttribute("Height")) || 0,
        };

        if (image.name) {
          imageset.images.set(image.name, image);
        }
      });

      // Preload the texture image (create placeholder for TGA/DDS)
      if (imageset.imagefile) {
        try {
          await this._preloadTexture(imageset.imagefile);
          // Store the original imagefile path
          imageset.resolvedImagefile = imageset.imagefile;
        } catch (error) {
          console.warn(
            `Failed to preload texture ${imageset.imagefile}:`,
            error
          );
          // Continue anyway - we can still provide image coordinates
        }
      }

      return imageset;
    } catch (error) {
      throw new Error(`Failed to load imageset XML: ${error.message}`);
    }
  }

  /**
   * Preload texture image - with TGA/DDS decoding support
   * @param {string} imagePath - Path to the texture image
   * @returns {Promise<HTMLImageElement>} Real decoded image or placeholder
   * @private
   */
  async _preloadTexture(imagePath) {
    if (!imagePath) throw new Error("Empty image path");

    // Simple path construction: PATH_TEXTURE_FILES + imagePath
    const primaryPath = `${PATH_TEXTURE_FILES}${imagePath}`;
    const filename = imagePath.split("/").pop();
    const cacheKey = `texture_${filename}`;

    // Return cached if exists
    if (this.imageCache.has(cacheKey)) {
      console.log(`📦 Using cached texture: ${filename}`);
      return this.imageCache.get(cacheKey);
    }

    // For TGA/DDS files, decode them
    if (filename.toLowerCase().endsWith(".tga") || filename.toLowerCase().endsWith(".dds")) {
      try {
        console.log(`🔄 Loading ${filename} from: ${this.basePath}${primaryPath}`);
        const response = await fetch(this.basePath + primaryPath);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          
          try {
            const decodedResult = filename.toLowerCase().endsWith(".tga") 
              ? window.TextureDecoder.decodeTGA(buffer)
              : window.TextureDecoder.decodeDDS(buffer);

            // Convert to image with data URL - fix naturalWidth issue
            const img = new Image();
            img.src = decodedResult.canvas.toDataURL();
            
            // Wait for image to load before setting dimensions
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            
            // Set dimensions after image loads
            Object.defineProperty(img, 'width', { value: decodedResult.width, writable: false });
            Object.defineProperty(img, 'height', { value: decodedResult.height, writable: false });
            img.isDecoded = true;

            this.imageCache.set(cacheKey, img);
            console.log(`✅ Decoded ${filename}: ${decodedResult.width}x${decodedResult.height}`);
            return img;
          } catch (decodingError) {
            console.warn(`⚠️ Cannot decode ${filename}: ${decodingError.message} - creating placeholder`);
            // Fall through to create placeholder instead of throwing
          }
        }
      } catch (error) {
        console.warn(`❌ Failed to load ${filename}:`, error.message);
      }
    } else {
      // For PNG/JPG files
      try {
        const img = new Image();
        const loadPromise = new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Image load failed"));
        });
        img.src = this.basePath + primaryPath;
        
        const result = await loadPromise;
        this.imageCache.set(cacheKey, result);
        console.log(`✅ Loaded ${filename}`);
        return result;
      } catch (error) {
        console.warn(`❌ Failed to load ${filename}:`, error.message);
      }
    }

    // Create placeholder
    console.log(`🎨 Creating placeholder for: ${filename}`);
    const placeholder = this._createTGAPlaceholder(imagePath);
    this.imageCache.set(cacheKey, placeholder);
    return placeholder;
  }

  /**
   * Create placeholder image for TGA/DDS files
   * @param {string} path - Original TGA/DDS path
   * @returns {HTMLImageElement} Placeholder image
   * @private
   */
  _createTGAPlaceholder(path) {
    // Cache placeholders by path
    if (this.placeholderCache && this.placeholderCache.has(path)) {
      return this.placeholderCache.get(path);
    }

    if (!this.placeholderCache) {
      this.placeholderCache = new Map();
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Create a basic placeholder
    canvas.width = 256;
    canvas.height = 256;

    // Generate unique color based on filename
    const filename = path.split("/").pop();
    const hash = filename.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const hue = Math.abs(hash) % 360;
    const color1 = `hsl(${hue}, 60%, 50%)`;
    const color2 = `hsl(${hue + 30}, 60%, 40%)`;

    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Add border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 254, 254);

    // Add text
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 2;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("TGA/DDS", 128, 110);
    ctx.font = "12px Arial";
    ctx.fillText("Placeholder", 128, 130);
    ctx.font = "10px Arial";
    ctx.fillText(filename, 128, 150);

    // Convert canvas to image
    img.src = canvas.toDataURL();
    this.placeholderCache.set(path, img);

    console.log(`Created TGA placeholder for: ${filename} (color: ${color1})`);
    return img;
  }

  /**
   * Get image info from imageset
   * @param {string} imagesetName - Name of the imageset
   * @param {string} imageName - Name of the image
   * @returns {Object|null} Image information
   */
  getImageInfo(imagesetName, imageName) {
    const imageset = this.imagesets.get(imagesetName);
    if (!imageset) {
      // console.warn(`Imageset not loaded: ${imagesetName}. Available imagesets:`, Array.from(this.imagesets.keys()));
      return null;
    }

    const imageInfo = imageset.images.get(imageName);
    if (!imageInfo) {
      // console.warn(`Image not found in imageset ${imagesetName}: ${imageName}. Available images:`, Array.from(imageset.images.keys()).slice(0, 10));
      return null;
    }

    return {
      ...imageInfo,
      imagefile: imageset.resolvedImagefile || imageset.imagefile,
      textureWidth: imageset.nativeHorzRes,
      textureHeight: imageset.nativeVertRes,
    };
  }

  /**
   * Parse TLBB image reference format
   * @param {string} imageReference - Format: "set:ImagesetName image:ImageName"
   * @returns {Object|null} Parsed reference
   */
  parseImageReference(imageReference) {
    if (!imageReference || typeof imageReference !== "string") {
      // console.warn('Invalid image reference:', imageReference);
      return null;
    }

    const match = imageReference.match(/^set:(\S+)\s+image:(\S+)$/);
    if (match) {
      const parsed = {
        imagesetName: match[1],
        imageName: match[2],
      };
      // console.log('Parsed image reference:', imageReference, '->', parsed);
      return parsed;
    }

    // console.warn('Failed to parse image reference:', imageReference);
    return null;
  }

  /**
   * Get CSS background properties for an image reference
   * @param {string} imageReference - Format: "set:ImagesetName image:ImageName"
   * @returns {Object|null} CSS properties
   */
  getImageCSS(imageReference) {
    const parsed = this.parseImageReference(imageReference);
    if (!parsed) {
      console.warn("❌ Invalid image reference:", imageReference);
      return this._createFallbackCSS(imageReference, "Invalid format");
    }
    
    const imageInfo = this.getImageInfo(parsed.imagesetName, parsed.imageName);
    if (!imageInfo) {
      return this._createFallbackCSS(imageReference, `Image not found: ${parsed.imageName}`);
    }

    const filename = imageInfo.imagefile.split("/").pop();
    const cacheKey = `texture_${filename}`;
    const cachedTexture = this.imageCache.get(cacheKey);
    
    if (cachedTexture && !cachedTexture.isPlaceholder && cachedTexture.complete) {
      
      // Always use data URL for decoded textures to avoid path conflicts
      const backgroundImage = cachedTexture.src.startsWith('data:') 
        ? `url('${cachedTexture.src}')`
        : `url('${this.basePath}${PATH_TEXTURE_FILES}${imageInfo.imagefile}')`;

      return {
        backgroundImage,
        backgroundPosition: `${-imageInfo.xPos}px ${-imageInfo.yPos}px`,
        backgroundRepeat: "no-repeat", 
        backgroundSize: `${imageInfo.textureWidth}px ${imageInfo.textureHeight}px`,
        width: `${imageInfo.width}px`,
        height: `${imageInfo.height}px`,
        imageInfo,
        isRealTexture: true,
        debugInfo: {
          usedDataURL: cachedTexture.src.startsWith('data:'),
          textureSize: `${imageInfo.textureWidth}x${imageInfo.textureHeight}`,
          spritePos: `${imageInfo.xPos},${imageInfo.yPos}`,
        },
      };
    }

    // Simple placeholder for missing textures
    console.log(`ℹ️ Using placeholder for ${imageReference}`);
    const bgColor = this._getPlaceholderColor(parsed.imageName);
    
    return {
      backgroundColor: bgColor,
      backgroundImage: "none",
      width: `${imageInfo.width}px`,
      height: `${imageInfo.height}px`,
      imageInfo,
      isPlaceholder: true,
      debugInfo: { reason: "Texture not loaded", color: bgColor },
    };
  }

  /**
   * Get placeholder color based on image name
   * @param {string} imageName - Name of the image
   * @returns {string} CSS color
   * @private
   */
  _getPlaceholderColor(imageName) {
    const lower = imageName.toLowerCase();
    if (lower.includes("ok") || lower.includes("normal")) return "#4299e1"; // blue
    if (lower.includes("hover") || lower.includes("over")) return "#48bb78"; // green  
    if (lower.includes("pushed") || lower.includes("down")) return "#ed8936"; // orange
    if (lower.includes("disabled")) return "#a0aec0"; // light gray
    if (lower.includes("close") || lower.includes("cancel")) return "#f56565"; // red
    return "#4a5568"; // default gray
  }

  /**
   * Create fallback CSS for failed image references
   * @param {string} imageReference - Original image reference
   * @param {string} reason - Reason for fallback
   * @returns {Object} Fallback CSS properties
   * @private
   */
  _createFallbackCSS(imageReference, reason) {
    const errorPlaceholder = this.createErrorPlaceholder(
      imageReference,
      reason
    );

    return {
      backgroundImage: `url('${errorPlaceholder}')`,
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
      width: "64px",
      height: "32px",
      imageInfo: null,
      isPlaceholder: true,
      isError: true,
      errorReason: reason,
      debugInfo: { originalRef: imageReference, errorReason: reason },
    };
  }

  /**
   * Create enhanced placeholder with better visual feedback
   * @param {Object} imageInfo - Image information from imageset
   * @param {Object} parsed - Parsed image reference
   * @returns {string} Data URL for enhanced placeholder
   */
  createEnhancedPlaceholder(imageInfo, parsed) {
    const cacheKey = `enhanced_${imageInfo.name}_${imageInfo.width}_${imageInfo.height}`;

    if (this.placeholderCache.has(cacheKey)) {
      return this.placeholderCache.get(cacheKey);
    }

    // Create canvas for placeholder
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(imageInfo.width, 64);
    canvas.height = Math.max(imageInfo.height, 32);
    const ctx = canvas.getContext("2d");

    // Create sophisticated gradient based on image name
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Color scheme based on button type
    let colors = ["#4a5568", "#2d3748"]; // default gray

    if (parsed.imageName.toLowerCase().includes("levelup")) {
      colors = ["#48bb78", "#38a169"]; // green
    } else if (parsed.imageName.toLowerCase().includes("ok")) {
      colors = ["#4299e1", "#3182ce"]; // blue
    } else if (parsed.imageName.toLowerCase().includes("cancel")) {
      colors = ["#f56565", "#e53e3e"]; // red
    } else if (parsed.imageName.toLowerCase().includes("close")) {
      colors = ["#ed8936", "#dd6b20"]; // orange
    } else if (parsed.imageName.toLowerCase().includes("normal")) {
      colors = ["#667eea", "#764ba2"]; // purple
    } else if (parsed.imageName.toLowerCase().includes("hover")) {
      colors = ["#f093fb", "#f5576c"]; // pink
    } else if (parsed.imageName.toLowerCase().includes("pushed")) {
      colors = ["#4facfe", "#00f2fe"]; // cyan
    } else if (parsed.imageName.toLowerCase().includes("disabled")) {
      colors = ["#a0aec0", "#718096"]; // gray
    }

    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border with rounded corners effect
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.setLineDash([]);

    // Add text information
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Main title
    const fontSize = Math.min(canvas.width / 8, canvas.height / 3, 16);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Extract meaningful name
    let displayName = parsed.imageName.replace(/^Btn/, "").replace(/_/g, " ");
    if (displayName.length > 12) {
      displayName = displayName.substring(0, 12) + "...";
    }

    ctx.fillText(displayName, centerX, centerY - fontSize / 2);

    // Add size info
    const sizeText = `${imageInfo.width}×${imageInfo.height}`;
    ctx.font = `${Math.max(fontSize * 0.6, 8)}px Arial`;
    ctx.fillText(sizeText, centerX, centerY + fontSize / 2);

    // Add imageset info
    ctx.font = `${Math.max(fontSize * 0.5, 8)}px Arial`;
    ctx.fillStyle = "#cbd5e0";
    ctx.fillText(parsed.imagesetName, centerX, centerY + fontSize);

    const dataURL = canvas.toDataURL("image/png");
    this.placeholderCache.set(cacheKey, dataURL);
    return dataURL;
  }

  /**
   * Create error placeholder for invalid references
   * @param {string} imageReference - Original reference
   * @param {string} reason - Error reason
   * @returns {string} Data URL for error placeholder
   */
  createErrorPlaceholder(imageReference, reason) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    // Red error background
    const gradient = ctx.createLinearGradient(0, 0, 128, 64);
    gradient.addColorStop(0, "#f56565");
    gradient.addColorStop(1, "#c53030");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 64);

    // Error border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 62);

    // Error text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ERROR", 64, 20);

    ctx.font = "10px Arial";
    ctx.fillText("Image Not Found", 64, 35);

    // Truncate long references
    let shortRef = imageReference || "Unknown";
    if (shortRef.length > 15) {
      shortRef = shortRef.substring(0, 15) + "...";
    }

    ctx.font = "8px Arial";
    ctx.fillText(shortRef, 64, 50);

    return canvas.toDataURL("image/png");
  }

  /**
   * Create a canvas element with the specified image drawn on it
   * @param {string} imageReference - Format: "set:ImagesetName image:ImageName"
   * @returns {HTMLCanvasElement|null} Canvas with image
   */
  createImageCanvas(imageReference) {
    const parsed = this.parseImageReference(imageReference);
    if (!parsed) {
      return null;
    }

    const imageInfo = this.getImageInfo(parsed.imagesetName, parsed.imageName);
    if (!imageInfo) {
      return null;
    }

    // Try to get texture from cache (for real textures only)
    const textureImg = this.imageCache.get(this.basePath + imageInfo.imagefile);

    if (!textureImg || textureImg.isPlaceholder) {
      console.warn(
        `Real texture not available for canvas creation: ${imageInfo.imagefile}`
      );
      return null;
    }

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = imageInfo.width;
    canvas.height = imageInfo.height;

    const ctx = canvas.getContext("2d");

    // Draw the specific part of the texture
    ctx.drawImage(
      textureImg,
      imageInfo.xPos,
      imageInfo.yPos,
      imageInfo.width,
      imageInfo.height,
      0,
      0,
      imageInfo.width,
      imageInfo.height
    );

    return canvas;
  }


  /**
   * Get list of all loaded imagesets
   * @returns {Array<string>} List of imageset names
   */
  getLoadedImagesets() {
    return Array.from(this.imagesets.keys());
  }

  /**
   * Get list of images in an imageset
   * @param {string} imagesetName - Name of the imageset
   * @returns {Array<string>} List of image names
   */
  getImagesetImages(imagesetName) {
    const imageset = this.imagesets.get(imagesetName);
    return imageset ? Array.from(imageset.images.keys()) : [];
  }

  /**
   * Clear all loaded data
   */
  clear() {
    this.imagesets.clear();
    this.imageCache.clear();
    this.loadingPromises.clear();
    this.placeholderCache.clear();
  }

  /**
   * Apply multi-state images to a DOM element
   * @param {HTMLElement} element - DOM element to apply styles to
   * @param {Object} imageStates - Object containing image references for different states
   * @param {Object} options - Additional options
   */
  applyMultiStateImages(element, imageStates, options = {}) {
    console.log("🎯 applyMultiStateImages called:", {
      element,
      imageStates,
      options,
    });

    const cssStyles = this.getMultiStateImageCSS(imageStates);

    if (!cssStyles.normal) {
      console.warn("❌ No normal state available for multi-state image");
      return;
    }

    // Apply base styles (normal state)
    this._applyStylesToElement(element, cssStyles.normal);

    // Set up event listeners for state changes
    if (cssStyles.hover) {
      element.addEventListener("mouseenter", () => {
        this._applyStylesToElement(element, cssStyles.hover);
      });

      element.addEventListener("mouseleave", () => {
        if (!element.classList.contains("pressed") && !element.disabled) {
          this._applyStylesToElement(element, cssStyles.normal);
        }
      });
    }

    if (cssStyles.pushed) {
      element.addEventListener("mousedown", () => {
        this._applyStylesToElement(element, cssStyles.pushed);
        element.classList.add("pressed");
      });

      element.addEventListener("mouseup", () => {
        element.classList.remove("pressed");
        if (element.matches(":hover") && cssStyles.hover) {
          this._applyStylesToElement(element, cssStyles.hover);
        } else {
          this._applyStylesToElement(element, cssStyles.normal);
        }
      });
    }

    // Handle disabled state
    if (cssStyles.disabled) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "disabled"
          ) {
            if (element.disabled) {
              this._applyStylesToElement(element, cssStyles.disabled);
            } else {
              this._applyStylesToElement(element, cssStyles.normal);
            }
          }
        });
      });

      observer.observe(element, {
        attributes: true,
        attributeFilter: ["disabled"],
      });
    }
  }

  /**
   * Helper method to apply CSS styles to an element
   * @param {HTMLElement} element - DOM element
   * @param {Object} styles - CSS styles object
   * @private
   */
  _applyStylesToElement(element, styles) {
    Object.entries(styles).forEach(([property, value]) => {
      if (
        property.startsWith("background") ||
        ["width", "height"].includes(property)
      ) {
        element.style[property] = value;
      }
    });
  }

  /**
   * Validate multi-state image references
   * @param {Object} imageStates - Image state references to validate
   * @returns {Object} Validation result with success/error info
   */
  validateMultiStateImages(imageStates) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      validStates: [],
      invalidStates: [],
    };

    // Check if at least normal state is provided
    if (!imageStates.normal) {
      result.errors.push("Normal state is required but not provided");
      result.isValid = false;
    }

    // Validate each state
    for (const [stateName, imageReference] of Object.entries(imageStates)) {
      if (!imageReference) {
        result.warnings.push(`${stateName} state is empty`);
        continue;
      }

      const parsed = this.parseImageReference(imageReference);
      if (!parsed) {
        result.errors.push(
          `Invalid image reference format for ${stateName}: ${imageReference}`
        );
        result.invalidStates.push(stateName);
        result.isValid = false;
        continue;
      }

      const imageInfo = this.getImageInfo(
        parsed.imagesetName,
        parsed.imageName
      );
      if (!imageInfo) {
        result.errors.push(
          `Image not found for ${stateName}: ${imageReference}`
        );
        result.invalidStates.push(stateName);
        result.isValid = false;
      } else {
        result.validStates.push(stateName);
      }
    }

    return result;
  }
}

// Export singleton instance for browser use
if (typeof window !== "undefined") {
  window.ImagesetLoader = window.ImagesetLoader || new ImagesetLoader();
}
