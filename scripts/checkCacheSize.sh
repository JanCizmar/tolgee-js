#!/bin/bash

# When turbo cache gets too large it's cheaper to recompute then to download it every time

MAX_SIZE="5000" # in mb

CACHE_DIR="node_modules/.cache/turbo"

if [ -d "$CACHE_DIR" ]; then
  # check the current size
  CHECK="`du -csm $CACHE_DIR`"
  SIZE="`echo $CHECK | grep -oE '^\s*[0-9]+'`"
else
  echo "CACHE EMPTY"
  exit 0
fi

echo $CHECK "(in mb)"

if [ "$SIZE" -gt "$MAX_SIZE" ]; then
  echo "TOO BIG, REMOVING"
  npm run clean:turbo
else
  echo "OK"
fi