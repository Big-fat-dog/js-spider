!(() => {
    const origin_log = console.log;
    logToConsole = function (){
        return origin_log(...arguments)
    }
})();
//环境代理
function watch(obj, name) {
    const loggedOperations = new Set();

    const truncateValue = (value) => {
        const str = String(value);
        return str.length > 20 ? str.substring(0, 20) + '...' : str;
    };

    return new Proxy(obj, {
        get: function (target, property, receiver) {
            const value = target[property];
            const type = typeof value;

            let operationId;
            let logMessage;
            const displayValue = truncateValue(value);

            if (type === "symbol") {
                const symbolDescription = property.description || 'no description';
                logMessage = `对象=>${name},读取属性:${symbolDescription},这是一个 Symbol 类型的值`;
                operationId = `get:${name}:symbol:${symbolDescription}`;
            } else if (type === "function") {
                const functionName = value.name || 'anonymous';
                const displayFunctionName = truncateValue(functionName);
                logMessage = `对象=>${name},读取属性:${property.toString()},这是一个名为 ${displayFunctionName} 的函数`;
                operationId = `get:${name}:function:${property.toString()}:${functionName}`;
            } else {
                logMessage = `对象=>${name},读取属性:${String(property)},值为:${displayValue},类型为:${type}`;
                operationId = `get:${name}:${String(property)}:${type}:${String(value)}`;
            }

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            // 关键修复：如果是函数，用 bind 绑定正确的 this
            // 或者直接返回 value，让 receiver 自动处理 this
            if (type === "function") {
                // 方式1: 使用 bind 绑定到 target
                return value.bind(target);

                // 方式2: 使用 Reflect.get 获取，保持 receiver 上下文（更推荐）
                // return Reflect.get(target, property, receiver);
            }

            return value;
        },
        set: (target, property, newValue, receiver) => {
            const valueType = typeof newValue;

            let operationId;
            let logMessage;
            const displayNewValue = truncateValue(newValue);

            if (valueType === "symbol") {
                const symbolDescription = newValue.description || 'no description';
                logMessage = `对象=>${name},设置属性:${String(property)},这是一个 Symbol 类型的新值, 描述为: ${symbolDescription}`;
                operationId = `set:${name}:${String(property)}:symbol:${symbolDescription}`;
            } else {
                logMessage = `对象=>${name},设置属性:${String(property)},值为:${displayNewValue},类型为:${valueType}`;
                operationId = `set:${name}:${String(property)}:${valueType}:${String(newValue)}`;
            }

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            // 使用 Reflect.set 保持正确的 receiver
            return Reflect.set(target, property, newValue, receiver);
        },
        has: (target, property) => {
            let operationId;
            let logMessage;

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
        ownKeys: (target) => {
            const keys = Reflect.ownKeys(target);
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
        // 拦截 Object.isExtensible()
        isExtensible: (target) => {
            const result = Reflect.isExtensible(target);
            const operationId = `isExtensible:${name}:${result}`;
            const logMessage = `[扩展] ${name}.isExtensible() = ${result}`;

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return result;
        },
        // 拦截 Object.preventExtensions()
        preventExtensions: (target) => {
            const operationId = `preventExtensions:${name}`;
            const logMessage = `[扩展] ${name}.preventExtensions()`;

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return Reflect.preventExtensions(target);
        },
        // 拦截 Object.getOwnPropertyDescriptor
        getOwnPropertyDescriptor: (target, property) => {
            const desc = Reflect.getOwnPropertyDescriptor(target, property);
            const descStr = desc ? `configurable=${desc.configurable}, enumerable=${desc.enumerable}` : 'undefined';
            const operationId = `getOwnPropertyDescriptor:${name}:${String(property)}:${descStr}`;
            const logMessage = `[描述符] ${name}[${String(property)}] = {${descStr}}`;

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return desc;
        },
        // 拦截 delete
        deleteProperty: (target, property) => {
            const operationId = `delete:${name}:${String(property)}`;
            const logMessage = `[删除] delete ${name}.${String(property)}`;

            if (!loggedOperations.has(operationId)) {
                loggedOperations.add(operationId);
                logToConsole(logMessage);
            }

            return Reflect.deleteProperty(target, property);
        }
    });
}

//安全函数
const safeFunction = (function () {
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

        Object.defineProperty(this, Symbol.toStringTag, {
            value: constructorName,
            writable: false,
            enumerable: false,
            configurable: false
        });

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

    Object.defineProperty(constructorFunction, 'name', {value: constructorName});

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

    Object.defineProperty(constructorFunction, Symbol.toStringTag, {
        value: constructorName,
        writable: false,
        enumerable: false,
        configurable: false
    });

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

    Object.keys(prototypeMethods).forEach(methodName => {
        constructorFunction.prototype[methodName] = prototypeMethods[methodName];
        if (typeof constructorFunction.prototype[methodName] === "function") {
            safeFunction(constructorFunction.prototype[methodName]);
        }
    });

    safeFunction(constructorFunction);

    window[constructorName] = constructorFunction;
    return constructorFunction;
}

window = globalThis;
createConstructor('EventTarget', true, [], {});
createConstructor('Node', true, [], {}, 'EventTarget');
createConstructor('WindowProperties', true, [], {}, 'EventTarget')
createConstructor('Window', true, [], {}, 'WindowProperties');
Object.setPrototypeOf(window, Window.prototype);
