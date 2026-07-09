// ============================================================
// newdecode.js - VM反混淆工具
// 版本: v2.0 (修复版)
// 作者: 胖狗逆向
// ============================================================
// 【重要修复记录】
// 1. [CRITICAL] 第589行: updateExpression的prefix参数错误
//    原始: types.updateExpression('--', types.identifier('p'), true)
//    修复: types.updateExpression('--', types.identifier('p'), false)
//    影响: default分支取栈顶元素错误，导致VM状态混乱，SDK检测异常
// 2. [CRITICAL] 第619行: updateExpression的prefix参数错误
//    原始: types.updateExpression('++', types.identifier('a'), true)
//    修复: types.updateExpression('++', types.identifier('a'), false)
//    影响: 获取操作码时索引偏移错误
// ============================================================

// ============ 模块导入 ============
// fs模块 用于操作文件的读写
const fs = require("fs");
// @babel/parser 用于将JavaScript代码转换为ast树
const parser = require("@babel/parser");
// @babel/traverse 用于遍历各个节点的函数
const traverse = require("@babel/traverse").default;
// @babel/types 节点的类型判断及构造等操作
const types = require("@babel/types");
// @babel/generator 将处理完毕的AST转换成JavaScript源代码
const generator = require("@babel/generator").default;

// ============ 全局变量 ============
// 用于存储所有操作码映射 { opcode: code_node }
let stream = {};

// ============ 阶段一: 读取原始代码 ============
// 读取原始bdm.js文件（不含日志代码）
let jsCode = fs.readFileSync("vmp.js", { encoding: "utf-8" });
// 将javascript代码转换为ast树(json结构)
let ast = parser.parse(jsCode);

// ============================================================
// 阶段二: 三元表达式转换
// 目标: 将嵌套的三元表达式转换为等价的if-else语句
// ============================================================

/**
 * 将三元表达式转换为if-else语句
 * @param {Object} path - AST节点路径
 * @returns {Object} if-else语句节点
 */
function fix_condition(path) {
    const test = path.node.expression.test;
    const consequent = path.node.expression.consequent;
    const alternate = path.node.expression.alternate;

    // 将表达式分支包装成语句(if的括号内是语句statement而不是expression）
    const toStatement = (node) => {
        if (types.isStatement(node)) return node;
        return types.expressionStatement(node);
    };

    const consequentStmt = toStatement(consequent);
    const alternateStmt = alternate ? toStatement(alternate) : null;

    return types.ifStatement(test, consequentStmt, alternateStmt);
}

/**
 * Visitor1: 处理三元表达式
 * 遍历ExpressionStatement，将三元表达式转换为if-else语句
 */
const visitor1 = {
    ExpressionStatement: {
        exit: function (path) {
            // 只处理函数 d 内部的表达式
            const pa = path.findParent(
                p => p.isFunctionDeclaration() && p.node.id.name === 'd'
            );
            if (!pa) return;

            const expr = path.node.expression;

            // ===== 情况1：独立三元表达式 =====
            // 形式: condition ? expr1 : expr2;
            if (types.isConditionalExpression(expr)) {
                console.log("[替换独立三元表达式]", path.toString());
                const ifStmt = fix_condition(path);
                path.replaceWith(ifStmt);
                return;
            }

            // ===== 情况2：赋值语句中的三元表达式 =====
            // 形式: v[p] = condition ? expr1 : expr2;
            if (types.isAssignmentExpression(expr) && types.isConditionalExpression(expr.right)) {
                console.log("[替换赋值语句中的三元表达式]", path.toString());

                const test = expr.right.test;
                const consequent = expr.right.consequent;
                const alternate = expr.right.alternate;
                const left = expr.left;
                const operator = expr.operator;

                // 将三元表达式转换为if-else语句
                const trueStmt = types.expressionStatement(
                    types.assignmentExpression(operator, left, consequent)
                );
                const falseStmt = types.expressionStatement(
                    types.assignmentExpression(operator, left, alternate)
                );

                const ifStmt = types.ifStatement(test, trueStmt, falseStmt);
                path.replaceWith(ifStmt);
            }
        }
    }
};

