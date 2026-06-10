#!/usr/bin/env python3
"""Zip the built dist/ into pitz-itch.zip with index.html at the archive root.
itch.io requires index.html at the top level of the uploaded zip."""
import os
import sys
import zipfile

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist = os.path.join(root, "dist")
out = os.path.join(root, "pitz-itch.zip")

if not os.path.isfile(os.path.join(dist, "index.html")):
    sys.exit("dist/index.html not found — run `npm run build` first.")

count = 0
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for folder, _dirs, files in os.walk(dist):
        for name in files:
            if name.endswith(".map"):
                continue
            full = os.path.join(folder, name)
            arc = os.path.relpath(full, dist)  # paths relative to dist root
            z.write(full, arc)
            count += 1

size = os.path.getsize(out)
print(f"Wrote {out} ({size/1024:.0f} KB, {count} files)")
