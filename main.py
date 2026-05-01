"""
titiler/main.py
───────────────────────────────────────────────────────────────────────────
TiTiler tile server for Savak GIS.

Reads Cloud-Optimised GeoTIFFs (COGs) stored on Cloudflare R2 and serves
them as XYZ map tiles that Leaflet can consume directly.

To run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Then open: http://localhost:8000/docs  (auto-generated API docs)
───────────────────────────────────────────────────────────────────────────
"""

from titiler.core.application import TilerFactory
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# ── App setup ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Savak GIS Tile Server",
    description="Serves Cloud-Optimised GeoTIFFs as XYZ map tiles for the Savak GIS dashboard.",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────
# Add your production frontend domain here.
# During development, localhost:5500 (Live Server) and localhost:3000 are allowed.
#
# IMPORTANT: Before going live, replace "*" in the origins list with your
# actual domain (e.g. "https://savak.resourcesfuture.com") for security.

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── TiTiler COG endpoint ───────────────────────────────────────────────────
# Mounts the /cog route which handles:
#   GET /cog/tiles/{z}/{x}/{y}   ← what Leaflet calls
#   GET /cog/info                ← metadata about a COG
#   GET /cog/statistics          ← value range info (useful for rescale)

cog = TilerFactory()
app.include_router(cog.router, prefix="/cog", tags=["Cloud Optimised GeoTIFF"])

add_exception_handlers(app, DEFAULT_STATUS_CODES)

# ── Health check ───────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
