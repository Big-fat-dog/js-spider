//导入加密字符和解密文件
require('./env.js')
// require('./rs6encrypt.js')
// require('./rs6decrypt.js')
require('./first.js')
require('./second.js')
window.__meta_content = "{{meta_content}}";

debugger;


function get_cookie(){
    console.log(document.cookie)
    console.log(document.cookie.length)
    return document.cookie;
}
get_cookie()
console.log(navigator.toString())