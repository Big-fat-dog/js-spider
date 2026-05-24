delete __filename
delete __dirname
!(() => {
    const origin_log = console.log;
    logToConsole = function (){
        return origin_log(...arguments)
    }
})();
//环境代理
function watch(obj, name) {
    // 用于存储已记录的操作，实现去重
    const loggedOperations = new Set();

    // 辅助函数：限制字符串长度，最长20个字符
    const truncateValue = (value) => {
        const str = String(value);
        return str.length > 20 ? str.substring(0, 20) + '...' : str;
    };

    return new Proxy(obj, {
        get: function (target, property) {
            const value = target[property];
            const type = typeof value;

            // 生成操作唯一标识和日志消息
            let operationId;
            let logMessage;
            // 处理要显示的值（截断处理）
            const displayValue = truncateValue(value);

            if (type === "symbol") {
                const symbolDescription = property.description || 'no description';
                logMessage = `对象=>${name},读取属性:${symbolDescription},这是一个 Symbol 类型的值`;
                operationId = `get:${name}:symbol:${symbolDescription}`;
            } else if (type === "function") {
                const functionName = value.name || 'anonymous';
                // 函数名也进行长度控制
                const displayFunctionName = truncateValue(functionName);
                logMessage = `对象=>${name},读取属性:${property.toString()},这是一个名为 ${displayFunctionName} 的函数`;
                operationId = `get:${name}:function:${property.toString()}:${functionName}`;
            } else {
                logMessage = `对象=>${name},读取属性:${String(property)},值为:${displayValue},类型为:${type}`;
                operationId = `get:${name}:${String(property)}:${type}:${String(value)}`;
            }

            // 检查是否已记录，如果没有则记录并输出
            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return value;
        },
        set: (target, property, newValue, receiver) => {
            const valueType = typeof newValue;

            // 生成操作唯一标识和日志消息
            let operationId;
            let logMessage;
            // 处理要显示的新值（截断处理）
            const displayNewValue = truncateValue(newValue);

            if (valueType === "symbol") {
                const symbolDescription = newValue.description || 'no description';
                logMessage = `对象=>${name},设置属性:${String(property)},这是一个 Symbol 类型的新值, 描述为: ${symbolDescription}`;
                operationId = `set:${name}:${String(property)}:symbol:${symbolDescription}`;
            } else {
                logMessage = `对象=>${name},设置属性:${String(property)},值为:${displayNewValue},类型为:${valueType}`;
                operationId = `set:${name}:${String(property)}:${valueType}:${String(newValue)}`;
            }

            // 检查是否已记录，如果没有则记录并输出
            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return Reflect.set(target, property, newValue, receiver);
        },
        // 监听 in 操作符（检查属性是否存在）
        has: (target, property) => {
            let operationId;
            let logMessage;

            // 处理 Symbol 类型的属性
            if (typeof property === 'symbol') {
                const symbolDescription = property.description || 'no description';
                logMessage = `对象=>${name},检查属性存在:${symbolDescription} (Symbol), 使用 in 操作符`;
                operationId = `has:${name}:symbol:${symbolDescription}`;
            } else {
                logMessage = `对象=>${name},检查属性存在:${String(property)}, 使用 in 操作符`;
                operationId = `has:${name}:${String(property)}`;
            }

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return Reflect.has(target, property);
        },
        // 监听属性枚举操作（如 Object.keys、for...in 等）
        // ownKeys: (target) => {
        //     const keys = Reflect.ownKeys(target);
        //     // 截断过长的键列表显示
        //     const displayKeys = truncateValue(keys.map(k =>
        //         typeof k === 'symbol' ? `Symbol(${k.description || ''})` : String(k)
        //     ).join(', '));
        //
        //     const operationId = `ownKeys:${name}:${keys.length}`;
        //     const logMessage = `对象=>${name},枚举属性,共 ${keys.length} 个属性:${displayKeys}`;
        //
        //     if (!loggedOperations.has(operationId)) {
        //         loggedOperations.add(operationId);
        //         logToConsole(logMessage);
        //     }
        //
        //     return keys;
        // }
        ownKeys: (target) => {
            let keys = Reflect.ownKeys(target);

            // ✅ 补齐window的属性数量到246
            if (name === 'window' && keys.length < 246) {
                const needFake = 246 - keys.length;
                const fakeKeys = [];
                for (let i = 0; i < needFake; i++) {
                    fakeKeys.push('__fake_prop_' + i);
                }
                keys = [...keys, ...fakeKeys];
            }

            // 日志
            const displayKeys = truncateValue(keys.map(k =>
                typeof k === 'symbol' ? `Symbol(${k.description || ''})` : String(k)
            ).join(', '));
            const operationId = `ownKeys:${name}:${keys.length}`;
            const logMessage = `对象=>${name},枚举属性,共 ${keys.length} 个属性:${displayKeys}`;
            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return keys;
        }
    });
}

//安全函数
const safeFunction = (function () {
    //处理安全函数
    Function.prototype.$call = Function.prototype.call;
    const $toString = Function.toString;
    const myFunction_toString_symbol = Symbol('('.concat('', ')'));

    const myToString = function myToString() {
        return typeof this === 'function' && this[myFunction_toString_symbol] || $toString.$call(this);
    }

    const set_native = function set_native(func, key, value) {
        Object.defineProperty(func, key, {
            "enumerable": false,
            "configurable": true,
            "writable": true,
            "value": value
        });
    }

    delete Function.prototype['toString'];
    set_native(Function.prototype, "toString", myToString);
    set_native(Function.prototype.toString, myFunction_toString_symbol, "function toString() { [native code] }");

    return function (func) {
        set_native(func, myFunction_toString_symbol, "function" + (func.name ? " " + func.name : "") + "() { [native code] }");
    }
})();

