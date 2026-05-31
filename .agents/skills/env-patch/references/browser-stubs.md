# 浏览器环境存根目录

按诊断报告中出现的 UNDEFINED/ERRORS 按需取用。所有存根使用 `env_core.js` 的工具编写。

**约定**：以下代码中 `env` 指 `require('./env_core')`。

---

## document（基础）

```javascript
const [Document, fakeDocument] = env.getNativeProto('HTMLDocument', {});

// --- 基本属性用 getter，模拟浏览器行为 ---
Object.defineProperties(fakeDocument, {
    cookie:         { get() { return COOKIE; }, set(v) { COOKIE = v; }, enumerable: true, configurable: true },
    domain:         { get() { return DOMAIN; }, enumerable: true, configurable: true },
    URL:            { get() { return PAGE_URL; }, enumerable: true, configurable: true },
    referrer:       { get() { return ''; }, enumerable: true, configurable: true },
    title:          { get() { return ''; }, set() {}, enumerable: true, configurable: true },
    characterSet:   { get() { return 'UTF-8'; }, enumerable: true, configurable: true },
    readyState:     { get() { return 'complete'; }, enumerable: true, configurable: true },
    hidden:         { get() { return false; }, enumerable: true, configurable: true },
    visibilityState:{ get() { return 'visible'; }, enumerable: true, configurable: true },
});

// --- head / body ---
const fakeHead = { appendChild(c) { return c; }, removeChild(c) { return c; }, insertBefore(c) { return c; } };
const fakeBody = { appendChild(c) { return c; }, removeChild(c) { return c; }, insertBefore(c) { return c; } };
env.setObjNative(fakeHead, 'HTMLHeadElement');
env.setObjNative(fakeBody, 'HTMLBodyElement');
for (const m of ['appendChild', 'removeChild', 'insertBefore']) {
    env.setFuncNative(fakeHead[m], m, 1);
    env.setFuncNative(fakeBody[m], m, 1);
}
fakeDocument.head = fakeHead;
fakeDocument.body = fakeBody;
fakeDocument.documentElement = { style: {}, appendChild(c) { return c; } };
env.setFuncNative(fakeDocument.documentElement.appendChild, 'appendChild', 1);

// --- DOM 查询方法 ---
fakeDocument.getElementById = env.setFuncNative(function getElementById() { return null; }, 'getElementById', 1);
fakeDocument.getElementsByTagName = env.setFuncNative(function getElementsByTagName(tag) {
    tag = (tag || '').toLowerCase();
    if (tag === 'head') return [fakeDocument.head];
    if (tag === 'body') return [fakeDocument.body];
    return [];
}, 'getElementsByTagName', 1);
fakeDocument.getElementsByClassName = env.setFuncNative(function getElementsByClassName() { return []; }, 'getElementsByClassName', 1);
fakeDocument.querySelector = env.setFuncNative(function querySelector() { return null; }, 'querySelector', 1);
fakeDocument.querySelectorAll = env.setFuncNative(function querySelectorAll() { return []; }, 'querySelectorAll', 1);
fakeDocument.createElement = env.setFuncNative(function createElement(tag) {
    const el = {
        tagName: (tag || '').toUpperCase(), style: {}, childNodes: [],
        setAttribute() {}, getAttribute() { return null; },
        appendChild(c) { return c; }, removeChild(c) { return c; },
        addEventListener() {},
        offsetWidth: 100, offsetHeight: 20,
        innerHTML: '', innerText: '', textContent: '',
    };
    return el;
}, 'createElement', 1);
fakeDocument.createTextNode = env.setFuncNative(function createTextNode(t) { return { textContent: t }; }, 'createTextNode', 1);
fakeDocument.createEvent = env.setFuncNative(function createEvent(type) {
    return { type, initEvent() {}, preventDefault() {}, stopPropagation() {} };
}, 'createEvent', 1);
fakeDocument.addEventListener = env.setFuncNative(function addEventListener() {}, 'addEventListener', 2);
fakeDocument.removeEventListener = env.setFuncNative(function removeEventListener() {}, 'removeEventListener', 2);
```

---

## navigator（基础）

