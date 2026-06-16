// ====== 浏览器端日志保存 ======
const vmLogs = [];       // 存储 { raw, pretty } 对象（备用）
let logCounter = 0;
const MAX_LOGS = 10000;  // 内存最多保存这么多条日志
const WS_SERVER = 'ws://127.0.0.1:9999';  // WebSocket 服务器地址
const USE_WS = true;     // true=WebSocket实时写入，false=存内存后下载

function pretty(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') {
        return '[Function: ' + (value.name || 'anonymous') + ']';
    }
    if (typeof value === 'string') {
        // 字符串：显示完整内容，超长的加省略号但显示更多
        if (value.length > 200) {
            return JSON.stringify(value.slice(0, 200) + '...(len=' + value.length + ')');
        }
        return JSON.stringify(value);
    }
    if (value instanceof Uint8Array || Array.isArray(value)) {
        // 数组：显示前 20 个元素
        let arr = Array.from(value).slice(0, 20);
        let suffix = value.length > 20 ? '...(len=' + value.length + ')' : '';
        return '[' + arr.map(x => typeof x === 'number' ? x : pretty(x)).join(', ') + suffix + ']';
    }
    if (typeof value === 'object') {
        try {
            let str = JSON.stringify(value);
            // 对象：显示完整内容，超长的加省略号但显示更多
            if (str.length > 300) {
                return str.slice(0, 300) + '...(len=' + str.length + ')';
            }
            return str;
        } catch (e) {
            return '[object ' + (value.constructor ? value.constructor.name : 'Object') + ']';
        }
    }
    return String(value);
}

