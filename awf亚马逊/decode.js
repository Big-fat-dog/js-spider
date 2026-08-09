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
let jsCode = fs.readFileSync("D:\\yuanrenxue\\胖狗实战\\awf亚马逊\\challenge.js", { encoding: "utf-8" });
// 将javascript代码转换为ast树(json结构)
let ast = parser.parse(jsCode);


//函数返回数组直接赋值
//内存中保留大数组
var myarray;
visitor1 = {
    FunctionDeclaration: function(path){
        if(path.node.id.name&&path.node.id.name==="a0_0x1fd3"){
            //获取大数组对象
            var array = path.get("body").get("body")[0].get("declarations")[0].get("init");
            // console.log(array.toString());
            myarray = array;
            // path.remove();
        }
    }
}


//  =========== 阶段二: 解密函数还原 ============
//首先先将函数替换为大数组
//收集各处a0_0x4f2e解密函数的复制，将其存储起来,怎么还不发工资。
var clone_obj = [];
visitor2 = {
    VariableDeclarator: function(path){
        if(path.node.id.name&&path.node.id.name==="_0x10a541"&&path.node.init.type==="CallExpression"&&path.node.init.callee.name==="a0_0x1fd3"){
            path.get('init').replaceWith(myarray);
            // console.log("path.toString() = ",path.toString());
            console.log("[INFO] 反混淆成功，已将函数调用替换为大数组");
        }
        if(path.node.init&&path.node.init.type==='Identifier'&&path.node.init.name==="a0_0x4f2e"){
            // console.log(path.node.id.name);
            clone_obj.push(path.node.id.name);
            // path.remove();

        }
    }
}



