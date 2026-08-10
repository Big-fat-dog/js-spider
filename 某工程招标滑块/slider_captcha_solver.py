# -*- coding: utf-8 -*-
"""
txzbgl.miit.gov.cn 
协议（由既有采集脚本 + 实测还原）:
  1. POST /zbtb/captcha/slideCaptcha
     body: {canvasWidth:320, canvasHeight:155, blockWidth:'65', blockHeight:'55', blockRadius:10}
     resp: data.nonceStr / data.canvasSrc(AES-ECB加密, key=nonceStr) / data.blockSrc / data.blockY
  2. 用 nonceStr 作 AES-ECB key 解密 canvasSrc -> "data:image/png;base64,..." 底图
  3. ddddocr slider 模型识别缺口 x 坐标
  4. code_x AES-ECB 加密(nonceStr) 后作为 code 字段提交业务接口, token=nonceStr
     业务接口返回 code==0 且含 page.list => 验证通过

用法: python slider_captcha_solver.py            (默认: 求解+业务接口回验)
      python slider_captcha_solver.py --solve     (只求解打印坐标, 不提交业务接口)
"""
import argparse
import base64
import json
import os
import sys
import time
import uuid

import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

BASE = "https://txzbgl.miit.gov.cn"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36")
HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json;charset=UTF-8',
    'Pragma': 'no-cache',
    'Referer': BASE + '/',
    'User-Agent': UA,
}
CAPTCHA_BODY = {
    'canvasWidth': 320,
    'canvasHeight': 155,
    'blockWidth': '65',
    'blockHeight': '55',
    'blockRadius': 10,
}
DEBUG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'debug')


def aes_ecb_encrypt(plaintext: str, key: str) -> str:
    key_bytes = key.encode('utf-8')
    if len(key_bytes) not in (16, 24, 32):
        key_bytes = key_bytes.ljust(16, b'\0')
    cipher = AES.new(key_bytes, AES.MODE_ECB)
    return base64.b64encode(cipher.encrypt(pad(plaintext.encode('utf-8'), AES.block_size))).decode()


def aes_ecb_decrypt(ciphertext_b64: str, key: str) -> bytes:
    key_bytes = key.encode('utf-8')
    if len(key_bytes) not in (16, 24, 32):
        key_bytes = key_bytes.ljust(16, b'\0')
    raw = AES.new(key_bytes, AES.MODE_ECB).decrypt(base64.b64decode(ciphertext_b64))
    try:
        raw = unpad(raw, AES.block_size)
    except ValueError:
        pass
    return raw


def strip_dataurl(s: str) -> str:
    return s.split(',', 1)[1] if ',' in s else s


def get_captcha(session: requests.Session) -> dict:
    """拉取一张滑块验证码, 返回解密后的底图/拼图块字节与 nonce。"""
    r = session.post(BASE + '/zbtb/captcha/slideCaptcha', headers=HEADERS, json=CAPTCHA_BODY, timeout=30)
    r.raise_for_status()
    data = r.json().get('data') or {}
    nonce = data.get('nonceStr')
    if not nonce or not data.get('canvasSrc') or not data.get('blockSrc'):
        raise RuntimeError('slideCaptcha 响应缺少字段: %s' % list(data.keys()))
    raw = aes_ecb_decrypt(strip_dataurl(data['canvasSrc']), nonce)
    if raw.startswith(b'data:'):
        b64 = raw.decode('utf-8').split(',', 1)[1]
        b64 += '=' * (-len(b64) % 4)
        canvas_png = base64.b64decode(b64)
    else:
        canvas_png = raw
    block_png = base64.b64decode(strip_dataurl(data['blockSrc']))
    return {
        'nonce': nonce,
        'canvas_png': canvas_png,
        'block_png': block_png,
        'block_y': data.get('blockY'),
    }


# ddddocr slide_match 返回的是滑块中心 x(缺口左缘+32, 块宽65)。
# 服务端期望的是缺口左缘 x, 校准得 center-29 对齐左缘(参考脚本 matchTemplate 左上角+3)。
DELTA_CANDIDATES = [-29, -32, -30, -28, -33]


def detect_gap(ocr, canvas_png: bytes, block_png: bytes) -> tuple:
    """ddddocr slider 缺口识别, 返回 (中心x, 置信度)。"""
    res = ocr.slide_match(block_png, canvas_png)
    return float(res['target_x']), float(res.get('confidence', 0.0))


def build_biz_body(code_x: int, nonce: str) -> dict:
    ciphertext = aes_ecb_encrypt(str(code_x), nonce)
    return {
        'resource': '',
        'page': 1,
        'limit': 15,
        'totalSize': 0,
        'bulletinTitle': '',
        'issueDate': '',
        'status': '11',
        'bulletinType': '21',
        'unitRestrict': [],
        'supervisorName': [],
        'nationFlag': None,
        'bidType': None,
        'bidSubtype': None,
        'fileBuyBeginTime': '',
        'fileBuyEndTime': '',
        'occupationBeginDate': '',
        'occupationEndDate': '',
        'issueDates': [],
        'gatewayFlag': 0,
        'code': ciphertext,
        'token': nonce,
    }