//类构造函数
function createConstructor(constructorName, enableStrictMode, propertiesList, prototypeMethods, parentConstructorName) {
    const instancesData = {};
    const constructorFunction = function (element, propertySetter, validationToken) {
        if (enableStrictMode && !(validationToken && validationToken === "fatdog")) {
            throw new Error("Illegal constructor");
        }

        // 为实例添加Symbol.toStringTag
        Object.defineProperty(this, Symbol.toStringTag, {
            value: constructorName,
            writable: false,
            enumerable: false,
            configurable: false
        });

        // 为实例添加Symbol.toPrimitive
        Object.defineProperty(this, Symbol.toPrimitive, {
            value: function (hint) {
                switch (hint) {
                    case 'number':
                        return this._element ? instancesData[this._element].toString().length : 0;
                    case 'string':
                        return `[${constructorName} Instance]`;
                    default:
                        return `[object ${constructorName}]`;
                }
            },
            writable: false,
            enumerable: false,
            configurable: false
        });

        if (propertySetter && typeof propertySetter === "function") {
            propertySetter(this, instancesData[this._element]);
        }
        const instanceProperties = element && typeof element === "object" ? element : {};
        this._element = Symbol("_element");
        instancesData[this._element] = instanceProperties;
        if (element && typeof element === "object") {
            Object.keys(element).forEach(key => {
                if (!this[key]) {
                    this[key] = element[key];
                }
            });
        }
    };

    // 设置构造函数名称
    Object.defineProperty(constructorFunction, 'name', {value: constructorName});

    // 处理继承关系
    if (parentConstructorName && window[parentConstructorName]) {
        const ParentConstructor = window[parentConstructorName];
        constructorFunction.prototype = Object.create(ParentConstructor.prototype);
        Object.defineProperty(constructorFunction.prototype, 'constructor', {
            value: constructorFunction,
            writable: false,
            enumerable: false,
            configurable: false
        });
    }

    // 为构造函数本身添加Symbol.toStringTag
    Object.defineProperty(constructorFunction, Symbol.toStringTag, {
        value: constructorName,
        writable: false,
        enumerable: false,
        configurable: false
    });

    // 为构造函数本身添加Symbol.toPrimitive
    Object.defineProperty(constructorFunction, Symbol.toPrimitive, {
        value: function (hint) {
            switch (hint) {
                case 'number':
                    return constructorName.length;
                case 'string':
                    return `[Constructor ${constructorName}]`;
                default:
                    return constructorName;
            }
        },
        writable: false,
        enumerable: false,
        configurable: false
    });

    // 添加原型方法
    Object.keys(prototypeMethods).forEach(methodName => {
        constructorFunction.prototype[methodName] = prototypeMethods[methodName];
        if (typeof constructorFunction.prototype[methodName] === "function") {
            safeFunction(constructorFunction.prototype[methodName]);
        }
    });

    // 保护构造函数
    safeFunction(constructorFunction);

    // 挂载到全局
    window[constructorName] = constructorFunction;
    return constructorFunction;
};

window = globalThis;
delete globalThis.navigator;  // ✅ 干掉Node自带的
// window.__meta_content = "h79TIymi_rlfP_8GBpeloHFYTEpzCb8mMzf0uYo3P.MTT7N12z4cacYhiRKZSFepNGyBrcdr0YNoVFIfXUITpG"
createConstructor('EventTarget', true, [], {
    addEventListener:function(type, listener,options){
        console.log("addEventListener参数是",arguments)
    }
});
createConstructor('Node', true, [], {
    appendChild:function(achild){
        console.log("appendChild设置了————",achild)
    },
    removeChild:function(child){
        console.log("removeChild————",child)
    }
}, 'EventTarget');
createConstructor('WindowProperties', true, [], {}, 'EventTarget')
createConstructor('Window', true, [], {}, 'WindowProperties');
createConstructor('Navigator', true, [], {});
createConstructor('Screen', true, [], {}, 'EventTarget');
createConstructor('History', true, [], {});
createConstructor('NetworkInformation', true, [], {},'EventTarget');


