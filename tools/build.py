#!/usr/bin/env python3
"""Baut Libero '91 aus game/shell.html + game/js/*.js zusammen.

  python3 tools/build.py                 # dist/libero91.html + App-Asset (Schriften per Google-Link)
  python3 tools/build.py --embed-fonts   # zusätzlich die Pixel-Schriften ins App-Asset einbetten (offline-fähig)
"""
import base64, pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
DIST = ROOT / "dist" / "libero91.html"
ASSET = ROOT / "app" / "src" / "main" / "assets" / "index.html"
FONT_CSS = "https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&display=swap"
UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"
LATIN = re.compile(r"/\*\s*(latin|latin-ext)\s*\*/")


def page():
    js = "\n".join(p.read_text(encoding="utf-8") for p in sorted((GAME / "js").glob("*.js")))
    return (GAME / "shell.html").read_text(encoding="utf-8").replace("/*@@SCRIPT@@*/", js)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def embedded_fonts():
    css = fetch(FONT_CSS).decode("utf-8")
    blocks = re.findall(r"(/\*[^*]*\*/\s*@font-face\s*{[^}]*})", css)
    keep = [b for b in blocks if LATIN.search(b)] or re.findall(r"@font-face\s*{[^}]*}", css)
    out = []
    for b in keep:
        def inline(m):
            data = base64.b64encode(fetch(m.group(1))).decode("ascii")
            return f"url(data:font/woff2;base64,{data})"
        out.append(re.sub(r"url\((https://[^)]+)\)", inline, b))
    return "<style>\n" + "\n".join(out) + "\n</style>"


def app_page(html, embed):
    if embed:
        try:
            fonts = embedded_fonts()
            html = re.sub(r'<link rel="preconnect"[^>]*>\n?', "", html)
            html = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', fonts, html)
            print("Schriften eingebettet.")
        except Exception as e:  # App läuft auch ohne, dann mit Ersatzschrift
            print(f"::warning::Schriften konnten nicht eingebettet werden: {e}")
    i = html.index("<style>")
    head, rest = html[:i], html[i:]
    j = rest.index("</style>") + len("</style>")
    style, body = rest[:j], rest[j:]
    style = style.replace("<style>", "<style>\nhtml,body{margin:0}\n[hidden]{display:none!important}\nimg{max-width:100%}\n"
                          ":root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\n", 1)
    return ('<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + style + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n")


def main():
    html = page()
    DIST.parent.mkdir(parents=True, exist_ok=True)
    DIST.write_text(html, encoding="utf-8")
    ASSET.parent.mkdir(parents=True, exist_ok=True)
    ASSET.write_text(app_page(html, "--embed-fonts" in sys.argv), encoding="utf-8")
    print(f"{DIST.relative_to(ROOT)} und {ASSET.relative_to(ROOT)} geschrieben.")


if __name__ == "__main__":
    main()
