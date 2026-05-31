# webpack bundle 模块提取

当加密代码嵌在 webpack bundle 中时使用本指南。

## 识别 webpack

```javascript
// webpack 5 — chunk push 模式
(self.webpackChunkapp = self.webpackChunkapp || []).push([["chunkId"], {
  12345: function(module, exports, __webpack_require__) { ... },
  67890: function(module, __webpack_exports__, __webpack_require__) { ... },
}]);

// webpack 4 — IIFE 模式
(function(modules) { /* runtime */ })({
  0: function(module, exports, __webpack_require__) { ... },
  1: function(module, exports, __webpack_require__) { ... },
});
```

## 提取步骤

### 1. 定位入口模块

从加密入口函数追溯到 webpack 模块 ID：

```javascript
// 在 vendor-dynamic.js 中搜索加密函数名或字符串
// 找到所在的 webpack 模块
// 记录模块 ID（数字或字符串）
```

### 2. 追踪依赖

入口模块通过 `__webpack_require__(id)` 引用其他模块。用正则提取：

```javascript
// 短名调用（a/n/r 等单字母变量）
const deps = code.match(/[a-z]\((\d{3,6})\)/g);
```

### 3. 提取模块代码

编写 `nodejs/extract_modules.js`：

```javascript
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

// 解析 bundle，提取目标模块
// 按 { id: function(module, exports, __webpack_require__){...} } 格式输出
```

### 4. 组装运行

使用 `${CLAUDE_SKILL_DIR}/scripts/webpack_runtime.js` 模板：

```javascript
// 复制到 env/main.js
// 将提取的模块填入 __webpack_modules__
// 设置入口模块 ID
```

### 5. 补缺失模块

运行后如果报 `__webpack_modules__[id] is not a function`：
1. 记录缺失的模块 ID
2. 回 bundle 中查找并提取
3. 添加到 `__webpack_modules__`
4. 重复直到无缺失

## 不使用 webpack runtime 的替代方案

当加密代码是独立脚本（非 webpack 模块）时，直接复制即可：

```javascript
// env/sdk.js — 独立的 SDK 脚本，原样复制
// env/bytecode.js — 从 bundle 中提取的字节码调用代码
```

用 `require` 或 `vm.runInThisContext` 按顺序加载。