def submit_biz(session: requests.Session, code_x: int, nonce: str):
    """携带加密 code 提交业务接口, 返回 (http_status, resp_json, ok)。"""
    body = build_biz_body(code_x, nonce)
    r = session.post(BASE + '/zbtb/gateway/gatewayPublicity/bidBulletinList',
                     headers=HEADERS, json=body, timeout=30)
    try:
        resp = r.json()
    except json.JSONDecodeError:
        return r.status_code, None, False
    ok = (resp.get('code') == 0 and resp.get('page', {}).get('list'))
    return r.status_code, resp, ok


_OCR = None  # ddddocr 实例缓存(模型加载较慢, 重复调用复用)


def _get_ocr():
    global _OCR
    if _OCR is None:
        import ddddocr
        _OCR = ddddocr.DdddOcr(show_ad=False)
    return _OCR


def solve_slider(session=None, submit=True, max_tries=20, verbose=True) -> dict:
    """绕过滑块验证码, 返回可直接用于业务请求的凭据。

    参数:
        session : 可选 requests.Session, 复用 cookie/连接
        submit  : True=提交业务接口回验直到通过(推荐); False=只求解坐标, 不消耗验证码
        max_tries: 最大尝试次数(失败自动重新拉图, 每个 nonce 一次性)
        verbose : 是否打印过程日志

    返回(验证通过时):
        {code: AES-ECB 密文, token: nonce, nonce: nonce,
         code_x: 缺口左缘 x, block_y: 拼图块 y, attempts: 尝试次数}

    失败: 抛 RuntimeError
    """
    ocr = _get_ocr()
    if session is None:
        session = requests.Session()
    stage, stage_failures = 0, 0  # 候选 delta 档位; 同一档连续失败才换下一档
    for attempt in range(1, max_tries + 1):
        delta = DELTA_CANDIDATES[stage]
        try:
            cap = get_captcha(session)
            cx, conf = detect_gap(ocr, cap['canvas_png'], cap['block_png'])
            code_x = int(round(cx + delta))
            if verbose:
                print('[%02d] nonce=%s blockY=%s 中心x=%.1f 置信度=%.3f delta=%+d -> code_x=%d'
                      % (attempt, cap['nonce'], cap['block_y'], cx, conf, delta, code_x))
            if not submit:
                if verbose:
                    for d in DELTA_CANDIDATES:
                        c = int(round(cx + d))
                        if 0 <= c <= 320 - 65:
                            print('    候选 code_x =', c)
                return {'code_x': code_x, 'center_x': cx, 'confidence': conf,
                        'nonce': cap['nonce'], 'block_y': cap['block_y'], 'attempts': attempt}
            if code_x < 0 or code_x > 320 - 65:
                if verbose:
                    print('[%02d] code_x 越界, 换一张重试' % attempt)
                continue
            st, resp, ok = submit_biz(session, code_x, cap['nonce'])
            if ok:
                total = resp['page'].get('totalCount')
                if verbose:
                    print('[%02d] 验证通过 ✅ code_x=%d (delta=%+d) 页面列表 %d 条, totalCount=%s'
                          % (attempt, code_x, delta, len(resp['page']['list']), total))
                return {
                    'code': aes_ecb_encrypt(str(code_x), cap['nonce']),
                    'token': cap['nonce'],
                    'nonce': cap['nonce'],
                    'code_x': code_x,
                    'block_y': cap['block_y'],
                    'attempts': attempt,
                }
            if st == 200 and resp is not None:
                # 服务器明确拒绝(每个 nonce 只可提交一次), 计入换档计数
                stage_failures += 1
                if verbose:
                    print('[%02d] 被拒 code=%s list=%s msg=%s'
                          % (attempt, resp.get('code'), len(resp.get('page', {}).get('list') or []),
                             resp.get('msg', resp.get('message', ''))))
                if stage_failures >= 3 and stage < len(DELTA_CANDIDATES) - 1:
                    stage += 1
                    stage_failures = 0
                    if verbose:
                        print('    delta=%+d 连续失败, 切换到下一候选 delta=%+d'
                              % (delta, DELTA_CANDIDATES[stage]))
            else:
                if verbose:
                    print('[%02d] 提交异常 http=%s, 稍后重试' % (attempt, st))
        except Exception as e:
            if verbose:
                print('[%02d] 失败: %r' % (attempt, e))
        time.sleep(1 + attempt % 3)
    raise RuntimeError('滑块验证未通过(重试 %d 次)' % max_tries)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--solve', action='store_true', help='只求解坐标, 不提交业务接口')
    ap.add_argument('--max-tries', type=int, default=20)
    args = ap.parse_args()
    try:
        res = solve_slider(submit=not args.solve, max_tries=args.max_tries)
    except RuntimeError as e:
        print(str(e))
        return 1
    if args.solve:
        print('仅求解模式, 未提交业务接口; code_x=%d nonce=%s'
              % (res['code_x'], res['nonce']))
    return 0


if __name__ == '__main__':
    sys.exit(main())
