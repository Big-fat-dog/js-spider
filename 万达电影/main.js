const CryptoJS = require('crypto-js')
c = {
    "clientKey": "B3AA12B0145E1982F282BEDD8A3305B89A9811280C0B8CC3A6A60D81022E4903",
    "saleSubjectCode": "Wanda",
    "cCode": "1_3",
    "mxAPIVer": "v1.0.0",
    "method": "GET",
    "appId": "3"
}

c.setPostData = function (t) {
    var e = [];
    for (var i in t)
        "POST" === this.method ? "object" == typeof t[i] ? e.push(this.flatParamObjectValue(i, t[i])) : e.push(i + "=" + this.urlEncodeUnicode(t[i])) : e.push(i + "=" + encodeURIComponent(t[i]));
    return e.join("&")
}
c.generateSignature = function (t, e, i) {
    var n = "";
    return n += this.saleSubjectCode,
        n += this.cCode,
        n += this.clientKey,
        n += t,
        "POST" === this.method ? (n += e,
            n += i) : (n += e,
        i && (n += "?",
            n += i)),
        CryptoJS.MD5(n).toString()
}

function get_headers(t, e, i) {
    var n = {
        ver: "v1.0.0",
        sCode: 'Wanda',
        _mi_: "",
        width: 1280,
        json: !0,
        cCode: '1_3',
        check: i,
        ts: e,
        heigth: 720,
        appId: "3"
    };
    return JSON.stringify(n)
}

A = (new Date).getTime()
t = {
    data: {
        tt: (new Date).getTime()
    }
}
function get_sign(){
    p = c.setPostData(t.data)
    d = c.generateSignature(A, t.path, p)
    return d;
}
// p = c.setPostData(t.data)
// d = c.generateSignature(A, t.path, p)
t = '';
console.log(get_headers(t, A, get_sign()))