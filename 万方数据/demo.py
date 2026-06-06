import blackboxprotobuf

import codecs

# 示例 protobuf 字节串
protobuf_bytes = b'\x08\x96\x01'
message_data = {
    '1': {                          # 嵌套对象
        '1': b'paper',              # 字符串用 bytes
        '2': '爬虫'.encode('utf-8'),  # 中文必须编码为 UTF-8
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
s = "\n$\n\\u0005paper\\u0012\\u0006爬虫(\\u00010\\u0014B\\u0001\\u0000H\\u0001b\\u0002pcj\\u0006search\\u0010\\u0001\"\\u0007AI_READ\"\nAI_EXTRACT"
decoded = codecs.decode(s, 'unicode_escape')  # 把 \\u0005 变成真正的 \x05
mybytes = decoded.encode('latin-1')  # ✅ 得到正确的二进制
# 解码 protobuf 消息
decoded_message, type_definition = blackboxprotobuf.decode_message(mybytes)
print('type:',type_definition)
print("Decoded Message:", decoded_message)

# 重新编码消息
encoded_bytes = blackboxprotobuf.encode_message(decoded_message, type_definition)
newencoded_bytes = blackboxprotobuf.encode_message(message_data, type_definition)
print("Encoded Bytes:", encoded_bytes)
print('new encoded:',newencoded_bytes)