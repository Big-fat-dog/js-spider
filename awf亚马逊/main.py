# -*- coding: utf-8 -*-
"""PyCharm right-click runnable entrypoint for the lens.org AWS WAF token collector."""
import io
import sys
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aws_waf import get_token


def main():
    token = get_token(
        page_url="https://lens.org/",
        referrer="https://www.google.com/",
        existing_token="",
    )
    print("aws-waf-token =", token[:80], "...")
    print("token length =", len(token))
    parts = token.split(":")
    print("format: uuid:%s | part2 len %s | part3 len %s" % (parts[0][:8], len(parts[1]), len(parts[2])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