// ============================================================
// 阶段三: 区间夹逼算法
// 目标: 通过分析嵌套if-else的条件，推断每个操作码对应的代码块
// 核心思想: 利用条件区间的交集逐步缩小范围，最终确定单个操作码
// ============================================================

/**
 * 计算两个区间的交集
 * @param {Object} r1 - 区间1 {min, max}
 * @param {Object} r2 - 区间2 {min, max}
 * @returns {Object} 交集区间
 */
function intersect(r1, r2) {
    return { min: Math.max(r1.min, r2.min), max: Math.min(r1.max, r2.max) };
}

/**
 * 判断区间是否恰好包含一个整数（即操作码已确定）
 * 左闭右开区间 [min, max)，当 max - min === 1 时，恰好包含 min 这个整数
 * @param {Object} range - 区间 {min, max}
 * @returns {boolean} 是否为单整数区间
 */
function isSingleInt(range) {
    return range.max - range.min === 1;
}

/**
 * 存储操作码映射
 * 只有当区间恰好包含一个整数时才存储
 * @param {Object} range - 区间 {min, max}
 * @param {Object} node - 代码节点
 */
function storeOpcode(range, node) {
    if (isSingleInt(range)) {
        const op = range.min;
        if (!stream[op]) {
            stream[op] = node;
        } else {
            // 如果已经有代码，检查是否需要合并（去重逻辑）
            if (types.isBlockStatement(stream[op])) {
                // 如果已有代码是BlockStatement，检查是否重复
                const nodeStr = generator(node).code;
                const exists = stream[op].body.some(existing =>
                    generator(existing).code === nodeStr
                );
                if (!exists) {
                    stream[op].body.push(node);
                }
            } else {
                // 如果已有代码是单个语句，检查是否重复
                const existingStr = generator(stream[op]).code;
                const nodeStr = generator(node).code;
                if (existingStr !== nodeStr) {
                    stream[op] = types.blockStatement([stream[op], node]);
                }
            }
        }
    }
}

/**
 * 解析条件表达式获取区间（核心函数）
 * 将条件表达式转换为左闭右开区间表示
 *
 * 区间表示法说明（左闭右开）:
 * - t < 6     → [-∞, 6)     → t 可以是: 0, 1, 2, 3, 4, 5
 * - t <= 6    → [-∞, 7)     → t 可以是: 0, 1, 2, 3, 4, 5, 6
 * - t > 6     → [7, +∞)     → t 可以是: 7, 8, 9, ...
 * - t >= 6    → [6, +∞)     → t 可以是: 6, 7, 8, ...
 * - t === 6   → [6, 7)      → t 只能是: 6
 * - t !== 6   → 返回假区间 [6, 7)，真区间需要通过计算得到
 *
 * @param {Object} testPath - 条件表达式路径
 * @returns {Object|null} 区间对象 {min, max} 或 null
 */
