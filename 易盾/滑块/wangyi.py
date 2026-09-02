#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
网易易盾验证码 d 参数生成器 - 完整版
基于完整逆向分析复现，所有数据已就绪
"""

import random
import hashlib
from typing import List, Optional

fatd =  "iy1o0YMIHGL46ifo6kuIYUKD/Ja11igAoExzz6aPf5anCOabCsxIqO6nOBiDGe4C8NNhLAxxgDUWotzO6fM9lPJ990NeF+eBsMa/sQSSLbBtNRlgWniOZ49OGajfpVx+wxphRZKeVusCpK41Zk3BKlYiKa23VerjJHN1MiDD9XNn38DYae6ftBKP2Wj6S0562PlKKZl9MTazcjhph1uC9Esu.DX3d.Y6L9I6WCM5cnLydDj20BONQVs8ZH8fvGuO6Wt1U1EhtNT46iIbFp3L9qNKl.luV9OHIAAZTVj+ieEZA8JiCJFf0pHXvRLqjozXypH/1.+j/Zzso2HOuxCT8Y2yjrBJs+KPgYbCk3TXLcXFb5ZZPtcUsJvbw1IQa0+Lw444F5rqFMoAsNUUO+TPxpbzSuYomm9xJa9nMliqXTFZ/fBjPL6CVVY2RqgbhNBGO8wJmX6ZUjecoeXHY+GaX3WTYskxA6/o159fcUSWps2czmsvdndrVE.R2u6hvUBZUdsi5KpANj2enusxjVdtywyjOf6yN085GY0Zb5I65/iC2HzmptC5YzzBxAyBrPT5nhzsWjvCZmIW4AGnOIAx/Ix+vMmMlXlBVmsaNPlFuun0X9c.y1CuVCKOok5jqeB5l9wo8cfIYNXqgl9JZNeZXg3L8O+2TqUfTMjS3PcUTHOY5Vr/wrfDANeHDG9bfR.J+voVm8aYe9QQKdi4iPgJ04H1SBNHum5du0xFX3yvkmxwuTlb+w6U494SkxcKz.1IExsnLjuppItxPAMEeHwU2PWixRfzUrAnmlvmTEBM2Ln8f16TUOFStXjhPbD8d8ZT/YtwmwQ23.e4A+H2YDbqbqwCM54HwNKEWAg9pYSziH3XgyMMMR9A3YTbeGoy3xuLpBYQTCArMjQvvKp3ONNHKFA21giLgl24cvMJZu+iCi/KpeKfvmLopQ9Sjuk240SHj52+T5nYlCdy+W3kxoPEexunHyF2iTPF+Aupi/9.mrzPuP+iepJvxSZPoQjdt6NdAMXXTKe02s3mzC6RPoWQxfF43/O6+q2gZvItjxT.pfdx+sgbu.GQ5rvQ9I8fReouFCcDEBhf+j4uOdfWhYIsld4mkAYJw+WpwzOa1UMPYZhRVrJU+55GhHp8p.9L5TjlEioOvZ9Q3.PBLpAkSdK6JdvNEgF6eTHwkd0ufsCX1ANp35lGPIApPAFIla0SAxqtHfDKSn+1r0n2MuP5nM8Wj83uPCzpMKPcFEnCeikNuMIdXh1tEyhsG8CBAyOT0Sk9Q9sPN32BS4Xnj5RsGWfa0msOZg5ASmQ4wtJaQXp0U.nGu4LbyKZSbLRxuNx.Mt0Xiwgh6Kv86l6HtUeiD+dDkjY4XKM8xIMQCzxpHkBPBosiHtcIxdTSZNTVnyKBPiZQHvJKanz/ZSIPquNK2Gh/VAmWsyQF+InsJfzqt8WWr0yQOMVUO84JNhjLyPh6xgLAHh0ZVg90gHA192GEiCF+zO83tXiHoOOphEKr+4NpATn+qVqM0UymoOiBkli5oEDeVPMruNuGXh0+1uYENNe/jzPVI2IeEWoKS+mMYssyak86InxPREAj2wy4ItmWHmTCZMGAva/AIXa0TGy3hTgaQeh/EaidZ8/vLHsqZXbVQ5h5w+2ftOiCQ69iJeaxAV1XV0N39/hGUusTpV2MVZBnm8SREBHEx1jVPIvIAyx0oALBXg/CZNXMiAM8dbhX4EwtrnkHDrFMtVSV1RjDrErgMTds8IEjpg/mrYyXwJq3HnsBbO1BUZJDd/vnp20NqEreZSZRcZ0T.lET33AgCva9gHRlgMYInLmd8gKt6WFU3BrsTIy8zfc1zDx9eBEWQVL9.hwvJZvbBQ4L.dOTh6GmffsLZ0Pnwv9RoL/9hp4n.a2ws1VgvSNiNPwIMugoZ3qU8tvpKn93DLrTOHFQbH4G/CEywL3/Y4OYQuhKas.H9pbmDhr5eSjvsI34MAPpR4naPGL6TfxUdriTnDbtcyDCVr8Dt8Er9NABztdVjR1QdbZWunfYqw9hYinNhmhwrRP0EZ0FJfxWs0v1h5s+J+j8/BAIfm.D3mZ.Vzu/KKrzKjYJiOXmrkF2nVorTspuHHfsmPwTYQoxojyWtsw.m2pH1G4wkhnCZIDFX/5.kBkuqud0AGJD2kPxKpy+Gn/pEzDAKnnhmt4VthrkRMvS/2Z1tlSX3ztreoIHDaXn5yWRkeCys1q8cOGHv.c9KyL3MdGAdPAdvSribDIq2ApkZ.f0n0yV2AuTURZyFlHhf4di.1QHmereoyNeoQTwRrxef2Q89zQzVGyeceki6gqi3WcqZrUk9qsIxTJ30jFf3wwgV39w9.YYQMQkn/IkHko4kv.VP8ZN5V.cnpBheWz5WbTWCAkOGv/txoMz2W9lAPanu3d4QctSzMyQn0gUaaqKrHQEcHYRrjMFQ4lxYcWocnKip3DmRwGgTrf1/XSIu8Xi5Ut9K1tls/mfZ4X1f3YUbtLZxPvkv11+VaB4lkBz+YVNQAZeHm/kA63hKcY/8kVQHH.qpZ1.HrhDnr8n.na9yH3mBYmuDM77"

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
网易易盾验证码 d 参数生成器 - 最终修复版（动态时间戳）
"""

