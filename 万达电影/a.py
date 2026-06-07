import requests


headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "MX-API": "{\"ver\":\"v1.0.0\",\"sCode\":\"Wanda\",\"_mi_\":\"\",\"width\":1280,\"json\":true,\"cCode\":\"1_3\",\"check\":\"6aa17870caa8c658567a0441673ea9bd\",\"ts\":1780806015163,\"heigth\":720,\"appId\":\"3\"}",
    "Pragma": "no-cache",
    "Referer": "https://www.wandacinemas.com/MovieList",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "sec-ch-ua": "\"Google Chrome\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\""
}
cookies = {
    "Hm_lvt_fb5d677ed5c8cf9aee8702b1472147e0": "1780801162",
    "HMACCOUNT": "DB3BD1AA6D57F3F6",
    "Hm_lpvt_fb5d677ed5c8cf9aee8702b1472147e0": "1780805711",
    "MXAPI": "%7B%22ver%22%3A%22v1.0.0%22%2C%22sCode%22%3A%22Wanda%22%2C%22_mi_%22%3A%22%22%2C%22width%22%3A1280%2C%22json%22%3Atrue%2C%22cCode%22%3A%221_3%22%2C%22check%22%3A%22748901fa54e7a03e7b77bbc2afe0f262%22%2C%22ts%22%3A1780806015164%2C%22heigth%22%3A720%2C%22appId%22%3A%223%22%7D"
}
url = "https://www.wandacinemas.com/api/proxy/content/pc/movie/hot_show.api"
params = {
    "tt": "1780806015163"
}
response = requests.get(url, headers=headers, cookies=cookies, params=params)

print(response.text)
print(response)