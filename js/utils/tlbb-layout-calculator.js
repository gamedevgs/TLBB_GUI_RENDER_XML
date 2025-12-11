/**
 * TLBBLayoutCalculator
 * Chính xác hoá việc tính toán layout theo đặc tả TLBB, tách biệt hoàn toàn rendering.
 * Dựa trên các guideline trong DISPLAY_FIXES_README.md & RENDERER_IMPROVEMENTS.md
 */
class TLBBLayoutCalculator {
  constructor(options = {}) {
    this.virtualWidth = options.virtualWidth || 1024;
    this.virtualHeight = options.virtualHeight || 768;
    this.enableDebug = !!options.debug;
  }

  log(...args) { if (this.enableDebug) console.log('[TLBBLayoutCalc]', ...args); }

  compute(elements) {
    const sorted = [...elements].sort((a,b)=>this.depth(a)-this.depth(b));
    // Pass 0: parse components
    for (const el of sorted) this.parseComponents(el);
    // Pass 1: provisional size (top-down)
    const registry = new Map();
    for (const el of sorted) {
      const parent = el.parentPath ? registry.get(el.parentPath) : null;
      const parentSize = parent ? { width: parent.bounds?.width ?? parent.provisionalWidth, height: parent.bounds?.height ?? parent.provisionalHeight } : { width: this.virtualWidth, height: this.virtualHeight };
      const size = this.computeSize(el, parentSize);
      el.provisionalWidth = size.width; el.provisionalHeight = size.height;
      registry.set(el.path, el);
    }
    // Pass 2: final bounds
    for (const el of sorted) {
      const parent = el.parentPath ? registry.get(el.parentPath) : null;
      const parentBox = parent ? parent.bounds || { x: parent.bounds?.x || 0, y: parent.bounds?.y || 0, width: parent.provisionalWidth, height: parent.provisionalHeight } : { x:0, y:0, width:this.virtualWidth, height:this.virtualHeight };
      const bounds = this.calculateElementBounds(el, parentBox);
      el.boundsOriginal = Object.freeze({ ...bounds });
      el.bounds = bounds;
    }
  
    return sorted;
  }
  depth(el){ return (el.path||'').split('/').filter(Boolean).length; }

  calculateElementBounds(el, parent){
    if (!parent || parent.width == null || parent.height == null) parent = { x:0, y:0, width:this.virtualWidth, height:this.virtualHeight };
    const size = this.computeSize(el, { width: parent.width, height: parent.height });
    if (size.width === 0 && size.height === 0 && el._parsedSize?.source === 'Implicit') {
      size.width = parent.width; size.height = parent.height; // inherit
      this.log('[InheritSize]', el.name, '->', size.width, size.height);
    }
    const pos = this.computePosition(el, parent);
    const visualMin = 1;
    return { x:pos.x, y:pos.y, width:Math.max(0,size.width), height:Math.max(0,size.height), visualWidth:Math.max(visualMin,size.width), visualHeight:Math.max(visualMin,size.height) };
  }

