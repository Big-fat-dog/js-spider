import json
import base64
import requests
from time import time
import subprocess
from functools import partial
# 解决 Windows 编码问题
subprocess.Popen = partial(subprocess.Popen, encoding='utf-8')
import execjs
print(execjs.get().name)  # 确保能正常运行
with open('sign.js', 'r', encoding='utf-8') as f:
    sig = execjs.compile(f.read())
mydata = {"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":0,"g_tk_new_20200303":5381,"g_tk":5381},"req_1":{"module":"music.globalComment.CommentRead","method":"GetNewCommentList","param":{"BizType":4,"BizId":"4","LastCommentSeqNo":"","PageSize":25,"PageNum":0,"FromCommentId":"","WithHot":1,"PicEnable":1,"LastTotal":0,"LastTotalVer":"0"}},"req_2":{"module":"music.globalComment.CommentRead","method":"GetHotCommentList","param":{"BizType":4,"BizId":"4","LastCommentSeqNo":"","PageSize":15,"PageNum":0,"HotType":2,"WithAirborne":1,"PicEnable":1}},"req_3":{"module":"music.globalComment.CommentAsset","method":"GetCmBgCard","param":{}}}
adata = '{"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":0,"g_tk_new_20200303":5381,"g_tk":5381},"req_1":{"module":"music.musicsearch.HotkeyService","method":"GetHotkeyForQQMusicMobile","param":{"searchid":"31365759695277856","remoteplace":"txt.yqq.top","from":"yqqweb"}},"req_2":{"module":"music.paycenterapi.LoginStateVerificationApi","method":"GetChargeAccount","param":{"appid":"mlive"}},"req_3":{"module":"musicToplist.ToplistInfoServer","method":"GetAll","param":{}}}'

headers = {
    "accept": "application/octet-stream",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "cache-control": "no-cache",
    "content-type": "text/plain",
    "origin": "https://y.qq.com",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "referer": "https://y.qq.com/",
    "sec-ch-ua": "\"Microsoft Edge\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0"
}
cookies = {
    "ptcz": "df024eb8c636501e9b0eb9f5d6a92242ac4e5dd4ab43987387d752cdc8f902f1",
    "yyb_muid": "311EF8A01A0C61A83B8EED231B4F6025",
    "pgv_pvid": "9765749276",
    "eas_sid": "A1R7X5T8j2Z619g5x1O0k6U0E4",
    "_ga": "GA1.1.964751004.1760099841",
    "_ga_PF3XX5J8LE": "GS2.1.s1760099840$o1$g0$t1760099843$j57$l0$h0",
    "_qimei_uuid42": "19a161311221007b51ce3bce4b29f4a7c9bdb14d8b",
    "pac_uid": "0_rJdrWBccaPZxf",
    "_qimei_fingerprint": "13f28da002b5bf17f1c4ec7b9c9653fa",
    "_qimei_q36": "",
    "_qimei_h38": "defb621551ce3bce4b29f4a702000002b19a16",
    "RK": "NWAGm6+Q/i",
    "fqm_pvqid": "9db4f1ba-c744-4390-8302-9550dbd8d1ca",
    "ts_refer": "cn.bing.com/",
    "ts_uid": "8387115692",
    "fqm_sessionid": "9bdacb42-f023-4461-ba62-e459a4a9d13f",
    "pgv_info": "ssid=s6366570040",
    "ts_last": "y.qq.com/n/ryqq_v2/toplist/4"
}
url = "https://u6.y.qq.com/cgi-bin/musics.fcg"
params = {
    "_": str(int(time()*1000)),
    "encoding": "ag-1",
    "sign": sig.call("get_sign",mydata)
}
data = sig.call("encryptSync",mydata)

# data = 'haPXFV0RwQkoHw+orrYoEQCtiExbFCTW8+nbi/RECiPdJrjb+B8yGBNlh129aPZbbXdKFHAyLFyE/83gXzf7BpwujCiaXdx5FCTh+EgQuV9nUg1JC08bc0T0DGJ/kxHBuT7lAXtDIO2DfPEbJ5/L8mAGbRPlxEstqfL9V1IiCsa64i8u60YqqQQlFnkG6sEQdKnR99YYk1m7rxbRoTdckeqkMuPpWM8/gE3JxAgkpe4Ee0QZ8Axpyf3RZfW1XYU2UQl7lp/YiFS+wSVEJ7rrUSy86R54qlJh3AJeqeTrca07jEl8r2UtMlHDABFjNekVbLrSmp6epTRWRWhySzEVo70xYF6Ige5FImjaLRgbppZkz83EDfznynNsx0exnk4fo+Iv9WRgbjgbwtNg3MLAZy2r7pBO5MtT4FTaAXGbjiL4bVdNRyIluVeFXxP7FvlkuCWCtoDIJpzksRYuUY2QPyrHa1mSXQ5+MI1EYhFvDqpBK2Z1gH14DzNbEs5Eb42iGSKq+wpBqlJ6GRQov01k0lkoUzutmaW3GzDsXkeM7EECHPQpQF3KIVBqHHP+TAcBtadAc9UtBXt+T6MFHHvgOZ8yFW//LcMh5iJDG8JlPUO3fN+C0ewbumlPFK/dDYkhkEXyjkYQLTKYnR1kbcVEZAFKNP7z85sA0EpjCCwbfJazhmmBqdP6EhuPT49Bv836j86RJZMlw3SWZGQX4Vk18WWX7NVD3PpK/fQuGihaJZJF6O9G+4/7/Oy5+fBlKfRc57X+qD9ghPss8tZXo+o3JouJfZKu0hWERbbevvaG9zhD2cVaO+6MrkiBMism6cAtseEmVfna5MUDTFS5XDEIzq6P+B4+irSATo57Lth5ILBS8YwPfVQFk8fPY7atj4zxSOXbKUzb7YDVf0sRbgXgBpvDAw8kF8xqC7lPdw8t4vk8L2GSPA9+yk+Lq9Sq49ZpZ1QDO9Is4KiQAVLNbPw3tWI6+AI7MrVmZ0iJ'.encode('unicode_escape')

response = requests.post(url, headers=headers, cookies=cookies, params=params, data=data)

print(response)

# 调试：保存原始响应
with open('raw_response.bin', 'wb') as f:
    f.write(response.content)
print(f"原始响应长度: {len(response.content)} 字节")
print(f"原始响应前50字节: {response.content[:50].hex()}")

KEY = bytes([122, 63, 140, 29, 94, 155, 47, 10, 108, 77, 126, 139, 31, 58, 92, 157, 14, 43, 111,74,129])


def decrypt(cipher_bytes):
    if isinstance(cipher_bytes, str):
        cipher_bytes = cipher_bytes.encode('utf-8')
    
    plain_bytes = bytearray()
    for i, byte in enumerate(cipher_bytes):
        plain_bytes.append(byte ^ KEY[i % len(KEY)])

    # 调试：保存解密结果
    with open('decrypted_result.bin', 'wb') as f:
        f.write(plain_bytes)
    print(f"解密结果前50字节: {plain_bytes[:50].hex()}")
    
    try:
        return plain_bytes.decode('utf-8')
    except:
        return plain_bytes.decode('latin-1')  # 失败时用latin-1查看


print(decrypt(response.content))