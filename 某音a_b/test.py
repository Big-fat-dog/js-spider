from gmssl import sm3
import random

SBOX_TABLES = {
    's3': 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe',
    's4': 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe'
}


def sm3_hash_bytes(data_bytes):
    return bytes.fromhex(sm3.sm3_hash(list(data_bytes)))


def modified_rc4_ksa(key):
    s_box = [255 - i for i in range(256)]
    j = 0
    key_len = len(key)
    for i in range(256):
        j = (j * s_box[i] + j + key[i % key_len]) % 256
        s_box[i], s_box[j] = s_box[j], s_box[i]
    return s_box


def modified_rc4_prga(s_box, plaintext):
    i, j = 0, 0
    ciphertext = []
    for byte in plaintext:
        i = (i + 1) % 256
        j = (j + s_box[i]) % 256
        s_box[i], s_box[j] = s_box[j], s_box[i]
        t = (s_box[i] + s_box[j]) % 256
        k = s_box[t]
        ciphertext.append(byte ^ k)
    return ciphertext


def modified_rc4_encrypt(key, plaintext):
    s_box = modified_rc4_ksa(key)
    return modified_rc4_prga(s_box, plaintext)


def custom_base64_encode(data_bytes, table_name='s4'):
    table = SBOX_TABLES[table_name]
    result = []
    length = len(data_bytes)
    i = 0
    while i < length:
        chunk = data_bytes[i:i + 3]
        chunk_len = len(chunk)
        if chunk_len == 3:
            combined = (chunk[0] << 16) | (chunk[1] << 8) | chunk[2]
        elif chunk_len == 2:
            combined = (chunk[0] << 16) | (chunk[1] << 8)
        elif chunk_len == 1:
            combined = chunk[0] << 16
        else:
            break
        result.append(table[(combined >> 18) & 0x3F])
        result.append(table[(combined >> 12) & 0x3F])
        if chunk_len > 1:
            result.append(table[(combined >> 6) & 0x3F])
        if chunk_len > 2:
            result.append(table[combined & 0x3F])
        i += 3
    return ''.join(result)


def generate_fingerprint_50(ua_hash, timestamp_ms, sys_info_len=40, aid=6383, page_id=6241):
    fp = [0] * 50

    arr_a = [0] * 20
    arr_a[3] = 156
    arr_a[9] = 131
    arr_a[18] = 198

    arr_b = [0] * 20
    arr_b[4] = 44
    arr_b[10] = 82
    arr_b[19] = 177

    arr_d = [74]

    fp[0] = 1
    fp[1] = 1 << 3
    fp[2] = ua_hash[11]
    fp[3] = (timestamp_ms >> 8) & 255
    fp[4] = 0
    fp[5] = timestamp_ms & 255
    fp[6] = 0
    fp[7] = 0
    fp[8] = 1
    fp[9] = arr_a[18]
    fp[10] = 1
    fp[11] = 3
    fp[12] = arr_a[3]
    fp[13] = (page_id >> 8) & 255
    fp[14] = ((timestamp_ms - (timestamp_ms - 10)) + 3) & 255
    fp[15] = arr_a[9]
    fp[16] = (timestamp_ms >> 32) & 255
    fp[17] = 0
    fp[18] = fp[3]
    fp[19] = aid & 255
    fp[20] = 50
    fp[21] = arr_b[4]
    fp[22] = (timestamp_ms >> 16) & 255
    fp[23] = 0
    fp[24] = ua_hash[5]
    fp[25] = arr_d[0]
    fp[26] = fp[22]
    fp[27] = (timestamp_ms >> 24) & 255
    fp[28] = 6
    fp[29] = fp[13]
    fp[30] = 3
    fp[31] = 0
    fp[32] = ua_hash[21]
    fp[33] = arr_b[10]
    fp[34] = 3
    fp[35] = 0
    fp[36] = fp[16]
    fp[37] = page_id & 255
    fp[38] = arr_b[19]
    fp[39] = 0
    fp[40] = 1
    fp[41] = 0
    fp[42] = 0
    fp[43] = 41
    fp[44] = (timestamp_ms - 8) & 255
    fp[45] = fp[27]
    fp[46] = sys_info_len
    fp[47] = 0
    fp[48] = 4
    fp[49] = 0

    return fp


