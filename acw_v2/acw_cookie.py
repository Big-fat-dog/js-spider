
import io
import json
import re
import sys
import time

from curl_cffi import requests as cffi_requests
from iv8 import JSContext

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36")

HEADERS = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': 'https://www.xianjichina.com/',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
}

RE_RENDER = re.compile(r'<textarea id="renderData"[^>]*>(.*?)</textarea>', re.S)
RE_WAF = re.compile(r'<script name="aliyunwaf_[^"]*">(.*?)</script>', re.S)
RE_PRE = re.compile(r'<script>(.*?)</script>', re.S)


def is_challenge(html):
    """挑战页特征: renderData + aliyunwaf 脚本"""
    return ('<textarea id="renderData"' in html) and ('aliyunwaf_' in html)


def extract_challenge(html):
    m1 = RE_RENDER.search(html)
    m2 = RE_WAF.search(html)
    m3 = RE_PRE.search(html)
    if not (m1 and m2 and m3):
        return None
    try:
        rd = json.loads(m1.group(1))
        arg1 = rd['l1'].split("'")[1]
    except Exception:
        return None
    return {
        'render_json': m1.group(1),
        'pre_script': m3.group(1),
        'waf_script': m2.group(1),
        'arg1': arg1,
    }


def compute_cookie(challenge, ua=UA):
    """iv8 执行挑战脚本, 返回 acw_sc__v2 值"""
    ctx = JSContext(environment={
        'location': {'href': 'https://www.xianjichina.com/', 'host': 'www.xianjichina.com'},
        'navigator': {'userAgent': ua, 'language': 'zh-CN'},
    })
    ctx.eval("(function(){var el=document.createElement('textarea');"
             "el.id='renderData';el.innerHTML=%s;"
             "(document.body||document.documentElement).appendChild(el);})();"
             % json.dumps(challenge['render_json']))
    ctx.eval(challenge['pre_script'])
    ctx.eval(challenge['waf_script'])
    m = re.search(r'acw_sc__v2=([^;]+)', ctx.eval('document.cookie') or '')
    return m.group(1) if m else None


def get_session_and_cookie(url='https://www.xianjichina.com/', max_rounds=8, timeout=25):
    """
    返回 (session, cookie)。
      - session 已持有 acw_sc__v2, 可直接继续请求目标站;
      - cookie 为 None 表示这次请求本来就没被挑战(无需 cookie)。
    内部最多循环 max_rounds 次, 每次请求都带超时, 不会卡死。
    """
    session = cffi_requests.Session(impersonate='chrome')
    for _ in range(max_rounds):
        r = session.get(url, headers=HEADERS, timeout=timeout)
        if not is_challenge(r.text):
            return session, None
        ch = extract_challenge(r.text)
        if not ch:
            raise RuntimeError('挑战页解析失败, 请检查页面结构')
        cookie = compute_cookie(ch)
        if not cookie:
            raise RuntimeError('iv8 计算 cookie 失败')
        session.cookies.set('acw_sc__v2', cookie,
                            domain='www.xianjichina.com', path='/')
        r2 = session.get(url, headers=HEADERS, timeout=timeout)
        if not is_challenge(r2.text):
            return session, cookie
        # 重试仍被挑战: 服务器重新签发了挑战(新的 acw_tc/arg1), 用新挑战重算
    raise RuntimeError('连续 %d 轮仍被挑战' % max_rounds)


if __name__ == '__main__':
    t0 = time.time()
    s, cookie = get_session_and_cookie()
    print('cookie =', cookie)
    if cookie:
        print('挑战通过, 耗时 %.1fs' % (time.time() - t0))
    else:
        print('本次请求未被挑战, 直接通过')
    r = s.get('https://www.xianjichina.com/special/information/page_2.html',
              headers=HEADERS, timeout=25)
    m = re.search(r'<title>(.*?)</title>', r.text, re.S)
    print('列表页 status=%d len=%d title=%s' % (
        r.status_code, len(r.text), m.group(1).strip()[:40] if m else '?'))