```javascript
const [Navigator, fakeNavigator] = env.getNativeProto('Navigator', {});

// 用 getter 模拟只读属性
Object.defineProperties(fakeNavigator, {
    userAgent:          { get() { return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'; }, enumerable: true },
    platform:           { get() { return 'MacIntel'; }, enumerable: true },
    language:           { get() { return 'zh-CN'; }, enumerable: true },
    languages:          { get() { return ['zh-CN', 'zh']; }, enumerable: true },
    cookieEnabled:      { get() { return true; }, enumerable: true },
    appName:            { get() { return 'Netscape'; }, enumerable: true },
    vendor:             { get() { return 'Google Inc.'; }, enumerable: true },
    onLine:             { get() { return true; }, enumerable: true },
    hardwareConcurrency:{ get() { return 8; }, enumerable: true },
    webdriver:          { get() { return false; }, enumerable: true },
    maxTouchPoints:     { get() { return 0; }, enumerable: true },
    deviceMemory:       { get() { return 8; }, enumerable: true },
    productSub:         { get() { return '20030107'; }, enumerable: true },
});

// --- plugins 完整链 ---
function makeMimeType(type, description, suffixes, plugin) {
    return { type, description, suffixes, enabledPlugin: plugin };
}
function makePlugin(name, description, filename, mimes) {
    const p = { name, description, filename, length: mimes.length };
    mimes.forEach((m, i) => {
        const mt = makeMimeType(m[0], m[1], m[2], p);
        p[i] = mt; p[m[0]] = mt;
    });
    p.item = env.setFuncNative(function item(i) { return p[i] || null; }, 'item', 1);
    p.namedItem = env.setFuncNative(function namedItem(n) { return p[n] || null; }, 'namedItem', 1);
    return p;
}

const pluginDefs = [
    ['PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer',
     [['application/pdf','Portable Document Format','pdf'], ['text/pdf','Portable Document Format','pdf']]],
    ['Chrome PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer',
     [['application/pdf','Portable Document Format','pdf'], ['text/pdf','Portable Document Format','pdf']]],
    ['Chromium PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer',
     [['application/pdf','Portable Document Format','pdf'], ['text/pdf','Portable Document Format','pdf']]],
    ['Microsoft Edge PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer',
     [['application/pdf','Portable Document Format','pdf'], ['text/pdf','Portable Document Format','pdf']]],
    ['WebKit built-in PDF', 'Portable Document Format', 'internal-pdf-viewer',
     [['application/pdf','Portable Document Format','pdf'], ['text/pdf','Portable Document Format','pdf']]],
];
const fakePlugins = pluginDefs.map(d => makePlugin(d[0], d[1], d[2], d[3]));
const fakePluginArray = { length: fakePlugins.length };
fakePlugins.forEach((p, i) => { fakePluginArray[i] = p; fakePluginArray[p.name] = p; });
fakePluginArray.item = env.setFuncNative(function item(i) { return fakePlugins[i] || null; }, 'item', 1);
fakePluginArray.namedItem = env.setFuncNative(function namedItem(n) { return fakePluginArray[n] || null; }, 'namedItem', 1);
fakePluginArray.refresh = env.setFuncNative(function refresh() {}, 'refresh', 0);
env.setObjNative(fakePluginArray, 'PluginArray');

Object.defineProperty(fakeNavigator, 'plugins', { get() { return fakePluginArray; }, enumerable: true });

// --- navigator.connection ---
const fakeConnection = {};
env.setObjNative(fakeConnection, 'NetworkInformation');
Object.defineProperties(fakeConnection, {
    effectiveType: { get() { return '4g'; }, enumerable: true },
    rtt:           { get() { return 50; }, enumerable: true },
    downlink:      { get() { return 10; }, enumerable: true },
    saveData:      { get() { return false; }, enumerable: true },
});
Object.defineProperty(fakeNavigator, 'connection', { get() { return fakeConnection; }, enumerable: true });
```

---

## location（基础）

```javascript
const fakeLocation = {};
env.setObjNative(fakeLocation, 'Location');

const url = new (globalThis.URL || URL)(PAGE_URL);
Object.defineProperties(fakeLocation, {
    href:     { get() { return PAGE_URL; }, set() {}, enumerable: true },
    protocol: { get() { return url.protocol; }, enumerable: true },
    host:     { get() { return url.host; }, enumerable: true },
    hostname: { get() { return url.hostname; }, enumerable: true },
    port:     { get() { return url.port; }, enumerable: true },
    pathname: { get() { return url.pathname; }, enumerable: true },
    search:   { get() { return url.search; }, enumerable: true },
    hash:     { get() { return ''; }, enumerable: true },
    origin:   { get() { return url.origin; }, enumerable: true },
});
fakeLocation.assign = env.setFuncNative(function assign() {}, 'assign', 1);
fakeLocation.replace = env.setFuncNative(function replace() {}, 'replace', 1);
fakeLocation.reload = env.setFuncNative(function reload() {}, 'reload', 0);
fakeLocation.toString = env.setFuncNative(function toString() { return PAGE_URL; }, 'toString', 0);
```

---

## screen（基础）

