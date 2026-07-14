import re
import json
import time
import subprocess
from curl_cffi import requests


UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"

def step1_get_challenge_config():
    """Step 1: Request tracking page to get Akamai challenge config"""
    session = requests.Session()
    session.headers.update({
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    })

    print("Step 1: Request tracking page to get challenge config")
    resp = session.get("https://www.dhl.com/cn-zh/home/tracking.html", impersonate="chrome124")
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 403:
        jsc_conf_match = re.search(r'window\._jsc_ch_conf=({.*?});', resp.text)
        if jsc_conf_match:
            jsc_conf = json.loads(jsc_conf_match.group(1))
            print(f"Found challenge config: {json.dumps(jsc_conf, indent=2)}")
            return session, jsc_conf
        else:
            print("No challenge config found")
            return session, None
    else:
        print("Page loaded without challenge - likely already has valid cookies")
        return session, None

def step2_get_challenge_js(session, jsc_conf):
    """Step 2: Download the challenge JS script"""
    if not jsc_conf:
        return None
    
    js_url = f"https://www.dhl.com/_jsc_sbu/ws_sec_page.js?sc=9587&ev={jsc_conf['ev']}&jv={jsc_conf['jv']}&chType={jsc_conf['chType']}&chTs={jsc_conf['chTs']}&chID={jsc_conf['chID']}&chHash={jsc_conf['chHash']}"
    print(f"\nStep 2: Download challenge JS from: {js_url}")
    
    resp = session.get(js_url, impersonate="chrome124")
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        with open("d:/大胖狗的学习/逆向/胖狗逆向集/akm/challenge.js", "w", encoding="utf-8") as f:
            f.write(resp.text)
        print(f"Saved challenge JS ({len(resp.text)} bytes)")
        return resp.text
    return None

