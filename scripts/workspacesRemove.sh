#!/bin/bash
set -x

# remove "workspaces" section from package.json, so npm installs only root packages
cp package.json package.json.original
cat package.json.original | sed -e '/"workspaces":/,+6d' > package.json