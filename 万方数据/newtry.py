import requests
import struct
import json

# ==================== 请求头 ====================
headers = {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/grpc-web+proto",
    "cookies": "CASTGC=;CASTGCSpecial=;",
    "origin": "https://s.wanfangdata.com.cn",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "referer": "https://s.wanfangdata.com.cn/paper?q=%E7%88%AC%E8%99%AB",
    "sec-ch-ua": "\"Google Chrome\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
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
    "Hm_lpvt_838fbc4154ad87515435bf1e10023fab": "1780753249",
    "CNZZDATA1281185085": "1918788632-1780569625-https%253A%252F%252Fwww.wanfangdata.com.cn%252F%7C1780753249",
    "behavior_last_active": "1780753268727"
}

# ==================== 构造请求 ====================
def encode_varint(value):
    result = []
    while value > 0x7f:
        result.append((value & 0x7f) | 0x80)
        value >>= 7
    result.append(value & 0x7f)
    return bytes(result)

def encode_length_delimited(field_number, data):
    tag = (field_number << 3) | 2
    return encode_varint(tag) + encode_varint(len(data)) + data

def encode_varint_field(field_number, value):
    tag = (field_number << 3) | 0
    return encode_varint(tag) + encode_varint(value)

query = '美女'.encode('utf-8')
inner = b''
inner += encode_length_delimited(1, b'paper')
inner += encode_length_delimited(2, query)
inner += encode_varint_field(5, 1)
inner += encode_varint_field(6, 20)
inner += encode_length_delimited(8, b'\x00')
inner += encode_varint_field(9, 1)
inner12 = encode_varint_field(14, 99)
inner += encode_length_delimited(12, inner12)
inner += encode_length_delimited(13, b'search')

body = b''
body += encode_length_delimited(1, inner)
body += encode_varint_field(2, 1)
body += encode_length_delimited(4, b'AI_READ')
body += encode_length_delimited(4, b'AI_EXTRACT')

grpc_frame = b'\x00' + struct.pack('>I', len(body)) + body
response = requests.post(
    "https://s.wanfangdata.com.cn/SearchService.SearchService/search",
    headers=headers,
    cookies=cookies,
    data=grpc_frame
)

# ==================== 保存原始数据 ====================
raw_data = {
    "status_code": response.status_code,
    "headers": dict(response.headers),
    "content_length": len(response.content),
    "content_hex": response.content.hex(),  # 十六进制（方便查看）
    "content_base64": __import__('base64').b64encode(response.content).decode(),  # base64（方便解码）
}

with open('response_raw.json', 'w', encoding='utf-8') as f:
    json.dump(raw_data, f, ensure_ascii=False, indent=2)

print(f"Status: {response.status_code}")
print(f"Length: {len(response.content)}")
print("已保存到 response_raw.json")