```javascript
const [Screen, fakeScreen] = env.getNativeProto('Screen', {});
Object.defineProperties(fakeScreen, {
    width:      { get() { return 1920; }, enumerable: true },
    height:     { get() { return 1080; }, enumerable: true },
    availWidth: { get() { return 1920; }, enumerable: true },
    availHeight:{ get() { return 1055; }, enumerable: true },
    colorDepth: { get() { return 24; }, enumerable: true },
    pixelDepth: { get() { return 24; }, enumerable: true },
});
```

---

## storage（基础 + 追踪）

```javascript
function createStorage(name) {
    const _data = {};
    const storage = {};
    env.setObjNative(storage, 'Storage');
    storage.getItem = env.setFuncNative(function getItem(key) {
        console.log(`[storage] ${name}.getItem("${key}")`);
        return _data[key] !== undefined ? _data[key] : null;
    }, 'getItem', 1);
    storage.setItem = env.setFuncNative(function setItem(key, value) {
        console.log(`[storage] ${name}.setItem("${key}", "${value}")`);
        _data[key] = String(value);
    }, 'setItem', 2);
    storage.removeItem = env.setFuncNative(function removeItem(key) {
        delete _data[key];
    }, 'removeItem', 1);
    storage.clear = env.setFuncNative(function clear() {
        for (const k in _data) delete _data[k];
    }, 'clear', 0);
    storage.key = env.setFuncNative(function key(i) {
        return Object.keys(_data)[i] || null;
    }, 'key', 1);
    Object.defineProperty(storage, 'length', {
        get() { return Object.keys(_data).length; }, enumerable: true
    });
    return storage;
}

const localStorage = createStorage('localStorage');
const sessionStorage = createStorage('sessionStorage');
```

---

## Canvas + WebGL（指纹场景）

当诊断报告出现 `createElement` 返回 canvas 相关的 UNDEFINED/ERRORS 时使用。

```javascript
// 在 createElement 中判断 tag === 'CANVAS' 时返回增强元素：
function createCanvasElement() {
    const el = {
        tagName: 'CANVAS', width: 150, height: 150,
        style: {}, childNodes: [],
        setAttribute() {}, getAttribute() { return null; },
        addEventListener() {},
    };

    const FAKE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // --- 2D Context ---
    const ctx2d = {};
    env.setObjNative(ctx2d, 'CanvasRenderingContext2D');
    const ctx2dMethods = [
        'fillRect', 'strokeRect', 'clearRect',
        'fillText', 'strokeText',
        'beginPath', 'closePath', 'moveTo', 'lineTo',
        'arc', 'arcTo', 'bezierCurveTo', 'quadraticCurveTo',
        'fill', 'stroke', 'clip', 'rect',
        'save', 'restore', 'translate', 'rotate', 'scale',
        'drawImage', 'setTransform', 'transform', 'putImageData',
    ];
    for (const m of ctx2dMethods) {
        ctx2d[m] = env.setFuncNative(function() {}, m);
    }
    ctx2d.measureText = env.setFuncNative(function measureText() { return { width: 0 }; }, 'measureText', 1);
    ctx2d.createLinearGradient = env.setFuncNative(function createLinearGradient() {
        return { addColorStop: env.setFuncNative(function addColorStop() {}, 'addColorStop', 2) };
    }, 'createLinearGradient', 4);
    ctx2d.createRadialGradient = env.setFuncNative(function createRadialGradient() {
        return { addColorStop: env.setFuncNative(function addColorStop() {}, 'addColorStop', 2) };
    }, 'createRadialGradient', 6);
    ctx2d.getImageData = env.setFuncNative(function getImageData() {
        return { data: new Uint8ClampedArray(0) };
    }, 'getImageData', 4);
    ctx2d.createImageData = env.setFuncNative(function createImageData() {
        return { data: new Uint8ClampedArray(0) };
    }, 'createImageData', 2);
    ctx2d.isPointInPath = env.setFuncNative(function isPointInPath() { return false; }, 'isPointInPath', 2);
    ctx2d.canvas = el;
    ctx2d.fillStyle = '';
    ctx2d.strokeStyle = '';

    // --- WebGL Context ---
    const WEBGL_PARAMS = {
        7936: 'WebKit', 7937: 'WebKit WebGL',
        7938: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
        35724: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
        3379: 16384, 3386: 32768, 34076: 16384, 34024: 16384,
        36347: 1024, 36348: 30, 34921: 16, 36349: 16,
        34930: 16, 35660: 16, 35661: 80, 36183: 4,
    };
    const ctxGL = {};
    env.setObjNative(ctxGL, 'WebGLRenderingContext');
    ctxGL.getParameter = env.setFuncNative(function getParameter(pname) {
        if (pname === 37445) return 'Google Inc. (Apple)';
        if (pname === 37446) return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)';
        return WEBGL_PARAMS[pname] !== undefined ? WEBGL_PARAMS[pname] : null;
    }, 'getParameter', 1);
    ctxGL.getExtension = env.setFuncNative(function getExtension(name) {
        if (name === 'WEBGL_debug_renderer_info') return { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
        return null;
    }, 'getExtension', 1);
    ctxGL.getSupportedExtensions = env.setFuncNative(function getSupportedExtensions() {
        return ['WEBGL_debug_renderer_info', 'WEBGL_lose_context', 'WEBGL_compressed_texture_s3tc'];
    }, 'getSupportedExtensions', 0);
    ctxGL.canvas = el;

    // --- getContext ---
    el.getContext = env.setFuncNative(function getContext(type) {
        if (type === 'webgl' || type === 'experimental-webgl') return ctxGL;
        return ctx2d;
    }, 'getContext', 1);
    el.toDataURL = env.setFuncNative(function toDataURL() { return FAKE_DATA_URL; }, 'toDataURL', 0);
    el.toBlob = env.setFuncNative(function toBlob(cb) { if (cb) cb(new Blob([])); }, 'toBlob', 1);

    return el;
}
```

