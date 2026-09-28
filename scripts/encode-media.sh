#!/usr/bin/env bash
# Encodes the supplied 4K masters into web plates for the film.
#   desktop  1600×900  H.264, keyframe every 6 frames (fast scroll-seeking), light denoise
#   phone    720×1280  centre crop of the same master
#   posters  first frame (webp) + a representative still for reduced motion
#   audio    AAC beds, loudness-matched, for the optional sound mode
# Usage: scripts/encode-media.sh "/path/to/masters"
set -euo pipefail

SRC="${1:?path to the folder of masters}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media"
mkdir -p "$OUT"

# id | master file | start s | duration s | still at s (relative)
CLIPS=(
  "origin|scene1.mp4|0|10|8"
  "intelligence|scene2.mp4|9|11|6"
  "systems|scene3.mp4|0|10|4"
  "real-world|scene4.mp4|0|10|8"
  "map-a|scene 5a.mp4|0|10|9"
  "map-b|scene5b.mp4|0|10|8"
  "map-c|scene 5c.mp4|0|10|8"
  "map-e|scene 5e.mp4|0|8|3"
)

DN="hqdn3d=3:2:6:4"
X264=(-c:v libx264 -preset slow -tune film -crf 27 -g 6 -bf 0 -pix_fmt yuv420p -movflags +faststart -an)

for row in "${CLIPS[@]}"; do
  IFS='|' read -r id file ss dur still <<<"$row"
  in="$SRC/$file"
  echo "== $id ($file)"
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$in" -vf "scale=1600:-2:flags=lanczos,$DN" "${X264[@]}" "$OUT/$id-16x9.mp4"
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$in" -vf "crop=ih*9/16:ih,scale=720:1280:flags=lanczos,$DN" "${X264[@]}" "$OUT/$id-9x16.mp4"
  ffmpeg -v error -y -i "$OUT/$id-16x9.mp4" -frames:v 1 -c:v libwebp -quality 70 "$OUT/$id-16x9.webp"
  ffmpeg -v error -y -i "$OUT/$id-9x16.mp4" -frames:v 1 -c:v libwebp -quality 70 "$OUT/$id-9x16.webp"
  ffmpeg -v error -y -ss "$still" -i "$OUT/$id-16x9.mp4" -frames:v 1 -c:v libwebp -quality 72 "$OUT/$id-still-16x9.webp"
  ffmpeg -v error -y -ss "$still" -i "$OUT/$id-9x16.mp4" -frames:v 1 -c:v libwebp -quality 72 "$OUT/$id-still-9x16.webp"
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$in" -vn -af "loudnorm=I=-26:TP=-3:LRA=11,afade=t=in:d=0.4,afade=t=out:st=$((dur - 1)):d=1" -c:a aac -b:a 96k -ac 2 "$OUT/$id.m4a"
done

ls -la "$OUT"
