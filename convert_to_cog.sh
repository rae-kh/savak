#!/bin/bash
# scripts/convert_to_cog.sh
# ───────────────────────────────────────────────────────────────────────────
# Converts all GeoTIFFs in an input folder to Cloud-Optimised GeoTIFFs (COGs)
# and writes them to an output folder, ready to upload to Cloudflare R2.
#
# REQUIREMENTS:
#   GDAL must be installed.
#   - Mac:     brew install gdal
#   - Ubuntu:  sudo apt install gdal-bin
#   - Windows: install OSGeo4W or use the QGIS-bundled GDAL (see below)
#
# USAGE:
#   chmod +x scripts/convert_to_cog.sh
#   ./scripts/convert_to_cog.sh /path/to/your/tiffs /path/to/output
#
# WINDOWS (using QGIS GDAL):
#   Open the OSGeo4W shell that ships with QGIS, then run this script,
#   or run the gdal_translate commands manually for each file.
#
# WHAT THIS DOES:
#   - Adds internal tiling (256x256 tiles) so TiTiler can read small
#     chunks of the file without downloading the whole thing
#   - Adds overview levels (lower-resolution copies inside the file)
#     so zoomed-out views render quickly
#   - Applies DEFLATE compression to keep file sizes small
# ───────────────────────────────────────────────────────────────────────────

set -e

INPUT_DIR="${1:?Usage: ./convert_to_cog.sh <input_dir> <output_dir>}"
OUTPUT_DIR="${2:?Usage: ./convert_to_cog.sh <input_dir> <output_dir>}"

mkdir -p "$OUTPUT_DIR"

echo ""
echo "Converting GeoTIFFs in: $INPUT_DIR"
echo "Output will be written to: $OUTPUT_DIR"
echo ""

for input_file in "$INPUT_DIR"/*.tif "$INPUT_DIR"/*.tiff; do
  # Skip if no files match the glob
  [ -e "$input_file" ] || continue

  filename=$(basename "$input_file")
  output_file="$OUTPUT_DIR/$filename"

  echo "▸ Converting: $filename"

  # Step 1 — Convert to COG with tiling + DEFLATE compression
  gdal_translate \
    "$input_file" \
    "$output_file" \
    -of COG \
    -co TILED=YES \
    -co BLOCKXSIZE=256 \
    -co BLOCKYSIZE=256 \
    -co COMPRESS=DEFLATE \
    -co PREDICTOR=2 \
    -co COPY_SRC_OVERVIEWS=YES \
    --config GDAL_TIFF_OVR_BLOCKSIZE 256

  # Step 2 — Add overviews if they weren't already in the source file
  # (Zoom levels: 2x, 4x, 8x, 16x, 32x down from full resolution)
  gdaladdo \
    -r average \
    "$output_file" \
    2 4 8 16 32

  echo "  ✓ Done → $output_file"
  echo ""
done

echo "All files converted."
echo ""
echo "Next step: upload the files in $OUTPUT_DIR to your Cloudflare R2 bucket."
echo "See README.md → Step 2 for upload instructions."
