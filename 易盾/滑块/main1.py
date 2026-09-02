#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
网易易盾 up 接口请求脚本（修复版，配套 wangyi.py）

使用方法：
    E:/MySpider/.venv/Scripts/python.exe -X utf8 E:/pyteacher/demo3/main1.py
    （或任意装有 requests 的 python：python main1.py）

验证逻辑：
    1) 本地自检：把生成的 d 解码回字节，检查结构 = 4 字节 e + n*64 状态块；
    2) 真实请求：POST https://ir-sdk.dun.163.com/v4/j/up
       返回 {"code":200,"msg":"成功","ok":true} 即代表服务端解密+CRC 校验通过，
       wangyi.py 生成逻辑正确。
"""

import json
import requests

from wangyi import (
    generate_request,
    T_ARRAY,
    O_ARRAY,
    F1_ARRAY,
    CUSTOM_CHARSET,
)


# ============================================================
# 接口配置
# ============================================================

URL = 'https://ir-sdk.dun.163.com/v4/j/up'

HEADERS = {
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Origin': 'https://dun.163.com',
    'Pragma': 'no-cache',
    'Referer': 'https://dun.163.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
    'Content-Type': 'text/plain',
}


# ============================================================
# 本地自检
# ============================================================

def decode_d(d: str) -> bytes:
    """把 d 从自定义 base64（字符集 CUSTOM_CHARSET，填充字符 '7'）解码回字节"""
    inv = {c: i for i, c in enumerate(CUSTOM_CHARSET)}
    out = []
    buf = 0
    bits = 0
    for ch in d:
        if ch == '7':
            break
        buf = (buf << 6) | inv[ch]
        bits += 6
        if bits >= 8:
            bits -= 8
            out.append((buf >> bits) & 0xFF)
    return bytes(out)


def local_selfcheck(data: dict) -> bool:
    """
    结构自检：d 解码后必须是 [e(4字节) + n*64 状态块]。
    静态数组 1879 字节 -> 30 块；真实动态数组 1770 字节 -> 28 块。
    """
    raw = decode_d(data['d'])
    ok_len = len(raw) >= 4 and (len(raw) - 4) % 64 == 0
    blocks = (len(raw) - 4) // 64
    print(f'[自检] d 解码 {len(raw)} 字节 = 4(e) + {blocks}x64 块, 结构合法: {"是" if ok_len else "否"}')
    return ok_len


# ============================================================
# 发送请求
# ============================================================

def send_up_request():
    """生成请求参数并发送 up 接口请求"""

    # 修复版：generate_request 直接输出 {n, d, p, v, vk}，n 每次自动新生成（一次性 nonce）
    data = generate_request(T_ARRAY, O_ARRAY, F1_ARRAY)

    print('=' * 70)
    print('发送请求到:', URL)
    print('=' * 70)
    print()
    print('[请求参数]')
    for key, value in data.items():
        if key == 'd':
            print(f'  {key}: {value[:80]}...')
            print(f'  {key} 长度: {len(value)}')
        else:
            print(f'  {key}: {value}')
    print()

    # 本地自检（不依赖网络）
    local_selfcheck(data)
    print()

    json_data = json.dumps(data, separators=(',', ':'))
    print('[请求体 JSON]')
    print(f'  {json_data[:200]}...')
    print()

    try:
        response = requests.post(
            URL,
            headers=HEADERS,
            data=json_data,
            timeout=30,
        )
    except requests.exceptions.RequestException as e:
        print(f'[错误] 请求失败: {e}')
        print('提示：确认网络能访问 ir-sdk.dun.163.com（国内直连即可，无需代理）')
        return None

    print('[响应]')
    print(f'  状态码: {response.status_code}')
    try:
        resp_json = response.json()
        print(json.dumps(resp_json, indent=2, ensure_ascii=False))
    except ValueError:
        print(response.text[:500])
        resp_json = {}

    print()
    if response.status_code == 200 and resp_json.get('ok') and resp_json.get('code') == 200:
        print('[判定] 通过：服务端解密+CRC 校验成功（code=200, ok=true），wangyi.py 生成逻辑正确')
    else:
        code = resp_json.get('code')
        msg = resp_json.get('msg')
        hint = {
            5504: '5504 Decrypt Failure：d 解密失败（检查压缩函数表 FUNC_MAP 4/5 是否写反、输入是否用 flatten(shuffle(数组))）',
            5505: '5505 Invalid Nonce：n 是一次性的，不要复用抓包里的 n，必须每次新生成',
        }.get(code, '')
        print(f'[判定] 未通过: code={code} msg={msg}')
        if hint:
            print(f'       提示: {hint}')
    return response


# ============================================================
# 测试入口
# ============================================================

if __name__ == '__main__':
    send_up_request()