function parseRange(testPath) {
    if (!testPath || testPath.type !== 'BinaryExpression') return null;

    const left = testPath.get('left');
    const right = testPath.get('right');
    const op = testPath.get('operator').node;

    // 处理 t < num 或 t > num 或 t <= num 或 t >= num
    if (left.type === 'Identifier' && left.node.name === 't') {
        if (right.type === 'NumericLiteral') {
            const num = right.node.value;
            switch (op) {
                case '<':
                    // t < num → [-∞, num)
                    return { min: -Infinity, max: num };
                case '<=':
                    // t <= num → [-∞, num + 1)
                    return { min: -Infinity, max: num + 1 };
                case '>':
                    // t > num → [num + 1, +∞)
                    return { min: num + 1, max: Infinity };
                case '>=':
                    // t >= num → [num, +∞)
                    return { min: num, max: Infinity };
                case '===':
                case '==':
                    // t === num → [num, num + 1)
                    return { min: num, max: num + 1 };
                case '!==':
                case '!=':
                    // !== 和 != 的假区间是 t == num，和 === 一样
                    // 真区间需要在调用处通过计算得到
                    return { min: num, max: num + 1 };
            }
        }
    } else if (right.type === 'Identifier' && right.node.name === 't') {
        // 处理 num < t 或 num > t 等反向条件
        if (left.type === 'NumericLiteral') {
            const num = left.node.value;
            switch (op) {
                case '<':
                    // num < t → [num + 1, +∞)
                    return { min: num + 1, max: Infinity };
                case '<=':
                    // num <= t → [num, +∞)
                    return { min: num, max: Infinity };
                case '>':
                    // num > t → [-∞, num)
                    return { min: -Infinity, max: num };
                case '>=':
                    // num >= t → [-∞, num + 1)
                    return { min: -Infinity, max: num + 1 };
                case '===':
                case '==':
                    // num === t → [num, num + 1)
                    return { min: num, max: num + 1 };
                case '!==':
                case '!=':
                    return { min: num, max: num + 1 };
            }
        }
    }
    return null;
}

/**
 * 区间夹逼函数（递归核心）
 * 递归分析if-else链来推断操作码
 * @param {Object} path - IfStatement节点路径
 * @param {Object} currentRange - 当前区间 {min, max}
 */
