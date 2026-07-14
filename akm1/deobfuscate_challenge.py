import re

def extract_string_array(js_content):
    match = re.search(r'function ws_s\([^)]+\)\{[^}]+return ws_s\(a,b\);\},ws_s\(a,b\);\}\s*function ws_r\(\)\{var c8=(\[.*?\]);', js_content, re.DOTALL)
    if match:
        array_str = match.group(1)
        strings = []
        current_str = ''
        in_string = False
        escape = False
        
        for i, char in enumerate(array_str):
            if escape:
                if char == 'x':
                    hex_code = array_str[i+1:i+3]
                    current_str += chr(int(hex_code, 16))
                    escape = False
                    continue
                current_str += char
                escape = False
                continue
                
            if char == '\\':
                escape = True
                continue
                
            if char == "'" and not escape:
                if in_string:
                    strings.append(current_str)
                    current_str = ''
                    in_string = False
                else:
                    in_string = True
                continue
                
            if in_string:
                current_str += char
                
        return strings
    return []

def main():
    with open("d:/大胖狗的学习/逆向/胖狗逆向集/akm/challenge.js", "r", encoding="utf-8") as f:
        js_content = f.read()
    
    strings = extract_string_array(js_content)
    print(f"Extracted {len(strings)} strings\n")
    
    interesting_patterns = [
        "challenge",
        "jsc",
        "sensor",
        "cookie",
        "POST",
        "fetch",
        "XHR",
        "ws_sec",
        "api",
        "utapi",
        "akamai",
        "abck",
        "set-cookie",
        "response",
        "request",
        "JSON",
        "encrypt",
        "hash",
        "md5",
        "sha",
        "navigator",
        "screen",
        "canvas",
        "WebGL",
        "performance",
        "crypto",
    ]
    
    print("Interesting strings:")
    for i, s in enumerate(strings):
        lower_s = s.lower()
        for pattern in interesting_patterns:
            if pattern.lower() in lower_s:
                print(f"  [{i}] {repr(s)}")
                break
    
    with open("d:/大胖狗的学习/逆向/胖狗逆向集/akm/extracted_strings.txt", "w", encoding="utf-8") as f:
        for i, s in enumerate(strings):
            f.write(f"{i}: {repr(s)}\n")
    
    print(f"\nSaved to extracted_strings.txt")

if __name__ == "__main__":
    main()