//解密函数注入内存，调用解密函数还原
function a0_0x4f2e(_0x1fd311, _0x4f2ef3) {
  var _0x10a541 = ["x19ZChjLywq", "x19ZChjLywrbCNjHEq", "x19HC3LUy1zHBhvLCW", "ChjVDg90ExbL", "igLZig5VDcbHignVBNn0CNvJDg9Yig9Yig51BgW", "AgfZt3DUuhjVCgvYDhK", "Aw5KzxHpzG", "zNvUy3rPB24", "Bwv0ywrHDge", "DgHYB3C", "yxbWBhK", "ChvZAa", "y2fSBa", "zg9Uzq", "BgvUz3rO", "C2XPy2u", "yxn5BMnjDgvYyxrVCG", "zgvMyxvSDa", "DMfSDwu", "y29SBgvJDerHDge", "y3jJvgfIBgu", "yNv0Dg9U", "D2HPy2G", "z2v0", "zwXLBwvUDa", "zw5KrxzLBNq", "Dg9tDhjPBMC", "CMfUzg9T", "y3nZvgv4Da", "x3fZyq", "Dg91y2HLBMq", "A2v5q3LJBgvZ", "AM9PBG", "BgvMDa", "y29WAwvZ", "A2v5uhjLC3nuAw1Lsw50zxj2ywXZ", "Bw91C2vdEwnSzxm", "x19LC01VzhvSzq", "Dg90ywXgB2n1C1rPBwu", "y3jJq2fSy3vSyxrVCG", "y2fSy3vSyxrL", "y29SBgvJDg9Yrg9JDw1LBNq", "AgvPz2H0", "ChjLzMLSBgvK", "x19Nzw5LCMf0B3i", "Bg9NAwnHBfHeueK", "DxnLCKfNzw50", "DgvSzw1LDhj5", "y29SBgvJDa", "yxGTCgX1z2LU", "vKjFu0nssvbu", "y29UDgfPBMvY", "uMvHBfbSyxLLCI5szwfSugXHEwvYkhrTksbby3rPDMvyienVBNrYB2WGkdmYlwjPDcK", "EZq0qKjbodqWlundnteTmtfdrI1bquzbltaWqueWmei2mde1q30", "EZiYrdzgmZeYluiWrJyTmtfemc05nefcltaWodbdnZrdn0u5nx0", "yxmTCgX1z2LU", "EZq0qKjbodqYlundnteTmtfdrI1bquzbltaWqueWmei2mde1qN0", "z2v0q29TCg9Uzw50vMvYC2LVBG", "yMLUzev2zw50q3LJBgvuzwXLBwv0CNK", "u0nst0Xmx0vwru5u", "C2fTCgXLuMf0zu1PBgXPC2vJB25KCW", "DgHYB3r0BgvY", "zxzLBNrZ", "C3rHCNrfDMvUDfrPBwu", "C3rHCNq", "CgfNzvG", "Bw91C2v1Ca", "tu9vu0vFrvzftLq", "A2v5zg93BG", "A2v5Dxa", "CgfYC2u", "ANnVBKz3y2LT", "zwXbBwf6B25eyxrH", "zw5JB2rLv2L0AfbVBhLMAwXS", "q1jdx0Ptt05Fu0vqqvjbve9s", "zw5JB2rL", "y3j5ChrV", "zgvYAxzLqML0CW", "D3jHCeTLEq", "x19LEhrLBMrZ", "CMvWBgfJzq", "x19HD2fPDgvY", "BgLZDerVy3vTzw50rgf0yq", "suzsqu1f", "A2v5", "DgLTzq", "DgfU", "z2vUzxjHDgvjzgvUDgLMAwvY", "u1rpuKfhrv9lrvK", "DMfSAwrHDgvjzgvUDgLMAwvY", "surmrv9qsu5hx0vwru5ux1rzueu", "y3jLyxrLrwXLBwvUDa", "z3b1", "v0vcr0XFzgvIDwDFCMvUzgvYzxjFAw5MBW", "z2v0u3vWCg9YDgvKrxH0zw5ZAw9UCW", "y2fUDMfZ", "CgfZC3DVCMq", "Aw5WDxrBDhLWzt0IDgv4DcjD", "DgvSzw1LDhj5q29SBgvJDg9YCW", "tw9VBejVCMfU", "u2HVD2nHCMqGr290AgLJ", "sg9IBYbtDgq", "qwrVyMuGr2fYyw1VBMqGuhjViejVBgq", "vgLTzxmGtMv3ifjVBwfUiejHBhrPyW", "rgvJB3i", "qwrVyMuGq2fZBg9UifbYBYbcB2XK", "s296DwTHieDVDgHPyYbqCM8GqG", "u3DPCZCYmsbfEcbcva", "qwXNzxjPyw4", "tw9KzxjU", "qNj1C2GGu2nYAxb0ifn0za", "u2LTsgvP", "qxjUBYbqCM8Gu21Izcbdyxb0Aw9U", "u21HBgWGrM9UDhm", "q2fSAxn0BYbnva", "q291CMLLCIbozxC", "tNLHBge", "sMfZBwLUzvvqqW", "uM9Tyw5u", "qMLJA2HHBsbty3jPChqGvhDV", "q29YyMvS", "zM9UDa", "rNjHBMTsDwvOBa", "qxjUBYbqCM8Gu21IzcbeAxnWBgf5", "v1aGtxvSDgLUyxrPB25HBeiGsgvSDMu", "v1nux1nWyw4", "u2vNB2uGuhjPBNq", "sgfYCMLUz3rVBG", "s296DwTHie1PBMnOBYbqCM8GruW", "rwXLCgHHBNq", "q29WCgvYCgXHDguGr290AgLJiejVBgq", "rwr3yxjKAwfUifnJCMLWDcbjvem", "twLJCM9ZB2z0ifbOywDZuge", "qxjPywWGq1Ls", "vhjHzgL0Aw9UywWGqxjHyMLJ", "q2fSAwjYAq", "tgvLBgf3ywrLzq", "vMvYzgfUyq", "qxjUBYbqCM8Gu21Iza", "twLJCM9ZB2z0iePOzw5NsgvPifvj", "qwrVyMuGtMfZA2GGtwvKAxvT", "r290AgLJsq", "t0nsieeGrxH0zw5Kzwq", "u2vNB2uGvuK", "u3DPCZCYmsbcBgTfEcbcva", "sgfYBg93ifnVBgLKieL0ywXPyW", "vgLTzxmGtMv3ifjVBwfUien5CG", "D2LUzg93CW", "C2nYzwvUsw5MB0nVBgXLy3rVCG", "B3bHy2L0Eq", "A2H0BwW", "y29SBgvJDg9YtMfTzq", "q1ntx1bst1bfuLrjrvm", "C3vWCg9YDgvK", "z2vVBg9JyxrPB24", "tM90ief2ywLSywjSzq", "z2XVyMfSq29TCg9ZAxrLt3bLCMf0Aw9U", "Bw92zvrV", "zgLMzMvYzw5Jzq", "yxjJ", "EwvZ", "y2fSBfbOyw50B20", "x3bOyw50B20", "jgnKy19HC2rQzMXHC3v0B3bMAhzJwKXTy2zSxW", "v0vcrfjjvKvsx05bvKLhqvrpuL9quK9qrvjusuvt", "B3nJAwXSyxrVCG", "x19LEhbVCNrtDgfY", "sw52ywXPzenOyxjHy3rLCKvYCM9Y", "qujdrevgr0HjsKTmtu5puffsu1rvvLDywvPHyMnKzwzNAgLQA2XTBM9WCxjZDhv2D3H5EJaXmJm0nty3odKRlW", "vgHLihn0CMLUzYb0BYbIzsbLBMnVzgvKignVBNrHAw5ZignOyxjHy3rLCNmGB3v0C2LKzsbVzIb0AguGtgf0Aw4XihjHBMDLlG", "zxHWB3j0CW", "sgv4rw5JB2rLCG", "vvrgoevUy29Kzxi", "DhjPz2DLCKnHBgXIywnR", "A2v5ChjLC3m", "AwrSzunHBgXIywnRu3rHCNq", "B2jMDxnJyxrLsNnVBKv4zwn1Dgu", "zg9JDw1LBNq", "C2HVDwXKt2jMDxnJyxrL", "CgfNzuLK", "l2fWlW", "yNvPBgrrDwvYEq", "CgfYyw1LDgvYCW", "Cgf0Ag5HBwu", "u2nYAxb0q29SBgvJDg9Y", "rM9YBuLUChv0vgvSzw1LDhj5q29SBgvJDg9Y", "qwn0AxzLu2v0DxbqBhvNAw5dB2XSzwn0B3i", "qwn0AxzLwfbSDwDPBKnVBgXLy3rVCG", "qMf0DgvYEunVBgXLy3rVCG", "rwXLBwvUDfrLBgvTzxrYEunVBgXLy3rVCG", "tg9JywXtDg9YywDLvujjrenVBgXLy3rVCG", "qKXpq0TFu0LArq", "AgfZAej1zMzLCG", "yNvMzMvY", "C3rHDgu", "DgvTCa", "s0vz", "Cg93", "B3v0zxi", "uMf3u2HHmJu2", "DxbKyxrL", "zxjYB3i", "AgfZAa", "zNjVBq", "y2HHCKnVzgvbDa", "BwfW", "ywvZ", "y3jLyxrLrw5JCNLWDgLVBKnPCgHLCG", "sw52ywXPzcbRzxKGCgfYyw1LDgvYlG", "BMfTzq", "Bw9Kzxm", "y2zI", "quvtlunuuG", "Bw9Kzq", "y2HHCKf0", "ywXNB3jPDgHTCW", "C3rYAw5N", "z2v0qwXNB3jPDgHT", "y2LWAgvY", "ywXNB3jPDgHT", "Aw5PDgLHBgL6zq", "Chv0qNvMzMvY", "x29W", "x2LUChv0", "yMXVy2TtAxPL", "Dw5Wywq", "Chv0qNL0zq", "x2LUDhm", "zwnI", "z2v0sw50mZi", "x2L2", "x2LUqMXVy2S", "y2jJ", "x3bHCNrPywXcExrLCW", "z2v0qNL0zxm", "x3bHCNrPywXpDxrWDxq", "Chv0sw50mZi", "CMvHza", "Chv0qNL0zxm", "y3jLyxrLqNvMzMvY", "x3rHz0XLBMD0Aa", "x3rHzW", "x2HHC2HtDwjRzxK", "x291DejSB2nR", "x2nPCgHLCKXLBMD0Aa", "BxvSDgLWBhK", "DxrPBa", "zgf0yq", "zNjVBunOyxjdB2rL", "B2jQzwn0", "x2nVBNn0CNvJDgvKu3rYAw5NtgvUz3rO", "BMv4DfrPy2S", "Cg9ZDe1LC3nHz2u", "DMvYC2LVBNm", "AxnoB2rLANm", "Dw5KzwzPBMvK", "qNL0zvn0CMLUz0j1zMzLCG", "z2v0sw50mJq", "z2v0sw50", "D3jPDgvpzMzZzxq", "yNL0zuXLBMD0Aa", "yNL0zu9MzNnLDa", "C2v0", "D3jPDgu", "Agv4", "DxrMmty", "rgf0yuj1zMzLCG", "C2v0sw50oa", "z2v0sw50oa", "z2v0sw50mJrmzq", "z2v0sw50mZjmzq", "z2v0vwLUDdG", "yMLUyxj5", "CMf3", "zw5JB2rLvxrMoa", "zw5JB2rLnJq", "zgvJB2rL", "Dgv4Da", "CNzHBa", "BwvZC2fNzq", "rMXHC2GGBg9JywWGC3rVCMfNzsbUB3qGyxzHAwXHyMXLlG", "y2XLyxjjDgvTCW", "BgfZDeLUzgv4", "C3vIC3rY", "yNL0zxngCM9Tsva", "yNL0zxnuB0Lq", "yNL0zxnuB0LqDJq", "y29Yzxm", "ywrKrxzLBNrmAxn0zw5LCG", "CMvKDwnL", "zgTmzw4", "C2nYExb0oIbPBNzHBgLKihi", "BMv4Da", "BgfIzwW", "AgfZ", "yxr0zw1WDgvKihrVihnLDcbWCML2yxrLigzPzwXKig9Uig5VBI1PBNn0yw5Jzq", "Dg9tDhjPBMDuywC", "Ag9ZDg5HBwu", "ChvIBgLJu3vMzML4", "Axnjy2fUBG", "B3jN", "z292", "C2vJCMv0", "D0Pys2G", "quvtluDdtsbLBMnYExb0Aw9UigzHAwXLza", "ug9SEwzPBgWGB25SEsbZDxbWB3j0CYaICMf3iIbRzxKGzM9YBwf0", "DxnHz2vZ", "qujMBwK", "r1bWEwe", "mtKZmdC2n0ruuMLZEG", "zgLNzxn0", "wNrvtuW", "u2HHmJu2", "C2HPzNq", "C3vIDgXL", "B25SB2fK", "mtaXma", "CMvHzefZrgf0yvvsta", "mteXmq", "C2vUDa", "ndC3mdG4C3ryAwDL", "mdeWmq", "C2HHmKG9", "B3bZ", "mdaWma", "y2HHBgXLBMDLx3r5Cgu", "Bwf0y2G", "CMv0DxjU", "C2v0sxrLBq", "C2nYAxb0CW", "DM91y2HLCKfUzfvWzgf0zvrVA2vU", "DKrLC2G", "Bg9JywXtDg9YywDL", "yw16BI1JAgfSBgvUz2uTzxjYB3i", "yM9KEq", "Dg9mB3DLCKnHC2u", "u2P5rwO", "u0fnrvnjvevFt1zfuLjjreu", "Bwv0Ag9K", "DgHLBG", "Dg9Rzw4", "yxDZlxDHzI10B2TLBJ07zxHWAxjLCZ1uAhuSidaXiePHBIaXotCWidaWoJaWoJaXieDnva", "zgvMAw5LuhjVCgvYDhK", "y2fSBeLUChv0CW", "AgfZAgnHC2HtAgeY", "y29Uy2f0", "DMvYAwz5", "Aw5JBhvKzxm", "C29SDxrPB24", "Bg9JyxrPB24", "C3rYAw5NAwz5", "AxnqCML2yxrL", "z2v0sxrLBq", "Bwf0zxjPywW", "mJCZrNPQs0vV", "wM9LEq", "t3vTEuG", "DfHhsxu", "muTywvjADG", "BhvRyvC", "mtq3mte2nxDTq0D1DW", "rNaY", "m3zSruPUvW", "twf0Aa", "oda3nde0mhvszM91CG", "u2LNBMfSqwnXDwLZAxrPB25uAw1L", "rg50", "Dg9vChbLCKnHC2u", "tM9Uzq", "q29VA2LLrMv0y2HuAw1L", "vgvSzw1LDhj5rw5JCNLWDgLVBLrPBwu", "u3vIDgXL", "z2v0uMfUzg9TvMfSDwvZ", "Cg9W", "r2vUzxjHDg9YigLZigfSCMvHzhKGzxHLy3v0Aw5NlG", "nZG3mtzUCNzQvuK", "mtGXnJq3mhH4sKvXua", "uufgzLi", "zM9YBwrLDgvJDg9Y", "mtaXoty5neXqCwHmtG", "B1PjB3y", "q2XHC3mGzxH0zw5KCYb2ywX1zsa", "l2fZC2v0CY9WCM9TChqUANm", "n2vdvLPTAa", "y3jLyxrL", "ChjVDMLKzq", "qLjWEw4", "zw5JB2rLzdOG", "mZC3mdG1r0nusMTe", "nMy3mwe1mtjImwuWmZvLywfIntnKogjLnZmXmJbKm2zInJHHmgnHmZq2yJK1nJbHywiZztvJzgy3ntnKnwu5oa", "y291BNq", "qNffu20", "x19Yzxn0", "BgDpBKC", "ChjVCgvYDhLjC0vUDw1LCMfIBgu", "y29SBgvJDg9Y", "AwD0z1u", "Dw5PBxbSzw1LBNrLzce", "CwP6B0W", "s2n0sfe", "odC4ntj1AKLKEeK", "s1L1yui", "y29SBgvJDg9YCW", "vwfVB0W", "uuvNEeu", "mtbXEvnUsgG", "sejIr2e", "zxzLBNrdEwnSzxm", "yMLUza", "z2v0rxzLBNrZq2XLyxjLzenVDw50", "mJy0oty5u3znzK93", "wwvVwhK", "y2XLyxjpBKz1BgXcDwzMzxi", "Dg9W", "x19WCM90B19F", "AxnbCNjHEq", "mtq2nJa2nJrLz25euMC", "y2HLy2TZDw0", "x19HC3nPz24", "rxzLBNrmAxn0zw5LCG", "C29YDa", "D2LKDgG", "otCYnMH3rhPzqG", "ndiXndaWrwPXz2Tf", "Eg10sha", "C1zpCvO", "yMLUzfDHzKLUChv0vgvSzw1LDhj5", "zxjYB3jZ", "rhHQuuy", "z2v0twv0CMLJCW", "DfzLCNnPB24", "mtCYmJK2te9ut0Hz", "zM9YBxm", "qMfZzty0rw5JB2rLCG", "Aw5PDgLHBgL6yxrPB25fCNjVCNm", "y29SBgvJDefUzevUy3j5Chq", "Bwv0CMLJCW", "s0DHtei", "Dhj5CW", "C2nOzwr1Bgu", "tKLRshC", "AxrLCMf0B3i", "mtuZm21svwD2BG", "uuflq0e", "yxDZlxDHzI10B2TLBG", "vwDhsge", "CenNqLO", "DxbKyxrLq2HHBgXLBMDLqxr0zw1WDhm/ihrPBwvtAw5JzuXHC3rbDhrLBxb0igLUig1PBgXPCZOG", "Aw5WDxq", "u1fYqNa", "BNvTyMvY", "ywTgCMu", "Aw50zxjHy3rPDMu", "DxbKyxrLq2HHBgXLBMDLqxr0zw1WDhm/ihjLC2v0DgLUzYbHDhrLBxb0ignVDw50", "BMv4Df9PBNrLCNzHBa", "sNvuBNa", "D1Hus0O", "DwDSBw8", "yxDZD2fMx3nLC3nPB25FC3rVCMfNzq", "BwvTB3j5", "twLSBgLZzwnVBMrZ", "CMvZCg9UC2u", "Bg9N", "CMvMzxjYzxi", "z2v0rwXLBwvUDhncEvrHz05HBwu", "AvnuEeO", "qNjVD3nLCG", "wwPsBfm", "BwfYz2LU", "y2f0y2G"];
  return a0_0x4f2e = function (_0x281aca, _0x54c844) {
    _0x281aca = _0x281aca - 0x0;
    var _0x431b65 = _0x10a541[_0x281aca];
    if (a0_0x4f2e["KdqSXu"] === undefined) {
      var _0x46ebf5 = function (_0x181235) {
        var _0x3ad368 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
        var _0x3bc291 = "",
          _0x22b1b9 = "";
        for (var _0x128ae3 = 0x0, _0x439bde, _0x369531, _0x5e93eb = 0x0; _0x369531 = _0x181235["charAt"](_0x5e93eb++); ~_0x369531 && (_0x439bde = _0x128ae3 % 0x4 ? _0x439bde * 0x40 + _0x369531 : _0x369531, _0x128ae3++ % 0x4) ? _0x3bc291 += String["fromCharCode"](0xff & _0x439bde >> (-0x2 * _0x128ae3 & 0x6)) : 0x0) {
          _0x369531 = _0x3ad368["indexOf"](_0x369531);
        }
        for (var _0x55db0a = 0x0, _0x5b9ebd = _0x3bc291["length"]; _0x55db0a < _0x5b9ebd; _0x55db0a++) {
          _0x22b1b9 += "%" + ("00" + _0x3bc291["charCodeAt"](_0x55db0a)["toString"](0x10))["slice"](-0x2);
        }
        return decodeURIComponent(_0x22b1b9);
      };
      a0_0x4f2e["dXfeOZ"] = _0x46ebf5, _0x1fd311 = arguments, a0_0x4f2e["KdqSXu"] = !![];
    }
    var _0x27ed0d = _0x10a541[0x0],
      _0x2a57b9 = _0x281aca + _0x27ed0d,
      _0x27ae64 = _0x1fd311[_0x2a57b9];
    return !_0x27ae64 ? (_0x431b65 = a0_0x4f2e["dXfeOZ"](_0x431b65), _0x1fd311[_0x2a57b9] = _0x431b65) : _0x431b65 = _0x27ae64, _0x431b65;
  }, a0_0x4f2e(_0x1fd311, _0x4f2ef3);
}
visitor3 = {
    CallExpression:{
        exit:function(path){
            // 1. 必须是一个简单标识符调用，且有一个参数
            let callee = path.node.callee;
            if (path.node.arguments.length !== 1) return;
            let name = callee.name;
            // 2. 判断是否在 clone_obj 里
            if (clone_obj.includes(name)) {
                let firstArg = path.node.arguments[0];
                // 3. 参数必须是数字
                if (!types.isNumericLiteral(firstArg)) return;
                
                let index = firstArg.value;
                
                let realValue = a0_0x4f2e(index);
                
                if (typeof realValue === 'string') {
                    console.log(`✅ [替换成功] ${name}(${index}) -> "${realValue}"`);
                    path.replaceWith(types.stringLiteral(realValue));
                } else {
                    console.log(`[警告] 解密失败或未找到索引: ${name}(${index})`);
                }
            }
        }
    }
}


