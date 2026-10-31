from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent


class SpaHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        # Serve files relative to project root (not cwd)
        rel = super().translate_path(path)
        # SimpleHTTPRequestHandler uses os.getcwd(); rewrite to ROOT
        cwd = Path(os.getcwd()).resolve()
        try:
            return str(ROOT / Path(rel).resolve().relative_to(cwd))
        except Exception:
            return str(ROOT / Path(rel).name)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        req_path = parsed.path

        # If the request matches a real file, serve it normally.
        local_path = Path(self.translate_path(req_path))
        if local_path.exists() and local_path.is_file():
            return super().do_GET()

        # SPA fallback: for "pretty routes" like /login, serve index.html.
        _, ext = os.path.splitext(req_path)
        if ext == "":
            self.path = "/index.html"
            return super().do_GET()

        # Otherwise return default 404.
        return super().do_GET()


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 8000), SpaHandler)
    print("LearnSphere AI dev server running")
    print("Open http://127.0.0.1:8000/")
    server.serve_forever()


if __name__ == "__main__":
    main()