function squeezeRange(path, currentRange) {
    const testPath = path.get('test');
    const range = parseRange(testPath);

    if (!range) return;

    // 对于 !== 操作符，parseRange返回的是假区间，需要特殊处理
    const testOp = testPath.get('operator').node;
    const isNotEqual = testOp === '!==' || testOp === '!=';

    // 计算当前分支的实际区间
    let branchRange;
    if (isNotEqual) {
        // !== 的真分支区间是当前区间减去假区间
        // 由于storeOpcode只处理单整数区间，这里简化处理
        branchRange = { min: currentRange.min, max: range.min };
    } else {
        branchRange = intersect(currentRange, range);
    }

    // ===== 处理 consequent 分支（条件为真）=====
    const consequent = path.get('consequent');
    if (consequent.isBlockStatement()) {
        const body = consequent.get('body');

        // ===== 特殊模式检测：BlockStatement中的隐式else分支 =====
        // 模式: { if (t === x) { ... } else_code; }
        // else_code 只在 t !== x 时执行，但由于外层已有区间限制，可能是单个操作码
        if (body.length === 2 && body[0].isIfStatement() && !body[0].node.alternate) {
            const ifStmt = body[0];
            const elseStmt = body[1];

            const ifTestPath = ifStmt.get('test');
            const ifRange = parseRange(ifTestPath);

            if (ifRange && (ifTestPath.get('operator').node === '===' || ifTestPath.get('operator').node === '!==')) {
                const op = ifTestPath.get('operator').node;

                if (op === '===') {
                    // === 条件：else区间是 [min, num) 和 [num+1, max)
                    const elseRange1 = { min: branchRange.min, max: ifRange.min };
                    const elseRange2 = { min: ifRange.max, max: branchRange.max };

                    if (elseStmt.isExpressionStatement()) {
                        handleNestedConditional(elseStmt, elseRange1);
                        handleNestedConditional(elseStmt, elseRange2);
                    }
                    storeOpcode(intersect(branchRange, elseRange1), elseStmt.node);
                    storeOpcode(intersect(branchRange, elseRange2), elseStmt.node);
                    // 递归处理内部if语句
                    squeezeRange(ifStmt, branchRange);
                } else if (op === '!==') {
                    // !== 条件：else区间就是精确值（当条件为假时执行）
                    // 这是操作码75的关键捕获逻辑
                    const elseRange = { min: ifRange.min, max: ifRange.max };

                    if (elseStmt.isExpressionStatement()) {
                        handleNestedConditional(elseStmt, elseRange);
                    }
                    // 存储隐式else分支（操作码75）
                    storeOpcode(intersect(branchRange, elseRange), elseStmt.node);
                    // 注意：不要递归处理if语句，因为它的consequent属于真区间
                }
            } else {
                // 其他情况，直接存储
                if (elseStmt.isExpressionStatement()) {
                    handleNestedConditional(elseStmt, branchRange);
                }
                storeOpcode(branchRange, elseStmt.node);
            }
        } else {
            // ===== 正常处理：遍历所有语句 =====
            body.forEach(stmtPath => {
                if (stmtPath.isIfStatement()) {
                    // 递归处理嵌套的if语句
                    squeezeRange(stmtPath, branchRange);
                } else if (stmtPath.isExpressionStatement()) {
                    // 先尝试处理嵌套三元表达式
                    handleNestedConditional(stmtPath, branchRange);
                    // 如果不是三元表达式，存储操作码
                    storeOpcode(branchRange, stmtPath.node);
                } else if (stmtPath.isVariableDeclaration()) {
                    storeOpcode(branchRange, stmtPath.node);
                } else if (stmtPath.isReturnStatement()) {
                    storeOpcode(branchRange, stmtPath.node);
                } else if (stmtPath.isForStatement() || stmtPath.isWhileStatement() || stmtPath.isDoWhileStatement()) {
                    // 循环语句也存储
                    storeOpcode(branchRange, stmtPath.node);
                } else {
                    storeOpcode(branchRange, stmtPath.node);
                }
            });
        }
    } else if (consequent.isIfStatement()) {
        // 如果 consequent 是 if 语句（没有花括号），递归处理
        squeezeRange(consequent, branchRange);
    } else if (consequent.isExpressionStatement()) {
        // 单个表达式语句，先尝试处理嵌套三元表达式
        handleNestedConditional(consequent, branchRange);
        storeOpcode(branchRange, consequent.node);
    } else if (consequent.isReturnStatement()) {
        storeOpcode(branchRange, consequent.node);
    } else {
        storeOpcode(branchRange, consequent.node);
    }

    // ===== 处理 alternate 分支（条件为假）=====
    const alternate = path.get('alternate');
    if (alternate.node) {
        // 计算else分支的区间（当前区间减去真分支区间）
        let elseRangeRaw;
        const testOp = testPath.get('operator').node;

        if (testOp === '<') {
            // t < num 的假分支是 t >= num → [num, +∞)
            elseRangeRaw = { min: range.max, max: Infinity };
        } else if (testOp === '<=') {
            // t <= num 的假分支是 t > num → [num + 1, +∞)
            elseRangeRaw = { min: range.max, max: Infinity };
        } else if (testOp === '>' || testOp === '>=') {
            // t > num 或 t >= num 的假分支是 t <= num 或 t < num
            elseRangeRaw = { min: -Infinity, max: range.min };
        } else if (testOp === '===' || testOp === '==') {
            // === 的假分支是当前区间去掉精确值
            elseRangeRaw = { min: currentRange.min, max: currentRange.max };
        } else if (testOp === '!==' || testOp === '!=') {
            // !== 的假分支是精确值
            elseRangeRaw = { min: range.min, max: range.max };
        }

        // 取交集，得到实际的else分支区间
        const elseRange = intersect(currentRange, elseRangeRaw);

        if (alternate.isIfStatement()) {
            // 递归处理 else if
            squeezeRange(alternate, elseRange);
        } else if (alternate.isBlockStatement()) {
            // else 代码块
            const elseBody = alternate.get('body');

            // 检测 "if (num !== t)" 后跟其他语句的模式
            let implicitElseRange = null;

            elseBody.forEach((stmtPath, index) => {
                if (stmtPath.isIfStatement()) {
                    const test = stmtPath.get('test');
                    if (test.type === 'BinaryExpression' && test.get('operator').node === '!==') {
                        const left = test.get('left');
                        const right = test.get('right');
                        let num = null;

                        if (left.type === 'NumericLiteral') {
                            num = left.node.value;
                        } else if (right.type === 'NumericLiteral') {
                            num = right.node.value;
                        }

                        if (num !== null) {
                            // 设置隐式else区间：t == num
                            implicitElseRange = { min: num, max: num + 1 };
                        }
                    }

                    squeezeRange(stmtPath, elseRange);
                } else if (stmtPath.isExpressionStatement()) {
                    // 如果前面有 "if (num !== t)"，则使用隐式else区间
                    const rangeToUse = implicitElseRange || elseRange;

                    handleNestedConditional(stmtPath, rangeToUse);
                    storeOpcode(rangeToUse, stmtPath.node);
                } else if (stmtPath.isForStatement() || stmtPath.isWhileStatement() || stmtPath.isDoWhileStatement()) {
                    const rangeToUse = implicitElseRange || elseRange;
                    storeOpcode(rangeToUse, stmtPath.node);
                } else {
                    const rangeToUse = implicitElseRange || elseRange;
                    storeOpcode(rangeToUse, stmtPath.node);
                }
            });
        } else if (alternate.isExpressionStatement()) {
            handleNestedConditional(alternate, elseRange);
            storeOpcode(elseRange, alternate.node);
        } else {
            storeOpcode(elseRange, alternate.node);
        }
    }
}

