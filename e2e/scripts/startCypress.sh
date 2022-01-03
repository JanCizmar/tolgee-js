#!/bin/bash
set -x

ARGS="--browser chrome --headed"

if [ -n "$E2E_APP" ]; then
  cypress run $ARGS --spec "cypress/integration/$E2E_APP/**"
else
  cypress run $ARGS
fi