//解密函数还没还原完毕，obj_clone又被套了一层特娘的
// 用于存储新发现的深度别名
let deep_clone_obj = [];
visitor4 = {
    VariableDeclarator:function(path) {
        // 1. 获取左边的变量名（被赋值者）
        let id = path.node.id;
        // 2. 获取右边的初始值
        let init = path.node.init;

        // 必须左右两边都是纯变量标识符
        if (!types.isIdentifier(id) || !types.isIdentifier(init)) return;

        let leftName = id.name;
        let rightName = init.name;

        // 3. 核心判断：右边是不是属于 clone_obj 或者 deep_clone_obj 里的值
        if (clone_obj.includes(rightName) || deep_clone_obj.includes(rightName)) {
            // 如果左边还没被记录过，记录下来
            if (!clone_obj.includes(leftName) && !deep_clone_obj.includes(leftName)) {
                deep_clone_obj.push(leftName);
                // path.remove();
                // console.log(`[深度收集] 发现新别名: ${leftName} = ${rightName}`);
            }
        }
    }
}

visitor5 = {
    CallExpression:{
        exit:function(path){
            // 1. 必须是一个简单标识符调用，且有一个参数
            let callee = path.node.callee;
            if (path.node.arguments.length !== 1) return;
            let name = callee.name;
            // 2. 判断是否在 clone_obj 里
            if (deep_clone_obj.includes(name)) {
                let firstArg = path.node.arguments[0];
                // 3. 参数必须是数字
                if (!types.isNumericLiteral(firstArg)) return;
                
                let index = firstArg.value;
                
                let realValue = a0_0x4f2e(index);
                
                if (typeof realValue === 'string') {
                    console.log(`✅ [替换成功] ${name}(${index}) -> "${realValue}"`);
                    path.replaceWith(types.stringLiteral(realValue));
                } else {
                    console.log(`[警告] 解密失败或未找到索引: ${name}(${index})`);
                }
            }
        }
    }
}



