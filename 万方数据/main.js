function jt(e, t, r) {
    var o = t.getMethodDescriptor()
        , i = r + o.name;
    (r = new lt).H = e.c;
    var n = new Dt({
        T: r
    });
    if (n.l = o.b,
        ut(r.headers, t.getMetadata()),
        "text" == e.a ? (r.headers.set("Content-Type", "application/grpc-web-text"),
            r.headers.set("Accept", "application/grpc-web-text")) : r.headers.set("Content-Type", "application/grpc-web+proto"),
        r.headers.set("X-User-Agent", "grpc-web-javascript/0.1"),
        r.headers.set("X-Grpc-Web", "1"),
        dt(r.headers.b, "deadline")) {
        var s = r.headers.get("deadline");
        s = Math.round(s - (new Date).getTime());
        var a = r.headers;
        dt(a.b, "deadline") && (delete a.b.deadline,
            a.c--,
        a.a.length > 2 * a.c && ct(a)),
        1 / 0 === s && (s = 0),
        0 < s && r.headers.set("grpc-timeout", s + "m")
    }
    if (e.f) {
        ct(a = r.headers),
            s = {};
        for (var c = 0; c < a.a.length; c++) {
            var u = a.a[c];
            s[u] = a.b[u]
        }
        (a = r.headers).b = {},
            a.a.length = 0,
            a.c = 0;
        e: {
            for (d in s) {
                var d = !1;
                break e
            }
            d = !0
        }
        d || (s = function (e) {
            var t = "";
            return function (e, t) {
                for (var r in e)
                    t.call(void 0, e[r], r, e)
            }(e, (function (e, r) {
                    t += r,
                        t += ":",
                        t += e,
                        t += "\r\n"
                }
            )),
                t
        }(s),
            "string" == typeof i ? (d = encodeURIComponent("$httpHeaders"),
            (d += s = null != s ? "=" + encodeURIComponent(String(s)) : "") && (0 > (s = i.indexOf("#")) && (s = i.length),
                0 > (a = i.indexOf("?")) || a > s ? (a = s,
                    c = "") : c = i.substring(a + 1, s),
                s = (i = [i.substr(0, a), c, i.substr(s)])[1],
                i[1] = d ? s ? s + "&" + d : d : s,
                i = i[0] + (i[1] ? "?" + i[1] : "") + i[2])) : i.a("$httpHeaders", s))
    }
    for (o = (t = (0,
        o.a)(t.getRequestMessage())).length,
             d = [0, 0, 0, 0],
             s = new Uint8Array(5 + o),
             a = 3; 0 <= a; a--)
        d[a] = o % 256,
            o >>>= 8;
    if (s.set(new Uint8Array(d), 1),
        s.set(t, 5),
        t = s,
    "text" == e.a) {
        var p;
        for (e = t,
             void 0 === p && (p = 0),
                 Pt(),
                 p = Ct[p],
                 t = [],
                 o = 0; o < e.length; o += 3) {
            u = e[o];
            var l = (d = o + 1 < e.length) ? e[o + 1] : 0;
            a = u >> 2,
                u = (3 & u) << 4 | l >> 4,
                l = (15 & l) << 2 | (c = (s = o + 2 < e.length) ? e[o + 2] : 0) >> 6,
                c &= 63,
            s || (c = 64,
            d || (l = 64)),
                t.push(p[a], p[u], p[l] || "", p[c] || "")
        }
        t = t.join("")
    } else
        "binary" == e.a && (r.j = "arraybuffer");
    return bt(r, i, t),
        n
}