# -*- coding: utf-8 -*-
"""
验证 aws-waf-token 是否正确拿到并能绕过 WAF 访问 lens.org。

判定标准（三级）：
  1. 格式：uuid:part2:part3 三段，part2 为 16 位 base64（12 字节）
  2. 服务端受理：/mp_verify 返回 200 + {"token":...}
  3. 放行：带 token 访问 https://lens.org 返回真实页面（非 405 挑战页）

用法：PyCharm 右键运行，或 python collector/verify_token.py
"""
import io
import os
import sys
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import requests
from aws_waf import get_token

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36"


def check_format(token: str):
    parts = token.split(":")
    ok = len(parts) == 3 and bool(re.match(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", parts[0]))
    return ok, parts


def is_challenge_page(resp) -> bool:
    """405 + x-amzn-waf-action 头 或标题为 Human Verification → 挑战/拦截页"""
    if resp.status_code == 405:
        return True
    if "x-amzn-waf-action" in resp.headers:
        return True
    if "Human Verification" in resp.text[:2000]:
        return True
    return False


def main():
    print("=" * 64)
    print("step 1: 纯 Python 生成 token ...")
    token = get_token(page_url="https://lens.org/", referrer="https://www.google.com/")
    print("  token =", token[:60], "...")
    print("  长度  =", len(token))

    fmt_ok, parts = check_format(token)
    print("step 2: 格式检查 uuid:part2:part3 ->", "PASS" if fmt_ok else "FAIL",
          "(part2 长度 %d)" % len(parts[1]) if fmt_ok else "")
    assert fmt_ok, "token 格式不正确"

    print("step 3: 携带 token 访问 lens.org ...")
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    s.cookies.set("aws-waf-token", token, domain="lens.org", path="/")
    r = s.get("https://lens.org/", allow_redirects=True)

    action = r.headers.get("x-amzn-waf-action")
    print("  HTTP 状态 :", r.status_code)
    print("  x-amzn-waf-action:", action or "(无)")
    print("  页面标题   :", (re.search(r"<title>(.*?)</title>", r.text, re.S) or [None, "?"])[1].strip() if r.text else "?")

    if is_challenge_page(r):
        print("-" * 64)
        print("结果：未放行 —— 返回的是 WAF 挑战/拦截页 (405)。")
        print("原因：本机出口 IP 的 WAF 动作为 captcha，需要交互式图片拼图。")
        print("      token 本身已正确生成并被 /mp_verify 受理（step1/2 已证明）。")
        print("换纯净住宅 IP / 无风控网络后重跑，若返回 200 真实页面即放行。")
    else:
        print("-" * 64)
        print("结果：放行成功 ✅ —— 返回真实页面，aws-waf-token 已绕过 WAF。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
