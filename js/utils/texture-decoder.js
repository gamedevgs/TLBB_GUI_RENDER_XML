/**
 * Texture Decoder Utility for TLBB
 * Supports TGA and DDS texture formats
 */

class TextureDecoder {
    /**
     * Decode TGA image from ArrayBuffer
     * @param {ArrayBuffer} buffer - TGA file buffer
     * @returns {Object} {canvas, width, height}
     */
    static decodeTGA(buffer) {
        const dv = new DataView(buffer);
        const idLength = dv.getUint8(0);
        const colorMapType = dv.getUint8(1);
        const imageType = dv.getUint8(2);
        
        if (colorMapType !== 0) throw new Error("Color-mapped TGA not supported");
        if (imageType !== 2 && imageType !== 10) throw new Error("Unsupported TGA type " + imageType);
        
        const width = dv.getUint16(12, true);
        const height = dv.getUint16(14, true);
        const bpp = dv.getUint8(16);
        const descriptor = dv.getUint8(17);
        
        if (bpp !== 24 && bpp !== 32) throw new Error(`Unsupported TGA bpp: ${bpp}`);
        
        const hasAlpha = bpp === 32;
        const bytesPerPixel = bpp / 8;
        const isCompressed = imageType === 10;
        const flipVertical = (descriptor & 0x20) === 0; // Origin at bottom-left
        
        let dataOffset = 18 + idLength;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        
        if (isCompressed) {
            // RLE compressed
            let pixelIndex = 0;
            let dataIndex = dataOffset;
            
            while (pixelIndex < width * height && dataIndex < buffer.byteLength) {
                const header = dv.getUint8(dataIndex++);
                const runLength = (header & 0x7F) + 1;
                
                if (header & 0x80) {
                    // Run-length packet
                    const b = dv.getUint8(dataIndex++);
                    const g = dv.getUint8(dataIndex++);
                    const r = dv.getUint8(dataIndex++);
                    const a = hasAlpha ? dv.getUint8(dataIndex++) : 255;
                    
                    for (let i = 0; i < runLength; i++) {
                        const y = flipVertical ? height - 1 - Math.floor(pixelIndex / width) : Math.floor(pixelIndex / width);
                        const x = pixelIndex % width;
                        const idx = (y * width + x) * 4;
                        
                        pixels[idx] = r;
                        pixels[idx + 1] = g;
                        pixels[idx + 2] = b;
                        pixels[idx + 3] = a;
                        pixelIndex++;
                    }
                } else {
                    // Raw packet
                    for (let i = 0; i < runLength; i++) {
                        const b = dv.getUint8(dataIndex++);
                        const g = dv.getUint8(dataIndex++);
                        const r = dv.getUint8(dataIndex++);
                        const a = hasAlpha ? dv.getUint8(dataIndex++) : 255;
                        
                        const y = flipVertical ? height - 1 - Math.floor(pixelIndex / width) : Math.floor(pixelIndex / width);
                        const x = pixelIndex % width;
                        const idx = (y * width + x) * 4;
                        
                        pixels[idx] = r;
                        pixels[idx + 1] = g;
                        pixels[idx + 2] = b;
                        pixels[idx + 3] = a;
                        pixelIndex++;
                    }
                }
            }
        } else {
            // Uncompressed
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixelOffset = dataOffset + (y * width + x) * bytesPerPixel;
                    const b = dv.getUint8(pixelOffset);
                    const g = dv.getUint8(pixelOffset + 1);
                    const r = dv.getUint8(pixelOffset + 2);
                    const a = hasAlpha ? dv.getUint8(pixelOffset + 3) : 255;
                    
                    const targetY = flipVertical ? height - 1 - y : y;
                    const idx = (targetY * width + x) * 4;
                    
                    pixels[idx] = r;
                    pixels[idx + 1] = g;
                    pixels[idx + 2] = b;
                    pixels[idx + 3] = a;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return { canvas, width, height };
    }

    /**
     * Decode DDS image from ArrayBuffer
     * @param {ArrayBuffer} buffer - DDS file buffer  
     * @returns {Object} {canvas, width, height}
     */
    static decodeDDS(buffer) {
        const dv = new DataView(buffer);
        
        // Check DDS magic
        const magic = dv.getUint32(0, true);
        if (magic !== 0x20534444) throw new Error("Not a valid DDS file");
        
        // Read DDS header
        const headerSize = dv.getUint32(4, true);
        if (headerSize !== 124) throw new Error("Invalid DDS header size");
        
        const height = dv.getUint32(12, true);
        const width = dv.getUint32(16, true);
        const linearSize = dv.getUint32(20, true);
        const mipMapCount = dv.getUint32(28, true);
        
        // Read pixel format
        const pfSize = dv.getUint32(76, true);
        const pfFlags = dv.getUint32(80, true);
        const fourCC = dv.getUint32(84, true);
        const rgbBitCount = dv.getUint32(88, true);
        const rBitMask = dv.getUint32(92, true);
        const gBitMask = dv.getUint32(96, true);
        const bBitMask = dv.getUint32(100, true);
        const aBitMask = dv.getUint32(104, true);
        
        let dataOffset = 128; // Standard DDS header size
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Handle different DDS formats
        if (pfFlags & 0x4) { // DDPF_FOURCC - compressed format
            const fourCCStr = String.fromCharCode(
                fourCC & 0xFF,
                (fourCC >> 8) & 0xFF,
                (fourCC >> 16) & 0xFF,
                (fourCC >> 24) & 0xFF
            );
            
            console.log(`🔍 DDS Format detected: ${fourCCStr} (${width}x${height})`);
            
            switch (fourCCStr) {
                case 'DXT1':
                    this._decodeDXT1(dv, dataOffset, width, height, ctx);
                    break;
                case 'DXT3':
                    this._decodeDXT3(dv, dataOffset, width, height, ctx);
                    break;
                case 'DXT5':
                    this._decodeDXT5(dv, dataOffset, width, height, ctx);
                    break;
                default:
                    throw new Error(`Unsupported DDS format: ${fourCCStr}`);
            }
        } else if (pfFlags & 0x40) { // DDPF_RGB - uncompressed RGB
            console.log(`🔍 DDS Format: Uncompressed RGB (${width}x${height})`);
            this._decodeUncompressedDDS(dv, dataOffset, width, height, rgbBitCount, 
                rBitMask, gBitMask, bBitMask, aBitMask, ctx);
        } else {
            throw new Error("Unsupported DDS pixel format");
        }
        
        return { canvas, width, height };
    }
    
    // DXT1 decoder (simplified)
    static _decodeDXT1(dv, offset, width, height, ctx) {
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        
        for (let by = 0; by < height; by += 4) {
            for (let bx = 0; bx < width; bx += 4) {
                const blockOffset = offset + ((by / 4) * Math.ceil(width / 4) + (bx / 4)) * 8;
                
                const color0 = dv.getUint16(blockOffset, true);
                const color1 = dv.getUint16(blockOffset + 2, true);
                const indices = dv.getUint32(blockOffset + 4, true);
                
                // Decode RGB565 colors
                const r0 = ((color0 >> 11) & 0x1F) * 8;
                const g0 = ((color0 >> 5) & 0x3F) * 4;
                const b0 = (color0 & 0x1F) * 8;
                
                const r1 = ((color1 >> 11) & 0x1F) * 8;
                const g1 = ((color1 >> 5) & 0x3F) * 4;
                const b1 = (color1 & 0x1F) * 8;
                
                // Create color palette
                const colors = [
                    [r0, g0, b0, 255],
                    [r1, g1, b1, 255]
                ];
                
                if (color0 > color1) {
                    colors[2] = [
                        Math.floor((2 * r0 + r1) / 3),
                        Math.floor((2 * g0 + g1) / 3),
                        Math.floor((2 * b0 + b1) / 3),
                        255
                    ];
                    colors[3] = [
                        Math.floor((r0 + 2 * r1) / 3),
                        Math.floor((g0 + 2 * g1) / 3),
                        Math.floor((b0 + 2 * b1) / 3),
                        255
                    ];
                } else {
                    colors[2] = [
                        Math.floor((r0 + r1) / 2),
                        Math.floor((g0 + g1) / 2),
                        Math.floor((b0 + b1) / 2),
                        255
                    ];
                    colors[3] = [0, 0, 0, 0]; // Transparent
                }
                
                // Apply colors to 4x4 block
                for (let py = 0; py < 4; py++) {
                    for (let px = 0; px < 4; px++) {
                        const x = bx + px;
                        const y = by + py;
                        
                        if (x < width && y < height) {
                            const bitIndex = py * 4 + px;
                            const colorIndex = (indices >> (bitIndex * 2)) & 0x3;
                            const color = colors[colorIndex];
                            
                            const pixelIndex = (y * width + x) * 4;
                            pixels[pixelIndex] = color[0];
                            pixels[pixelIndex + 1] = color[1];
                            pixels[pixelIndex + 2] = color[2];
                            pixels[pixelIndex + 3] = color[3];
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // DXT3 (BC2) decoder - basic implementation
    static _decodeDXT3(dv, offset, width, height, ctx) {
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        
        const blocksWide = Math.ceil(width / 4);
        const blocksHigh = Math.ceil(height / 4);
        
        for (let blockY = 0; blockY < blocksHigh; blockY++) {
            for (let blockX = 0; blockX < blocksWide; blockX++) {
                const blockOffset = offset + (blockY * blocksWide + blockX) * 16;
                
                // DXT3 has 8 bytes alpha + 8 bytes color
                // Read alpha data (8 bytes, 4 bits per pixel)
                const alphaData = [];
                for (let i = 0; i < 8; i++) {
                    const alphaByte = dv.getUint8(blockOffset + i);
                    alphaData.push((alphaByte & 0xF) * 17); // Convert 4-bit to 8-bit
                    alphaData.push(((alphaByte >> 4) & 0xF) * 17);
                }
                
                // Read color data (8 bytes)
                const color0 = dv.getUint16(blockOffset + 8, true);
                const color1 = dv.getUint16(blockOffset + 10, true);
                
                // Convert RGB565 to RGB
                const colors = [
                    this._rgb565ToRgb(color0),
                    this._rgb565ToRgb(color1),
                    [0, 0, 0], // Will be calculated
                    [0, 0, 0]  // Will be calculated
                ];
                
                // Calculate intermediate colors
                colors[2] = [
                    Math.floor((2 * colors[0][0] + colors[1][0]) / 3),
                    Math.floor((2 * colors[0][1] + colors[1][1]) / 3),
                    Math.floor((2 * colors[0][2] + colors[1][2]) / 3)
                ];
                colors[3] = [
                    Math.floor((colors[0][0] + 2 * colors[1][0]) / 3),
                    Math.floor((colors[0][1] + 2 * colors[1][1]) / 3),
                    Math.floor((colors[0][2] + 2 * colors[1][2]) / 3)
                ];
                
                // Read pixel indices (4 bytes)
                const indices = dv.getUint32(blockOffset + 12, true);
                
                // Decode 4x4 block
                for (let py = 0; py < 4; py++) {
                    for (let px = 0; px < 4; px++) {
                        const x = blockX * 4 + px;
                        const y = blockY * 4 + py;
                        
                        if (x >= width || y >= height) continue;
                        
                        const pixelIndex = (py * 4 + px);
                        const colorIndex = (indices >> (pixelIndex * 2)) & 0x3;
                        const alpha = alphaData[pixelIndex];
                        
                        const color = colors[colorIndex];
                        const outputIndex = (y * width + x) * 4;
                        
                        pixels[outputIndex] = color[0];     // R
                        pixels[outputIndex + 1] = color[1]; // G
                        pixels[outputIndex + 2] = color[2]; // B
                        pixels[outputIndex + 3] = alpha;    // A
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Helper to convert RGB565 to RGB
    static _rgb565ToRgb(rgb565) {
        const r = ((rgb565 >> 11) & 0x1F) * 8; // 5 bits -> 8 bits
        const g = ((rgb565 >> 5) & 0x3F) * 4;  // 6 bits -> 8 bits  
        const b = (rgb565 & 0x1F) * 8;         // 5 bits -> 8 bits
        return [r, g, b];
    }
    
    static _decodeDXT5(dv, offset, width, height, ctx) {
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        
        const blocksWide = Math.ceil(width / 4);
        const blocksHigh = Math.ceil(height / 4);
        
        for (let blockY = 0; blockY < blocksHigh; blockY++) {
            for (let blockX = 0; blockX < blocksWide; blockX++) {
                const blockOffset = offset + (blockY * blocksWide + blockX) * 16;
                
                // DXT5 has 8 bytes alpha interpolation + 8 bytes color
                // Read alpha endpoints
                const alpha0 = dv.getUint8(blockOffset);
                const alpha1 = dv.getUint8(blockOffset + 1);
                
                // Calculate alpha palette
                const alphas = [alpha0, alpha1];
                if (alpha0 > alpha1) {
                    for (let i = 1; i < 7; i++) {
                        alphas.push(Math.floor(((7 - i) * alpha0 + i * alpha1) / 7));
                    }
                } else {
                    for (let i = 1; i < 5; i++) {
                        alphas.push(Math.floor(((5 - i) * alpha0 + i * alpha1) / 5));
                    }
                    alphas.push(0);
                    alphas.push(255);
                }
                
                // Read alpha indices (6 bytes, 3 bits each)
                const alphaIndices = [];
                for (let i = 0; i < 2; i++) {
                    let value = dv.getUint8(blockOffset + 2 + i * 3) |
                               (dv.getUint8(blockOffset + 3 + i * 3) << 8) |
                               (dv.getUint8(blockOffset + 4 + i * 3) << 16);
                    for (let j = 0; j < 8; j++) {
                        alphaIndices.push((value >> (j * 3)) & 0x7);
                    }
                }
                
                // Read color data (same as DXT1)
                const color0 = dv.getUint16(blockOffset + 8, true);
                const color1 = dv.getUint16(blockOffset + 10, true);
                
                const colors = [
                    this._rgb565ToRgb(color0),
                    this._rgb565ToRgb(color1),
                    [
                        Math.floor((2 * this._rgb565ToRgb(color0)[0] + this._rgb565ToRgb(color1)[0]) / 3),
                        Math.floor((2 * this._rgb565ToRgb(color0)[1] + this._rgb565ToRgb(color1)[1]) / 3),
                        Math.floor((2 * this._rgb565ToRgb(color0)[2] + this._rgb565ToRgb(color1)[2]) / 3)
                    ],
                    [
                        Math.floor((this._rgb565ToRgb(color0)[0] + 2 * this._rgb565ToRgb(color1)[0]) / 3),
                        Math.floor((this._rgb565ToRgb(color0)[1] + 2 * this._rgb565ToRgb(color1)[1]) / 3),
                        Math.floor((this._rgb565ToRgb(color0)[2] + 2 * this._rgb565ToRgb(color1)[2]) / 3)
                    ]
                ];
                
                // Read color indices
                const indices = dv.getUint32(blockOffset + 12, true);
                
                // Decode 4x4 block
                for (let py = 0; py < 4; py++) {
                    for (let px = 0; px < 4; px++) {
                        const x = blockX * 4 + px;
                        const y = blockY * 4 + py;
                        
                        if (x >= width || y >= height) continue;
                        
                        const pixelIndex = py * 4 + px;
                        const colorIndex = (indices >> (pixelIndex * 2)) & 0x3;
                        const alphaIndex = alphaIndices[pixelIndex];
                        
                        const color = colors[colorIndex];
                        const alpha = alphas[alphaIndex];
                        const outputIndex = (y * width + x) * 4;
                        
                        pixels[outputIndex] = color[0];     // R
                        pixels[outputIndex + 1] = color[1]; // G
                        pixels[outputIndex + 2] = color[2]; // B
                        pixels[outputIndex + 3] = alpha;    // A
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Uncompressed RGB decoder
    static _decodeUncompressedDDS(dv, offset, width, height, bitCount, rMask, gMask, bMask, aMask, ctx) {
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        const bytesPerPixel = bitCount / 8;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelOffset = offset + (y * width + x) * bytesPerPixel;
                let pixelValue;
                
                if (bytesPerPixel === 2) {
                    pixelValue = dv.getUint16(pixelOffset, true);
                } else if (bytesPerPixel === 4) {
                    pixelValue = dv.getUint32(pixelOffset, true);
                } else {
                    throw new Error(`Unsupported bit count: ${bitCount}`);
                }
                
                const r = this._extractBits(pixelValue, rMask);
                const g = this._extractBits(pixelValue, gMask);
                const b = this._extractBits(pixelValue, bMask);
                const a = aMask ? this._extractBits(pixelValue, aMask) : 255;
                
                const idx = (y * width + x) * 4;
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
                pixels[idx + 3] = a;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    static _extractBits(value, mask) {
        if (!mask) return 0;
        
        const shift = Math.log2(mask & -mask); // Find first set bit
        const bits = Math.log2((mask >> shift) + 1); // Count bits
        const extracted = (value & mask) >> shift;
        
        // Scale to 8-bit
        return Math.round((extracted / ((1 << bits) - 1)) * 255);
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.TextureDecoder = TextureDecoder;
}
