# Node.js 环境检测对策

安全 SDK 常通过以下方式检测 Node.js 环境，检测到则走降级逻辑。

## 必须处理的检测项

### Buffer（最常见）

```javascript
// SDK 检测
typeof Buffer !== "undefined"  // Node.js: true, 浏览器: false

// 对策：必须 delete，不能用 getter（VMP 会用 GOPD 检测描述符类型）
const _origBuffer = globalThis.Buffer;
delete globalThis.Buffer;
// 执行完后恢复
globalThis.Buffer = _origBuffer;
```

**陷阱**：`Object.defineProperty(globalThis, 'Buffer', { get(){ return undefined } })` 会被 `Object.getOwnPropertyDescriptor` 识别为 accessor（浏览器中 Buffer 根本不存在，连 descriptor 都没有）。

### process

```javascript
// SDK 检测（通常检测 typeof 或属性值）
typeof process !== "undefined"  // Node.js: true, 浏览器: 看情况

// 对策：设为 webpack 注入的 data property（许多站点浏览器中 process 存在）
const _origProcess = globalThis.process;
globalThis.process = { env: { BROWSER: true, BUILD_ENV: 'production' } };
// 执行完后恢复
globalThis.process = _origProcess;
```

**关键**：必须是 data property（直接赋值），不能用 getter。VMP 通过 `Object.getOwnPropertyDescriptor(globalThis, 'process')` 检测描述符类型。

### Error.prepareStackTrace

```javascript
// Node.js V8 特有 API，浏览器无此属性
typeof Error.prepareStackTrace  // Node.js: "function", 浏览器: "undefined"

// 对策
delete Error.prepareStackTrace;
```

### module / exports / require

```javascript
// CommonJS 模块特征
typeof module !== "undefined"
typeof exports !== "undefined"

// 对策：在 VMP 入口依赖数组中将相关项改为 void 0（Step 3 阶段处理）
// 如果无法改依赖数组，在 global 上隐藏
Object.defineProperty(globalThis, 'module', { value: undefined, configurable: true });
```

## Node.js 版本特定问题

Node.js 新版本不断新增全局 API，可能与 mock 冲突：

| 变量 | Node.js 版本 | 问题 |
|------|-------------|------|
| `navigator` | v21+ | 内置 getter，简单赋值被拦截 |
| `crypto` | v19+ | Web Crypto API |
| `fetch` | v18+ | Undici |
| `performance` | v16+ | perf_hooks |

**统一解决**：所有全局变量覆盖都用 `Object.defineProperty`：

```javascript
Object.defineProperty(global, 'navigator', {
  value: proxiedNavigator,
  writable: true, configurable: true, enumerable: true,
});
```

## Error.stack 描述符

浏览器和 Node.js 中 `Error.stack` 都是 accessor（get/set），这不是区分点。但 VMP 可能通过 `Object.defineProperty(err, 'stack', { get: ... })` 设置自定义 getter 来探测执行环境。这种 probe 发生在 VMP opcode 内部，外部无法 hook。

## toString 检测

```javascript
// VMP 可能通过 Object.prototype.toString.call() 检测对象类型
Object.prototype.toString.call(window)     // 浏览器: [object Window], Node.js: [object Object]
Object.prototype.toString.call(document)   // 浏览器: [object HTMLDocument]

// 对策
Object.defineProperty(window, Symbol.toStringTag, { value: 'Window', configurable: true });
Object.defineProperty(document, Symbol.toStringTag, { value: 'HTMLDocument', configurable: true });
```

注意：这些对策**不保证**能绕过所有检测。VMP 的核心检测可能在 opcode 层面完成。参考 `limitations.md`。
