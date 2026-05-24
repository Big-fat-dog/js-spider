const crypto = require('crypto-js')

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
createConstructor('EventTarget', true, [], {});
createConstructor('Node', true, [], {}, 'EventTarget');
createConstructor('WindowProperties', true, [], {}, 'EventTarget')
createConstructor('Window', true, [], {}, 'WindowProperties');
createConstructor('Element', true, [],{}, 'Node');
Object.setPrototypeOf(window, Window.prototype);

createConstructor('Storage', true, [], {},{});
createConstructor('HTMLAllCollection', true, [], {},{});
createConstructor('Document',true,[],{
    createElement:function(tagName){
        console.log('Document.createElement',tagName)
        if(tagName==='script'){
            return watch(new HTMLScriptElement({},null,"fatdog"),'createElement(script)')
        }
        if(tagName==="canvas"){
            return watch(new HTMLCanvasElement({},null,"fatdog"),'createElement(canvas)')
        }
    },
    createEvent:function(eventname){
        console.log(eventname)
    },
    getElementsByTagName:function(tagname){
        console.log('DOcument.getElementsByTagName获取',tagname)
        if(tagname==="head"){
            return watch(new HTMLCollection({
                0:watch(new HTMLHeadElement({
                    appendChild:function(tagname){

                    }
                },null,'fatdog'),'getElementsByTagName(head)')
            },null,"fatdog"),'Document.HTMLCollection')
        }
    }
},'Node')
createConstructor('HTMLDocument',true,[],{},'Document')
createConstructor('HTMLElement',true,[],{},'Element')
createConstructor('HTMLHtmlElement',true,[],{},'HTMLElement')
createConstructor('HTMLHeadElement',true,[],{},'HTMLElement')
createConstructor('HTMLBodyElement',true,[],{},'HTMLElement')
createConstructor('HTMLScriptElement',true,[],{},'HTMLElement')
//canvas指纹
createConstructor('HTMLCanvasElement',true,[],{
    getContext:function(type){
        console.log("getContext设置",type)
        if(type==="2d"){
            return watch(new CanvasRenderingContext2D({},null,"fatdog"),"CanvasRenderingContext2D")
        }
        if(type==="webgl"){
            return watch(new WebGLRenderingContext({},null,"fatdog"),"WebGLRenderingContext")
        }
    },
    toDataURL:function(){
        return 'data:image/png;base64,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'
    }
},'HTMLElement')
createConstructor('CanvasRenderingContext2D',true,[],{
    fillRect: function() {},
    fillText: function() {},
    arc: function() {},
    stroke: function() {},
})

createConstructor('WebGLRenderingContext',true,[],{

},'HTMLCanvasElement')



createConstructor('HTMLCollection',true,[],{})


//定时器用作清理，我们直接滞空，可以少补dom
setInterval=function(){}
setTimeout=function(){}

