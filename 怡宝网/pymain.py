import requests
import json
import time
import subprocess
from functools import partial
# 解决 Windows 编码问题
subprocess.Popen = partial(subprocess.Popen, encoding='utf-8')
import execjs
print(execjs.get().name)  # 确保能正常运行
with open('main.js', 'r', encoding='utf-8') as f:
    js_code = f.read()
ctx = execjs.compile(js_code)
timestmp = str(int(time.time()))
dogt = {
    "data": {
        "data": {
            "keyWords": "",
            "drugType": "",
            "pageNo": 1,
            "pageSize": 10,
            "medListCodg": "X"
        },
        "appCode": "T98HPCGN5ZVVQBS8LZQNOAEXVI9GYHKQ",
        "version": "1.0.0",
        "encType": "SM4",
        "signType": "SM2",
        "timestamp": timestmp,
    }
}

headers = {
    "Accept": "application/json",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Content-Type": "application/json",
    "Origin": "https://fuwu.nhsa.gov.cn",
    "Pragma": "no-cache",
    "Referer": "https://fuwu.nhsa.gov.cn/nationalHallSt/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "X-Tingyun": ctx.call('get_headers',dogt)["x-tingyun"],
    "channel": "web",
    "contentType": "application/x-www-form-urlencoded",
    "sec-ch-ua": "\"Google Chrome\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "x-tif-paasid": "undefined",
    "x-tif-signature": ctx.call('get_headers',dogt)['x-tif-signature'],
    "x-tif-nonce": ctx.call('get_headers',dogt)['x-tif-nonce'],
    "x-tif-timestamp": timestmp,
}
cookies = {
    "amap_local": "320500",
    "acw_tc": "3ccdc17017805476462998363ef69f690703e9f0e659620a110b7f9f247f0c",
    "yb_header_active": "-1"
}
url = "https://fuwu.nhsa.gov.cn/ebus/fuwu/api/nthl/api/CommQuery/queryWmTcmpatInfoBFromEs"

data = {
    "data": {
        "data": {
            "encData": ctx.call('get_encdata',dogt)
        },
        "appCode": "T98HPCGN5ZVVQBS8LZQNOAEXVI9GYHKQ",
        "version": "1.0.0",
        "encType": "SM4",
        "signType": "SM2",
        "timestamp": timestmp,
        "signData": ctx.call('get_signData',dogt),
    }
}
data = json.dumps(data, separators=(',', ':'))
response = requests.post(url, headers=headers, cookies=cookies, data=data)

print(response.text)
print(response)
results = ctx.call('dec_data',response.json())
print(results)