---

## 构造函数（按需）

当诊断报告出现 `new XXX` 或 `typeof XXX` 相关的 UNDEFINED 时取用。

### Image

```javascript
const [FakeImage] = env.getNativeProto('Image', {});
// 覆盖为可实例化
const Image = env.setFuncNative(function Image(w, h) {
    this.width = w || 0; this.height = h || 0;
    this.src = ''; this.complete = false;
    this.naturalWidth = 0; this.naturalHeight = 0;
    this.onload = null; this.onerror = null;
}, 'Image', 0);
```

### WebSocket

```javascript
const WebSocket = env.setFuncNative(function WebSocket(url) {
    this.url = url; this.readyState = 0;
    this.onopen = null; this.onclose = null; this.onmessage = null; this.onerror = null;
    this.send = env.setFuncNative(function send() {}, 'send', 1);
    this.close = env.setFuncNative(function close() {}, 'close', 0);
}, 'WebSocket', 1);
WebSocket.CONNECTING = 0; WebSocket.OPEN = 1; WebSocket.CLOSING = 2; WebSocket.CLOSED = 3;
```

### RTCPeerConnection

```javascript
const RTCPeerConnection = env.setFuncNative(function RTCPeerConnection() {
    this.createDataChannel = env.setFuncNative(function createDataChannel() { return {}; }, 'createDataChannel', 1);
    this.createOffer = env.setFuncNative(function createOffer() { return Promise.resolve({}); }, 'createOffer', 0);
    this.setLocalDescription = env.setFuncNative(function setLocalDescription() { return Promise.resolve(); }, 'setLocalDescription', 1);
    this.close = env.setFuncNative(function close() {}, 'close', 0);
    this.onicecandidate = null;
    this.localDescription = null;
}, 'RTCPeerConnection', 0);
```

### IndexedDB

```javascript
const fakeIDB = {};
env.setObjNative(fakeIDB, 'IDBFactory');
fakeIDB.open = env.setFuncNative(function open() {
    return { result: null, onerror: null, onsuccess: null, onupgradeneeded: null };
}, 'open', 1);
fakeIDB.deleteDatabase = env.setFuncNative(function deleteDatabase() { return {}; }, 'deleteDatabase', 1);
```

---

## window.chrome（Chrome 检测）

```javascript
const fakeChrome = {
    app: { isInstalled: false, getIsInstalled: env.setFuncNative(function getIsInstalled() { return false; }, 'getIsInstalled', 0) },
    runtime: {
        connect: env.setFuncNative(function connect() {}, 'connect', 0),
        sendMessage: env.setFuncNative(function sendMessage() {}, 'sendMessage', 0),
        PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
    },
    loadTimes: env.setFuncNative(function loadTimes() { return {}; }, 'loadTimes', 0),
    csi: env.setFuncNative(function csi() { return {}; }, 'csi', 0),
};

// 重要：同步到 global，VMP typeof 检测走 globalThis
window.chrome = fakeChrome;
Object.defineProperty(global, 'chrome', { value: fakeChrome, writable: true, configurable: true });
```

---

## history

