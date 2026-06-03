import json
import csv
import time
import random

import requests
import os
import subprocess
from functools import partial
# 解决 Windows 编码问题
subprocess.Popen = partial(subprocess.Popen, encoding='utf-8')
import execjs
print(execjs.get().name)  # 确保能正常运行
with open('a.js','r',encoding='utf8') as f:
    js_code=f.read()
ctx = execjs.compile(js_code)

filename = 'watchbirds.csv'
buffer = []
fieldnames = ['page', 'id', 'address', 'pointName', 'taxonCount', 'userId', 'username', 'startTime', 'endTime']
# 第一次写入表头
if not os.path.exists(filename):
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames = fieldnames)
        writer.writeheader()
for page in range(1,21):
    obj = ctx.call('get_headers',f'page={page}&limit=20')
    headers = {
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.birdreport.cn",
        "Pragma": "no-cache",
        "Referer": "https://www.birdreport.cn/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        "requestId": obj['requestId'],
        "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sign": obj['sign'],
        "timestamp": str(obj['timestamp']),
    }
    url = "https://api.birdreport.cn/front/activity/search"
    data = obj['data']
    response = requests.post(url, headers=headers,data=data)
    resp = json.loads(response.text)
    result = ctx.call('decode_aes',resp['data'])
    for aa in result:
        buffer.append({
            'page': page,
            "id": aa['id'],
            'address': aa['address'],
            "pointName": aa['pointName'],
            "taxonCount": aa['taxonCount'],
            "userId":aa['userId'],
            "username": aa['username'],
            "startTime":aa['startTime'],
            "endTime": aa['endTime'],
        })
        # 每10页或最后一页写入
    if page % 10 == 0 or page == 100:
        with open(filename, 'a', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writerows(buffer)
        print(f"第{page}页已保存，累计{page * 20}条")
        buffer = []  # 清空缓冲
    # 平均2秒，标准差0.5秒
    sleep_time = random.gauss(2, 0.5)
    sleep_time = max(0.5, min(sleep_time, 4))  # 限制在 0.5-4 秒之间
    time.sleep(sleep_time)


