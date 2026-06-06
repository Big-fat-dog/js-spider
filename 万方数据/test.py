import requests
import blackboxprotobuf
import codecs


headers = {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/grpc-web+proto",
    "cookies": "CASTGC=;CASTGCSpecial=;",
    "httpreferer": "https://s.wanfangdata.com.cn/paper?q=%E7%88%AC%E8%99%AB",
    "origin": "https://s.wanfangdata.com.cn",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "referer": "https://s.wanfangdata.com.cn/paper?q=%E7%BE%8E%E5%A5%B3",
    "sec-ch-ua": "\"Google Chrome\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "",
    "x-grpc-web": "1",
    "x-user-agent": "grpc-web-javascript/0.1"
}
cookies = {
    "UM_distinctid": "19e9237ee1a15b5-0e25224ad7289e8-26061051-e1000-19e9237ee1b28e4",
    "_pk_id.1.d704": "62c64a2d8db6783e.1780569625.",
    "behavior_trace_id": "trace_1780569625101_jhgu9g4s",
    "fingerprint": "1704218895",
    "zh_choose": "n",
    "Hm_lvt_838fbc4154ad87515435bf1e10023fab": "1780569600,1780714229,1780741445",
    "HMACCOUNT": "DB3BD1AA6D57F3F6",
    "behavior_session_id": "session_1780741929683_dq2qrd29",
    "_pk_ses.1.d704": "1",
    "Hm_lpvt_838fbc4154ad87515435bf1e10023fab": "1780750833",
    "CNZZDATA1281185085": "1918788632-1780569625-https%253A%252F%252Fwww.wanfangdata.com.cn%252F%7C1780750836",
    "behavior_last_active": "1780750840165"
}
url = "https://s.wanfangdata.com.cn/SearchService.SearchService/search"
typed_definition = {'1': {'type': 'message', 'message_typedef': {'1': {'type': 'bytes', 'name': ''}, '2': {'type': 'bytes', 'name': ''}, '5': {'type': 'int', 'name': ''}, '6': {'type': 'int', 'name': ''}, '8': {'type': 'bytes', 'name': ''}, '9': {'type': 'int', 'name': ''}, '12': {'type': 'message', 'message_typedef': {'14': {'type': 'int', 'name': ''}}, 'name': ''}, '13': {'type': 'bytes', 'name': ''}}, 'name': ''}, '2': {'type': 'int', 'name': ''}, '4': {'type': 'bytes', 'name': ''}}
message_data = {
    '1': {                          # 嵌套对象
        '1': b'paper',              # 字符串用 bytes
        '2': '美女'.encode('utf-8'),  # 中文必须编码为 UTF-8
        '5': 1,                     # int
        '6': 20,                    # int
        '8': b'\x00',              # 空字节
        '9': 1,                     # int
        '12': {                     # 嵌套对象
            '14': 99               # int (ascii 'c')
        },
        '13': b'search',           # 字符串
    },
    '2': 1,                         # int
    '4': [                          # 数组
        b'AI_READ',
        b'AI_EXTRACT'
    ]
}
newencoded_bytes = blackboxprotobuf.encode_message(message_data, typed_definition)

data = {
    "\\u0000\\u0000\\u0000\\u0000": newencoded_bytes
}
response = requests.post(url, headers=headers, cookies=cookies, data=data)

print(response.content)
print(response)