createConstructor('Document', true, [], {
    createElement:function(tagname){
        console.log("createElement设置了————",tagname)
        if(tagname==="div"){
            newdiv = new HTMLDivElement({
                style:watch(new CSSStyleDeclaration({},null,"fatdog"),'div————style'),
                addBehavior:undefined
            },null,'fatdog');
            return watch(newdiv,"createElement.div")
        }
        if(tagname==="script"){
            newscript = new HTMLScriptElement({
                parentElement: watch(new HTMLBodyElement({},null,'fatdog'),'script.parentElement')
            },null,"fatdog")
            return watch(newscript,"Document的createElement————script")
        }
        if(tagname==='media'){
            newmedia = new HTMLUnknownElement({},null,"fatdog")
            return watch(newmedia,"Document的createElement————media")
        }
        if(tagname==="canvas"){
            newcanvas = new HTMLCanvasElement({},null,"fatdog")
            return watch(newcanvas,"Document的createElement————canvas")
        }
    },
    getElementsByTagName:function(name){
        console.log("Document的getElementsByTagName读取——————",name)
        if(name==="i"){
            return {
                "0": {},
                "1": {},
                "2": {},
                "3": {}
            }
        }
        if(name==='script'){
            newtag = watch([watch(new HTMLScriptElement({
                parentElement: watch(new HTMLBodyElement({},null,'fatdog'),'script.parentElement')
            },null,"fatdog"),'script')],"getElementsByTagName.script[]")
            return newtag;
        }
        if(name==='base'){
            // newtag = new HTMLCollection({},null,"fatdog")
            // return newtag;
            return []
        }
    },
    getElementById:function(id){
        console.log("Document的getElementById访问————",id)
        if(id==='K5MK4FPPNWrv'){
            return {
            tagName: 'META',
            nodeName: 'META',
            nodeType: 1,
            id: 'K5MK4FPPNWrv',

            // ✅ 所有可能被调用的方法：
            getAttribute: function(name) {
                console.log('meta.getAttribute:', name);
                if (name === 'content') return window.__meta_content || '';
                if (name === 'r') return 'm';
                return null;
            },
            setAttribute: function(name, value) {
                console.log('meta.setAttribute:', name, value);
            },
            removeAttribute: function(name) {
                console.log('meta.removeAttribute:', name);
            },
            hasAttribute: function(name) {
                console.log('meta.hasAttribute:', name);
                return name === 'content' || name === 'r' || name === 'id';
            },
            getAttributeNode: function(name) {
                return null;
            },
            cloneNode: function(deep) {
                console.log('meta.cloneNode:', deep);
                return this;  // 返回自己
            },

            // ✅ DOM关系：
            parentNode: {
                tagName: 'HEAD',
                removeChild: function(child) {
                    console.log('head.removeChild:', child.tagName);
                    return child;
                }
            },
            parentElement: {
                tagName: 'HEAD'
            },

            // ✅ 其他属性：
            style: {},
            innerHTML: '',
            outerHTML: '<meta id="K5MK4FPPNWrv" content="' + (window.__meta_content || '') + '">',
            textContent: '',
            childNodes: [],
            children: [],

            // ✅ Symbol.toStringTag：
            [Symbol.toStringTag]: 'HTMLMetaElement'
        };
        }
    }

}, 'Node');
createConstructor('HTMLDocument', true, [], {}, 'Document');
createConstructor('Location', true, [], {});
createConstructor('Storage', true, [], {
    getItem: function(key) {
        console.log('localStorage.getItem获取', key);
        if(key==="_$rc"){
            return  ".UKKtb.H2PscONI9xfCccezbS1Nca.q9cl2b8S_qE0DqrTPJ4xMjeFEmtZ9rhFa6nqIYgKpkoA55_BxyWVLCNTw3IN7AYgX5U7Jxy04Pwjiz3TbLGNN72ji8bl0Hf18X_rW_4O0FFjPEarj7WVOSQMpZ0_BhOUMieKWbcGEkVRYoVQydrKHfiIqZRGOxljGdxBw36SHGCjOMjpbf8hwzvcTxEvVP5NIXMiJzB96a.7qjFu.pvESgvQ2ps19Kf5s0jt2QdqNSTnPMVmD1MGxs6PnW5fN2zHiVXD4MhszlQ72B0NEiAN.xR5mxVltC6fbxuw1Rgr7q0h0cEQQxpUhxDNqR6rHd_cCDhFa70JrH.I3MW4GhOYNHKGODp1KGzIH8A7DR.VBf8QD8oyjZAHZnTkLBohlaODnLhST4lf9wqhU3Sh48vVhCbnOxje2zw8mN7p52fIwBPuYTQPp6kMxBfijLFwscFx7w5Nxpsx2JQCa055nm6w2hRuW1zLQ8LdDWfB3ctuqOaKDc.XDkdtx2HBy27rQ4IHCrE_T7W.O8infAVOiwIweip0MamzvSRqrbfVuvEO9t.X.mXGRu1keI_crdI0Klqa10rbMEUndJ5feDOzNZMI7gOLBa43DcafK5hkFLcEK9Plmob70q39N_WHlgASgs7ZWpsbSVt0ZqAgPfhSR9BZ7rYwnIQG9pw6Gls4rxDtejoQvj6xnVeGsOoXEQPuenJaaIY6TYbyox22Yt7ZTBmixbtcIq0OFAei0uV3Y_hq"
        }
        if(key==='$_YWTU'){
            return "Joe4xOav_FW3MoVBdxofXRWV7wZXvJLeKqGfP3J6mSq"
        }
        return this[key] || null;
    },
    setItem: function(key, value) {
        console.log('localStorage.setItem设置', key, value);
        this[key] = String(value);
    },
    removeItem: function(key) {
        console.log('localStorage.removeItem删除', key);
        // delete this._data[key];
        delete this[key];

    },
    clear: function() {
        this._data = {};
    },
});
createConstructor('Element', true, [], {
    getElementsByTagName:function(name){
        console.log("Element的getElementsByTagName读取——————",name)
        if(name==="i"){
            return [];
        }
    },
    setAttribute:function(name, value) {
        console.log('setAttribute:', name, '=', value);
        this['_' + name] = value;  // 存一下
    },
    getAttribute: function(name) {
        if(name==='r'){
            return 'm'
        }
        console.log('Element.getAttribute:', name);
        return this['_' + name] || null;
    },

},"Node");
createConstructor('HTMLElement', true, [], {},"Element");
createConstructor('HTMLDivElement', true, [], {},"HTMLElement");
createConstructor('IDBFactory', true, [], {
    open: function(name, version) {
        console.log("IDBFactory的open被调用————", arguments)
        return {
            // 模拟一个"正在打开"的数据库对象
            result: {
                close: function() {},
                transaction: function() { return {}; },
                createObjectStore: function() { return {}; }
            },
            onerror: null,
            onsuccess: null,
            onupgradeneeded: null,
            error: null,
            readyState: 'done'
        };
    }
});
createConstructor('HTMLCollection', true, [], {});
createConstructor('HTMLScriptElement', true, [], {},"HTMLElement");
createConstructor('HTMLHtmlElement', true, [], {},"HTMLElement");
createConstructor('CSSStyleDeclaration', true, [], {});
createConstructor('HTMLCanvasElement', true, [], {},"HTMLElement");
createConstructor('CanvasRenderingContext2D', false, [], {});
createConstructor('HTMLMetaElement', true, [], {},"HTMLElement");
createConstructor('HTMLBodyElement', true, [], {},"HTMLElement");
createConstructor('DeprecatedStorageQuota', true, [], {});
createConstructor('MimeTypeArray', true, [], {});
createConstructor('MimeType', true, [], {});


Object.setPrototypeOf(window, Window.prototype);
//补环境代码
window.top = window
window.ActiveXObject =undefined
window.msCrypto=undefined
window.DOMParser = function(){}
window.XMLHttpRequest = function(){}
window.name = ''
window.execScript=undefined
window.globalStorage=undefined
window.mozIndexedDB=undefined
window.webkitIndexedDB=undefined
window.msIndexedDB=undefined
window.attachEvent=function(){}
window.CollectGarbage=undefined
window.MSBlobBuilder=undefined
window.showModalDialog=undefined
window.UCWebExt=undefined
window.ucweb=undefined
window.qb_bridge=undefined
window.qbbookshelf=undefined
window.dolphin=undefined
window.qihoo=undefined
window.dolphininfo=undefined
window.dolphinmeta=undefined
window.safari=undefined
window.orientation=undefined
//window上不该有的属性！
window.clearImmediate=undefined
window.setImmediate=undefined


