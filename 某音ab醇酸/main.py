import requests
import time
from test import generate_a_bogus

timestamp_ms = int(time.time() * 1000)
headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "bd-ticket-guard-client-data": "eyJ0c19zaWduIjoidHMuMi42MmYyODg3NmFhM2RmZjlmZmMzYTIwMGU4NzQzYWE5YjUwZWQzM2E5YjNjNTFhZDZjMTRhZDc1ZjU1M2RjOWY4YzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50IjoidGlja2V0LHBhdGgsdGltZXN0YW1wIiwicmVxX3NpZ24iOiJVakRvZVV6N0Y5VkM5UkwyWDA5aEpQanE5a0Mwci9neU9RSGdVeVVYYWdFPSIsInRpbWVzdGFtcCI6MTc4MzU4Mzc4MH0=",
    "bd-ticket-guard-ree-public-key": "BCpJNzLJLqGagqFNrejewAEiytWpuAxrs99Z+yu4zHT9Ob+wFqLEupfqM6OU52Mp+e44hGOzCWelP/HY/iEHtuk=",
    "bd-ticket-guard-version": "2",
    "bd-ticket-guard-web-sign-type": "1",
    "bd-ticket-guard-web-version": "2",
    "cache-control": "no-cache",
    "origin": "https://www.douyin.com",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "referer": "https://www.douyin.com/",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"150\", \"Microsoft Edge\";v=\"150\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "uifid": "8a2c55e26caff587ca8dd1b4eead3becfa87fd6f92b6a9dc9b258d7d20c56a315c820d577e7cd02da7121d54d993b5168b068e3ad76e47583c7dc88964ad59401d2fd3f3ccec087140eab1c3901387bf91c3e9877342ae1b6718f470764761ba1303bbef908475e1bbac6b4dd24748e277f6d695fd14305ac89b959dbee5e1d2270031b220d19937ca947a02bbf4640ac3ca920d3cb8e9c4dd4065d1d1bec824",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"
}
cookie={}
url = "https://www-hj.douyin.com/aweme/v1/web/comment/list/"

ua = headers["user-agent"]
ms_token = "PMRiHmXKIC088P671gjU-Gt2RX7LFeFhZUbz265G9eV7rrFfDDhgV1JGGK88zXiRWi1TZdZr0G9Y-NvVhmGLJ0F2FYU0H7PA4gVpmKFkc5wzLbWZOZsWPeJp3d2rDv6IbATFFwDorljXO4CkdiZ0C-fE9mG9XXHcftl1RaHTT-Efcg0FagPNDas="

base_params = {
    "device_platform": "webapp",
    "aid": "6383",
    "channel": "channel_pc_web",
    "aweme_id": "7654431834596464232",
    "pc_img_format": "webp",
    "cursor": "10",
    "count": "10",
    "item_type": "0",
    "insert_ids": "",
    "whale_cut_token": "",
    "cut_version": "1",
    "rcFT": "",
    "update_version_code": "170400",
    "pc_client_type": "1",
    "pc_libra_divert": "Windows",
    "support_h265": "1",
    "support_dash": "1",
    "cpu_core_num": "16",
    "version_code": "170400",
    "version_name": "17.4.0",
    "cookie_enabled": "true",
    "screen_width": "1280",
    "screen_height": "720",
    "browser_language": "zh-CN",
    "browser_platform": "Win32",
    "browser_name": "Edge",
    "browser_version": "150.0.0.0",
    "browser_online": "true",
    "engine_name": "Blink",
    "engine_version": "150.0.0.0",
    "os_name": "Windows",
    "os_version": "10",
    "device_memory": "16",
    "platform": "PC",
    "downlink": "10",
    "effective_type": "4g",
    "round_trip_time": "150",
    "webid": "7544951663862318633",
    "uifid": "8a2c55e26caff587ca8dd1b4eead3becfa87fd6f92b6a9dc9b258d7d20c56a315c820d577e7cd02da7121d54d993b5168b068e3ad76e47583c7dc88964ad59401d2fd3f3ccec087140eab1c3901387bf91c3e9877342ae1b6718f470764761ba1303bbef908475e1bbac6b4dd24748e277f6d695fd14305ac89b959dbee5e1d2270031b220d19937ca947a02bbf4640ac3ca920d3cb8e9c4dd4065d1d1bec824",
    "verifyFp": "verify_mqkbxm1x_tPdfK6Yo_5t1i_4f5L_AJes_jUU5y53tMcOW",
    "fp": "verify_mqkbxm1x_tPdfK6Yo_5t1i_4f5L_AJes_jUU5y53tMcOW"
}

url_params_str = "&".join(f"{k}={v}" for k, v in base_params.items())

result = generate_a_bogus(ua, url_params_str, ms_token)
a_bogus = result['a_bogus']

params = base_params.copy()
params["msToken"] = ms_token
params["a_bogus"] = a_bogus

print(f"生成的 a_bogus: {a_bogus}")
print(f"长度: {len(a_bogus)}")

response = requests.get(url, headers=headers, cookies=cookies, params=params)

print(response.text)
print(response)