// ============================================================
// 阶段四: 嵌套三元表达式处理
// 目标: 处理赋值语句中的三元表达式，如 v[p] = 36 === t ? +v[p] : ~v[p]
// ============================================================

/**
 * 处理嵌套三元表达式（赋值语句右侧）
 * @param {Object} path - ExpressionStatement路径
 * @param {Object} currentRange - 当前区间
 */
function handleNestedConditional(path, currentRange) {
    if (!path.isExpressionStatement()) return;

    const expr = path.node.expression;
    if (!types.isAssignmentExpression(expr)) return;

    // 检查右侧是否是三元表达式
    const right = expr.right;
    if (!types.isConditionalExpression(right)) return;

    console.log("[发现嵌套三元表达式]", path.toString());

    // 解析三元表达式的条件
    const test = right.test;
    const consequent = right.consequent;
    const alternate = right.alternate;
    const left = expr.left;

    if (types.isBinaryExpression(test)) {
        const op = test.operator;
        let num;

        // 提取数字
        if (types.isNumericLiteral(test.left)) {
            num = test.left.value;
        } else if (types.isNumericLiteral(test.right)) {
            num = test.right.value;
        } else {
            return;
        }

        // 计算区间
        if (op === '===') {
            // 真分支区间：精确匹配num
            const trueRange = { min: num, max: num + 1 };

            // 假分支区间：当前区间去掉num
            const falseRange1 = { min: currentRange.min, max: num };
            const falseRange2 = { min: num + 1, max: currentRange.max };

            // 存储操作码
            const trueCode = types.expressionStatement(
                types.assignmentExpression(expr.operator, left, consequent)
            );
            const falseCode = types.expressionStatement(
                types.assignmentExpression(expr.operator, left, alternate)
            );

            // 存储真分支（操作码num）
            storeOpcode(intersect(currentRange, trueRange), trueCode);

            // 存储假分支（可能包含多个操作码）
            storeOpcode(intersect(currentRange, falseRange1), falseCode);
            storeOpcode(intersect(currentRange, falseRange2), falseCode);
        }
    }
}

// ============================================================
// 阶段五: 恒等式操作码收集
// 目标: 直接收集 t === num 和 t === num + 1 的操作码
// ============================================================

/**
 * 收集恒等式条件的操作码
 * 处理 t === num 形式的条件，同时收集其 else 分支（通常是 t === num + 1）
 * @param {Object} path - IfStatement路径
 */