//补环境代码
localStorage = watch(new Storage({
    getItem:function(key){
        console.log('localStorage.getItem获取',key)
        return this[key];
    },
    setItem:function(key,value){
        console.log('localStorage.setItem设置',key,value)
        this[key]=value;
    },

},null,'fatdog'),'localStorage')
document = new HTMLDocument({
    all:watch(new HTMLAllCollection({},null,'fatdog'),"document.all"),
    documentElement:watch(new HTMLHtmlElement({},null,'fatdog'),"document.documentElement"),
    cookie:"__jdv=229668127|cn.bing.com|t_2037222536_0_0|adrealizable|f49c1979fb28d62d-p_0|1778760960019; PCSYCityID=CN_320000_320500_0; user-key=1063871e-fef9-46fb-90f3-2f11fcc86806; shshshfpa=7016242f-a138-659d-7491-5709d4550ab4-1778761184; shshshfpx=7016242f-a138-659d-7491-5709d4550ab4-1778761184; __jdu=17787647195151699949541; areaId=52993; ipLoc-djd=52993-52994-146660-0; TrackID=1RZcfqjkwy76IJKCAe59oT1JBBKuBGlMrbE4NgcObczVnYG-e0UwFdLh7NeVnDUTohS1B4BCz2FDIzNSd36rexqAPv1GW9ae6HvVCJM56_S4; pinId=OI66V8DdRcDvRP4X3ePfTg; pin=jd_KlBTjtKcZjSM; unick=2l652aq5b18189; _tp=nRRl2Me9wmEDL1EY%2FCqfTg%3D%3D; umc_count=1; mail_times=4%2C2%2C1778831489107; mba_muid=17787647195151699949541; x-rp-evtoken=mGW9U4qbzsaBdCMe70m9pJrdLMqfeYSDBzJ5cgrJFxtyKHCnqXMfEqvnahR8RN8oNLfCMMZvCjo9rZ55GC2AoA%3D%3D; 3AB9D23F7A4B3CSS=jdd034BPKMDD2RHGRUQV5KRSOZKORJMNUXX4XMCMHWQPUJ6S6H4YZVJ2TU4GFI7OULL45RNG7SPUP5HVZB7KFZA45ZHCP7EAAAAM6FPOXQBIAAAAACBRVDGASAUXDJYX; __jda=143920055.17787647195151699949541.1778764720.1778842152.1778852393.5; __jdc=143920055; o2State=; is_avif=onAVIF; cn=1; cid=9; sdtoken=AAbEsBpEIOVjqTAKCQtvQu17xs-QYUVhO9B9L1Sm21jnK3bRBhT7_RoF8d6lmkW0xHIoJqK2nHvQAG3aOWDubGRZFVUKytnU3bxi6CEYZVvbei9mWduRJ94J7iLMO17bUF8fKKCqOHe2dLqH1VGgiq-qHVhGspAtOQj4BYpt; shshshfpb=BApXWfyLVKPtA4Io_U3-LKcZYPn5vk7tuBjo3FqsX9xJ1PdZfQq3asC7hmAD5CYxAXjWF06vnsaxgIblgv64M5Ip_Og3qp9tOxNc; 3AB9D23F7A4B3C9B=4BPKMDD2RHGRUQV5KRSOZKORJMNUXX4XMCMHWQPUJ6S6H4YZVJ2TU4GFI7OULL45RNG7SPUP5HVZB7KFZA45ZHCP7E; __jdb=143920055.12.17787647195151699949541|5.1778852393",
    head:watch(new HTMLHeadElement({
        childElementCount:78,
    },null,'fatdog'),"document.head"),
    body:watch(new HTMLBodyElement({
        childElementCount:23,
    },null,'fatdog'),"document.body"),

},null,'fatdog');
window = watch(window,"window");
window.document = watch(document,'document')


//生成逻辑
require('./js_code')

function get_h5st() {
    params = {
    "enc": "utf-8",
    "area": "52993_52994_146660_0",
    "page": 1,
    "mode": "",
    "concise": false,
    "hoverPictures": false,
    "newAdvRepeat": false,
    "mixerParam": false,
    "new_interval": true,
    "s": 1
}
    u = {
        appid: "search-pc-java",
        functionId: 'pc_search_searchWare',
        client: "pc",
        clientVersion: "1.0.0",
        t: new Date().getTime(),
        body: crypto.SHA256(JSON.stringify(params)).toString()
    };
    window.PSign = new window.ParamsSign({
            appId: 'f06cc',
            preRequest: false,
            onSign: (res) => {
              // 签名可用率监控，业务方自行上报
              if (res.code != 0) {
                try {
                  window.dra &&
                    window.dra.sendCustomEvent &&
                    window.dra.sendCustomEvent({
                      name: 'main_search',
                      metrics: {
                        error_code: '751',
                        error_type_txt: '接口加密失败onSign非0',
                      },
                      context: {
                        error_code: res.code,
                      },
                    })
                } catch (error) {
                  console.log(error)
                }
              }
            },
            onRequestTokenRemotely: (res) => {
              // 算法接口可用率监控，业务方自行上报
              if (res.code != 200) {
                try {
                  window.dra &&
                    window.dra.sendCustomEvent &&
                    window.dra.sendCustomEvent({
                      name: 'main_search',
                      metrics: {
                        error_code: '751',
                        error_type_txt: '接口加密失败onRequestTokenRemotely',
                      },
                      context: {
                        error_msg: res && res.message ? res.message : '接口加密失败',
                      },
                    })
                } catch (error) {
                  console.log(error)
                }
              }
            },
          })
    h5st = window.PSign._$sdnmd(u)
    return h5st

}

console.log(get_h5st())