//擦！还有解密函数！chovy！

!function (_0x5034ed, _0x303bee) {
      for (var _0x473800 = _0x2a8f0f, _0x3f86b0 = _0x5034ed();;) try {
        if (849990 === -parseInt(_0x473800(217)) / 1 + -parseInt(_0x473800(209)) / 2 * (parseInt(_0x473800(186)) / 3) + -parseInt(_0x473800(204)) / 4 + -parseInt(_0x473800(225)) / 5 + -parseInt(_0x473800(248)) / 6 * (parseInt(_0x473800(241)) / 7) + -parseInt(_0x473800(235)) / 8 + parseInt(_0x473800(210)) / 9) break;
        _0x3f86b0["push"](_0x3f86b0["shift"]());
      } catch (_0x30f7be) {
        _0x3f86b0["push"](_0x3f86b0["shift"]());
      }
    }(_0xff7950);

//内存中保留大数组
function _0xff7950() {
      var _0x3bea22 = ["cipher", "secret", "wJXKh", "extractable", "ATOdP", "object", "kuokS", "finish", "3051328XpVJBN", "type", "update", "oyxWr", "digest", "2PfhSFj", "47894562ZxDQUj", "string", "util", "function", "encoding", "algorithm", "importKey", "434853gsIWGO", "AES-GCM encryption failed", "output", "Polyfill\x20only\x20supports\x20SHA-256\x20digest", "getBytes", "MxINB", "resolve", "subtle", "3205360vQSHSB", "utf-8", "Polyfill only supports \"raw\" key format", "createBuffer", "usages", "FoVne", "tagLength", "bfMKk", "TextEncoder", "charCodeAt", "7296160GjjwtF", "mode", "Polyfill\x20only\x20supports\x20AES-GCM\x20encryption", "DFuuh", "sAgav", "FobNI", "3770417SYmlab", "name", "ABfmi", "hlAJG", "sPjVJ", "encode", "ldBNC", "12GQJYdN", "iXPHl", "zZiwu", "AES-GCM", "_rawBytes", "ZtUML", "GPpya", "OBghC", "AOtkQ", "buffer", "abheE", "encrypt", "fQaoe", "tag", "prototype", "fromCharCode", "wZjsn", "reject", "msCrypto", "1930767DTRisz", "Secure\x20random\x20number\x20generation\x20is\x20not\x20supported\x20by\x20this\x20browser", "crypto", "length", "toUpperCase", "getRandomValues", "SPPkJ", "Polyfill\x20only\x20supports\x20AES-GCM\x20algorithm", "createCipher", "RSERo"];
      return (_0xff7950 = function () {
        return _0x3bea22;
      })();
    }
