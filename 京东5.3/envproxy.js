
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
Object.setPrototypeOf(window, Window.prototype);


