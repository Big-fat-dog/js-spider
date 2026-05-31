# 多文件拆分模式

当加密代码由多个独立文件组成时使用本指南。

## 典型场景

安全 SDK 常拆分为：

| 文件 | 作用 | 加载方式 |
|------|------|---------|
| SDK 主文件 | 创建 VMP 解释器函数 | `<script>` 标签 或 CDN |
| 字节码文件 | 被解释器执行，创建签名函数 | 内嵌在 webpack bundle 或单独文件 |
| 动态字节码 | 运行时从 API 加载，升级签名 | 动态 `<script>` 或 fetch |

## 文件组织

```
env/
├── sdk.js           # VMP 解释器（如 _AUuXfEG27Xa3x）
├── bytecode.js      # 主字节码（提取自 webpack bundle）
├── ds_response.js   # 动态字节码（可选，curl 下载）
├── run.js           # 加载器 + 环境补齐
└── sign.js          # 签名接口
```

## 加载顺序

**顺序必须与浏览器一致**。SDK 必须在字节码之前加载（解释器函数必须先存在）：

```javascript
// run.js
require("./sdk.js");        // 1. 创建 VMP 解释器
require("./bytecode.js");   // 2. 用解释器执行字节码，创建签名函数

// 如果有动态字节码
const vm = require('vm');
const dsCode = fs.readFileSync('./ds_response.js', 'utf-8');
vm.runInThisContext(dsCode); // 3. 动态字节码可能创建额外全局变量
```

## 从 webpack bundle 提取字节码

字节码通常是 webpack bundle 中的一个长十六进制字符串：

```javascript
// vendor-dynamic.js 中的模式
var __$c = "56544b424251464d0037371636126ee91594cc67...";
glb['_AUuXfEG27Xa3x'](__$c, [/* 依赖数组 */]);
```

**提取步骤**：
1. 搜索 `glb[` 或解释器函数名
2. 找到字节码字符串 `__$c` 的赋值位置
3. 提取从 `var __$c = "` 到 `glb[` 调用的完整代码
4. 转义还原（`\"` → `"`）
5. 保存为 `env/bytecode.js`

## 多解释器场景

可能存在多个 VMP 解释器，各执行不同字节码：

```
解释器 A（静态 SDK）→ 执行主字节码 → 创建 mnsv2
解释器 B（动态脚本自带）→ 执行动态字节码 → 创建 _dsf/_dsn/_dsl
```

每个解释器有不同的入口参数列表，需要分别分析。

## 签名函数与动态变量的关系

动态字节码创建的全局变量（如 `_dsf`）可能被签名函数内部读取：

```javascript
// mnsv2 内部可能读取 window._dsf
// 验证方法：在浏览器中 hook _dsf 为 getter，调用 mnsv2，检查 getter 是否被触发
```

**关键发现（来自实战）**：签名函数可能在初始化阶段就缓存了动态变量的值。即使后续删除这些变量，签名行为也不改变。这意味着**加载顺序**和**初始化时机**很重要。
