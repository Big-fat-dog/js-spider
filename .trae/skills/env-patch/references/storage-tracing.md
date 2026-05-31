# localStorage/sessionStorage 追踪指南

当签名格式不对（长度/字符集与浏览器不一致）但 Proxy 报告无异常时使用。

## 问题背景

许多安全 SDK 用 localStorage 存储控制流开关和运行时数据。Proxy 监控 **不会** 报告这些问题，因为 `getItem()` 调用成功了——只是返回值是 null。

常见模式：
- **参数开关**：如 `_byted_param_sw`，base64 编码的配置，决定是否收集指纹
- **指纹 ID**：如 `tt_scid`，由服务端返回的设备标识，拼入签名
- **会话标记**：如 `ttcid`，由 SDK 自己生成的会话 ID

## 第一步：从浏览器收集 storage 内容

```javascript
evaluate_script({ function: `() => {
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    result[k] = localStorage.getItem(k).substring(0, 200);
  }
  return JSON.stringify(result);
}` })
```

关注与目标 SDK 相关的 key（搜索 SDK 名称、域名、常见前缀如 `_byted`、`__tea`、`tt_`）。

## 第二步：注入 storage 追踪

替换 `proxy_monitor.js` 中的 fakeStorage，添加读写日志：

```javascript
const _storage = { /* 从浏览器复制的初始值 */ };
const _storageLog = [];
const fakeStorage = {
  getItem(k) {
    _storageLog.push({ op: "get", key: k, val: _storage[k] || null });
    return _storage[k] || null;
  },
  setItem(k, v) {
    _storageLog.push({ op: "set", key: k, val: String(v).substring(0, 100) });
    _storage[k] = String(v);
  },
  removeItem(k) { delete _storage[k]; },
  get length() { return Object.keys(_storage).length; },
};
```

运行后检查 `_storageLog`，关注：
- **读取了但值为 null 的 key** → 可能需要从浏览器预置
- **写入的 key** → SDK 自己生成的数据，可能被后续读取

## 第三步：预置关键值

将浏览器中的值复制到 `_storage` 初始值中。同时设置 `sessionStorage` 使用同一个 `_storage` 对象（许多 SDK 两个都读）。

```javascript
global.localStorage = fakeStorage;
global.sessionStorage = {
  getItem(k) { return _storage[k] || null; },
  setItem(k, v) { _storage[k] = String(v); },
};
```

**注意**：`proxy_monitor.init()` 会创建自己的 fakeStorage 挂到 window 上。如果你在 init() 之前设置了 global.localStorage，需要在 init() 之后再次覆盖 `global.window.localStorage`。

## 常见的 storage key

| key 模式 | 用途 | 是否需要预置 |
|----------|------|-------------|
| `_byted_param_sw` | 参数开关，控制签名模式 | 是，从浏览器复制 |
| `tt_scid` | 指纹 ID，拼入签名 | 是，从浏览器复制（可能过期） |
| `ttcid` | 会话 ID，SDK 自己生成 | 否，SDK 会自己写入 |
| `__ac_referer` | 来源页追踪 | 通常不需要 |

## 过期问题

预置的 storage 值可能过期。如果签名突然失效：
1. 从浏览器重新获取最新值
2. 研究值的生成机制（可能需要调用服务端 API）
3. 对于 SDK 生成的值（如 ttcid），不需要预置——让 SDK 自己生成即可
