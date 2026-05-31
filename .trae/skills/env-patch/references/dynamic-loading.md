# 动态加载字节码

当加密代码在运行时从 API 动态加载时使用本指南。

## 识别方法

在浏览器中观察网络请求，查找：
- 返回 JS 代码的 API（Content-Type 为 `application/javascript` 或 JSON 中嵌入代码）
- URL 含 `sdk`、`ds`、`sign`、`sec`、`script` 等关键词
- 动态创建 `<script>` 标签加载的外部 JS

常见模式：
```
GET  https://cdn.example.com/sdk/xxxxx.js          → 直接返回 JS
POST https://api.example.com/api/sec/v1/scripting   → JSON { data: { data: "JS代码" } }
GET  https://api.example.com/api/sec/v1/ds?appId=x  → 直接返回 JS
```

## 下载方法

**大文件必须用 curl**：

```bash
# 直接返回 JS 的 GET 请求
curl -o source/dynamic_sdk.js "https://cdn.example.com/sdk/xxxxx.js"

# 需要认证的 POST 请求
curl -X POST "https://api.example.com/api/sec/v1/scripting" \
  -H "Content-Type: application/json" \
  -H "Cookie: a1=...; webId=..." \
  -d '{"type":"ds","appId":"xhs-pc-web"}' \
  -o source/scripting_response.json

# 从 JSON 响应中提取 JS（用 jq）
cat source/scripting_response.json | jq -r '.data.data' > source/dynamic_sdk.js
```

## 动态代码的特点

1. **自带解释器** — 动态脚本可能包含自己的 VMP 解释器（与静态 SDK 中的不同）
2. **少量 VMP 参数** — 依赖数组通常很短（如仅 undefined、Uint8Array、时间戳函数）
3. **产出全局变量** — 执行后在 window 上创建新的函数/值（如 `_dsf`、`_dsn`、`_dsl`）
4. **时效性** — 服务端可能定期更换字节码内容，需要定期重新下载

## 在 Node.js 中加载

```javascript
const vm = require('vm');
const fs = require('fs');

// 动态代码通常设计为在全局作用域执行
// 用 vm.runInThisContext 模拟 <script> 标签的行为
const dsCode = fs.readFileSync('./ds_response.js', 'utf-8');
vm.runInThisContext(dsCode, { filename: 'ds_response.js' });

// 检查产出
console.log('_dsf:', typeof window._dsf);  // function
console.log('_dsn:', window._dsn);         // string
```

**注意**：如果动态代码的 VMP 解释器名与静态 SDK 的不同，它们是独立的，不互相依赖。但动态代码创建的全局变量可能被静态代码的签名函数内部读取。

## 动态代码依赖认证

有些动态 API 需要有效的 cookies 或签名头才能请求：

- 初次请求可以直接用 curl + 浏览器的 cookies
- 后续刷新需要先用已有的签名能力签名请求
- 鸡生蛋问题：需要签名才能获取新字节码，需要字节码才能签名

**解决方案**：动态代码通常有有效期（几小时到几天），初期可以手动 curl 下载，后期再自动化刷新。
