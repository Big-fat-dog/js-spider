import re
import json
import time
from curl_cffi import requests


UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"

def main():
    session = requests.Session()
    session.headers.update({
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    })

    print("Step 1: Request tracking page to get Akamai challenge")
    resp = session.get("https://www.dhl.com/cn-zh/home/tracking.html", impersonate="chrome124")
    print(f"Status: {resp.status_code}")
    print(f"Cookies: {resp.cookies.get_dict()}")
    
    with open("d:/大胖狗的学习/逆向/胖狗逆向集/akm/page1.html", "w", encoding="utf-8") as f:
        f.write(resp.text)

    jsc_conf_match = re.search(r'window\._jsc_ch_conf=({.*?});', resp.text)
    if jsc_conf_match:
        jsc_conf = json.loads(jsc_conf_match.group(1))
        print(f"\nFound _jsc_ch_conf: {json.dumps(jsc_conf, indent=2)}")
        
        js_url = f"https://www.dhl.com/_jsc_sbu/ws_sec_page.js?sc=9587&ev={jsc_conf['ev']}&jv={jsc_conf['jv']}&chType={jsc_conf['chType']}&chTs={jsc_conf['chTs']}&chID={jsc_conf['chID']}&chHash={jsc_conf['chHash']}"
        print(f"\nFound Akamai JS URL: {js_url}")
        
        print("\nStep 2: Request Akamai JS challenge script")
        resp2 = session.get(js_url, impersonate="chrome124")
        print(f"Status: {resp2.status_code}")
        print(f"Cookies: {resp2.cookies.get_dict()}")
        print(f"Body length: {len(resp2.text)}")
        
        with open("d:/大胖狗的学习/逆向/胖狗逆向集/akm/challenge.js", "w", encoding="utf-8") as f:
            f.write(resp2.text)
            
        print("\nStep 3: Analyzing challenge JS...")
        analyze_challenge(resp2.text)
    else:
        print("No _jsc_ch_conf found in page")

def analyze_challenge(js_content):
    with open("d:/大胖狗的学习/逆向/胖狗逆向集/akm/challenge_analysis.txt", "w", encoding="utf-8") as f:
        f.write("=== Akamai Challenge JS Analysis ===\n\n")
        
        patterns = [
            ("sensor_data", "Sensor data parameter"),
            ("_abck", "ABCK cookie"),
            ("POST", "POST requests"),
            ("fetch", "Fetch API calls"),
            ("XMLHttpRequest", "XHR calls"),
            ("navigator", "Navigator checks"),
            ("screen", "Screen checks"),
            ("canvas", "Canvas fingerprint"),
            ("WebGL", "WebGL fingerprint"),
            ("devicePixelRatio", "Device pixel ratio"),
            ("performance", "Performance API"),
            ("crypto", "Crypto API"),
            ("Math.random", "Random generation"),
            ("Date.now", "Timestamp"),
            ("localStorage", "Local storage"),
            ("sessionStorage", "Session storage"),
            ("document.cookie", "Cookie operations"),
            ("window.", "Window properties"),
        ]
        
        for pattern, desc in patterns:
            count = js_content.count(pattern)
            if count > 0:
                f.write(f"Found {count} occurrences of '{pattern}' ({desc})\n")
                if count <= 5:
                    for i, match in enumerate(re.finditer(pattern, js_content)):
                        start = max(0, match.start() - 50)
                        end = min(len(js_content), match.end() + 50)
                        f.write(f"  Context {i+1}: {js_content[start:end]}\n")
                f.write("\n")

if __name__ == "__main__":
    main()