import json
import random
import zlib
import time
import uuid
from typing import List, Optional, Dict, Any


# ============================================================
# 一、常量定义
# ============================================================

FIXED_KEY = 'fd6a43ae25f74398b61c03c83be37449'
Y1049 = '037606da0296055c'
Y79_HEX = (
    'a7be3f3933fa8c5fcf86c4b6908b569ba1e26c1a6d7cfbf60ae4b00e074a194dac4b73e7f898541159a39d08183b76eedee3ed341e6685d2357440158394b1ff03a9004cbbb5ca7dcb7f41489a16e03dcc9c71eb3c9796685b1d01b4d56193a6e1f1a2470445c191ae49c5d82765dc82c350f263387a24a502fcbf442e2dddaad0e936d9ea22b89275307b42518fbc3a626ba806d4ecd6d725f50cc8c72fefa4551ccd6fc9b2b7ab954f815c7264c6e51f4eaf99885a79892b1b60a0b3526e57ba5d178d370958847eb9fd28f9ce0bc023f4148a2adfe632126769057043d3bd8eda0df7872629f3809ef05310e83113216afe202c460fc23e789f77d1addb5e'
)
CUSTOM_CHARSET = 'MB.CfHUzEeJpsuGkgNwhqiSaI4Fd9L6jYKZAxn1/Vml0c5rbXRP+8tD3QTO2vWyo'
PADDING_CHAR = '7'


# ============================================================
# 二、基础工具函数
# ============================================================

def Z(n: int) -> int:
    if n < -128:
        return Z(n + 256)
    if n > 127:
        return Z(n - 256)
    return n


def w(a: int, b: int) -> int:
    return Z(Z(a) ^ Z(b))


def A_xor(n: List[int], t: List[int]) -> List[int]:
    if not n or not t:
        return []
    return [w(n[i], t[i % len(t)]) for i in range(len(n))]


def A_add(n: List[int], t: List[int]) -> List[int]:
    if not n or not t:
        return []
    return [Z(n[i] + t[i % len(t)]) for i in range(len(n))]


def N(s: str) -> List[int]:
    return [Z(ord(ch)) for ch in s]


