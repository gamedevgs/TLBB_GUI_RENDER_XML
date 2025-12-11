# TLBB Multi-State Images Handler

Hệ thống xử lý nhiều trạng thái hình ảnh cho TLBB GUI, hỗ trợ các trạng thái button như Normal, Hover, Pushed, Disabled.

## 🚀 Tính năng chính

- ✅ Xử lý đầy đủ các trạng thái: Normal, Hover, Pushed, Disabled
- ✅ Hỗ trợ format image reference TLBB: `set:ImagesetName image:ImageName`
- ✅ Tự động áp dụng CSS cho các trạng thái
- ✅ Presets sẵn có cho các button phổ biến
- ✅ Validation image states
- ✅ Generate CSS rules tự động
- ✅ Pattern-based image state creation

## 📁 Files

### Core Files (Production)
- `js/utils/imageset-loader.js` - Core ImagesetLoader với multi-state support
- `js/utils/multi-state-image-helper.js` - Helper class để dễ dàng sử dụng

### Test Files (Development)
- `tests/index.html` - Test suite index
- `tests/simple-test.html` - Test đơn giản với mock data
- `tests/demo-helper.html` - Demo sử dụng helper class
- `tests/debug-imagesets.html` - Debug tool cho imagesets
- `tests/test-multi-state-images.html` - Demo chi tiết các tính năng

### Documentation
- `MULTI_STATE_IMAGES.md` - Hướng dẫn này

## 🔧 Cách sử dụng

### 1. Cơ bản với ImagesetLoader

```javascript
// Khởi tạo ImagesetLoader
const imagesetLoader = new ImagesetLoader();
imagesetLoader.setBasePath('./');

// Load imageset
await imagesetLoader.loadImagesetByNameGuess('Button5');

// Định nghĩa các trạng thái
const imageStates = {
    normal: 'set:Button5 image:BtnLevelup_Normal',
    hover: 'set:Button5 image:BtnLevelup_Hover',
    pushed: 'set:Button5 image:BtnLevelup_Pushed',
    disabled: 'set:Button5 image:BtnLevelup_Disabled'
};

// Áp dụng cho element
const button = document.getElementById('myButton');
imagesetLoader.applyMultiStateImages(button, imageStates);
```

### 2. Sử dụng Helper Class

```javascript
// Khởi tạo helper
const helper = new TLBBMultiStateImageHelper(imagesetLoader);

// Tạo button với preset
const okButton = helper.createButton('ok', {
    text: 'OK',
    onClick: () => console.log('OK clicked!')
});

// Áp dụng preset cho element có sẵn
helper.applyPreset(existingElement, 'levelup');

// Tạo pattern tùy chỉnh
const customStates = helper.createImageStatesFromPattern('Button5', 'BtnLevelup');
```

### 3. Generate CSS Rules

```javascript
// Generate CSS cho tất cả states
const cssRules = imagesetLoader.generateMultiStateCSSRules(
    '.my-button',
    imageStates,
    { includeTransitions: true, transitionDuration: '0.3s' }
);

// Thêm CSS vào document
const style = document.createElement('style');
style.textContent = cssRules;
document.head.appendChild(style);
```

## 📋 Presets có sẵn

- `levelup` - Button nâng cấp
- `ok` - Button xác nhận
- `cancel` - Button hủy
- `close` - Button đóng

## 🎯 API Reference

### ImagesetLoader Methods

#### `getMultiStateImageCSS(imageStates)`
Lấy CSS styles cho tất cả các trạng thái.

**Parameters:**
- `imageStates` - Object chứa image references cho các states

**Returns:** Object chứa CSS cho từng state

#### `applyMultiStateImages(element, imageStates, options)`
Áp dụng multi-state images cho DOM element.

**Parameters:**
- `element` - DOM element
- `imageStates` - Object chứa image references
- `options` - Tùy chọn bổ sung

#### `generateMultiStateCSSRules(selector, imageStates, options)`
Generate CSS class definitions cho multi-state element.

