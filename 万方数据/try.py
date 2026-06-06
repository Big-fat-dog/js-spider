import json
import struct
import re

with open('response_raw.json', 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

data = bytes.fromhex(raw_data['content_hex'])

# 解析 gRPC 帧头
msg_len = struct.unpack('>I', data[1:5])[0]
proto_data = data[5:5 + msg_len]


def read_varint(data, pos):
    result = 0
    shift = 0
    while pos < len(data):
        byte = data[pos]
        pos += 1
        result |= (byte & 0x7f) << shift
        if not (byte & 0x80):
            break
        shift += 7
    return result, pos


def parse_protobuf(data, max_depth=5):
    if max_depth <= 0:
        return {}
    result = {}
    pos = 0
    while pos < len(data):
        try:
            tag, pos = read_varint(data, pos)
        except:
            break
        field_num = tag >> 3
        wire_type = tag & 0x07

        if wire_type == 0:
            value, pos = read_varint(data, pos)
        elif wire_type == 2:
            length, pos = read_varint(data, pos)
            value = data[pos:pos + length]
            pos += length
            try:
                text = value.decode('utf-8')
                if any('\u4e00' <= c <= '\u9fff' for c in text[:50]):
                    value = text
                else:
                    sub = parse_protobuf(value, max_depth - 1)
                    value = sub if sub else text
            except:
                sub = parse_protobuf(value, max_depth - 1)
                value = sub if sub else value
        else:
            break

        if field_num in result:
            if not isinstance(result[field_num], list):
                result[field_num] = [result[field_num]]
            result[field_num].append(value)
        else:
            result[field_num] = value
    return result


top = parse_protobuf(proto_data)
papers = top.get(4, [])

print(f"共 {len(papers)} 篇论文:\n")

for i, paper in enumerate(papers):
    inner = paper.get(101, {})
    if not isinstance(inner, dict) or not inner:
        continue

    # 标题：优先取中文，否则取第一个
    title_list = inner.get(2, '')
    if not isinstance(title_list, list):
        title_list = [title_list]
    title = ''
    for t in title_list:
        t_str = str(t)
        if any('\u4e00' <= c <= '\u9fff' for c in t_str):
            title = t_str
            break
    if not title and title_list:
        title = str(title_list[0])
    title = re.sub(r'<[^>]+>', '', title)

    # 作者
    authors = inner.get(3, [])
    if not isinstance(authors, list):
        authors = [authors]
    authors = [str(a) for a in authors if isinstance(a, str) and any('\u4e00' <= c <= '\u9fff' for c in a)]

    # 期刊
    journal_list = inner.get(23, '')
    if not isinstance(journal_list, list):
        journal_list = [journal_list]
    journal = ''
    for j in journal_list:
        j_str = str(j)
        if any('\u4e00' <= c <= '\u9fff' for c in j_str):
            journal = j_str
            break
    if not journal and journal_list:
        journal = str(journal_list[0])

    year = inner.get(33, '')
    page = inner.get(36, '')
    doi = inner.get(41, '')

    print(f"{i + 1}. {title}")
    print(f"   作者: {', '.join(authors[:3]) if authors else '未知'}")
    print(f"   期刊: {journal}")
    print(f"   年份: {year}  页码: {page}")
    print(f"   DOI: {doi}")
    print()