function _0x2a8f0f(_0x335e20, _0x545aa3) {
      //标记解密1
      var _0x3fbb4a = _0xff7950();
      return (_0x2a8f0f = function (_0x223f62, _0x2dd906) {
        return _0x3fbb4a[_0x223f62 -= 180];
      })(_0x335e20, _0x545aa3);
    }
//获取洗牌之后的大数组
var bigarray=_0xff7950();
//删掉返回数组的函数
visitor6 = {
    FunctionDeclaration: function(path){
        if(path.node.id.name&&path.node.id.name==="_0xff7950"){
            // console.log("找到返回大数组的函数，删除",path.toString());
            // path.remove();
        }
        else if(path.node.id.name&&path.node.id.name==="_0x2a8f0f"){
            // console.log("找到调用大数组，删除",path.toString());
            // path.remove();
        }
    }
}
//删掉自执行洗牌函数
visitor7 = {
    UnaryExpression(path) {
        // 检查运算符是不是 "!"
        if (path.node.operator !== "!") return;

        // 取 argument，也就是后面的 CallExpression
        let callExpr = path.node.argument;
        if (!callExpr || callExpr.type !== "CallExpression") return;

        // 检查参数列表第一个是不是 _0xff7950
        let args = callExpr.arguments;
        if (args.length === 1 && 
            args[0].type === "Identifier" && 
            args[0].name === "_0xff7950") {
            
            // console.log("✅ 找到自执行洗牌函数，准备删除:", path.toString());
            // path.remove(); // 直接删除整个 !function(...) 节点
        }
    }
};


