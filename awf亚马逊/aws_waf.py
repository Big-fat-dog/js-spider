"""
AWS WAF challenge token generator for lens.org (pure Python, browser-free).

Protocol recovered:
  GET  /inputs?client=browser   -> {challenge:{input,hmac,region}, challenge_type, difficulty}
  POST /mp_verify  (FormData: solution_metadata=<json>, solution_data=<b64 zeros>)
       -> {"token":"<uuid>:<b64>:<b64>"}

Envelope (the "Present"/parsine field):
  plaintext = "<crc32-hex>#<fingerprint-json>"
  IV        = 12 random bytes
  Present   = base64(IV) + "::" + hex(AES-GCM(key=6f71a512..., iv, plaintext))

solution_data (NetworkBandwidth PoW):
  difficulty 1 -> 1024 zero bytes, 2 -> 10240, 3 -> 102400, 4 -> 1048576, 5 -> 10485760
"""
import base64
import hashlib
import json
import os
import re
import time
import urllib.parse
import uuid
import zlib

import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

AES_KEY_HEX = "6f71a512b1e035eaab53d8be73120d3fb68a0ca346b9560aab3e5cdf753d5e98"
AES_KEY = bytes.fromhex(AES_KEY_HEX)

CHALLENGE_TYPE = "ha9faaffd31b4d5ede2a2e19d2d7fd525f66fee61911511960dcbb52d3c48ce25"

# difficulty -> NetworkBandwidth buffer size (from output.js)
DIFFICULTY_SIZES = {1: 1024, 2: 10240, 3: 102400, 4: 1048576, 5: 10485760}


def b64e(data: bytes) -> str:
    return base64.b64encode(data).decode()


def hexb(s: str) -> str:
    return base64.b64encode(s.encode()).decode()


def crc32hex(text: str) -> str:
    return format(zlib.crc32(text.encode("utf-8")) & 0xFFFFFFFF, "08X")


def aes_gcm_encrypt(plaintext: bytes, iv: bytes) -> bytes:
    aesgcm = AESGCM(AES_KEY)
    return aesgcm.encrypt(iv, plaintext, None)


def build_present(plaintext: str) -> str:
    iv = os.urandom(12)
    ct = aes_gcm_encrypt(plaintext.encode("utf-8"), iv)
    return b64e(iv) + "::" + ct.hex()


def build_solution_data(difficulty: int) -> str:
    size = DIFFICULTY_SIZES.get(difficulty, 1024)
    return b64e(bytes(size))


def parse_page(page_html: str):
    """Extract goku_props and challenge.js base URL from the WAF HTML page."""
    gp = {}
    m = re.search(r"window\.gokuProps\s*=\s*(\{.*?\});", page_html, re.S)
    if m:
        raw = m.group(1)
        for key in ("key", "iv", "context"):
            km = re.search(r'"%s"\s*:\s*"([^"]*)"' % key, raw)
            if km:
                gp[key] = km.group(1)
    base = None
    sm = re.search(r'<script src="(https://[^"]+/challenge\.js)"', page_html)
    if sm:
        base = sm.group(1).rsplit("/challenge.js", 1)[0]
    domain = None
    dm = re.search(r'window\.awsWafCookieDomainList\s*=\s*\[([^\]]*)\]', page_html)
    return {"goku_props": gp, "base_url": base}


def fetch_inputs(base_url: str, session: requests.Session) -> dict:
    url = base_url + "/inputs?client=browser"
    r = session.get(url, headers={"accept": "application/json, text/plain, */*",
                                  "origin": "https://lens.org", "referer": "https://lens.org/"})
    r.raise_for_status()
    return r.json()


