"""HTTPS requests to the configured ChatKHU gateway."""

import json
import sys
from urllib.parse import urlsplit

import requests


def main():
    request = json.load(sys.stdin)
    url = request["url"]
    target = urlsplit(url)
    if (
        target.scheme != "https"
        or target.netloc != "factchat-cloud.mindlogic.ai"
        or not target.path.startswith("/v1/gateway/")
    ):
        raise ValueError("Unexpected gateway address")

    headers = {
        key: value for key, value in request["headers"].items()
        if key.lower() in {"authorization", "content-type", "accept", "x-api-key"}
    }
    headers["User-Agent"] = f"DrawWeapon/1.0 python-requests/{requests.__version__}"
    body = request["body"]
    with requests.request(
        request["method"], url, headers=headers,
        data=body.encode("utf-8") if body is not None else None,
        allow_redirects=False, stream=True, timeout=(8, 175),
    ) as response:
        meta = {"status": response.status_code, "headers": {
            name: response.headers[name]
            for name in ("Content-Type", "Retry-After", "CF-Ray")
            if name in response.headers
        }}
        output = sys.stdout.buffer
        output.write(json.dumps(meta).encode("utf-8") + b"\n")
        total = 0
        for part in response.iter_content(65536):
            total += len(part)
            if total > 24 * 1024 * 1024:
                raise ValueError("Gateway response too large")
            output.write(part)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.Timeout:
        sys.exit(28)
    except (ValueError, OSError, requests.exceptions.RequestException):
        sys.exit(1)