function get_identity(path) {
    const testPath = path.get('test');
    if (testPath && testPath.type === 'BinaryExpression') {
        const left = testPath.get('left');
        const right = testPath.get('right');
        const op = testPath.get('operator').node;

        if (op === "===") {
            let opr;
            if (left.isNumericLiteral()) {
                opr = left.node.value;
            } else if (right.isNumericLiteral()) {
                opr = right.node.value;
            } else {
                return; // 两边都不是数字，跳过
            }

            // 收集 === 对应的操作码
            const code = path.node.consequent;
            stream[opr] = code;

            // 收集 else 分支（通常对应 t === opr + 1）
            if (path.node.alternate) {
                const op_next = opr + 1;
                const newcode = path.node.alternate;
                stream[op_next] = newcode;
            }
        }
    }
}

// ============================================================
// 阶段六: 区间夹逼入口
// ============================================================

/**
 * 区间夹逼入口函数
 * 只处理函数 d 内部的最外层if语句
 * @param {Object} path - IfStatement路径
 */
function processRangeSqueeze(path) {
    // 只处理函数 d 内部的 if 语句
    const pa = path.findParent(
        p => p.isFunctionDeclaration() && p.node.id.name === 'd'
    );
    if (!pa) return;

    // 检查是否是最外层的if语句
    // 最外层的if语句的父节点应该是BlockStatement（函数体）
    const parent = path.parentPath;
    if (!parent.isBlockStatement()) {
        // 如果父节点不是BlockStatement，说明是嵌套的if语句
        // 这些应该由squeezeRange递归处理
        return;
    }

    const testPath = path.get('test');
    const range = parseRange(testPath);

    if (range) {
        // 从当前if语句开始进行区间夹逼
        // 使用完整区间 [-∞, +∞) 作为初始currentRange
        const fullRange = { min: -Infinity, max: Infinity };
        squeezeRange(path, fullRange);
    }
}

/**
 * Visitor2: 处理if-else语句
 * 收集操作码映射
 */
const visitor2 = {
    IfStatement: function (path) {
        const pa = path.findParent(
            p => p.isFunctionDeclaration() && p.node.id.name === 'd'
        );
        if (!pa) return;

        // 收集恒等式操作码
        get_identity(path);

        // 区间夹逼收集
        processRangeSqueeze(path);
    }
};

// ============================================================
// 执行阶段: 遍历AST收集操作码
// ============================================================

// 第一次遍历：转换三元表达式为if-else
traverse(ast, visitor1);

// 第二次遍历：收集操作码映射
traverse(ast, visitor2);

// 输出收集结果
console.log("收集到的操作码数量:", Object.keys(stream).length);
console.log("操作码列表:", Object.keys(stream).sort((a, b) => a - b));

// ============================================================
// 阶段七: 生成switch-case结构（关键！）
// ============================================================

// 使用traverse来找到函数d
let functionDPath = null;
traverse(ast, {
    FunctionDeclaration: {
        enter(path) {
            if (path.node.id && path.node.id.name === 'd') {
                functionDPath = path;
                path.stop();
            }
        }
    }
});