  // ==== Parsing ====
  parseComponents(el){
    // Position components
    const p = {};
    if (el.unifiedPosition) {
      const parts = this.extractUnified(el.unifiedPosition); if (parts) { [p.relX,p.absX,p.relY,p.absY]=parts; p.source='UnifiedPosition'; }
    } else if (el.unifiedXPosition || el.unifiedYPosition) {
      const x = this.extractSingleUnified(el.unifiedXPosition) || [0,0];
      const y = this.extractSingleUnified(el.unifiedYPosition) || [0,0];
      [p.relX,p.absX]=x; [p.relY,p.absY]=y; p.source='UnifiedXYPosition';
    } else if (el.absolutePosition) {
      const xm = el.absolutePosition.match(/x:([-\d.]+)/i); const ym = el.absolutePosition.match(/y:([-\d.]+)/i);
      p.relX=0; p.absX=xm?parseFloat(xm[1]):0; p.relY=0; p.absY=ym?parseFloat(ym[1]):0; p.source='AbsolutePosition';
    } else if (el.position) {
      const xm = el.position.match(/x:([-\d.]+)/i); const ym = el.position.match(/y:([-\d.]+)/i);
      const rx = xm?parseFloat(xm[1]):0; const ry = ym?parseFloat(ym[1]):0;
      if (Math.abs(rx)<=1 && /\d+\.\d+/.test(xm?xm[1]:'')) { p.relX=rx; p.absX=0; } else { p.relX=0; p.absX=rx; }
      if (Math.abs(ry)<=1 && /\d+\.\d+/.test(ym?ym[1]:'')) { p.relY=ry; p.absY=0; } else { p.relY=0; p.absY=ry; }
      p.source='Position';
    } else { p.relX=0; p.absX=0; p.relY=0; p.absY=0; p.source='Inherited'; }
    el._parsedPos = p;

    // Size components
    const s = {};
    if (el.unifiedSize) {
      const parts = this.extractUnified(el.unifiedSize); if (parts) { [s.relW,s.absW,s.relH,s.absH]=parts; s.source='UnifiedSize'; }
    } else if (el.unifiedXSize || el.unifiedYSize) {
      const x = this.extractSingleUnified(el.unifiedXSize) || [0,0];
      const y = this.extractSingleUnified(el.unifiedYSize) || [0,0];
      [s.relW,s.absW]=x; [s.relH,s.absH]=y; s.source='UnifiedXYSize';
    } else if (el.absoluteSize) {
      const wm = el.absoluteSize.match(/w:([-\d.]+)/i); const hm = el.absoluteSize.match(/h:([-\d.]+)/i);
      s.relW=0; s.absW=wm?parseFloat(wm[1]):0; s.relH=0; s.absH=hm?parseFloat(hm[1]):0; s.source='AbsoluteSize';
    } else if (el.size) {
      const wm = el.size.match(/w:([-\d.]+)/i); const hm = el.size.match(/h:([-\d.]+)/i);
      const rw = wm?parseFloat(wm[1]):0; const rh = hm?parseFloat(hm[1]):0;
      if (rw<=1 && /\d+\.\d+/.test(wm?wm[1]:'')) { s.relW=rw; s.absW=0; } else { s.relW=0; s.absW=rw; }
      if (rh<=1 && /\d+\.\d+/.test(hm?hm[1]:'')) { s.relH=rh; s.absH=0; } else { s.relH=0; s.absH=rh; }
      s.source='Size';
    } else { s.relW=0; s.absW=0; s.relH=0; s.absH=0; s.source='Implicit'; }
    el._parsedSize = s;
  }

  computeSize(el,parentSize){
    const s = el._parsedSize || { relW:0, absW:0, relH:0, absH:0 };
    let width = parentSize.width * (s.relW||0) + (s.absW||0);
    let height = parentSize.height * (s.relH||0) + (s.absH||0);
    if (width > this.virtualWidth*5) width = this.virtualWidth*5;
    if (height > this.virtualHeight*5) height = this.virtualHeight*5;
    if (width < 0) width = 0; if (height < 0) height = 0;
    return { width, height };
  }

  computePosition(el,parent){
    const p = el._parsedPos || { relX:0, absX:0, relY:0, absY:0 };
    return { x: parent.x + parent.width * (p.relX||0) + (p.absX||0), y: parent.y + parent.height * (p.relY||0) + (p.absY||0) };
  }
  // (old resolve/parse methods removed in refactor)

  // ------- Helpers ---------
  extractUnified(str){
    if (!str) return null;
    let norm = str.trim();
    if ((norm.startsWith('"') && norm.endsWith('"')) || (norm.startsWith("'") && norm.endsWith("'"))) norm = norm.slice(1,-1);
    while (norm.endsWith('}}}')) norm = norm.slice(0,-1);
    if (!norm.endsWith('}}')) { if (norm.endsWith('}')) norm += '}'; else norm += '}}'; }
    norm = norm.replace(/\s+/g,'');
    const m = norm.match(/\{\{([-\d.]+),([-\d.]+)\},\{([-\d.]+),([-\d.]+)\}\}/);
    if (!m) {
      const raw = norm.replace(/[{}]/g,'').split(',').filter(Boolean);
      if (raw.length>=4) { const nums = raw.slice(0,4).map(parseFloat); if (nums.every(n=>!isNaN(n))) { console.warn('[TLBBLayoutCalc] Fallback unified parse:',str,'=>',nums); return nums; } }
      console.warn('[TLBBLayoutCalc] Failed unified parse:', str); return null;
    }
    return m.slice(1).map(v=>parseFloat(v));
  }
  extractSingleUnified(str){ if(!str) return null; const m = str.trim().replace(/\s+/g,'').match(/\{([-\d.]+),([-\d.]+)\}/); return m?[parseFloat(m[1]), parseFloat(m[2])]:null; }
}

window.TLBBLayoutCalculator = TLBBLayoutCalculator;
