import requests


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
    "_": "1781411109906",
    "encoding": "ag-1",
    "sign": "zzc23c81b08ln0xcliusuovjw58qfbye8cy19660417"
}
data = 'haPXFV0RwQkoHw+orrYoEQCtiExbFCTW8+nbi/RECiPdJrjb+B8yGBNlh129aPZbbXdKFHAyLFyE/83gXzf7BpwujCiaXdx5FCTh+EgQuV9nUg1JC08bc0T0DGJ/kxHBuT7lAXtDIO2DfPEbJ5/L8mAGbRPlxEstqfL9V1IiCsa64i8u60YqqQQlFnkG6sEQdKnR99YYk1m7rxbRoTdckeqkMuPpWM8/gE3JxAgkpe4Ee0QZ8Axpyf3RZfW1XYU2UQl7lp/YiFS+wSVEJ7rrUSy86R54qlJh3AJeqeTrca07jEl8r2UtMlHDABFjNekVbLrSmp6epTRWRWhySzEVo70xYF6Ige5FImjaLRgbppZkz83EDfznynNsx0exnk4fo+Iv9WRgbjgbwtNg3MLAZy2r7pBO5MtT4FTaAXGbjiL4bVdNRyIluVeFXxP7FvlkuCWCtoDIJpzksRYuUY2QPyrHa1mSXQ5+MI1EYhFvDqpBK2Z1gH14DzNbEs5Eb42iGSKq+wpBqlJ6GRQov01k0lkoUzutmaW3GzDsXkeM7EECHPQpQF3KIVBqHHP+TAcBtadAc9UtBXt+T6MFHHvgOZ8yFW//LcMh5iJDG8JlPUO3fN+C0ewbumlPFK/dDYkhkEXyjkYQLTKYnR1kbcVEZAFKNP7z85sA0EpjCCwbfJazhmmBqdP6EhuPT49Bv836j86RJZMlw3SWZGQX4Vk18WWX7NVD3PpK/fQuGihaJZJF6O9G+4/7/Oy5+fBlKfRc57X+qD9ghPss8tZXo+o3JouJfZKu0hWERbbevvaG9zhD2cVaO+6MrkiBMism6cAtseEmVfna5MUDTFS5XDEIzq6P+B4+irSATo57Lth5ILBS8YwPfVQFk8fPY7atj4zxSOXbKUzb7YDVf0sRbgXgBpvDAw8kF8xqC7lPdw8t4vk8L2GSPA9+yk+Lq9Sq49ZpZ1QDO9Is4KiQAVLNbPw3tWI6+AI7MrVmZ0iJ'.encode('unicode_escape')
response = requests.post(url, headers=headers, cookies=cookies, params=params, data=data)

print(response.text)
print(response)