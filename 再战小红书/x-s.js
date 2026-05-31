const crypto = require('crypto')
require('./env.js')
require('./vm.js')

// 包装 window.mnsv2 来修正版本号 (0201 -> 0301)
const originalMnsv2 = window.mnsv2
window.mnsv2 = function(u, m, w) {
    const result = originalMnsv2.call(this, u, m, w)
    if (result && typeof result === 'string' && result.startsWith('mns0201_')) {
        return 'mns0301_' + result.substring(8)
    }
    return result
}

// require('./vm.js')
Pu = function Pu(e) {
    // MD5，返回十六进制字符串
    return crypto.createHash('md5').update(e).digest('hex');
}
function tripletToBase64(e) {
    u=[
    "Z",
    "m",
    "s",
    "e",
    "r",
    "b",
    "B",
    "o",
    "H",
    "Q",
    "t",
    "N",
    "P",
    "+",
    "w",
    "O",
    "c",
    "z",
    "a",
    "/",
    "L",
    "p",
    "n",
    "g",
    "G",
    "8",
    "y",
    "J",
    "q",
    "4",
    "2",
    "K",
    "W",
    "Y",
    "j",
    "0",
    "D",
    "S",
    "f",
    "d",
    "i",
    "k",
    "x",
    "3",
    "V",
    "T",
    "1",
    "6",
    "I",
    "l",
    "U",
    "A",
    "F",
    "M",
    "9",
    "7",
    "h",
    "E",
    "C",
    "v",
    "u",
    "R",
    "X",
    "5"
]
            return u[e >> 18 & 63] + u[e >> 12 & 63] + u[e >> 6 & 63] + u[63 & e]
        }
function encodeChunk(e, a, s) {
            for (var u, m = [], w = a; w < s; w += 3)
                u = (e[w] << 16 & 0xff0000) + (e[w + 1] << 8 & 65280) + (255 & e[w + 2]),
                m.push(tripletToBase64(u));
            return m.join("")
        }
function b64Encode(e) {
            for (var a, s = e.length, m = s % 3, w = [], C = 16383, R = 0, P = s - m; R < P; R += C)
                w.push(encodeChunk(e, R, R + C > P ? P : R + C));
            return 1 === m ? (a = e[s - 1],
            w.push(u[a >> 2] + u[a << 4 & 63] + "==")) : 2 === m && (a = (e[s - 2] << 8) + e[s - 1],
            w.push(u[a >> 10] + u[a >> 4 & 63] + u[a << 2 & 63] + "=")),
            w.join("")
        }
function encodeUtf8(e) {
    for (var a = encodeURIComponent(e), s = [], u = 0; u < a.length; u++) {
        var m = a.charAt(u);
        if ("%" === m) {
            var w = parseInt(a.charAt(u + 1) + a.charAt(u + 2), 16);
            s.push(w),
                u += 2
        } else
            s.push(m.charCodeAt(0))
    }
    return s
}
function seccore_signv2(e, a) {
            var s = window.toString
              , u = e;
             u += JSON.stringify(a)
            var m = (0,
            Pu)([u].join(""))
              , w = (0,
            Pu)(e)
              , C = window.mnsv2(u, m, w)
              , P = {
                x0: '4.3.5',
                x1: "xhs-pc-web",
                x2: 'Windows',
                x3: C,
                x4: 'object'
            };
            return "XYS_" + (0,
            b64Encode)((0,
            encodeUtf8)(JSON.stringify(P)))
        }
q='/api/sns/web/v1/homefeed'
w={
    "cursor_score": "1.780106062973002E9",
    "num": 16,
    "refresh_type": 3,
    "note_index": 26,
    "unread_begin_note_id": "",
    "unread_end_note_id": "",
    "unread_note_count": 0,
    "category": "homefeed_recommend",
    "search_key": "",
    "need_num": 6,
    "image_formats": [
        "jpg",
        "webp",
        "avif"
    ],
    "need_filter_image": false
}
console.log(seccore_signv2(q,w))
