# 补环境方案的已知局限性

当所有外部 hook（Proxy、deepTrackProxy、Object.defineProperty 拦截、Error 构造函数代理）都显示正常，但签名仍然是降级版本时，参考本文档。

## VMP opcode 级检测

### 现象

- Proxy 诊断报告 0 errors、0 undefined
- deepTrackProxy 追踪无异常
- hook Object.getOwnPropertyDescriptor、getPrototypeOf 无可疑访问
- 但签名前缀/长度与浏览器不一致（如 mns0201 vs mns0301）

### 根因

VMP 字节码解释器的环境检测**在 opcode 层面完成**，不经过任何外部 JS API 调用。

以 Error.stack 探测为例：
1. VMP 创建一个空 Error 对象
2. 用 `Object.defineProperty(err, 'stack', { get: function(){...} })` 设置自定义 getter
3. getter 内部逻辑**完全在 VMP 操作码中执行**（不调用 captureStackTrace、不访问 Error 属性、不读 RegExp、不调用 String 方法）
4. getter 在 Node.js 中返回 undefined，在浏览器中返回正常值
5. VMP 根据返回值设置内部标志，决定降级或正常

**关键**：步骤 3 中的逻辑被编译成了 VMP 自定义操作码序列。外部无法 hook，因为整个过程没有任何 JS 层面的调用。

### 已验证无效的方案

| 方案 | 为什么无效 |
|------|-----------|
| `delete globalThis.Buffer` | 非唯一检测点 |
| `process = {env:{BROWSER:true}}` | 非唯一检测点 |
| `delete Error.prepareStackTrace` | VMP 不读取此属性 |
| `Symbol.toStringTag = "Window"` | 非唯一检测点 |
| `getElementsByTagName("*")` mock | 非唯一检测点 |
| `vm.createContext` 沙箱 | cross-realm instanceof 失败，VMP 崩溃 |
| Error 构造函数 Proxy 包装 | stack getter 无外部 JS 调用 |
| Hook Object.getOwnPropertyDescriptor | 关键检测不在这层 |
| 强制设 VMP 内部标志 = 1 | 输出 `mns0301_0`（9 chars），签名内容缺失 |

### 理论可行但未验证的方向

1. **VMP opcode trace diff** — 对比浏览器和 Node.js 中 VMP 的操作码执行序列，找到分叉点
2. **V8 引擎层面修补** — 找到 Node.js V8 与 Chrome V8 在 Error.stack 行为上的具体差异，在 C++ 层面修补
3. **Headless Chrome** — 放弃 Node.js 补环境，直接用 Puppeteer/Playwright 在真实浏览器中运行
4. **修改 VMP 字节码** — 分析字节码格式，直接修改检测操作码的跳转目标

## 降级签名的可用性

降级签名（如 mns0201）通常仍然有效：
- HTTP 200，返回正常业务数据
- 但服务端**能区分**（签名版本明文嵌入在请求中）
- 服务端随时可以启用风控封禁降级签名
- 适合短期使用、低频请求的场景

## 建议

遇到 VMP opcode 级检测时：
1. **记录发现** — 更新 `docs/progress.md`，标注"阶段 C 卡在 VMP opcode 检测"
2. **评估风险** — 降级签名是否满足需求？被封的概率有多高？
3. **告知用户** — 明确说明当前方案的天花板，让用户决定是否继续投入
4. **考虑替代方案** — Headless Chrome、协议逆向、或寻找不需要此参数的 API