def T(hex_str: str) -> List[int]:
    result = []
    for i in range(0, len(hex_str), 2):
        if i + 1 >= len(hex_str):
            break
        result.append(Z(int(hex_str[i:i+2], 16)))
    return result


def p_int_to_bytes(val: int) -> List[int]:
    return [
        Z((val >> 24) & 0xFF),
        Z((val >> 16) & 0xFF),
        Z((val >> 8) & 0xFF),
        Z(val & 0xFF)
    ]


def R(n: List[int]) -> List[int]:
    if not n:
        return [0] * 64
    if len(n) >= 64:
        return n[:64]
    return [n[i % len(n)] for i in range(64)]


def P(src: List[int], src_start: int, dst: List[int], dst_start: int, count: int) -> List[int]:
    """从 src 复制 count 个字节到 dst 的指定位置"""
    src_len = len(src)
    for i in range(count):
        if src_start + i < src_len:
            dst[dst_start + i] = src[src_start + i]
    return dst


def flatten(arr: List) -> List:
    result = []
    for item in arr:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result


def fisher_yates_shuffle(data: List) -> List:
    n = len(data)
    for i in range(n - 1, 0, -1):
        j = random.randint(0, i)
        data[i], data[j] = data[j], data[i]
    return data


# ============================================================
# 三、S-Box
# ============================================================

def build_sbox() -> List[int]:
    return T(Y79_HEX)


def S(n: List[int]) -> List[int]:
    if not n:
        return []
    sbox = build_sbox()
    result = []
    for val in n:
        t = Z(val)
        idx = 16 * ((t >> 4) & 0x0F) + (t & 0x0F)
        result.append(sbox[idx] if idx < len(sbox) else 0)
    return result


# ============================================================
# 四、自定义压缩函数 (4 轮)
# ============================================================

def q_func(n: List[int], t: int) -> List[int]:
    return n


def K_func(n: List[int], t: int) -> List[int]:
    if not n:
        return []
    t = Z(t)
    return [w(val, t) for val in n]


def x_func(n: List[int], t: int) -> List[int]:
    if not n:
        return []
    t = Z(t)
    return [Z(val + t) for val in n]


def V_func(n: List[int], t: int) -> List[int]:
    if not n:
        return []
    t = Z(t)
    result = []
    for val in n:
        result.append(w(val, t))
        t = Z(t + 1)
    return result


def W_func(n: List[int], t: int) -> List[int]:
    if not n:
        return []
    t = Z(t)
    result = []
    for val in n:
        result.append(w(val, t))
        t = Z(t - 1)
    return result


def Y_func(n: List[int], t: int) -> List[int]:
    if not n:
        return []
    t = Z(t)
    result = []
    for val in n:
        result.append(Z(val + t))
        t = Z(t + 1)
    return result


def H_func(n: List[int], t: int) -> List[int]:
    if not n:
        return []
    t = Z(t)
    result = []
    for val in n:
        result.append(Z(val + t))
        t = Z(t - 1)
    return result


FUNC_MAP = {
    0: q_func, 1: K_func, 2: x_func, 3: V_func,
    4: Y_func, 5: W_func, 6: H_func,
}


def custom_compress(block: List[int]) -> List[int]:
    n = block[:]
    for i in range(0, len(Y1049), 4):
        if i + 4 > len(Y1049):
            break
        chunk = Y1049[i:i+4]
        func_idx = int(chunk[0:2], 16)
        param = int(chunk[2:4], 16)
        n = FUNC_MAP[func_idx](n, param)
    return n


# ============================================================
# 五、数据填充与分块
# ============================================================

def sha256_padding(data: List[int]) -> List[int]:
    if not data:
        return [0] * 64

    r = len(data)
    if r % 64 <= 60:
        pad_zero_count = 64 - (r % 64) - 4
    else:
        pad_zero_count = 128 - (r % 64) - 4

    t = [0] * (r + pad_zero_count + 4)
    P(data, 0, t, 0, r)

    for i in range(pad_zero_count):
        t[r + i] = 0

    length_bytes = p_int_to_bytes(r)
    P(length_bytes, 0, t, r + pad_zero_count, 4)

    return t


def split_into_blocks(data: List[int], block_size: int = 64) -> List[List[int]]:
    if len(data) % block_size != 0:
        return []
    return [data[i:i+block_size] for i in range(0, len(data), block_size)]


# ============================================================
# 六、自定义 Base64 编码
# ============================================================

