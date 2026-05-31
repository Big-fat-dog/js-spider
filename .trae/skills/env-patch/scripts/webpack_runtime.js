/**
 * 最小 webpack runtime 模板
 *
 * 兼容 webpack 4 和 5 的模块加载机制。
 * 将提取的模块填入 __webpack_modules__，调用 __webpack_require__(entryId) 即可运行。
 *
 * 用法：
 *   1. 复制到项目 env/ 目录
 *   2. 将提取的模块按 id: function(module, exports, __webpack_require__){...} 格式填入
 *   3. 修改底部的入口模块 ID
 */

var __webpack_modules__ = {
    // === 在此粘贴提取的模块 ===
    // 格式:
    // 12345: function(module, exports, __webpack_require__) { ... },
    // "abcde": function(module, __webpack_exports__, __webpack_require__) { ... },
};

var __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== undefined) return cachedModule.exports;

    var module = __webpack_module_cache__[moduleId] = {
        id: moduleId,       // webpack 4 compat
        loaded: false,      // webpack 4 compat
        exports: {}
    };

    __webpack_modules__[moduleId].call(
        module.exports,     // this === exports（部分模块依赖）
        module,
        module.exports,
        __webpack_require__
    );

    module.loaded = true;
    return module.exports;
}

// --- helpers ---

// .o — hasOwnProperty 简写
__webpack_require__.o = function (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
};

// .d — 定义 harmony exports（getter 方式）
// webpack 5: (exports, definition_object)
// webpack 4: (exports, name, getter) — 下面兼容两种
__webpack_require__.d = function (exports, a, b) {
    if (typeof a === "string") {
        // webpack 4 签名: .d(exports, name, getter)
        if (!__webpack_require__.o(exports, a)) {
            Object.defineProperty(exports, a, { enumerable: true, get: b });
        }
    } else {
        // webpack 5 签名: .d(exports, { key: getter, ... })
        for (var key in a) {
            if (__webpack_require__.o(a, key) && !__webpack_require__.o(exports, key)) {
                Object.defineProperty(exports, key, { enumerable: true, get: a[key] });
            }
        }
    }
};

// .r — 标记为 ES Module
__webpack_require__.r = function (exports) {
    if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    }
    Object.defineProperty(exports, "__esModule", { value: true });
};

// .n — 兼容获取 default export
__webpack_require__.n = function (module) {
    var getter = module && module.__esModule
        ? function () { return module["default"]; }
        : function () { return module; };
    __webpack_require__.d(getter, { a: getter });
    return getter;
};

// .t — 创建 fake namespace（bitmask 模式）
__webpack_require__.t = function (value, mode) {
    if (mode & 1) value = __webpack_require__(value);
    if (mode & 8) return value;
    if (mode & 4 && typeof value === "object" && value && value.__esModule) return value;
    var ns = Object.create(null);
    __webpack_require__.r(ns);
    Object.defineProperty(ns, "default", { enumerable: true, value: value });
    if (mode & 2 && typeof value !== "string") {
        for (var key in value) {
            __webpack_require__.d(ns, key, (function (k) { return value[k]; }).bind(null, key));
        }
    }
    return ns;
};

// .e — 异步 chunk 加载（Node.js 下直接 resolve）
__webpack_require__.e = function () {
    return Promise.resolve();
};

// .m — 暴露模块表（部分模块通过 __webpack_require__.m 访问）
__webpack_require__.m = __webpack_modules__;

// .c — 暴露缓存
__webpack_require__.c = __webpack_module_cache__;

// .p — public path（Node.js 下通常不需要）
__webpack_require__.p = "";

// --- chunk push 拦截（多 chunk 场景） ---
// 如果目标站使用多 chunk，取消下方注释并修改 chunkName
//
// var chunkName = "webpackChunk_N_E";  // 改为实际的 chunk 变量名
// (global[chunkName] = global[chunkName] || []).push = function (chunk) {
//     var moreModules = chunk[1];
//     for (var moduleId in moreModules) {
//         __webpack_modules__[moduleId] = moreModules[moduleId];
//     }
// };

// === 入口：修改为实际的入口模块 ID ===
// var entryModule = __webpack_require__(12345);
// module.exports = entryModule;