window.webkitRequestFileSystem=function(){}
window.innerWidth = 1920;   // 浏览器内容区域宽度
window.innerHeight = 937;   // 浏览器内容区域高度（去掉工具栏）
window.outerWidth = 1920;   // 浏览器整个窗口宽度
window.outerHeight = 1080;  // 浏览器整个窗口高度
window.TEMPORARY=0
window.chrome={
    "app": {
        "isInstalled": false,
        "InstallState": {
            "DISABLED": "disabled",
            "INSTALLED": "installed",
            "NOT_INSTALLED": "not_installed"
        },
        "RunningState": {
            "CANNOT_RUN": "cannot_run",
            "READY_TO_RUN": "ready_to_run",
            "RUNNING": "running"
        }
    }
}
// 将 atob/btoa 等替换为安全版本，避免原型链检测
if (typeof atob === 'function') {
    const _atob = atob;
    window.atob = function(a) { return _atob(a); };
    safeFunction(window.atob);
}
if (typeof btoa === 'function') {
    const _btoa = btoa;
    window.btoa = function(b) { return _btoa(b); };
    safeFunction(window.btoa);
}

window.open=function(){}
window.CanvasRenderingContext2D = function() {};
location =new Location({
    search:'',
    href:'http://epub.cnipa.gov.cn/Index',
    pathname:'/Index',
    hostname:'epub.cnipa.gov.cn',
    host:'epub.cnipa.gov.cn',
    hash:'',
    protocol:'http:',
    port:''
},null,'fatdog')
document = new HTMLDocument({
    createExpression:function(xpathText, namespaceURLMapper){
            console.log('createExpression被调用:', xpathText);
    return {
        evaluate: function(contextNode, type, result) {
            return {
                singleNodeValue: null,
                stringValue: '',
                booleanValue: false,
                iterateNext: function() { return null; }
            };
        }
    };
    },
    "location":location,
    "__webdriver_evaluate":undefined,
    "__webdriver_script_fn":undefined,
    "visibilityState":'visible',
    "cookie":'',
    'documentElement':watch(new HTMLHtmlElement({
        style:watch(new CSSStyleDeclaration({
    "accentColor": "",
    "additiveSymbols": "",
    "alignContent": "",
    "alignItems": "",
    "alignSelf": "",
    "alignmentBaseline": "",
    "all": "",
    "anchorName": "",
    "anchorScope": "",
    "animation": "",
    "animationComposition": "",
    "animationDelay": "",
    "animationDirection": "",
    "animationDuration": "",
    "animationFillMode": "",
    "animationIterationCount": "",
    "animationName": "",
    "animationPlayState": "",
    "animationRange": "",
    "animationRangeEnd": "",
    "animationRangeStart": "",
    "animationTimeline": "",
    "animationTimingFunction": "",
    "animationTrigger": "",
    "appRegion": "",
    "appearance": "",
    "ascentOverride": "",
    "aspectRatio": "",
    "backdropFilter": "",
    "backfaceVisibility": "",
    "background": "",
    "backgroundAttachment": "",
    "backgroundBlendMode": "",
    "backgroundClip": "",
    "backgroundColor": "",
    "backgroundImage": "",
    "backgroundOrigin": "",
    "backgroundPosition": "",
    "backgroundPositionX": "",
    "backgroundPositionY": "",
    "backgroundRepeat": "",
    "backgroundSize": "",
    "basePalette": "",
    "baselineShift": "",
    "baselineSource": "",
    "blockSize": "",
    "border": "",
    "borderBlock": "",
    "borderBlockColor": "",
    "borderBlockEnd": "",
    "borderBlockEndColor": "",
    "borderBlockEndStyle": "",
    "borderBlockEndWidth": "",
    "borderBlockStart": "",
    "borderBlockStartColor": "",
    "borderBlockStartStyle": "",
    "borderBlockStartWidth": "",
    "borderBlockStyle": "",
    "borderBlockWidth": "",
    "borderBottom": "",
    "borderBottomColor": "",
    "borderBottomLeftRadius": "",
    "borderBottomRightRadius": "",
    "borderBottomStyle": "",
    "borderBottomWidth": "",
    "borderCollapse": "",
    "borderColor": "",
    "borderEndEndRadius": "",
    "borderEndStartRadius": "",
    "borderImage": "",
    "borderImageOutset": "",
    "borderImageRepeat": "",
    "borderImageSlice": "",
    "borderImageSource": "",
    "borderImageWidth": "",
    "borderInline": "",
    "borderInlineColor": "",
    "borderInlineEnd": "",
    "borderInlineEndColor": "",
    "borderInlineEndStyle": "",
    "borderInlineEndWidth": "",
    "borderInlineStart": "",
    "borderInlineStartColor": "",
    "borderInlineStartStyle": "",
    "borderInlineStartWidth": "",
    "borderInlineStyle": "",
    "borderInlineWidth": "",
    "borderLeft": "",
    "borderLeftColor": "",
    "borderLeftStyle": "",
    "borderLeftWidth": "",
    "borderRadius": "",
    "borderRight": "",
    "borderRightColor": "",
    "borderRightStyle": "",
    "borderRightWidth": "",
    "borderShape": "",
    "borderSpacing": "",
    "borderStartEndRadius": "",
    "borderStartStartRadius": "",
    "borderStyle": "",
    "borderTop": "",
    "borderTopColor": "",
    "borderTopLeftRadius": "",
    "borderTopRightRadius": "",
    "borderTopStyle": "",
    "borderTopWidth": "",
    "borderWidth": "",
    "bottom": "",
    "boxDecorationBreak": "",
    "boxShadow": "",
    "boxSizing": "",
    "breakAfter": "",
    "breakBefore": "",
    "breakInside": "",
    "bufferedRendering": "",
    "captionSide": "",
    "caretAnimation": "",
    "caretColor": "",
    "caretShape": "",
    "clear": "",
    "clip": "",
    "clipPath": "",
    "clipRule": "",
    "color": "",
    "colorInterpolation": "",
    "colorInterpolationFilters": "",
    "colorRendering": "",
    "colorScheme": "",
    "columnCount": "",
    "columnFill": "",
    "columnGap": "",
    "columnHeight": "",
    "columnRule": "",
    "columnRuleColor": "",
    "columnRuleStyle": "",
    "columnRuleWidth": "",
    "columnSpan": "",
    "columnWidth": "",
    "columnWrap": "",
    "columns": "",
    "contain": "",
    "containIntrinsicBlockSize": "",
    "containIntrinsicHeight": "",
    "containIntrinsicInlineSize": "",
    "containIntrinsicSize": "",
    "containIntrinsicWidth": "",
    "container": "",
    "containerName": "",
    "containerType": "",
    "content": "",
    "contentVisibility": "",
    "cornerBlockEndShape": "",
    "cornerBlockStartShape": "",
    "cornerBottomLeftShape": "",
    "cornerBottomRightShape": "",
    "cornerBottomShape": "",
    "cornerEndEndShape": "",
    "cornerEndStartShape": "",
    "cornerInlineEndShape": "",
    "cornerInlineStartShape": "",
    "cornerLeftShape": "",
    "cornerRightShape": "",
    "cornerShape": "",
    "cornerStartEndShape": "",
    "cornerStartStartShape": "",
    "cornerTopLeftShape": "",
    "cornerTopRightShape": "",
    "cornerTopShape": "",
    "counterIncrement": "",
    "counterReset": "",
    "counterSet": "",
    "cursor": "",
    "cx": "",
    "cy": "",
    "d": "",
    "descentOverride": "",
    "direction": "",
    "display": "",
    "dominantBaseline": "",
    "dynamicRangeLimit": "",
    "emptyCells": "",
    "fallback": "",
    "fieldSizing": "",
    "fill": "",
    "fillOpacity": "",
    "fillRule": "",
    "filter": "",
    "flex": "",
    "flexBasis": "",
    "flexDirection": "",
    "flexFlow": "",
    "flexGrow": "",
    "flexShrink": "",
    "flexWrap": "",
    "float": "",
    "floodColor": "",
    "floodOpacity": "",
    "font": "",
    "fontDisplay": "",
    "fontFamily": "",
    "fontFeatureSettings": "",
    "fontKerning": "",
    "fontLanguageOverride": "",
    "fontOpticalSizing": "",
    "fontPalette": "",
    "fontSize": "",
    "fontSizeAdjust": "",
    "fontStretch": "",
    "fontStyle": "",
    "fontSynthesis": "",
    "fontSynthesisSmallCaps": "",
    "fontSynthesisStyle": "",
    "fontSynthesisWeight": "",
    "fontVariant": "",
    "fontVariantAlternates": "",
    "fontVariantCaps": "",
    "fontVariantEastAsian": "",
    "fontVariantEmoji": "",
    "fontVariantLigatures": "",
    "fontVariantNumeric": "",
    "fontVariantPosition": "",
    "fontVariationSettings": "",
    "fontWeight": "",
    "forcedColorAdjust": "",
    "gap": "",
    "grid": "",
    "gridArea": "",
    "gridAutoColumns": "",
    "gridAutoFlow": "",
    "gridAutoRows": "",
    "gridColumn": "",
    "gridColumnEnd": "",
    "gridColumnGap": "",
    "gridColumnStart": "",
    "gridGap": "",
    "gridRow": "",
    "gridRowEnd": "",
    "gridRowGap": "",
    "gridRowStart": "",
    "gridTemplate": "",
    "gridTemplateAreas": "",
    "gridTemplateColumns": "",
    "gridTemplateRows": "",
    "height": "",
    "hyphenateCharacter": "",
    "hyphenateLimitChars": "",
    "hyphens": "",
    "imageOrientation": "",
    "imageRendering": "",
    "inherits": "",
    "initialLetter": "",
    "initialValue": "",
    "inlineSize": "",
    "inset": "",
    "insetBlock": "",
    "insetBlockEnd": "",
    "insetBlockStart": "",
    "insetInline": "",
    "insetInlineEnd": "",
    "insetInlineStart": "",
    "interactivity": "",
    "interestDelay": "",
    "interestDelayEnd": "",
    "interestDelayStart": "",
    "interpolateSize": "",
    "isolation": "",
    "justifyContent": "",
    "justifyItems": "",
    "justifySelf": "",
    "left": "",
    "letterSpacing": "",
    "lightingColor": "",
    "lineBreak": "",
    "lineGapOverride": "",
    "lineHeight": "",
    "listStyle": "",
    "listStyleImage": "",
    "listStylePosition": "",
    "listStyleType": "",
    "margin": "",
    "marginBlock": "",
    "marginBlockEnd": "",
    "marginBlockStart": "",
    "marginBottom": "",
    "marginInline": "",
    "marginInlineEnd": "",
    "marginInlineStart": "",
    "marginLeft": "",
    "marginRight": "",
    "marginTop": "",
    "marker": "",
    "markerEnd": "",
    "markerMid": "",
    "markerStart": "",
    "mask": "",
    "maskClip": "",
    "maskComposite": "",
    "maskImage": "",
    "maskMode": "",
    "maskOrigin": "",
    "maskPosition": "",
    "maskRepeat": "",
    "maskSize": "",
    "maskType": "",
    "mathDepth": "",
    "mathShift": "",
    "mathStyle": "",
    "maxBlockSize": "",
    "maxHeight": "",
    "maxInlineSize": "",
    "maxWidth": "",
    "minBlockSize": "",
    "minHeight": "",
    "minInlineSize": "",
    "minWidth": "",
    "mixBlendMode": "",
    "navigation": "",
    "negative": "",
    "objectFit": "",
    "objectPosition": "",
    "objectViewBox": "",
    "offset": "",
    "offsetAnchor": "",
    "offsetDistance": "",
    "offsetPath": "",
    "offsetPosition": "",
    "offsetRotate": "",
    "opacity": "",
    "order": "",
    "orphans": "",
    "outline": "",
    "outlineColor": "",
    "outlineOffset": "",
    "outlineStyle": "",
    "outlineWidth": "",
    "overflow": "",
    "overflowAnchor": "",
    "overflowBlock": "",
    "overflowClipMargin": "",
    "overflowInline": "",
    "overflowWrap": "",
    "overflowX": "",
    "overflowY": "",
    "overlay": "",
    "overrideColors": "",
    "overscrollBehavior": "",
    "overscrollBehaviorBlock": "",
    "overscrollBehaviorInline": "",
    "overscrollBehaviorX": "",
    "overscrollBehaviorY": "",
    "pad": "",
    "padding": "",
    "paddingBlock": "",
    "paddingBlockEnd": "",
    "paddingBlockStart": "",
    "paddingBottom": "",
    "paddingInline": "",
    "paddingInlineEnd": "",
    "paddingInlineStart": "",
    "paddingLeft": "",
    "paddingRight": "",
    "paddingTop": "",
    "page": "",
    "pageBreakAfter": "",
    "pageBreakBefore": "",
    "pageBreakInside": "",
    "pageOrientation": "",
    "paintOrder": "",
    "perspective": "",
    "perspectiveOrigin": "",
    "placeContent": "",
    "placeItems": "",
    "placeSelf": "",
    "pointerEvents": "",
    "position": "",
    "positionAnchor": "",
    "positionArea": "",
    "positionTry": "",
    "positionTryFallbacks": "",
    "positionTryOrder": "",
    "positionVisibility": "",
    "prefix": "",
    "printColorAdjust": "",
    "quotes": "",
    "r": "",
    "range": "",
    "readingFlow": "",
    "readingOrder": "",
    "resize": "",
    "result": "",
    "right": "",
    "rotate": "",
    "rowGap": "",
    "rubyAlign": "",
    "rubyPosition": "",
    "rx": "",
    "ry": "",
    "scale": "",
    "scrollBehavior": "",
    "scrollInitialTarget": "",
    "scrollMargin": "",
    "scrollMarginBlock": "",
    "scrollMarginBlockEnd": "",
    "scrollMarginBlockStart": "",
    "scrollMarginBottom": "",
    "scrollMarginInline": "",
    "scrollMarginInlineEnd": "",
    "scrollMarginInlineStart": "",
    "scrollMarginLeft": "",
    "scrollMarginRight": "",
    "scrollMarginTop": "",
    "scrollMarkerGroup": "",
    "scrollPadding": "",
    "scrollPaddingBlock": "",
    "scrollPaddingBlockEnd": "",
    "scrollPaddingBlockStart": "",
    "scrollPaddingBottom": "",
    "scrollPaddingInline": "",
    "scrollPaddingInlineEnd": "",
    "scrollPaddingInlineStart": "",
    "scrollPaddingLeft": "",
    "scrollPaddingRight": "",
    "scrollPaddingTop": "",
    "scrollSnapAlign": "",
    "scrollSnapStop": "",
    "scrollSnapType": "",
    "scrollTargetGroup": "",
    "scrollTimeline": "",
    "scrollTimelineAxis": "",
    "scrollTimelineName": "",
    "scrollbarColor": "",
    "scrollbarGutter": "",
    "scrollbarWidth": "",
    "shapeImageThreshold": "",
    "shapeMargin": "",
    "shapeOutside": "",
    "shapeRendering": "",
    "size": "",
    "sizeAdjust": "",
    "speak": "",
    "speakAs": "",
    "src": "",
    "stopColor": "",
    "stopOpacity": "",
    "stroke": "",
    "strokeDasharray": "",
    "strokeDashoffset": "",
    "strokeLinecap": "",
    "strokeLinejoin": "",
    "strokeMiterlimit": "",
    "strokeOpacity": "",
    "strokeWidth": "",
    "suffix": "",
    "symbols": "",
    "syntax": "",
    "system": "",
    "tabSize": "",
    "tableLayout": "",
    "textAlign": "",
    "textAlignLast": "",
    "textAnchor": "",
    "textAutospace": "",
    "textBox": "",
    "textBoxEdge": "",
    "textBoxTrim": "",
    "textCombineUpright": "",
    "textDecoration": "",
    "textDecorationColor": "",
    "textDecorationLine": "",
    "textDecorationSkipInk": "",
    "textDecorationStyle": "",
    "textDecorationThickness": "",
    "textEmphasis": "",
    "textEmphasisColor": "",
    "textEmphasisPosition": "",
    "textEmphasisStyle": "",
    "textIndent": "",
    "textJustify": "",
    "textOrientation": "",
    "textOverflow": "",
    "textRendering": "",
    "textShadow": "",
    "textSizeAdjust": "",
    "textSpacingTrim": "",
    "textTransform": "",
    "textUnderlineOffset": "",
    "textUnderlinePosition": "",
    "textWrap": "",
    "textWrapMode": "",
    "textWrapStyle": "",
    "timelineScope": "",
    "timelineTrigger": "",
    "timelineTriggerActivationRange": "",
    "timelineTriggerActivationRangeEnd": "",
    "timelineTriggerActivationRangeStart": "",
    "timelineTriggerActiveRange": "",
    "timelineTriggerActiveRangeEnd": "",
    "timelineTriggerActiveRangeStart": "",
    "timelineTriggerName": "",
    "timelineTriggerSource": "",
    "top": "",
    "touchAction": "",
    "transform": "",
    "transformBox": "",
    "transformOrigin": "",
    "transformStyle": "",
    "transition": "",
    "transitionBehavior": "",
    "transitionDelay": "",
    "transitionDuration": "",
    "transitionProperty": "",
    "transitionTimingFunction": "",
    "translate": "",
    "triggerScope": "",
    "types": "",
    "unicodeBidi": "",
    "unicodeRange": "",
    "userSelect": "",
    "vectorEffect": "",
    "verticalAlign": "",
    "viewTimeline": "",
    "viewTimelineAxis": "",
    "viewTimelineInset": "",
    "viewTimelineName": "",
    "viewTransitionClass": "",
    "viewTransitionGroup": "",
    "viewTransitionName": "",
    "viewTransitionScope": "",
    "visibility": "",
    "webkitAlignContent": "",
    "webkitAlignItems": "",
    "webkitAlignSelf": "",
    "webkitAnimation": "",
    "webkitAnimationDelay": "",
    "webkitAnimationDirection": "",
    "webkitAnimationDuration": "",
    "webkitAnimationFillMode": "",
    "webkitAnimationIterationCount": "",
    "webkitAnimationName": "",
    "webkitAnimationPlayState": "",
    "webkitAnimationTimingFunction": "",
    "webkitAppRegion": "",
    "webkitAppearance": "",
    "webkitBackfaceVisibility": "",
    "webkitBackgroundClip": "",
    "webkitBackgroundOrigin": "",
    "webkitBackgroundSize": "",
    "webkitBorderAfter": "",
    "webkitBorderAfterColor": "",
    "webkitBorderAfterStyle": "",
    "webkitBorderAfterWidth": "",
    "webkitBorderBefore": "",
    "webkitBorderBeforeColor": "",
    "webkitBorderBeforeStyle": "",
    "webkitBorderBeforeWidth": "",
    "webkitBorderBottomLeftRadius": "",
    "webkitBorderBottomRightRadius": "",
    "webkitBorderEnd": "",
    "webkitBorderEndColor": "",
    "webkitBorderEndStyle": "",
    "webkitBorderEndWidth": "",
    "webkitBorderHorizontalSpacing": "",
    "webkitBorderImage": "",
    "webkitBorderRadius": "",
    "webkitBorderStart": "",
    "webkitBorderStartColor": "",
    "webkitBorderStartStyle": "",
    "webkitBorderStartWidth": "",
    "webkitBorderTopLeftRadius": "",
    "webkitBorderTopRightRadius": "",
    "webkitBorderVerticalSpacing": "",
    "webkitBoxAlign": "",
    "webkitBoxDecorationBreak": "",
    "webkitBoxDirection": "",
    "webkitBoxFlex": "",
    "webkitBoxOrdinalGroup": "",
    "webkitBoxOrient": "",
    "webkitBoxPack": "",
    "webkitBoxReflect": "",
    "webkitBoxShadow": "",
    "webkitBoxSizing": "",
    "webkitClipPath": "",
    "webkitColumnBreakAfter": "",
    "webkitColumnBreakBefore": "",
    "webkitColumnBreakInside": "",
    "webkitColumnCount": "",
    "webkitColumnGap": "",
    "webkitColumnRule": "",
    "webkitColumnRuleColor": "",
    "webkitColumnRuleStyle": "",
    "webkitColumnRuleWidth": "",
    "webkitColumnSpan": "",
    "webkitColumnWidth": "",
    "webkitColumns": "",
    "webkitFilter": "",
    "webkitFlex": "",
    "webkitFlexBasis": "",
    "webkitFlexDirection": "",
    "webkitFlexFlow": "",
    "webkitFlexGrow": "",
    "webkitFlexShrink": "",
    "webkitFlexWrap": "",
    "webkitFontFeatureSettings": "",
    "webkitFontSmoothing": "",
    "webkitHyphenateCharacter": "",
    "webkitJustifyContent": "",
    "webkitLineBreak": "",
    "webkitLineClamp": "",
    "webkitLocale": "",
    "webkitLogicalHeight": "",
    "webkitLogicalWidth": "",
    "webkitMarginAfter": "",
    "webkitMarginBefore": "",
    "webkitMarginEnd": "",
    "webkitMarginStart": "",
    "webkitMask": "",
    "webkitMaskBoxImage": "",
    "webkitMaskBoxImageOutset": "",
    "webkitMaskBoxImageRepeat": "",
    "webkitMaskBoxImageSlice": "",
    "webkitMaskBoxImageSource": "",
    "webkitMaskBoxImageWidth": "",
    "webkitMaskClip": "",
    "webkitMaskComposite": "",
    "webkitMaskImage": "",
    "webkitMaskOrigin": "",
    "webkitMaskPosition": "",
    "webkitMaskPositionX": "",
    "webkitMaskPositionY": "",
    "webkitMaskRepeat": "",
    "webkitMaskSize": "",
    "webkitMaxLogicalHeight": "",
    "webkitMaxLogicalWidth": "",
    "webkitMinLogicalHeight": "",
    "webkitMinLogicalWidth": "",
    "webkitOpacity": "",
    "webkitOrder": "",
    "webkitPaddingAfter": "",
    "webkitPaddingBefore": "",
    "webkitPaddingEnd": "",
    "webkitPaddingStart": "",
    "webkitPerspective": "",
    "webkitPerspectiveOrigin": "",
    "webkitPerspectiveOriginX": "",
    "webkitPerspectiveOriginY": "",
    "webkitPrintColorAdjust": "",
    "webkitRtlOrdering": "",
    "webkitRubyPosition": "",
    "webkitShapeImageThreshold": "",
    "webkitShapeMargin": "",
    "webkitShapeOutside": "",
    "webkitTapHighlightColor": "",
    "webkitTextCombine": "",
    "webkitTextDecorationsInEffect": "",
    "webkitTextEmphasis": "",
    "webkitTextEmphasisColor": "",
    "webkitTextEmphasisPosition": "",
    "webkitTextEmphasisStyle": "",
    "webkitTextFillColor": "",
    "webkitTextOrientation": "",
    "webkitTextSecurity": "",
    "webkitTextSizeAdjust": "",
    "webkitTextStroke": "",
    "webkitTextStrokeColor": "",
    "webkitTextStrokeWidth": "",
    "webkitTransform": "",
    "webkitTransformOrigin": "",
    "webkitTransformOriginX": "",
    "webkitTransformOriginY": "",
    "webkitTransformOriginZ": "",
    "webkitTransformStyle": "",
    "webkitTransition": "",
    "webkitTransitionDelay": "",
    "webkitTransitionDuration": "",
    "webkitTransitionProperty": "",
    "webkitTransitionTimingFunction": "",
    "webkitUserDrag": "",
    "webkitUserModify": "",
    "webkitUserSelect": "",
    "webkitWritingMode": "",
    "whiteSpace": "",
    "whiteSpaceCollapse": "",
    "widows": "",
    "width": "",
    "willChange": "",
    "wordBreak": "",
    "wordSpacing": "",
    "wordWrap": "",
    "writingMode": "",
    "x": "",
    "y": "",
    "zIndex": "",
    "zoom": ""
},null,"fatdog"),'documentElement————style'),
    },null,"fatdog"),"documentElement")
},null,"fatdog")
navigator = new Navigator({
    appCodeName: "Mozilla",
    appName: "Netscape",
    appVersion:'5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    language: "zh-CN",
    vendor: "Google Inc.",
    vendorSub: "",
    webdriver: false,
    platform: "Win32",
    languages: ['zh-CN', 'zh'],
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    webkitPersistentStorage:watch(new DeprecatedStorageQuota({},null,'fatdog'),'webkitPersistentStorage'),
    //这个有点恶心啊！！！！！
    mimeTypes:watch(new MimeTypeArray({
        0:watch(new MimeType({},null,'fatdog'),'MimeType--0'),
        1:watch(new MimeType({},null,'fatdog'),'MimeType--1'),
        'application/pdf':watch(new MimeType({},null,'fatdog'),'MimeType--application/pdf'),
        length: 2
    },null,'fatdog'),'navigator.mimetypes'),
    maxTouchPoints:0,
    connection:watch(new NetworkInformation({
        downlink: 4.45,
        effectiveType: "4g",
        rtt: 100,
        saveData: false,
    },null,'fatdog'),'navigator.connection'),//可能要代理

},null,"fatdog")
screen=new Screen({
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
    availLeft: 0,
    availTop: 0,
    left: 0,
    top: 0
},null,"fatdog")
history=new History({},null,'fatdog')
localStorage=new Storage({
    "$_YWTU": "Joe4xOav_FW3MoVBdxofXRWV7wZXvJLeKqGfP3J6mSq",
    "_$rc": ".UKKtb.H2PscONI9xfCccezbS1Nca.q9cl2b8S_qE0DqrTPJ4xMjeFEmtZ9rhFa6nqIYgKpkoA55_BxyWVLCNTw3IN7AYgX5U7Jxy04Pwjiz3TbLGNN72ji8bl0Hf18X_rW_4O0FFjPEarj7WVOSQMpZ0_BhOUMieKWbcGEkVRYoVQydrKHfiIqZRGOxljGdxBw36SHGCjOMjpbf8hwzvcTxEvVP5NIXMiJzB96a.7qjFu.pvESgvQ2ps19Kf5s0jt2QdqNSTnPMVmD1MGxs6PnW5fN2zHiVXD4MhszlQ72B0NEiAN.xR5mxVltC6fbxuw1Rgr7q0h0cEQQxpUhxDNqR6rHd_cCDhFa70JrH.I3MW4GhOYNHKGODp1KGzIH8A7DR.VBf8QD8oyjZAHZnTkLBohlaODnLhST4lf9wqhU3Sh48vVhCbnOxje2zw8mN7p52fIwBPuYTQPp6kMxBfijLFwscFx7w5Nxpsx2JQCa055nm6w2hRuW1zLQ8LdDWfB3ctuqOaKDc.XDkdtx2HBy27rQ4IHCrE_T7W.O8infAVOiwIweip0MamzvSRqrbfVuvEO9t.X.mXGRu1keI_crdI0Klqa10rbMEUndJ5feDOzNZMI7gOLBa43DcafK5hkFLcEK9Plmob70q39N_WHlgASgs7ZWpsbSVt0ZqAgPfhSR9BZ7rYwnIQG9pw6Gls4rxDtejoQvj6xnVeGsOoXEQPuenJaaIY6TYbyox22Yt7ZTBmixbtcIq0OFAei0uV3Y_hq",
    "__#classType": "localStorage",
    "$_YVTX": "JA"
},null,'fatdog')
sessionStorage=new Storage({
    "$_YWTU": "Joe4xOav_FW3MoVBdxofXRWV7wZXvJLeKqGfP3J6mSq",
    "$_YVTX": "JA"
},null,'fatdog')
indexedDB=new IDBFactory({},null,"fatdog")
window.self=window
window.top=window
window.document = watch(document,'window.document')
window.location = watch(location,'window.location')
window.localStorage = watch(localStorage,'window.localStorage')
window.sessionStorage = watch(sessionStorage,'sessionStorage')
window.screen = watch(screen,"screen")
window.indexedDB=watch(indexedDB,"window.indexedDB")
window.navigator=watch(navigator,"window.navigator")
setInterval=function(){}
setTimeout=function(){}
// ================== 双层代理：隐藏 Node 特征 + 日志 ==================
const rawWindow = window;

// 需要彻底隐藏的属性（包括泄漏的 logToConsole）
const hiddenProps = ['global', 'process', 'Buffer', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'structuredClone', 'logToConsole'];

window = new Proxy(rawWindow, {
    get(target, property, receiver) {
        if (hiddenProps.includes(property)) return undefined;
        // top/self/parent 返回代理自身
        if (property === 'top' || property === 'self' || property === 'parent') return receiver;
        return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
        return Reflect.set(target, property, value, receiver);
    },
    has(target, property) {
        if (hiddenProps.includes(property)) return false;
        return Reflect.has(target, property);
    },
    ownKeys(target) {
        return Reflect.ownKeys(target).filter(k => !hiddenProps.includes(k));
    },
    getOwnPropertyDescriptor(target, property) {
        if (hiddenProps.includes(property)) return undefined;
        return Reflect.getOwnPropertyDescriptor(target, property);
    }
});

// 套上日志代理
window = watch(window, 'window');