def I_encode(chunk: List[int], charset: str, padding: str) -> str:
    t = charset
    r = padding
    n_len = len(chunk)

    if n_len == 1:
        i = chunk[0]
        return t[(i >> 2) & 0x3F] + t[((i << 4) & 0x30)] + r + r
    elif n_len == 2:
        i, u = chunk[0], chunk[1]
        return (t[(i >> 2) & 0x3F] +
                t[((i << 4) & 0x30) + ((u >> 4) & 0x0F)] +
                t[((u << 2) & 0x3C)] +
                r)
    elif n_len == 3:
        i, u, e = chunk[0], chunk[1], chunk[2]
        return (t[(i >> 2) & 0x3F] +
                t[((i << 4) & 0x30) + ((u >> 4) & 0x0F)] +
                t[((u << 2) & 0x3C) + ((e >> 6) & 0x03)] +
                t[e & 0x3F])
    return ""


def M_encode(data: List[int]) -> str:
    if not data:
        return ""

    result = []
    i = 0
    n = len(data)

    while i < n:
        if i + 3 <= n:
            result.append(I_encode(data[i:i+3], CUSTOM_CHARSET, PADDING_CHAR))
            i += 3
        else:
            result.append(I_encode(data[i:], CUSTOM_CHARSET, PADDING_CHAR))
            break

    return ''.join(result)


# ============================================================
# 七、G 函数：生成 32 位随机 ID
# ============================================================

def G() -> str:
    result = []
    for _ in range(32):
        t = random.randint(0, 15)
        val = t if random.random() < 0.5 else (3 & t) | 8
        result.append(format(val, 'x'))
    return ''.join(result)


# ============================================================
# 八、接口常量（与真实抓包一致）
# ============================================================

APP_ID = 'YD00192283058223'
SDK_VERSION = '2.0.13_yanzhengma'
VERSION_KEY = 'd44593ca'


# ============================================================
# 九、核心 d 参数生成函数
# ============================================================

def generate_d_param(
    t_array: List[List[int]],
    o_array: List[List[int]],
    f1_array: List[List[int]],
    random_seed: Optional[List[int]] = None,
    debug: bool = False
) -> str:
    """生成 d 参数

    真实算法（与 ir.2.0.13.min.js 一致）：
      n = flatten(shuffle(t_array + o_array + f1_array))
    对 n 做 CRC32 -> sha256 式填充 -> 64 字节分块 -> 自定义压缩 -> base64。
    注意：不是把 JSON context 序列化后当作输入！
    """

    # ==========================================================
    # 步骤 1: 合并数组 + 洗牌 + 展平，得到指纹原始字节
    # ==========================================================
    merged = t_array + o_array + f1_array
    shuffled = fisher_yates_shuffle(merged)
    n = [Z(b) for b in flatten(shuffled)]
    if debug:
        print(f'[DEBUG] n 长度: {len(n)}')

    # ==========================================================
    # 步骤 2: 生成动态 IV u = R(A(R(key), R(e)))，e 为 4 字节随机数
    # ==========================================================
    key_bytes = N(FIXED_KEY)

    if random_seed is None:
        r_bytes = [Z(random.randint(0, 255)) for _ in range(4)]
    else:
        r_bytes = random_seed[:4]

    u = R(A_xor(R(key_bytes), R(r_bytes)))
    e = r_bytes

    if debug:
        print(f'[DEBUG] e (4 字节随机数): {e}')

    # ==========================================================
    # 步骤 3: CRC32 校验（8 字节 hex 字符串）
    # ==========================================================
    n_bytes = bytes([Z(b) & 0xFF for b in n])
    crc_hex = f'{zlib.crc32(n_bytes) & 0xFFFFFFFF:08x}'
    c = N(crc_hex)
    if debug:
        print(f'[DEBUG] CRC: {crc_hex}')

    # ==========================================================
    # 步骤 4: 数据填充 (魔改 SHA-256 填充)
    # ==========================================================
    padded = sha256_padding(n + c)
    if debug:
        print(f'[DEBUG] padded 长度: {len(padded)}')

    # ==========================================================
    # 步骤 5: 分块 (每块 64 字节)
    # ==========================================================
    blocks = split_into_blocks(padded, 64)
    if debug:
        print(f'[DEBUG] 块数: {len(blocks)}')

    # ==========================================================
    # 步骤 6: 自定义哈希压缩循环
    # ==========================================================
    # f2 初始化为 e 的副本 (4 字节)，长度 = 4 + 块数*64（真实 JS 里 f 是动态增长的）
    f2 = e[:] + [0] * (64 * len(blocks))
    v = u[:]
    if debug:
        print(f'[DEBUG] f2 初始长度: {len(f2)}')

    for m, block in enumerate(blocks):
        # 6.1 4 轮压缩
        compressed = custom_compress(block)

        # 6.2 XOR 混合: a = compressed XOR u
        a = A_xor(compressed, u)

        # 6.3 状态更新: v = S(S(((a + v) XOR v)))
        added = A_add(a, v)
        xored = A_xor(added, v)
        v = S(S(xored))

        # 6.4 存储到 f2: P(v, 0, f2, 64 * m + 4, 64)
        P(v, 0, f2, 64 * m + 4, 64)

    if debug:
        print(f'[DEBUG] f2 最终长度: {len(f2)}')

    # ==========================================================
    # 步骤 7: 最终 base64 编码
    # ==========================================================
    d_param = M_encode(f2)
    if debug:
        print(f'[DEBUG] d 参数长度: {len(d_param)}')

    return d_param