var new_clone_obj = [];
visitor8 = {
    VariableDeclarator: function(path){
        if(path.node.init&&path.node.init.type==='Identifier'&&path.node.init.name==="_0x2a8f0f"){
            // console.log(path.node.id.name);
            new_clone_obj.push(path.node.id.name);
            console.log(path.toString());
            // path.remove();
        }
    }
}


visitor9 = {
    CallExpression:{
        exit:function(path){
            // 1. 必须是一个简单标识符调用，且有一个参数
            let callee = path.node.callee;
            if (path.node.arguments.length !== 1) return;
            let name = callee.name;
            // 2. 判断是否在 clone_obj 里
            if (new_clone_obj.includes(name)) {
                let firstArg = path.node.arguments[0];
                // 3. 参数必须是数字
                if (!types.isNumericLiteral(firstArg)) return;
                
                let index = firstArg.value;
                
                let realValue = bigarray[index-180];//牛逼，坑死老子了！
                
                if (typeof realValue === 'string') {
                    console.log(`✅ [替换成功] ${name}(${index}) -> "${realValue}"`);
                    path.replaceWith(types.stringLiteral(realValue));
                } else {
                    console.log(`[警告] 解密失败或未找到索引: ${name}(${index})`);
                }
            }
        }
    }
}

//  =========== 阶段三: 死代码剔除 ============
// ================== 1. 十六进制数字还原 ==================
visitor110 = {
    NumericLiteral(path) {
        // 如果这个数字是以 0x 开头的，替换成普通的十进制
        if (path.node.extra && path.node.extra.raw.startsWith('0x')) {
            path.replaceWith(types.numericLiteral(path.node.value));
        }
    }
};


traverse(ast,visitor1)

traverse(ast,visitor2);

traverse(ast,visitor3);

traverse(ast,visitor4);

traverse(ast,visitor5);

// traverse(ast,visitor6);


// traverse(ast,visitor7);

// traverse(ast,visitor8);

// traverse(ast,visitor9);

traverse(ast,visitor110);

// 生成反混淆后的代码
let { code } = generator(ast);

// 保存代码
fs.writeFileSync('D:\\yuanrenxue\\胖狗实战\\awf亚马逊\\output.js', code);
console.log("[INFO] 代码已保存到 output.js");