if (functionDPath) {
    console.log("[INFO] 找到函数d，开始生成switch-case结构");

    const functionD = functionDPath.node;

    // 找到for循环（无限循环 for(;;)）
    let forStatement = null;
    functionD.body.body.forEach(node => {
        if (types.isForStatement(node) && node.test === null) {
            forStatement = node;
        }
    });

    if (forStatement) {
        console.log("[INFO] 找到for循环，开始构建switch-case");

        // 按操作码排序
        const sortedOpcodes = Object.keys(stream).sort((a, b) => parseInt(a) - parseInt(b));

        // 构建case子句
        const switchCases = sortedOpcodes.map(opcode => {
            const code = stream[opcode];
            let statements = [];

            if (types.isStatement(code)) {
                statements = [code];
            } else if (types.isBlockStatement(code)) {
                statements = code.body;
            } else if (types.isExpressionStatement(code)) {
                statements = [code];
            }

            // 确保每个case都有break或return
            if (statements.length > 0) {
                const lastStmt = statements[statements.length - 1];
                if (!types.isBreakStatement(lastStmt) && !types.isReturnStatement(lastStmt)) {
                    statements.push(types.breakStatement());
                }
            }

            return types.switchCase(types.numericLiteral(parseInt(opcode)), statements);
        });

        // ===== 添加default分支（关键修复点！）=====
        // 原始代码: if (75 !== t) return ((f = 2), void (l = v[p--]));
        //
        // 【BUG修复记录】
        // 错误代码（旧版）:
        //   types.updateExpression('--', types.identifier('p'), true)
        //   → 生成: v[--p]（前缀递减，先减后用）
        //
        // 正确代码（修复版）:
        //   types.updateExpression('--', types.identifier('p'), false)
        //   → 生成: v[p--]（后缀递减，先用后减）
        //
        // Babel API说明:
        //   types.updateExpression(operator, argument, prefix)
        //   - prefix=true  → 前缀运算符: ++a, --a
        //   - prefix=false → 后缀运算符: a++, a--
        //
        // 影响: 如果使用前缀递减，会取到错误的栈元素，导致VM状态混乱
        //       SDK检测到异常行为后会回退到stable版本
        switchCases.push(
            types.switchCase(
                null, // default
                [
                    types.returnStatement(
                        types.sequenceExpression([
                            types.assignmentExpression(
                                '=',
                                types.identifier('f'),
                                types.numericLiteral(2)
                            ),
                            types.assignmentExpression(
                                '=',
                                types.identifier('l'),
                                types.memberExpression(
                                    types.identifier('v'),
                                    // ⚠️ 关键修复：prefix=false 表示后缀递减 p--
                                    types.updateExpression('--', types.identifier('p'), false),
                                    true
                                )
                            )
                        ])
                    )
                ]
            )
        );

        // 构建switch语句
        const switchStmt = types.switchStatement(
            types.identifier('t'),
            switchCases
        );

        // ===== 构建for循环包裹switch（保持原始结构）=====
        // 【BUG修复记录】
        // 错误代码（旧版）:
        //   types.updateExpression('++', types.identifier('a'), true)
        //   → 生成: var t = o[++a]（前缀递增）
        //
        // 正确代码（修复版）:
        //   types.updateExpression('++', types.identifier('a'), false)
        //   → 生成: var t = o[a++]（后缀递增）
        const forStatementNew = types.forStatement(
            null,     // init
            null,     // test (for(;;) 没有条件)
            null,     // update (for(;;) 没有更新)
            types.blockStatement([
                // 保留获取操作码的代码: var t = o[a++]
                // ⚠️ 关键修复：prefix=false 表示后缀++
                types.variableDeclaration('var', [
                    types.variableDeclarator(
                        types.identifier('t'),
                        types.memberExpression(
                            types.identifier('o'),
                            types.updateExpression('++', types.identifier('a'), false),
                            true
                        )
                    )
                ]),
                switchStmt
            ])
        );

        // 找到for循环的索引并替换
        const forIndex = functionD.body.body.indexOf(forStatement);
        if (forIndex !== -1) {
            functionD.body.body[forIndex] = forStatementNew;
            console.log("[INFO] Switch-case结构生成成功，共", sortedOpcodes.length, "个操作码");
        } else {
            console.log("[WARN] 未找到for循环索引");
        }
    } else {
        console.log("[WARN] 未找到for循环");
    }
} else {
    console.log("[ERROR] 未找到函数d");
}

// ============================================================
// 阶段八: 生成代码并保存
// ============================================================

// 生成反混淆后的代码
let { code } = generator(ast);

// 保存代码
fs.writeFile('aioutput.js', code, (err) => {
    if (err) throw err;
    console.log("[INFO] 代码已保存到 output.js");
});