# ============================================================
# 十、生成完整请求参数
# ============================================================

def generate_request(
    t_array: List[List[int]],
    o_array: List[List[int]],
    f1_array: List[List[int]],
    random_n: Optional[str] = None,
    random_seed: Optional[List[int]] = None,
    debug: bool = False
) -> Dict[str, Any]:
    """
    生成完整的请求参数
    
    Args:
        t_array: 75 个元素的二维数组
        o_array: 14 个元素的二维数组
        f1_array: 13 个元素的二维数组
        random_n: 可选，指定 n 参数
        random_seed: 可选，指定随机种子
        debug: 是否打印调试信息
    
    Returns:
        请求参数字典
    """
    if random_n is None:
        random_n = G()
    
    d_param = generate_d_param(
        t_array,
        o_array,
        f1_array,
        random_seed=random_seed,
        debug=debug
    )
    
    return {
        'n': random_n,
        'd': d_param,
        'p': APP_ID,
        'v': SDK_VERSION,
        'vk': VERSION_KEY
    }


# ============================================================
# 十一、数据定义 (固定数组，从浏览器提取)
# ============================================================

# t 数组 (75 个元素)
T_ARRAY = [
    [0, -38, 0, 1, 2],
    [0, -31, 0, 1, 2],
    [0, -4, 0, 31, 52, 52, 49, 48, 48, 44, 50, 44, 49, 44, 48, 44, 50, 44, 101, 120, 112, 108, 105, 99, 105, 116, 44, 115, 112, 101, 97, 107, 101, 114, 115],
    [0, -2, 0, 1, 6],
    [0, -3, 0, 7, 48, 46, 48, 46, 48, 46, 48],
    [1, 5, 0, 1, 2],
    [1, 6, 0, 7, 48, 46, 48, 46, 48, 46, 48],
    [1, 7, 0, 8, 2, 3, 0, 1, 0, 2, 2, 2],
    [1, 9, 0, 0],
    [1, 23, 0, 5, 50, 50, 50, 50, 49],
    [1, 24, 0, 1, 33],
    [1, 27, 0, -37, 80, 68, 70, 32, 86, 105, 101, 119, 101, 114, 95, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 112, 100, 102, 44, 116, 101, 120, 116, 47, 112, 100, 102, 44, 67, 104, 114, 111, 109, 101, 32, 80, 68, 70, 32, 86, 105, 101, 119, 101, 114, 95, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 112, 100, 102, 44, 116, 101, 120, 116, 47, 112, 100, 102, 44, 67, 104, 114, 111, 109, 105, 117, 109, 32, 80, 68, 70, 32, 86, 105, 101, 119, 101, 114, 95, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 112, 100, 102, 44, 116, 101, 120, 116, 47, 112, 100, 102, 44, 77, 105, 99, 114, 111, 115, 111, 102, 116, 32, 69, 100, 103, 101, 32, 80, 68, 70, 32, 86, 105, 101, 119, 101, 114, 95, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 112, 100, 102, 44, 116, 101, 120, 116, 47, 112, 100, 102, 44, 87, 101, 98, 75, 105, 116, 32, 98, 117, 105, 108, 116, 45, 105, 110, 32, 80, 68, 70, 95, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 112, 100, 102, 44, 116, 101, 120, 116, 47, 112, 100, 102],
    [1, -11, 0, 1, 0],
    [1, -9, 0, 8, 50, 50, 50, 50, 50, 50, 50, 50],
    [1, -7, 0, 3, 49, 50, 50],
    [1, -3, 0, 13, 111, 98, 106, 101, 99, 116, 32, 87, 105, 110, 100, 111, 119],
    [1, -4, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, -2, 0, 13, 51, 54, 46, 50, 50, 46, 50, 53, 50, 46, 49, 55, 54],
    [1, -1, 0, 0],
    [2, 0, 0, 1, 2],
    [2, 1, 0, 81, -26, -69, -111, -27, -118, -88, -26, -117, -68, -27, -101, -66, -23, -86, -116, -24, -81, -127, -25, -96, -127, 95, -26, -117, -68, -27, -101, -66, -23, -86, -116, -24, -81, -127, 95, -27, -101, -66, -27, -67, -94, -23, -86, -116, -24, -81, -127, 95, -27, -100, -88, -25, -70, -65, -28, -67, -109, -23, -86, -116, 95, -25, -67, -111, -26, -104, -109, -26, -103, -70, -28, -68, -127, -62, -73, -26, -104, -109, -25, -101, -66],
    [2, -68, 0, 32, 104, 116, 116, 112, 115, 58, 47, 47, 100, 117, 110, 46, 49, 54, 51, 46, 99, 111, 109, 47, 116, 114, 105, 97, 108, 47, 106, 105, 103, 115, 97, 119],
    [2, -55, 0, 8, 0, 0, 3, -42, 0, 0, 3, -4],
    [3, 32, 0, 8, 53, 98, 102, 49, 54, 50, 54, 98],
    [3, 33, 0, 0],
    [3, 34, 0, 8, 101, 53, 99, 100, 52, 100, 101, 54],
    [3, 35, 0, 8, 97, 52, 99, 54, 50, 50, 101, 49],
    [3, 36, 0, 8, 56, 57, 101, 55, 99, 52, 56, 57],
    [3, -122, 0, 16, 73, 41, -111, 99, 116, 101, -89, -67, -108, 33, -108, -126, -36, -12, -11, 46],
    [3, -120, 0, 16, -15, -47, 69, -108, 19, 57, -117, 54, -111, 30, 68, -72, -107, -50, -8, -14],
    [0, -56, 0, 125, 77, 111, 122, 105, 108, 108, 97, 47, 53, 46, 48, 32, 40, 87, 105, 110, 100, 111, 119, 115, 32, 78, 84, 32, 49, 48, 46, 48, 59, 32, 87, 105, 110, 54, 52, 59, 32, 120, 54, 52, 41, 32, 65, 112, 112, 108, 101, 87, 101, 98, 75, 105, 116, 47, 53, 51, 55, 46, 51, 54, 32, 40, 75, 72, 84, 77, 76, 44, 32, 108, 105, 107, 101, 32, 71, 101, 99, 107, 111, 41, 32, 67, 104, 114, 111, 109, 101, 47, 49, 53, 50, 46, 48, 46, 48, 46, 48, 32, 83, 97, 102, 97, 114, 105, 47, 53, 51, 55, 46, 51, 54, 32, 69, 100, 103, 47, 49, 53, 50, 46, 48, 46, 48, 46, 48],
    [0, -55, 0, 5, 122, 104, 45, 67, 78],
    [0, -54, 0, 1, 24],
    [0, -53, 0, 1, 1],
    [0, -50, 0, 1, 20],
    [0, -49, 0, 1, 1],
    [0, -48, 0, 1, 1],
    [0, -47, 0, 1, 1],
    [0, -46, 0, 1, 2],
    [0, -45, 0, 1, 2],
    [0, -43, 0, 5, 87, 105, 110, 51, 50],
    [0, -42, 0, 7, 117, 110, 107, 110, 111, 119, 110],
    [0, -40, 0, 16, 124, 49, 44, 121, 95, -38, 89, -14, -52, -52, -68, -61, -6, -57, -54, 34],
    [0, -39, 0, 16, 106, -32, 64, -87, -53, 20, 118, -68, 72, -74, 100, 112, 67, -117, -9, -89],
    [0, -33, 0, 1, 2],
    [0, -28, 0, 1, 1],
    [0, -27, 0, 1, 2],
    [0, -23, 0, 117, 53, 46, 48, 32, 40, 87, 105, 110, 100, 111, 119, 115, 32, 78, 84, 32, 49, 48, 46, 48, 59, 32, 87, 105, 110, 54, 52, 59, 32, 120, 54, 52, 41, 32, 65, 112, 112, 108, 101, 87, 101, 98, 75, 105, 116, 47, 53, 51, 55, 46, 51, 54, 32, 40, 75, 72, 84, 77, 76, 44, 32, 108, 105, 107, 101, 32, 71, 101, 99, 107, 111, 41, 32, 67, 104, 114, 111, 109, 101, 47, 49, 53, 50, 46, 48, 46, 48, 46, 48, 32, 83, 97, 102, 97, 114, 105, 47, 53, 51, 55, 46, 51, 54, 32, 69, 100, 103, 47, 49, 53, 50, 46, 48, 46, 48, 46, 48],
    [0, -22, 0, 20, 122, 104, 45, 67, 78, 44, 101, 110, 44, 101, 110, 45, 71, 66, 44, 101, 110, 45, 85, 83],
    [0, -18, 0, 0],
    [0, -17, 0, 10, 67, 83, 83, 49, 67, 111, 109, 112, 97, 116],
    [0, -14, 0, 8, 8, 0, 4, -128, 8, 0, 4, 80],
    [0, -13, 0, 1, 6],
    [0, -6, 0, 1, 2],
    [0, -5, 0, 1, 0],
    [1, 2, 0, 1, 16],
    [1, 4, 0, 4, 0, 65, -128, 0],
    [1, 8, 0, 1, 0],
    [1, 11, 0, 1, 24],
    [1, 17, 0, 16, 8, -51, -13, -24, 1, -74, -101, -36, 55, 105, 91, -72, 37, -62, 31, -84],
    [3, -123, 0, 105, 71, 111, 111, 103, 108, 101, 32, 73, 110, 99, 46, 32, 40, 73, 110, 116, 101, 108, 41, 58, 65, 78, 71, 76, 69, 32, 40, 73, 110, 116, 101, 108, 44, 32, 73, 110, 116, 101, 108, 40, 82, 41, 32, 85, 72, 68, 32, 71, 114, 97, 112, 104, 105, 99, 115, 32, 54, 51, 48, 32, 40, 48, 120, 48, 48, 48, 48, 51, 69, 57, 56, 41, 32, 68, 105, 114, 101, 99, 116, 51, 68, 49, 49, 32, 118, 115, 95, 53, 95, 48, 32, 112, 115, 95, 53, 95, 48, 44, 32, 68, 51, 68, 49, 49, 41],
    [1, -6, 0, 1, 2],
    [1, -10, 0, 10, 100, 1, 0, 0, 0, 0, -1, -1, -1, -1],
    [0, -1, 0, 5, 85, 84, 70, 45, 56],
    [1, 1, 0, 0],
    [3, -124, 0, 16, 107, -121, -24, -16, 44, -41, 41, 26, 34, -91, -57, -52, -59, -14, 105, -59],
    [1, -12, 0, 19, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    [1, 28, 0, -108, 120, 56, 54, 44, 67, 104, 114, 111, 109, 105, 117, 109, 95, 49, 53, 50, 44, 78, 111, 116, 63, 65, 95, 66, 114, 97, 110, 100, 95, 50, 52, 44, 77, 105, 99, 114, 111, 115, 111, 102, 116, 32, 69, 100, 103, 101, 95, 49, 53, 50, 44, 67, 104, 114, 111, 109, 105, 117, 109, 95, 49, 53, 50, 46, 48, 46, 55, 57, 55, 55, 46, 54, 53, 44, 78, 111, 116, 63, 65, 95, 66, 114, 97, 110, 100, 95, 50, 52, 46, 48, 46, 48, 46, 48, 44, 77, 105, 99, 114, 111, 115, 111, 102, 116, 32, 69, 100, 103, 101, 95, 49, 53, 50, 46, 48, 46, 52, 49, 57, 49, 46, 53, 51, 44, 102, 97, 108, 115, 101, 44, 54, 52, 44, 44, 87, 105, 110, 100, 111, 119, 115, 44, 49, 57, 46, 48, 46, 48],
    [3, -113, 0, 1, 1],
    [3, -112, 0, 4, 0, -96, 0, 0],
    [3, -111, 0, 4, 0, 0, 0, -1],
    [3, -110, 0, 39, 48, 46, 48, 57, 57, 57, 57, 57, 57, 48, 52, 54, 51, 50, 53, 54, 56, 51, 54, 44, 48, 46, 49, 48, 48, 48, 48, 48, 48, 50, 51, 56, 52, 49, 56, 53, 55, 57, 49],
    [3, -102, 0, 0],
    [3, -61, 0, 31, 104, 116, 116, 112, 115, 58, 47, 47, 100, 117, 110, 46, 49, 54, 51, 46, 99, 111, 109, 47, 116, 114, 105, 97, 108, 47, 115, 101, 110, 115, 101],
    [3, -60, 0, 1, 3]
]

# o 数组 (14 个元素)
O_ARRAY = [
    [0, 2, 0, 16, 89, 68, 48, 48, 49, 57, 50, 50, 56, 51, 48, 53, 56, 50, 50, 51],
    [0, 3, 0, 32, 114, 74, 48, 75, 115, 119, 69, 109, 43, 106, 57, 70, 65, 104, 86, 65, 69, 65, 101, 100, 85, 68, 66, 105, 47, 106, 116, 77, 78, 102, 47, 115],
    [0, 4, 0, 17, 50, 46, 48, 46, 49, 51, 95, 121, 97, 110, 122, 104, 101, 110, 103, 109, 97],
    [0, 5, 0, 32, 55, 98, 99, 102, 102, 98, 53, 98, 54, 48, 48, 55, 52, 49, 53, 54, 97, 56, 99, 50, 100, 53, 97, 97, 102, 97, 52, 57, 101, 97, 57, 102],
    [0, 6, 0, 13, 49, 55, 56, 56, 50, 52, 55, 51, 54, 51, 53, 51, 52],
    [2, 3, 0, 4, 0, 0, 0, 55],
    [2, 4, 0, 4, 0, 0, 0, 1],
    [0, 121, 0, 12, 105, 110, 105, 116, 58, 49, 45, 103, 116, 115, 58, 49],
    [3, -114, 0, 7, 48, 46, 48, 46, 48, 46, 48],
    [1, 22, 0, 4, 0, -96, 0, 0],
    [11, -66, 0, 0],
    [11, -65, 0, 32, 55, 98, 99, 102, 102, 98, 53, 98, 54, 48, 48, 55, 52, 49, 53, 54, 97, 56, 99, 50, 100, 53, 97, 97, 102, 97, 52, 57, 101, 97, 57, 102],
    [3, -53, 0, 4, 0, 0, 0, -56],
    [3, -52, 0, 4, 0, 0, 5, 104]
]

# f1 数组 (13 个元素) - 来自 c[1]
F1_ARRAY = [
    [0, 110, 0, 2, 0, -112],
    [0, 111, 0, 2, 0, 1],
    [0, 112, 0, 2, 0, 2],
    [0, 113, 0, 2, 0, 2],
    [0, 114, 0, 2, 0, 0],
    [0, 115, 0, 2, 0, 0],
    [0, 116, 0, 2, 0, 0],
    [0, 117, 0, 2, 0, 2],
    [0, 118, 0, 2, 0, 0],
    [0, 119, 0, 2, 0, 0],
    [0, 120, 0, 2, 0, 0],
    [3, -57, 0, 2, 0, 1],
    [3, -56, 0, 2, 0, 0]
]


# ============================================================
# 十二、独立测试入口
# ============================================================

if __name__ == '__main__':
    random.seed(42)
    
    print('=' * 70)
    print('网易易盾验证码 d 参数生成器 - 动态版')
    print('=' * 70)
    print()
    
    # 演示动态生成
    print('[测试] 动态生成请求参数')
    print()
    
    request_params = generate_request(
        T_ARRAY, O_ARRAY, F1_ARRAY,
        debug=True
    )
    
    print()
    print('[最终请求参数]')
    print(f'  n: {request_params["n"]}')
    print(f'  d: {request_params["d"][:80]}...')
    print(f'  d 长度: {len(request_params["d"])}')
    print(f'  p: {request_params["p"]}')
    print(f'  v: {request_params["v"]}')
    print(f'  vk: {request_params["vk"]}')
    print()
    print('=' * 70)