# 反调试对策

目标 JS 常通过 `debugger` 语句阻止调试。在补环境场景下，`debugger` 不会弹出 DevTools，但会**严重拖慢执行速度**（Node.js 在 `--inspect` 模式下）或在某些 VM 实现中导致异常。更重要的是，`setInterval + debugger` 死循环会直接卡死进程。

**约定**：以下代码中 `env` 指 `require('./env_core')`。

---

## 核心原理

反调试代码不会直接写在源码里（那样太容易发现），而是通过**动态代码生成**注入：

| 注入方式 | 示例 |
|---------|------|
| `eval("debugger")` | 瑞数、OB 混淆 |
| `Function("debugger")()` | 瑞数、sojson |
| `(function(){}).constructor("debugger")()` | OB 混淆变种 |
| `setInterval(() => { debugger }, ...)` | 定时死循环 |
| `setTimeout` 递归 + debugger | 变种死循环 |

对策就是 **hook 这些动态执行入口，在代码字符串传入引擎前剥离 `debugger`**。

---

## eval Hook

```javascript
const _origEval = global.eval;
global.eval = env.setFuncNative(function eval(code) {
    if (typeof code === 'string' && code.includes('debugger')) {
        code = code.replace(/\bdebugger\b/g, '');
    }
    return _origEval(code);
}, 'eval', 1);
```

---

## Function 构造器 Hook

`Function("debugger")()` 和 `(function(){}).constructor("debugger")()` 本质都走 `Function` 构造器。

```javascript
const _OrigFunction = Function;
const _HookedFunction = new Proxy(_OrigFunction, {
    apply(target, thisArg, args) {
        const cleaned = args.map(a =>
            typeof a === 'string' && a.includes('debugger')
                ? a.replace(/\bdebugger\b/g, '')
                : a
        );
        return Reflect.apply(target, thisArg, cleaned);
    },
    construct(target, args) {
        const cleaned = args.map(a =>
            typeof a === 'string' && a.includes('debugger')
                ? a.replace(/\bdebugger\b/g, '')
                : a
        );
        return Reflect.construct(target, cleaned);
    },
});
// 维护原型链一致性
_HookedFunction.prototype = _OrigFunction.prototype;
_HookedFunction.prototype.constructor = _HookedFunction;
global.Function = _HookedFunction;
window.Function = _HookedFunction;
env.setFuncNative(_HookedFunction, 'Function', 1);
env.setFuncNative(_HookedFunction.prototype, '', 0);
```

**注意**：必须同时处理 `apply`（`Function("debugger")`）和 `construct`（`new Function("debugger")`）。

---

## setInterval / setTimeout 过滤

部分站点用定时器 + debugger 做死循环：

```javascript
setInterval(function() { debugger; }, 1000);
// 或递归 setTimeout
(function loop() { debugger; setTimeout(loop, 500); })();
```

如果已经 hook 了 `Function` 构造器，`setInterval(Function("debugger"), ...)` 会被自动处理。但直接传函数引用的情况需要额外过滤：

```javascript
const _origSetInterval = setInterval;
global.setInterval = env.setFuncNative(function setInterval(fn, delay, ...args) {
    // 检查函数体是否只有 debugger
    if (typeof fn === 'function') {
        const body = fn.toString();
        if (/^\s*function[^{]*\{\s*debugger;?\s*\}$/.test(body)) {
            return 0; // 静默丢弃
        }
    }
    return _origSetInterval(fn, delay, ...args);
}, 'setInterval', 1);
window.setInterval = global.setInterval;
```

**注意**：只过滤函数体**仅含** `debugger` 的情况。如果函数有其他逻辑，应该保留执行但剥离 debugger——这种情况靠 `Function` 构造器 hook 已经覆盖。

---

## 完整模板（复制到 run.js）

按加载顺序放在 `env.init()` 之后、`require('./main.js')` 之前：

```javascript
// ===== 反调试 =====

// 1. eval hook
const _origEval = global.eval;
global.eval = env.setFuncNative(function eval(code) {
    if (typeof code === 'string' && code.includes('debugger')) {
        code = code.replace(/\bdebugger\b/g, '');
    }
    return _origEval(code);
}, 'eval', 1);
window.eval = global.eval;

// 2. Function 构造器 hook
const _OrigFunction = Function;
const _HookedFunction = new Proxy(_OrigFunction, {
    apply(target, thisArg, args) {
        const cleaned = args.map(a =>
            typeof a === 'string' && a.includes('debugger')
                ? a.replace(/\bdebugger\b/g, '')
                : a
        );
        return Reflect.apply(target, thisArg, cleaned);
    },
    construct(target, args) {
        const cleaned = args.map(a =>
            typeof a === 'string' && a.includes('debugger')
                ? a.replace(/\bdebugger\b/g, '')
                : a
        );
        return Reflect.construct(target, cleaned);
    },
});
_HookedFunction.prototype = _OrigFunction.prototype;
_HookedFunction.prototype.constructor = _HookedFunction;
global.Function = _HookedFunction;
window.Function = _HookedFunction;
env.setFuncNative(_HookedFunction, 'Function', 1);
env.setFuncNative(_HookedFunction.prototype, '', 0);

// 3. setInterval 过滤（debugger 死循环）
const _origSetInterval = setInterval;
global.setInterval = env.setFuncNative(function setInterval(fn, delay, ...args) {
    if (typeof fn === 'function') {
        const body = fn.toString();
        if (/^\s*function[^{]*\{\s*debugger;?\s*\}$/.test(body)) {
            return 0;
        }
    }
    return _origSetInterval(fn, delay, ...args);
}, 'setInterval', 1);
window.setInterval = global.setInterval;
```

---

## 常见站点特征

| 站点/保护 | 反调试手段 | 关键 hook |
|-----------|-----------|----------|
| 瑞数 RS4/RS5 | eval + Function 动态生成 debugger | eval + Function |
| OB 混淆 (obfuscator.io) | `(function(){}).constructor("debugger")` + setInterval | Function + setInterval |
| sojson v6/v7 | Function("debugger") + 定时循环 | Function + setInterval |
| 极验 | 较少 debugger，主要靠格式化检测 | 通常不需要 |

---

## 排查提示

如果 `node env/run.js` 卡住不动（无输出、无报错）：
1. 先检查是否有 `setInterval` 死循环——在 setInterval hook 中加 `console.log` 打印回调内容
2. 如果卡在 `require('./main.js')` 阶段，可能是同步 `while(true)` + debugger——这种情况只能在源码中定位并在 run.js 中 patch（不修改 main.js，而是在 require 前 hook 相关全局）
3. 如果执行很慢但没卡死，检查是否用了 `--inspect` 启动——debugger 语句在 inspect 模式下会暂停
