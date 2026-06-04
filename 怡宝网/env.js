
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
        get: function (target, property, receiver) {
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
            // 关键修复：如果是函数，用 bind 绑定正确的 this
            // 或者直接返回 value，让 receiver 自动处理 this
            if (type === "function") {
                // 方式1: 使用 bind 绑定到 target
                // return value.bind(target);

                // 方式2: 使用 Reflect.get 获取，保持 receiver 上下文（更推荐）
                return Reflect.get(target, property, receiver);
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
        ownKeys: (target) => {
            const keys = Reflect.ownKeys(target);
            // 截断过长的键列表显示
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
        },
        // 拦截 Object.getOwnPropertyDescriptor
        getOwnPropertyDescriptor: (target, property) => {
            const desc = Reflect.getOwnPropertyDescriptor(target, property);
            if (desc) {
                logToConsole(`[描述符] ${name}.${String(property)}: configurable=${desc.configurable}, enumerable=${desc.enumerable}, writable=${desc.writable}`);
            }
            return desc;
        },
        // 拦截 delete
        deleteProperty: (target, property) => {
            logToConsole(`[删除] ${name}.${String(property)}`);
            return Reflect.deleteProperty(target, property);
        },
        // 拦截 Object.getPrototypeOf() 和 __proto__
        getPrototypeOf: (target) => {
            const proto = Reflect.getPrototypeOf(target);
            const protoName = proto ? (proto.name || proto[Symbol.toStringTag] || 'Object') : 'null';
            const operationId = `getPrototypeOf:${name}:${protoName}`;
            const logMessage = `[原型] ${name}.getPrototypeOf() = [${protoName}]`;

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return proto;
        },
        // 拦截 Object.setPrototypeOf()
        setPrototypeOf: (target, proto) => {
            const protoName = proto ? (proto.name || proto[Symbol.toStringTag] || 'Object') : 'null';
            const operationId = `setPrototypeOf:${name}:${protoName}`;
            const logMessage = `[原型] 设置 ${name}.prototype = [${protoName}]`;

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return Reflect.setPrototypeOf(target, proto);
        },
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
delete globalThis.navigator

createConstructor('HTMLCollection', true, [], {},);

createConstructor('EventTarget', true, [], {
    addEventListener:function(){},
    removeEventListener:function(){}
});
createConstructor('Node', true, [], {}, 'EventTarget');
createConstructor('WindowProperties', true, [], {}, 'EventTarget')
createConstructor('Window', true, [], {}, 'WindowProperties');
createConstructor('Navigator', true, [], {});
createConstructor('Screen', true, [], {}, 'EventTarget');
createConstructor('History', true, [], {});
createConstructor('Location', true, [], {});
createConstructor('Element', true, [], {
    getAttribute: function(name) {
            return name === 'href' ? _href : null;
            },
    setAttribute:function(a){
        console.log("setAttribute创建",a)
    }
},'Node');
createConstructor('HTMLElement', true, [], {},"Element");
createConstructor('HTMLHtmlElement', true, [], {},"HTMLElement");
createConstructor('HTMLAnchorElement', true, [], {},"HTMLElement");
createConstructor('Document', true, [], {
    createEvent:function(event){
        return {
            timestamp:0
        }
    },
    getElementsByTagName:function(name){
        console.log("getElementsByTagName————",name)

        if (name === 'script') {
    var arr = [];
    for (var i = 0; i < 10; i++) {
        arr.push({
            tagName: 'SCRIPT',
            src: '',
            innerHTML: '',
            readyState: 'complete',
            type: 'text/javascript',
            getAttribute: function(attr) { return null; },
            setAttribute: function() {}
        });
    }
    arr.length = 10;
    arr.item = function(i) { return this[i] || null; };

    return arr;
}
        },
    createElement:function(name){
        console.log("createElement————",name)
        if(name==='a'){
            return new HTMLAnchorElement({
                tagName: 'A',
        href: '',
        protocol: '',
        host: '',
        hostname: '',
        port: '',
        pathname: '/',
        search: '',
        hash: '',
                setAttribute: function(name, value) {
            console.log("a.setAttribute:", name, '=', value);

            if (name === 'href') {
                _href = value;
                // ✅ 用 URL 解析
                try {
                    var url = new URL(value, window.location.href || 'https://fuwu.nhsa.gov.cn');
                    this.href = url.href;
                    this.protocol = url.protocol.replace(/:$/, '');
                    this.host = url.host;
                    this.hostname = url.hostname;
                    this.port = url.port;
                    this.pathname = url.pathname.charAt(0) === '/' ? url.pathname : '/' + url.pathname;
                    this.search = url.search ? url.search.replace(/^\?/, '') : '';
                    this.hash = url.hash ? url.hash.replace(/^#/, '') : '';
                } catch(e) {
                    this.href = value;
                }
            } else {
                this['_' + name] = value;
            }
        },

        getAttribute: function(name) {
            return name === 'href' ? _href : (this['_' + name] || null);
        }
            },null,"fatdog")
        }
    }
}, 'Node');
createConstructor('HTMLDocument', true, [], {}, 'Document');
createConstructor('Storage', true, [], {
    getItem: function(key) {
        console.log('localStorage.getItem获取', key);
        return this[key] || null;
    },
    setItem: function(key, value) {
        console.log('localStorage.setItem设置', key, value);
        this[key] = String(value);
    },
    removeItem: function(key) {
        console.log('localStorage.removeItem删除', key);
        if (this[key]) delete this[key];
    },
    clear: function() {
        this.__storage__ = {};
    }
});



window.window = window.self =window.top = window

Object.setPrototypeOf(window, Window.prototype);

location =new Location({
    "ancestorOrigins": {},
    "href": "https://fuwu.nhsa.gov.cn/nationalHallSt/#/search/drug-directory?code=174000&message=serverUrl%20is%20null&gbFlag=true",
    "origin": "https://fuwu.nhsa.gov.cn",
    "protocol": "https:",
    "host": "fuwu.nhsa.gov.cn",
    "hostname": "fuwu.nhsa.gov.cn",
    "port": "",
    "pathname": "/nationalHallSt/",
    "search": "",
    "hash": "#/search/drug-directory?code=174000&message=serverUrl%20is%20null&gbFlag=true"
},null,'fatdog')
document = new HTMLDocument({
    documentElement:new HTMLHtmlElement({},null,'fatdog'),
    querySelector:function(a){
        if(a==='base'){
            return null;
        }
    },
    cookie:'amap_local=320500',
    "location":location,
    implementation:{}
},null,"fatdog")
navigator = new Navigator({
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    product:'Gecko',
    appName:'Netscape',
},null,"fatdog")
screen=new Screen({

},null,"fatdog")
history=new History({
    pushState:function(n, r, i) {
                    var o;
                    o = e.apply(this, arguments);
                    try {
                        Wa(t)
                    } catch (a) {}
                    return o
                }
},null,'fatdog')
localStorage = new Storage({},null,'fatdog')

// window.location = watch(location,"window.location")
// window.navigator = watch(navigator,'window.navigator')
// window.screen = watch(screen,'window.screen')
// window.history = watch(history,'window.history')
// window.document = watch(document,'window.document')
// window.localStorage = watch(localStorage,"window.localStorage")


// window = watch(window,"window")
_log = console.log
console.log = function(){}