**Parameters:**
- `selector` - CSS selector
- `imageStates` - Object chứa image references  
- `options` - Tùy chọn (includeTransitions, transitionDuration)

**Returns:** String chứa CSS rules

#### `validateMultiStateImages(imageStates)`
Validate image state references.

**Returns:** Object với thông tin validation

### TLBBMultiStateImageHelper Methods

#### `createButton(presetName, options)`
Tạo button mới với preset.

**Parameters:**
- `presetName` - Tên preset hoặc 'custom'
- `options` - Tùy chọn (text, className, onClick, disabled, customStates)

#### `applyPreset(element, presetName, customStates)`
Áp dụng preset cho element có sẵn.

#### `createImageStatesFromPattern(imagesetName, baseImageName, states)`
Tạo image states từ pattern.

**Parameters:**
- `imagesetName` - Tên imageset
- `baseImageName` - Base name (không bao gồm suffix)
- `states` - Array các state suffixes (default: ['Normal', 'Hover', 'Pushed', 'Disabled'])

## 🔍 Validation

```javascript
// Validate tất cả presets
const results = helper.validateAllPresets();

// Validate specific states
const validation = imagesetLoader.validateMultiStateImages(imageStates);
console.log(validation.isValid); // true/false
console.log(validation.errors);  // Array of error messages
console.log(validation.validStates); // Array of valid state names
```

## 📝 Image States Format

Image states object phải có format:

```javascript
{
    normal: 'set:ImagesetName image:ImageName_Normal',     // Required
    hover: 'set:ImagesetName image:ImageName_Hover',       // Optional  
    pushed: 'set:ImagesetName image:ImageName_Pushed',     // Optional
    disabled: 'set:ImagesetName image:ImageName_Disabled'  // Optional
}
```

## 🎨 CSS Classes Generated

Khi generate CSS, hệ thống tạo các classes:

```css
.my-button {
    /* Base styles (normal state) */
    background-image: url('...');
    background-position: ...;
    width: ...;
    height: ...;
    transition: background-image 0.2s, background-position 0.2s;
}

.my-button:hover {
    /* Hover state styles */
}

.my-button:active,
.my-button.pressed {
    /* Active/pushed state styles */
}

.my-button:disabled,
.my-button.disabled {
    /* Disabled state styles */
    opacity: 0.6;
}
```

## 🧪 Testing

### Để test các tính năng:
1. Mở `tests/index.html` trong browser
2. Chọn test phù hợp:
   - **Debug Tool** - Kiểm tra imageset files và paths
   - **Simple Test** - Test với mock data
   - **Helper Demo** - Demo TLBBMultiStateImageHelper
   - **Full API Demo** - Test tất cả APIs

### Production Usage:
Chỉ cần include 2 files core:
```html
<script src="js/utils/imageset-loader.js"></script>
<script src="js/utils/multi-state-image-helper.js"></script>
```

## 🐛 Troubleshooting

### Images không hiển thị
- Kiểm tra imageset đã được load chưa
- Verify image references format
- Check console cho errors

### States không hoạt động
- Ensure element có event listeners
- Check CSS được apply chưa
- Verify image paths

### Performance issues
- Sử dụng image caching
- Preload các imagesets cần thiết
- Minimize DOM manipulations

## 🔄 Example Workflow

```javascript
// 1. Initialize
const imagesetLoader = new ImagesetLoader();
const helper = new TLBBMultiStateImageHelper(imagesetLoader);

// 2. Load imagesets
await imagesetLoader.loadImagesetByNameGuess('Button5');

// 3. Create buttons
const buttons = ['ok', 'cancel', 'close'].map(preset => 
    helper.createButton(preset, { text: preset.toUpperCase() })
);

// 4. Add to DOM
buttons.forEach(btn => document.body.appendChild(btn));
```

Hệ thống này giúp bạn dễ dàng xử lý các button với nhiều trạng thái trong TLBB GUI một cách hiệu quả và có tổ chức!