function saveLogToFile(usePretty = false) {
    // 根据参数选择用美化字符串还是原始字符串
    const content = vmLogs.map(entry => {
        const msg = usePretty ? entry.pretty : entry.raw;
        return `[${entry.idx}] ${msg}`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vm_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

window.addEventListener('beforeunload', () => {
    console.log(`[日志统计] 总条数: ${logCounter}, 已发送: ${wsSentCount}, 队列剩余: ${wsQueue.length}`);
    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
        wsSocket.close();
    }
    saveLogToFile(false);
});
window._open = true;

// WebSocket 日志发送（顺序、高效）
let wsSocket = null;
let wsQueue = [];
let wsSentCount = 0;
let wsConnected = false;
let wsReconnecting = false;

// 初始化 WebSocket
function initWebSocket() {
    if (!USE_WS) return;
    
    wsSocket = new WebSocket(WS_SERVER);
    
    wsSocket.onopen = () => {
        wsConnected = true;
        wsReconnecting = false;
        console.log(`[WebSocket] 已连接到 ${WS_SERVER}`);
        
        // 发送队列中的日志
        flushWsQueue();
    };
    
    wsSocket.onmessage = (event) => {
        // 收到确认，发送下一条
        if (event.data === 'ok') {
            wsSentCount++;
            flushWsQueue();
            
            // 每 1000 条报告状态
            if (wsSentCount % 1000 === 0) {
                console.log(`[WebSocket] 已发送: ${wsSentCount} 条, 队列: ${wsQueue.length} 条`);
            }
        }
    };
    
    wsSocket.onclose = () => {
        wsConnected = false;
        console.log(`[WebSocket] 连接关闭, 已发送: ${wsSentCount} 条`);
        
        // 5秒后重连
        if (!wsReconnecting && USE_WS) {
            wsReconnecting = true;
            setTimeout(() => {
                console.log(`[WebSocket] 尝试重连...`);
                initWebSocket();
            }, 5000);
        }
    };
    
    wsSocket.onerror = (e) => {
        wsConnected = false;
        console.error(`[WebSocket] 连接错误! 队列剩余: ${wsQueue.length} 条`);
    };
}

// 发送队列中的日志（严格顺序）
function flushWsQueue() {
    if (!wsConnected || wsQueue.length === 0) return;
    
    // 只发送第一条（等待确认后再发下一条）
    const text = wsQueue.shift();
    try {
        wsSocket.send(text);
    } catch (e) {
        // 发送失败，放回队列
        wsQueue.unshift(text);
    }
}

// 添加日志到队列
function sendLogToWs(text) {
    if (!USE_WS) return;
    
    wsQueue.push(text);
    
    // 如果已连接，尝试发送
    if (wsConnected) {
        flushWsQueue();
    }
}

// 启动 WebSocket
initWebSocket();

function vmLog(...args) {
    if(!window._open)return;
    const idx = ++logCounter;

    // 美化字符串：用 pretty 处理
    const prettyText = args.map(pretty).join(' ');
    const logLine = `[${idx}] ${prettyText}`;

    // 方式1：WebSocket 实时发送（推荐）
    if (USE_WS) {
        sendLogToWs(logLine);
    }
    
    // 方式2：存内存（备用，有数量限制）
    if (vmLogs.length < MAX_LOGS) {
        vmLogs.push({ idx, raw: args.join(' '), pretty: prettyText });
    }
}

/**
 * 记录普通赋值：obj[key] = value
 * @param {*} obj    - 被取属性的对象
 * @param {*} key    - 属性名
 * @param {*} value  - 值
 */
function logassign(obj, key, value) {
    vmLog(`[obj[key] = value类型] obj: ${obj}  key：[${key}] value: ${value}`);
}

/**
 * 记录属性赋值（或属性取值后赋值）：
 * 实际语句可能是 h[dest] = obj[key]
 * @param {*} obj    - 被取属性的对象
 * @param {*} key    - 属性名
 * @param {*} result - 结果值
 */
function logpropassign(obj, key, result) {
    vmLog(`[h[dest] = obj[key]类型] obj: ${obj} key：[${key}] (result: ${result})`);
}

// ====== 在 vmLog 系统之后添加 ======
let callIdCounter = 0;  // 函数调用专用计数器

// 函数调用前记录
function funclog(method, thisObj, ...args) {
    const cid = ++callIdCounter;
    const parts = [`[fog_${cid}]`, '方法名:', method.name || method || 'anonymous', '调用对象:', thisObj];
    if (args.length === 0) {
        parts.push('参数无');
    } else {
        args.forEach((arg, i) => {
            parts.push(`参数${i + 1}:`, arg);
        });
    }
    vmLog(...parts);
}

// 函数调用后记录结果
function funclogresult(result) {
    const cid = callIdCounter;
    vmLog(`[fog_${cid}] 调用结果:`, result);
}

/**
 * 安全的二元运算插桩（结合 vmLog）- 在运算前调用
 * @param {*} left - 左操作数
 * @param {string} op - 运算符，如 '+', '-', '^' 等
 * @param {*} right - 右操作数
 * @returns {*} 返回 undefined，不执行运算，仅用于日志
 */
function twomath(left, op, right) {
    vmLog(
        `[MATH]`,
        pretty(left), op, pretty(right)
    );
}

/**
 * 安全的一元运算插桩（结合 vmLog）- 在运算前调用
 * @param {string} op - 运算符，如 '-', '~', '!' 等
 * @param {*} val - 操作数
 * @returns {*} 返回 undefined，不执行运算，仅用于日志
 */
function onemath(op, val) {
    vmLog(
        `[UNARY]`,
        op,
        '(' + pretty(val) + ')'
    );
}
!function(){
    var oe = "undefined" !== typeof e ? e : "undefined" !== typeof window ? window : "undefined" !== typeof self ? self : void 0;
    (function() {
            var e = [];
            function t(e, t, n) {
                for (var r = [], i = 0; i++ < t; )
                    r.push(e += n);
                return r
            }
            var n = t(0, 43, 0).concat([62, 0, 62, 0, 63]).concat(t(51, 10, 1)).concat(t(0, 8, 0)).concat(t(0, 25, 1)).concat([0, 0, 0, 0, 63, 0]).concat(t(25, 26, 1));
            function r(e) {
                for (var t, r, i = String(e).replace(/[=]+$/, ""), o = i.length, a = 0, s = 0, u = []; s < o; s++)
                    ~(r = n[i.charCodeAt(s)]) && (t = a % 4 ? 64 * t + r : r,
                    a++ % 4) && u.push(255 & t >> (-2 * a & 6));
                return u
            }
            function i(e) {
                return e >> 1 ^ -(1 & e)
            }
            var o = function(e) {
                for (var t = [], n = "undefined" != typeof Int8Array ? new Int8Array(r(e)) : r(e), o = n.length, a = 0; o > a; ) {
                    var s = n[a++]
                      , u = 127 & s;
                    s >= 0 ? t.push(i(u)) : (u |= (127 & (s = n[a++])) << 7,
                    s >= 0 || (u |= (127 & (s = n[a++])) << 14,
                    s >= 0 || (u |= (127 & (s = n[a++])) << 21,
                    s >= 0 || (u |= (s = n[a++]) << 28))),
                    t.push(i(u)))
                }
                return t
            };
            return function(t, n) {
                var r = o(t)
                  , i = function(t, n, o, s, u) {
                    return function c() {
                        for (var l, f, h = [o, s, n, this, arguments, c, r, 0], d = void 0, p = t, g = []; ; )
                            try {
                                for (; ; )
                                    switch (r[++p]) {
                                    case 0:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        twomath(h[r[p+2]], '+', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] + h[r[++p]];
                                        break;
                                    case 1:
                                        onemath('!', 1),
                                        h[r[++p]] = !1;
                                        break;
                                    case 2:
                                        funclog(h[r[p+3]], h[r[p+2]], h[r[p+4]], h[r[p+5]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-5]]);
                                        break;
                                    case 3:
                                        funclog(h[r[p+2]], h[r[p+1]], h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-3]]);
                                        break;
                                    case 4:
                                        twomath(h[r[p+2]], '&', r[p+3]),
                                        h[r[++p]] = h[r[++p]] & r[++p];
                                        break;
                                    case 5:
                                        twomath(h[r[p+2]], '|', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] | h[r[++p]];
                                        break;
                                    case 6:
                                        for (l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        h[r[++p]] = i(p + r[++p], l, o, s, u);
                                        try {
                                            Object.defineProperty(h[r[p - 1]], "length", {
                                                value: r[++p],
                                                configurable: !0,
                                                writable: !1,
                                                enumerable: !1
                                            })
                                        } catch (e) {}
                                        break;
                                    case 7:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]];
                                        break;
                                    case 8:
                                        twomath(h[r[p+2]], '-', 0),
                                        h[r[++p]] = h[r[++p]] - 0;
                                        break;
                                    case 9:
                                        twomath(h[r[p+2]], '^', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] ^ h[r[++p]];
                                        break;
                                    case 10:
                                        h[r[++p]][r[++p]] = h[r[++p]],
                                        h[r[++p]] = r[++p],
                                        logassign(h[r[p-1]],h[r[p]],h[r[p+1]]),
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 11:
                                        h[r[++p]] = new h[r[++p]];
                                        vmLog("new对象——","构造函数：",h[r[p]],"结果:",h[r[p-1]])
                                        break;
                                    case 12:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 13:
                                        for (l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        h[r[++p]] = a(p + r[++p], l, o, s, u);
                                        try {
                                            Object.defineProperty(h[r[p - 1]], "length", {
                                                value: r[++p],
                                                configurable: !0,
                                                writable: !1,
                                                enumerable: !1
                                            })
                                        } catch (e) {}
                                        logassign(h[r[p-1]],null,h[r[p]])
                                        break;
                                    case 14:
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        h[r[++p]] = Array(r[++p]),
                                        logassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 15:
                                        h[r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]];
                                        break;
                                    case 16:
                                        funclog(h[r[p+2]], h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]]);
                                        funclogresult(h[r[p-2]]);
                                        break;
                                    case 17:
                                        return h[r[++p]];
                                    case 18:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 19:
                                        twomath(h[r[p+2]], '+', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] + h[r[++p]],
                                        h[r[++p]] = h[r[++p]];
                                        break;
                                    case 20:
                                        h[r[++p]][r[++p]] = h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 21:
                                        twomath(h[r[p+2]], '+', r[p+3]),
                                        h[r[++p]] = h[r[++p]] + r[++p];
                                        break;
                                    case 22:
                                        h[r[++p]] = new h[r[++p]](h[r[++p]]);
                                        vmLog("new对象——","构造函数：",h[r[p-1]],"参数：",h[r[p]],"结果:",h[r[p-2]])
                                        break;
                                    case 23:
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 24:
                                        logpropassign(h[r[p-1]],h[r[p]],h[r[p+1]]),
                                        h[r[++p]][h[r[++p]]] = h[r[++p]];
                                        break;
                                    case 25:
                                        h[r[++p]] = "",
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 26:
                                        onemath('++', h[r[p+2]]),
                                        h[r[++p]] = ++h[r[++p]];
                                        break;
                                    case 27:
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 28:
                                        logassign(h[r[p+1]],null,""),
                                        h[r[++p]] = "";
                                        break;
                                    case 29:
                                        for (l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        funclog(h[r[p+2]], h[r[p+1]], ...l),
                                        h[r[++p]] = h[r[++p]].apply(h[r[++p]], l);
                                        funclogresult(h[r[p-2]]);
                                        break;
                                    case 30:
                                        funclog(h[r[p+2]], d),
                                        h[r[++p]] = h[r[++p]].call(d);
                                        funclogresult(h[r[p-1]]);
                                        break;
                                    case 31:
                                        h[r[++p]] = h[r[++p]],
                                        twomath(h[r[p+2]], '>>', r[p+3]),
                                        h[r[++p]] = h[r[++p]] >> r[++p],
                                        twomath(h[r[p+2]], '&', r[p+3]),
                                        h[r[++p]] = h[r[++p]] & r[++p];
                                        break;
                                    case 32:
                                        h[r[++p]] = typeof h[r[++p]],
                                        h[r[++p]] = "";
                                        break;
                                    case 33:
                                        logassign(h[r[p+1]],null,h[r[p+2]]),
                                        h[r[++p]] = h[r[++p]];
                                        break;
                                    case 34:
                                        h[r[++p]] = null;
                                        break;
                                    case 35:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        h[r[++p]] = "";
                                        break;
                                    case 36:
                                        logassign(h[r[p+1]],null,d)
                                        h[r[++p]] = d;
                                        break;
                                    case 37:
                                        for (h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        h[r[++p]] = i(p + r[++p], l, o, s, u);
                                        try {
                                            Object.defineProperty(h[r[p - 1]], "length", {
                                                value: r[++p],
                                                configurable: !0,
                                                writable: !1,
                                                enumerable: !1
                                            })
                                        } catch (e) {}
                                        funclog(h[r[p+2]], h[r[p+1]], h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-3]]);
                                        break;
                                    case 38:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        h[r[++p]] = h[r[++p]][r[++p]];
                                        break;
                                    case 39:
                                        logpropassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]] = r[++p],
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 40:
                                        funclog(h[r[p+3]], h[r[p+2]], h[r[p+4]], h[r[p+5]], h[r[p+6]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]], h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-6]]);
                                        break;
                                    case 41:
                                        funclog(h[r[p+2]], d, h[r[p+3]], h[r[p+4]]),
                                        h[r[++p]] = h[r[++p]].call(d, h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-3]]);
                                        break;
                                    case 42:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        h[r[++p]] = typeof h[r[++p]],
                                        logassign(h[r[p-1]],null,""),
                                        h[r[++p]] = "";
                                        break;
                                    case 43:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] = r[++p],
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 44:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        logpropassign(h[r[p-1]],h[r[p]],h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]][h[r[++p]]];
                                        break;
                                    case 45:
                                        twomath(h[r[p+2]], '<<', r[p+3]),
                                        h[r[++p]] = h[r[++p]] << r[++p];
                                        break;
                                    case 46:
                                        return h[r[++p]] = d,
                                        h[r[++p]];
                                    case 47:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        twomath(h[r[p+2]], '<', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] < h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 48:
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        logpropassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]][r[++p]];
                                        break;
                                    case 49:
                                        h[r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        twomath(h[r[p+2]], '+', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] + h[r[++p]];
                                        break;
                                    case 50:
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 51:
                                        logassign(h[r[p+1]],null,!0),
                                        h[r[++p]] = !0;
                                        break;
                                    case 52:
                                        twomath(h[r[p+2]], '===', r[p+3]),
                                        h[r[++p]] = h[r[++p]] === r[++p];
                                        break;
                                    case 53:
                                        h[r[++p]] = {};
                                        break;
                                    case 54:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] = h[r[++p]] === h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 55:
                                        funclog(h[r[p+2]], d, h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]].call(d, h[r[++p]]);
                                        funclogresult(h[r[p-2]]);
                                        break;
                                    case 56:
                                        h[r[++p]] = r[++p];
                                        break;
                                    case 57:
                                        h[r[++p]][r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        h[r[++p]] = "";
                                        break;
                                    case 58:
                                        h[r[++p]] = Array(r[++p]);
                                        break;
                                    case 59:
                                        logpropassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]][r[++p]];
                                        break;
                                    case 60:
                                        twomath(h[r[p+2]], '%', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] % h[r[++p]];
                                        break;
                                    case 61:
                                        twomath(h[r[p+2]], '<', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] < h[r[++p]];
                                        break;
                                    case 62:
                                        onemath('-', h[r[p+2]]),
                                        h[r[++p]] = -h[r[++p]];
                                        break;
                                    case 63:
                                        twomath(h[r[p+2]], '===', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] === h[r[++p]];
                                        break;
                                    case 64:
                                        h[r[++p]] = r[++p],
                                        h[r[++p]] = h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 65:
                                        twomath(h[r[p+2]], '>', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] > h[r[++p]];
                                        break;
                                    case 66:
                                        h[r[++p]] = h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 67:
                                        onemath('!', h[r[p+2]]),
                                        h[r[++p]] = !h[r[++p]];
                                        break;
                                    case 68:
                                        h[r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]] + r[++p],
                                        h[r[++p]] = ""
                                    }
                            } catch (t) {
                                if (g.length > 0 && (e = []),
                                e.push(p),
                                0 === g.length)
                                    throw u ? u(t, h, e) : t;
                                p = g.pop(),
                                e.pop()
                            }
                    }
                }
                  , a = function(t, n, o, s, u) {
                    return function c() {
                        for (var l, f, h = [o, s, n, this, arguments, c, r, 0], d = void 0, p = t, g = []; ; )
                            try {
                                for (; ; )
                                    switch (r[++p]) {
                                    case 0:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        twomath(h[r[p+2]], '+', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] + h[r[++p]];
                                        break;
                                    case 1:
                                        onemath('!', 1),
                                        h[r[++p]] = !1;
                                        break;
                                    case 2:
                                        funclog(h[r[p+3]], h[r[p+2]], h[r[p+4]], h[r[p+5]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-5]]);
                                        break;
                                    case 3:
                                        funclog(h[r[p+2]], h[r[p+1]], h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-3]]);
                                        break;
                                    case 4:
                                        twomath(h[r[p+2]], '&', r[p+3]),
                                        h[r[++p]] = h[r[++p]] & r[++p];
                                        break;
                                    case 5:
                                        twomath(h[r[p+2]], '|', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] | h[r[++p]];
                                        break;
                                    case 6:
                                        for (l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        h[r[++p]] = i(p + r[++p], l, o, s, u);
                                        try {
                                            Object.defineProperty(h[r[p - 1]], "length", {
                                                value: r[++p],
                                                configurable: !0,
                                                writable: !1,
                                                enumerable: !1
                                            })
                                        } catch (e) {}
                                        break;
                                    case 7:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]];
                                        break;
                                    case 8:
                                        twomath(h[r[p+2]], '-', 0),
                                        h[r[++p]] = h[r[++p]] - 0;
                                        break;
                                    case 9:
                                        twomath(h[r[p+2]], '^', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] ^ h[r[++p]];
                                        break;
                                    case 10:
                                        h[r[++p]][r[++p]] = h[r[++p]],
                                        h[r[++p]] = r[++p],
                                        logassign(h[r[p-1]],h[r[p]],h[r[p+1]]),
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 11:
                                        h[r[++p]] = new h[r[++p]];
                                        vmLog("new对象——","构造函数：",h[r[p]],"结果:",h[r[p-1]]);
                                        break;
                                    case 12:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 13:
                                        for (l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        h[r[++p]] = a(p + r[++p], l, o, s, u);
                                        try {
                                            Object.defineProperty(h[r[p - 1]], "length", {
                                                value: r[++p],
                                                configurable: !0,
                                                writable: !1,
                                                enumerable: !1
                                            })
                                        } catch (e) {}
                                        logassign(h[r[p-1]],null,h[r[p]])
                                        break;
                                    case 14:
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        h[r[++p]] = Array(r[++p]),
                                        logassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 15:
                                        h[r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]];
                                        break;
                                    case 16:
                                        funclog(h[r[p+2]], h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]]);
                                        funclogresult(h[r[p-2]]);
                                        break;
                                    case 17:
                                        return h[r[++p]];
                                    case 18:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 19:
                                        twomath(h[r[p+2]], '+', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] + h[r[++p]],
                                        h[r[++p]] = h[r[++p]];
                                        break;
                                    case 20:
                                        h[r[++p]][r[++p]] = h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 21:
                                        twomath(h[r[p+2]], '+', r[p+3]),
                                        h[r[++p]] = h[r[++p]] + r[++p];
                                        break;
                                    case 22:
                                        h[r[++p]] = new h[r[++p]](h[r[++p]]);
                                        vmLog("new对象——","构造函数：",h[r[p-1]],"参数：",h[r[p]],"结果:",h[r[p-2]]);
                                        break;
                                    case 23:
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 24:
                                        logpropassign(h[r[p-1]],h[r[p]],h[r[p+1]]),
                                        h[r[++p]][h[r[++p]]] = h[r[++p]];
                                        break;
                                    case 25:
                                        h[r[++p]] = "",
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 26:
                                        onemath('++', h[r[p+2]]),
                                        h[r[++p]] = ++h[r[++p]];
                                        break;
                                    case 27:
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 28:
                                        logassign(h[r[p+1]],null,""),
                                        h[r[++p]] = "";
                                        break;
                                    case 29:
                                        for (l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        funclog(h[r[p+1]], h[r[p]], ...l),
                                        h[r[++p]] = h[r[++p]].apply(h[r[++p]], l);
                                        funclogresult(h[r[p-2]]);
                                        break;
                                    case 30:
                                        funclog(h[r[p+2]], d),
                                        h[r[++p]] = h[r[++p]].call(d);
                                        funclogresult(h[r[p-1]]);
                                        break;
                                    case 31:
                                        h[r[++p]] = h[r[++p]],
                                        twomath(h[r[p+2]], '>>', r[p+3]),
                                        h[r[++p]] = h[r[++p]] >> r[++p],
                                        twomath(h[r[p+2]], '&', r[p+3]),
                                        h[r[++p]] = h[r[++p]] & r[++p];
                                        break;
                                    case 32:
                                        h[r[++p]] = typeof h[r[++p]],
                                        h[r[++p]] = "";
                                        break;
                                    case 33:
                                        logassign(h[r[p+1]],null,h[r[p+2]]),
                                        h[r[++p]] = h[r[++p]];
                                        break;
                                    case 34:
                                        h[r[++p]] = null;
                                        break;
                                    case 35:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        h[r[++p]] = "";
                                        break;
                                    case 36:
                                        logassign(h[r[p+1]],null,d)
                                        h[r[++p]] = d;
                                        break;
                                    case 37:
                                        for (h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        l = [],
                                        f = r[++p]; f > 0; f--)
                                            l.push(h[r[++p]]);
                                        h[r[++p]] = i(p + r[++p], l, o, s, u);
                                        try {
                                            Object.defineProperty(h[r[p - 1]], "length", {
                                                value: r[++p],
                                                configurable: !0,
                                                writable: !1,
                                                enumerable: !1
                                            })
                                        } catch (e) {}
                                        funclog(h[r[p+2]], h[r[p+1]], h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-3]]);
                                        break;
                                    case 38:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        logpropassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]][r[++p]];
                                        break;
                                    case 39:
                                        h[r[++p]] = r[++p],
                                        logpropassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 40:
                                        funclog(h[r[p+3]], h[r[p+2]], h[r[p+4]], h[r[p+5]], h[r[p+6]]),
                                        h[r[++p]] = h[r[++p]].call(h[r[++p]], h[r[++p]], h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-6]]);
                                        break;
                                    case 41:
                                        funclog(h[r[p+2]], d, h[r[p+3]], h[r[p+4]]),
                                        h[r[++p]] = h[r[++p]].call(d, h[r[++p]], h[r[++p]]);
                                        funclogresult(h[r[p-3]]);
                                        break;
                                    case 42:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        h[r[++p]] = typeof h[r[++p]],
                                        logassign(h[r[p-1]],null,""),
                                        h[r[++p]] = "";
                                        break;
                                    case 43:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] = r[++p],
                                        h[r[++p]] += String.fromCharCode(r[++p]);
                                        break;
                                    case 44:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        logpropassign(h[r[p-1]],h[r[p]],h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]][h[r[++p]]];
                                        break;
                                    case 45:
                                        twomath(h[r[p+2]], '<<', r[p+3]),
                                        h[r[++p]] = h[r[++p]] << r[++p];
                                        break;
                                    case 46:
                                        return h[r[++p]] = d,
                                        h[r[++p]];
                                    case 47:
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        twomath(h[r[p+2]], '<', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] < h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 48:
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        logpropassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]][r[++p]];
                                        break;
                                    case 49:
                                        h[r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]][h[r[++p]]],
                                        twomath(h[r[p+2]], '+', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] + h[r[++p]];
                                        break;
                                    case 50:
                                        h[r[++p]][r[++p]] = h[r[++p]];
                                        break;
                                    case 51:
                                        logassign(h[r[p+1]],null,!0),
                                        h[r[++p]] = !0;
                                        break;
                                    case 52:
                                        twomath(h[r[p+2]], '===', r[p+3]),
                                        h[r[++p]] = h[r[++p]] === r[++p];
                                        break;
                                    case 53:
                                        h[r[++p]] = {};
                                        break;
                                    case 54:
                                        h[r[++p]] += String.fromCharCode(r[++p]),
                                        h[r[++p]] = h[r[++p]] === h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 55:
                                        funclog(h[r[p+2]], d, h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]].call(d, h[r[++p]]);
                                        funclogresult(h[r[p-2]]);
                                        break;
                                    case 56:
                                        h[r[++p]] = r[++p];
                                        break;
                                    case 57:
                                        h[r[++p]][r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]][r[++p]],
                                        h[r[++p]] = "";
                                        break;
                                    case 58:
                                        h[r[++p]] = Array(r[++p]);
                                        break;
                                    case 59:
                                        logpropassign(h[r[p-1]],r[p],h[r[p+1]]),
                                        h[r[++p]] = h[r[++p]][r[++p]];
                                        break;
                                    case 60:
                                        twomath(h[r[p+2]], '%', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] % h[r[++p]];
                                        break;
                                    case 61:
                                        twomath(h[r[p+2]], '<', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] < h[r[++p]];
                                        break;
                                    case 62:
                                        onemath('-', h[r[p+2]]),
                                        h[r[++p]] = -h[r[++p]];
                                        break;
                                    case 63:
                                        twomath(h[r[p+2]], '===', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] === h[r[++p]];
                                        break;
                                    case 64:
                                        h[r[++p]] = r[++p],
                                        h[r[++p]] = h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 65:
                                        twomath(h[r[p+2]], '>', h[r[p+3]]),
                                        h[r[++p]] = h[r[++p]] > h[r[++p]];
                                        break;
                                    case 66:
                                        h[r[++p]] = h[r[++p]],
                                        p += h[r[++p]] ? r[++p] : r[(++p,
                                        ++p)];
                                        break;
                                    case 67:
                                        onemath('!', h[r[p+2]]),
                                        h[r[++p]] = !h[r[++p]];
                                        break;
                                    case 68:
                                        h[r[++p]] = h[r[++p]],
                                        h[r[++p]] = h[r[++p]] + r[++p],
                                        h[r[++p]] = ""
                                    }
                            } catch (t) {
                                if (g.length > 0 && (e = []),
                                e.push(p),
                                0 === g.length)
                                    throw u ? u(t, h, e) : t;
                                p = g.pop(),
                                e.pop()
                            }
                    }
                };
                return n ? i : a
            }
        }
        )()("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", !1)(6151, [], oe, [void 0, null, !0, !1], void 0)();
        var ae = oe.__cgiEncrypt
          , se = oe.__cgiDecrypt;
    data = '{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":0,"g_tk_new_20200303":5381,"g_tk":5381},"req_1":{"module":"yqq.WhiteListServer","method":"Pass","param":{}},"req_2":{"module":"music.musicsearch.HotkeyService","method":"GetHotkeyForQQMusicMobile","param":{"searchid":"22879308046081988","remoteplace":"txt.yqq.top","from":"yqqweb"}},"req_3":{"module":"yqq.WhiteListServer","method":"Pass","param":{}},"req_4":{"module":"music.paycenterapi.LoginStateVerificationApi","method":"GetChargeAccount","param":{"appid":"mlive"}}}'
    response = hq
    aa = JSON.parse(se(response))
    console.log(aa);
}()