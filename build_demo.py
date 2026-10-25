#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cloud-url")
    args = parser.parse_args()

    cloud_url = args.cloud_url or ""
    if cloud_url:
        parsed = urlparse(cloud_url)
        if (parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password or
                parsed.path not in ("", "/") or parsed.query or parsed.fragment):
            parser.error("--cloud-url must be an HTTPS origin without credentials, path, query, or fragment")

    template = ROOT / "worker" / "worker.template.js"
    output = ROOT / "worker" / "worker.js"
    output.write_text(template.read_text())

    index = ROOT / "index.html"
    html = index.read_text()
    marker = re.compile(r'window\.COA_CLOUD_URL = "(?:[^"\\]|\\.)*";')
    encoded_url = json.dumps(cloud_url).replace("<", "\\u003c")
    updated, count = marker.subn(lambda _: f"window.COA_CLOUD_URL = {encoded_url};", html)
    if count != 1:
        raise SystemExit("index.html must contain exactly one COA_CLOUD_URL setting")
    index.write_text(updated)


if __name__ == "__main__":
    main()