```javascript
const fakeHistory = {};
env.setObjNative(fakeHistory, 'History');
Object.defineProperties(fakeHistory, {
    length:            { get() { return 1; }, enumerable: true },
    state:             { get() { return null; }, enumerable: true },
    scrollRestoration: { get() { return 'auto'; }, set() {}, enumerable: true },
});
fakeHistory.pushState = env.setFuncNative(function pushState() {}, 'pushState', 3);
fakeHistory.replaceState = env.setFuncNative(function replaceState() {}, 'replaceState', 3);
fakeHistory.go = env.setFuncNative(function go() {}, 'go', 0);
fakeHistory.back = env.setFuncNative(function back() {}, 'back', 0);
fakeHistory.forward = env.setFuncNative(function forward() {}, 'forward', 0);
```

---

## window 常用属性和方法

当诊断报告出现 `window.XXX` UNDEFINED 时取用。

```javascript
// --- 事件 ---
window.addEventListener = env.setFuncNative(function addEventListener() {}, 'addEventListener', 2);
window.removeEventListener = env.setFuncNative(function removeEventListener() {}, 'removeEventListener', 2);
window.dispatchEvent = env.setFuncNative(function dispatchEvent() { return true; }, 'dispatchEvent', 1);

// --- 布局/渲染 ---
window.requestAnimationFrame = env.setFuncNative(function requestAnimationFrame(cb) { return setTimeout(cb, 16); }, 'requestAnimationFrame', 1);
window.cancelAnimationFrame = env.setFuncNative(function cancelAnimationFrame(id) { clearTimeout(id); }, 'cancelAnimationFrame', 1);
window.getComputedStyle = env.setFuncNative(function getComputedStyle() { return {}; }, 'getComputedStyle', 1);
window.matchMedia = env.setFuncNative(function matchMedia() {
    return { matches: false, media: '', addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
}, 'matchMedia', 1);

// --- 尺寸 ---
window.innerWidth = 1920;   window.innerHeight = 1080;
window.outerWidth = 1920;   window.outerHeight = 1080;
window.devicePixelRatio = 1;
window.screenX = 0; window.screenY = 0;
window.scrollX = 0; window.scrollY = 0;
window.screenTop = 33; window.screenLeft = 0;
window.pageXOffset = 0; window.pageYOffset = 0;

// --- performance（高频需求） ---
const fakePerformance = {};
env.setObjNative(fakePerformance, 'Performance');
const _startTime = Date.now();
fakePerformance.now = env.setFuncNative(function now() { return Date.now() - _startTime; }, 'now', 0);
fakePerformance.timing = { navigationStart: _startTime, domLoading: _startTime + 100, domComplete: _startTime + 500, loadEventEnd: _startTime + 600 };
fakePerformance.getEntries = env.setFuncNative(function getEntries() { return []; }, 'getEntries', 0);
fakePerformance.getEntriesByType = env.setFuncNative(function getEntriesByType() { return []; }, 'getEntriesByType', 1);
fakePerformance.getEntriesByName = env.setFuncNative(function getEntriesByName() { return []; }, 'getEntriesByName', 1);
fakePerformance.mark = env.setFuncNative(function mark() {}, 'mark', 1);
fakePerformance.measure = env.setFuncNative(function measure() {}, 'measure', 1);
window.performance = fakePerformance;

// --- 常用全局 ---
window.setTimeout = setTimeout;
window.setInterval = setInterval;
window.clearTimeout = clearTimeout;
window.clearInterval = clearInterval;
window.parseInt = parseInt;
window.parseFloat = parseFloat;
window.isNaN = isNaN;
window.isFinite = isFinite;
window.atob = typeof atob !== 'undefined' ? atob : (s) => Buffer.from(s, 'base64').toString('binary');
window.btoa = typeof btoa !== 'undefined' ? btoa : (s) => Buffer.from(s, 'binary').toString('base64');
window.encodeURIComponent = encodeURIComponent;
window.decodeURIComponent = decodeURIComponent;
window.encodeURI = encodeURI;
window.decodeURI = decodeURI;

// --- 标准构造函数 ---
window.Math = Math; window.JSON = JSON; window.Date = Date; window.RegExp = RegExp;
window.Array = Array; window.Object = Object; window.String = String;
window.Number = Number; window.Boolean = Boolean; window.Symbol = Symbol;
window.Error = Error; window.TypeError = TypeError; window.RangeError = RangeError;
window.Map = Map; window.Set = Set; window.WeakMap = WeakMap; window.WeakSet = WeakSet;
window.Promise = Promise; window.Proxy = Proxy; window.Reflect = Reflect;
window.ArrayBuffer = ArrayBuffer; window.DataView = DataView;
window.Uint8Array = Uint8Array; window.Int32Array = Int32Array; window.Float64Array = Float64Array;
window.console = console;
```
