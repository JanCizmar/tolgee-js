#!/bin/bash

if grep -q "\"workspaces\": {" package.json; then
  echo ""
  echo "Seems like you are installing dependencies through 'npm install', which is forbidden."
  echo ""
  echo "    Use 'npm run init' or 'npm run install:root'"
  echo ""
  exit 1
fi