def generate_a_bogus(ua,timestamp_ms, url_params, ms_token="", aid=6383, page_id=6241):
    # import time
    # timestamp_ms = int(time.time() * 1000)

    full_params = url_params + "&msToken=" + ms_token if ms_token else url_params
    url_hash_input = full_params + "dhzx"
    hash1 = sm3_hash_bytes(url_hash_input.encode('utf-8'))
    url_hash = sm3_hash_bytes(hash1)

    first_key = [0, 1, 8]
    first_encrypted = modified_rc4_encrypt(first_key, ua.encode('utf-8'))

    first_b64 = custom_base64_encode(first_encrypted, 's3')
    first_b64 += "="
    ua_hash = list(sm3_hash_bytes(first_b64.encode('utf-8')))

    sys_info = "552|588|1280|672|1280|672|1280|720|Win32"
    env_array = [ord(c) for c in sys_info]
    sys_info_len = len(env_array)

    ts_offset = timestamp_ms + 3
    ts_low8 = ts_offset & 0xFF
    ts_str = f"{ts_low8},"
    ts_array = [ord(c) for c in ts_str]

    version_sub = [1, 0]

    rand_val = random.random()
    rand_scaled = int(rand_val * 65535)
    r1 = rand_scaled & 255
    r2 = (rand_scaled >> 8) & 255

    mask_aa = 170
    mask_55 = 85

    first_4 = [
        (r1 & mask_aa) | (version_sub[0] & mask_55),
        (r1 & mask_55) | (version_sub[0] & mask_aa),
        (r2 & mask_aa) | (version_sub[1] & mask_55),
        (r2 & mask_55) | (version_sub[1] & mask_aa)
    ]

    second_4 = [
        (r2 & mask_aa) | (version_sub[0] & mask_55),
        (r2 & mask_55) | (version_sub[0] & mask_aa),
        (255 & mask_aa) | (version_sub[1] & mask_55),
        (255 & mask_55) | (version_sub[1] & mask_aa)
    ]

    fixed_fp = first_4 + second_4

    accum = fixed_fp[0]
    for i in range(1, len(fixed_fp)):
        accum ^= fixed_fp[i]

    extra_xor_values = [41, 50, 6, 13, 143, 217, 153, 48, 159, 1, 1, 0, 1, 0, 74, 3, 3, 0, 8, 0, 0, 0, 131, 198, 156,
                        82, 177, 44, 21, 92, 29, 135, 217, 153, 48, 159, 1, 3, 97, 24, 0, 0, 239, 24, 0, 0, 40, 0, 4, 0]
    for val in extra_xor_values:
        accum ^= val

    convergence_value = accum
    fingerprint_50 = generate_fingerprint_50(ua_hash, timestamp_ms, sys_info_len, aid, page_id)
    middle_95 = fingerprint_50 + env_array + ts_array + [convergence_value]

    confusion = []
    i = 0
    while i + 2 < len(middle_95):
        rand_val = random.random()
        r = int(rand_val * 1000) & 255

        confusion.extend([
            (r & 145) | (middle_95[i] & 110),
            (r & 66) | (middle_95[i + 1] & 189),
            (r & 44) | (middle_95[i + 2] & 211),
            (middle_95[i] & 145) | (middle_95[i + 1] & 66) | (middle_95[i + 2] & 44)
        ])
        i += 3

    while len(confusion) < 126:
        idx = 93 + (len(confusion) - 124)
        if idx < len(middle_95):
            confusion.append(middle_95[idx])
        else:
            confusion.append(44)

    confusion_126 = confusion[:126]
    full_134 = fixed_fp + confusion_126

    rc4_key = [211]
    rc4_ciphertext = modified_rc4_encrypt(rc4_key, full_134)

    prefix_rand = random.random()
    prefix_val = int(prefix_rand * 40)

    fixed_array = [3, 82]
    prefix_array = [
        (238 & mask_aa) | (fixed_array[0] & mask_55),
        (238 & mask_55) | (fixed_array[0] & mask_aa),
        (prefix_val & mask_aa) | (fixed_array[1] & mask_55),
        (prefix_val & mask_55) | (fixed_array[1] & mask_aa)
    ]

    final_binary = bytes(prefix_array) + bytes(rc4_ciphertext)
    a_bogus = custom_base64_encode(final_binary, 's4')

    return {
        'a_bogus': a_bogus,
        'timestamp': timestamp_ms,
        'fingerprint_50': fingerprint_50
    }


if __name__ == "__main__":
    test_ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0'

    base_url_params = 'device_platform=webapp&aid=6383&channel=channel_pc_web&action=heartbeat&new_user_login=0&update_version_code=170400&pc_client_type=1&pc_libra_divert=Windows&support_h265=1&support_dash=1&cpu_core_num=16&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1280&screen_height=720&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=150.0.0.0&browser_online=true&engine_name=Blink&engine_version=150.0.0.0&os_name=Windows&os_version=10&device_memory=16&platform=PC&downlink=10&effective_type=4g&round_trip_time=0&webid=7544951663862318633&uifid=8a2c55e26caff587ca8dd1b4eead3becfa87fd6f92b6a9dc9b258d7d20c56a315c820d577e7cd02da7121d54d993b5168b068e3ad76e47583c7dc88964ad59401d2fd3f3ccec087140eab1c3901387bf91c3e9877342ae1b6718f470764761ba1303bbef908475e1bbac6b4dd24748e277f6d695fd14305ac89b959dbee5e1d2270031b220d19937ca947a02bbf4640ac3ca920d3cb8e9c4dd4065d1d1bec824'

    expected_ms_token = 'opCbJA8EWXeQiv8jIbc-d6C8LDD6C9cTUWU67CFVtN-ihTOZNQoiwSt-NaEb5Yn5VwoggKWd1vQR6LOxqlag42JkEMdCFJxMv01lYhDgTNPP4_edrlPK5msW-ePXasoCSJWGQyNMgR9_ExscV68RigUcI7tVA7pdJEMsiOWUv6dh17dgX7-b7Ug%3D'

    result = generate_a_bogus(test_ua, base_url_params, ms_token=expected_ms_token)
    print(f"a_bogus: {result['a_bogus']}")
    print(f"长度: {len(result['a_bogus'])}")
    print(f"时间戳: {result['timestamp']}")
    print(f"50字节指纹前10: {result['fingerprint_50'][:10]}")