def step3_execute_challenge_js(jsc_conf):
    """Step 3: Execute challenge JS in Node.js to get sensor_data"""
    if not jsc_conf:
        return None, None
    
    node_script = f"""
const jsdom = require('jsdom');
const {{ JSDOM }} = jsdom;

const conf = {json.dumps(jsc_conf)};

const dom = new JSDOM(`<!DOCTYPE html><html><head><script>window._jsc_ch_conf = ${json.dumps(jsc_conf)};</script></head><body></body></html>`, {{
    url: 'https://www.dhl.com/cn-zh/home/tracking.html',
    userAgent: '{UA}',
    runScripts: 'dangerously',
    resources: 'usable'
}});

const window = dom.window;
const document = window.document;

Object.defineProperty(window, 'navigator', {{
    value: {{
        userAgent: '{UA}',
        appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        appName: 'Netscape',
        platform: 'Win32',
        languages: ['zh-CN', 'zh', 'en'],
        language: 'zh-CN',
        hardwareConcurrency: 8,
        deviceMemory: 8,
        webdriver: false,
        plugins: [],
        mimeTypes: [],
        cookieEnabled: true,
        onLine: true,
        doNotTrack: null,
        product: 'Gecko',
        productSub: '20030107',
        vendor: 'Google Inc.',
        vendorSub: '',
        maxTouchPoints: 0
    }},
    writable: true
}});

Object.defineProperty(window, 'screen', {{
    value: {{
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24
    }},
    writable: true
}});

Object.defineProperty(window, 'innerWidth', {{ value: 1920, writable: true }});
Object.defineProperty(window, 'innerHeight', {{ value: 920, writable: true }});
Object.defineProperty(window, 'outerWidth', {{ value: 1920, writable: true }});
Object.defineProperty(window, 'outerHeight', {{ value: 1080, writable: true }});
Object.defineProperty(window, 'devicePixelRatio', {{ value: 1, writable: true }});
Object.defineProperty(window, 'top', {{ value: window, writable: true }});
Object.defineProperty(window, 'self', {{ value: window, writable: true }});

window.performance = {{
    now: () => Date.now(),
    mark: () => {{}},
    measure: () => {{}}
}};

window.CSS = {{
    supports: (prop) => true
}};

window.Worker = function() {{
    this.terminate = () => {{}};
}};

const fs = require('fs');
const challengeCode = fs.readFileSync('d:/大胖狗的学习/逆向/胖狗逆向集/akm/challenge.js', 'utf8');

const scriptEl = document.createElement('script');
scriptEl.textContent = challengeCode;
document.head.appendChild(scriptEl);

setTimeout(() => {{
    console.log('=== CHALLENGE_RESULT ===');
    console.log(JSON.stringify(window._jsc_ch_conf));
    console.log('=== END_RESULT ===');
    process.exit(0);
}}, 3000);
"""
    
    with open("d:/大胖狗的学习/逆向/胖狗逆向集/akm/run_challenge.js", "w", encoding="utf-8") as f:
        f.write(node_script)
    
    print("\nStep 3: Executing challenge JS in Node.js...")
    result = subprocess.run(
        ["node", "d:/大胖狗的学习/逆向/胖狗逆向集/akm/run_challenge.js"],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    print(f"Node output: {result.stdout}")
    if result.stderr:
        print(f"Node errors: {result.stderr}")
    
    return None, None

def step4_get_sensor_data(jsc_conf):
    """Step 4: Generate sensor_data manually based on analysis"""
    if not jsc_conf:
        return None, None
    
    print("\nStep 4: Generating sensor_data manually")
    
    sensor_data = {
        "chHash": jsc_conf["chHash"],
        "chID": jsc_conf["chID"],
        "chTs": jsc_conf["chTs"],
        "chType": jsc_conf["chType"],
        "jv": jsc_conf["jv"],
        "ev": jsc_conf["ev"],
        "mt": jsc_conf.get("mt", "plab987"),
        "cv": jsc_conf.get("cv", "www.dhl.com"),
        "jsc_wid": jsc_conf.get("jsc_wid", ""),
        "env": {
            "n": {
                "userAgent": UA,
                "platform": "Win32",
                "language": "zh-CN",
                "languages": ["zh-CN", "zh", "en"],
                "hardwareConcurrency": 8,
                "deviceMemory": 8,
                "webdriver": False,
                "plugins": [],
                "cookieEnabled": True,
                "onLine": True,
                "vendor": "Google Inc.",
                "appName": "Netscape",
                "appVersion": "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
                "product": "Gecko",
                "productSub": "20030107",
                "vendorSub": ""
            },
            "s": {
                "width": 1920,
                "height": 1080,
                "availWidth": 1920,
                "availHeight": 1040,
                "colorDepth": 24,
                "pixelDepth": 24
            },
            "d": {
                "cookieEnabled": True
            },
            "w": {
                "innerWidth": 1920,
                "innerHeight": 920,
                "outerWidth": 1920,
                "outerHeight": 1080,
                "devicePixelRatio": 1
            },
            "browserType": "chrome",
            "browserVersion": "149",
            "jsCheck": 0,
            "iframeCheck": 1,
            "consoleCheck": 0,
            "performanceCheck": 1,
            "workerCheck": 1,
            "cssCheck": "true"
        }
    }
    
    return sensor_data, jsc_conf["jsc_wid"]

def step5_send_challenge(session, jsc_conf, sensor_data, jsc_wid):
    """Step 5: Send POST request with sensor_data to get _abck cookie"""
    if not jsc_conf or not sensor_data:
        return session
    
    print("\nStep 5: Sending challenge POST request")
    
    challenge_url = f"https://www.dhl.com/_jsc_sbu/challenge/jsc?sc=8891234&jv={jsc_conf['jv']}&ev={jsc_conf['ev']}&chType={jsc_conf['chType']}&chTs={jsc_conf['chTs']}&chID={jsc_conf['chID']}&chHash={jsc_conf['chHash']}"
    
    data = {
        "chHash": jsc_conf["chHash"],
        "chID": jsc_conf["chID"],
        "data": json.dumps(sensor_data),
        "jsc_wid": jsc_wid
    }
    
    resp = session.post(
        challenge_url,
        data=data,
        impersonate="chrome124",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": "https://www.dhl.com/cn-zh/home/tracking.html"
        }
    )
    
    print(f"Status: {resp.status_code}")
    print(f"Response headers: {dict(resp.headers)}")
    print(f"Cookies: {session.cookies.get_dict()}")
    
    return session

def step6_test_search(session):
    """Step 6: Test the search API with the obtained cookies"""
    print("\nStep 6: Testing search API")
    
    search_url = "https://www.dhl.com/utapi"
    
    resp = session.get(
        search_url,
        impersonate="chrome124",
        headers={
            "Referer": "https://www.dhl.com/cn-zh/home/tracking.html"
        }
    )
    
    print(f"Status: {resp.status_code}")
    print(f"Response body (first 500 chars): {resp.text[:500]}")
    
    return resp.status_code == 200

def main():
    session, jsc_conf = step1_get_challenge_config()
    
    if jsc_conf:
        step2_get_challenge_js(session, jsc_conf)
        sensor_data, jsc_wid = step4_get_sensor_data(jsc_conf)
        session = step5_send_challenge(session, jsc_conf, sensor_data, jsc_wid)
    
    success = step6_test_search(session)
    
    if success:
        print("\n✅ Success! Akamai bypass completed")
    else:
        print("\n❌ Failed to bypass Akamai")

if __name__ == "__main__":
    main()