def build_fingerprint(page_url: str = "https://lens.org/", referrer: str = "https://www.google.com/") -> str:
    """Construct the fingerprint JSON (the encrypted signal payload)."""
    now = int(time.time() * 1000)
    fp = {
        "metrics": {
            "fp2": 1, "browser": 1, "capabilities": 1, "gpu": 5, "dnt": 0,
            "math": 0, "screen": 0, "navigator": 0, "auto": 0, "stealth": 1,
            "subtle": 0, "canvas": 27, "formdetector": 0, "be": 1,
        },
        "start": now,
        "flashVersion": None,
        "plugins": [
            {"name": "PDF Viewer", "str": "PDF Viewer "},
            {"name": "Chrome PDF Viewer", "str": "Chrome PDF Viewer "},
            {"name": "Chromium PDF Viewer", "str": "Chromium PDF Viewer "},
            {"name": "Microsoft Edge PDF Viewer", "str": "Microsoft Edge PDF Viewer "},
            {"name": "WebKit built-in PDF", "str": "WebKit built-in PDF "},
        ],
        "dupedPlugins": "PDF Viewer Chrome PDF Viewer Chromium PDF Viewer Microsoft Edge PDF Viewer WebKit built-in PDF ||1280-720-672-24-*-*-*",
        "screenInfo": "1280-720-672-24-*-*-*",
        "referrer": referrer,
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "location": page_url,
        "webDriver": False,
        "capabilities": {
            "css": {"textShadow": 1, "WebkitTextStroke": 1, "boxShadow": 1, "borderRadius": 1,
                    "borderImage": 1, "opacity": 1, "transform": 1, "transition": 1},
            "js": {"audio": True, "geolocation": True, "localStorage": "supported",
                   "touch": False, "video": True, "webWorker": True},
            "elapsed": 1,
        },
        "gpu": {
            "vendor": "Google Inc. (AMD)",
            "model": "ANGLE (AMD, AMD Radeon 780M Graphics (0x00001900) Direct3D11 vs_5_0 ps_5_0, D3D11)",
            "extensions": [
                "ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_clip_control",
                "EXT_color_buffer_half_float", "EXT_depth_clamp", "EXT_disjoint_timer_query",
                "EXT_float_blend", "EXT_frag_depth", "EXT_polygon_offset_clamp",
                "EXT_shader_texture_lod", "EXT_texture_compression_bptc",
                "EXT_texture_compression_rgtc", "EXT_texture_filter_anisotropic",
                "EXT_texture_mirror_clamp_to_edge", "EXT_sRGB", "KHR_parallel_shader_compile",
                "OES_element_index_uint", "OES_fbo_render_mipmap", "OES_mapbuffer",
                "OES_standard_derivatives", "OES_texture_float", "OES_texture_float_linear",
                "OES_texture_half_float", "OES_texture_half_float_linear", "OES_vertex_array_object",
                "WEBGL_blend_func_extended", "WEBGL_color_buffer_float", "WEBGL_compressed_texture_astc",
                "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_etc1",
                "WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb",
                "WEBGL_debug_renderer_info", "WEBGL_debug_shaders", "WEBGL_depth_texture",
                "WEBGL_draw_buffers", "WEBGL_lose_context", "WEBGL_multi_draw",
                "WEBGL_provoking_vertex", "WEBGL_video_texture", "WEBKIT_WEBGL_compressed_texture_pvrtc",
            ],
        },
        "dnt": 0,
        "math": 0,
        "automation": 0,
        "stealth": 1,
        "crypto": 0,
        "canvas": {"hash": -252901508, "emailHash": None, "histogramBins": []},
        "formDetected": False,
        "numForms": 0,
        "numFormElements": 0,
        "be": 1,
        "end": now + 647,
        "errors": [],
        "version": "2.4.0",
        "id": str(uuid.uuid4()),
    }
    return json.dumps(fp, separators=(",", ":"))


def build_metrics() -> list:
    """Profiler metrics list attached to solution_metadata (values are not strictly validated)."""
    now = int(time.time() * 1000)
    tpl = [0.8, 1, 1, 1, 5, 0, 0, 0, 0, 1, 0, 27, 0, 1, 1.8, 1, 41.9, 2.2, 0, 44.1, 647.3, 1]
    names = ["2", "100", "101", "102", "103", "104", "105", "106", "107", "undefined",
             "108", "110", "111", "112", "3", "7", "1", "4", "5", "6", "0", "8"]
    return [{"name": n, "value": v, "unit": "2"} for n, v in zip(names, tpl)]


def build_solution_metadata(challenge: dict, present: str, checksum: str,
                            existing_token: str, goku_props: dict, domain: str) -> dict:
    return {
        "challenge": challenge,
        "solution": None,
        "signals": [{"name": "Zoey", "value": {"Present": present}}],
        "checksum": checksum,
        "existing_token": existing_token,
        "client": "Browser",
        "domain": domain,
        "metrics": build_metrics(),
        "goku_props": goku_props,
    }


def get_token(page_url: str = "https://lens.org/", referrer: str = "https://www.google.com/",
              existing_token: str = "", session: requests.Session = None) -> str:
    """Full pure-Python flow: returns the aws-waf-token."""
    if session is None:
        session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36"})

    # 1. load WAF page, extract goku_props + base url
    r = session.get(page_url)
    page = parse_page(r.text)
    if not page["base_url"] or not page["goku_props"]:
        raise RuntimeError("no WAF challenge page detected; response %s" % r.status_code)

    # 2. fetch challenge
    inp = fetch_inputs(page["base_url"], session)
    challenge = inp["challenge"]
    difficulty = inp.get("difficulty", 1)

    # 3. build fingerprint + envelope
    fp_json = build_fingerprint(page_url, referrer)
    checksum = crc32hex(fp_json)
    present = build_present(checksum + "#" + fp_json)

    # 4. build metadata + solution
    metadata = build_solution_metadata(challenge, present, checksum, existing_token,
                                       page["goku_props"], domain=urllib.parse.urlparse(page_url).hostname)
    solution_data = build_solution_data(difficulty)

    # 5. POST mp_verify
    url = page["base_url"] + "/mp_verify"
    files = {
        "solution_metadata": (None, json.dumps(metadata)),
        "solution_data": (None, solution_data),
    }
    resp = session.post(url, files=files, headers={"origin": page_url.rstrip("/"), "referer": page_url})
    resp.raise_for_status()
    data = resp.json()
    return data.get("token")
