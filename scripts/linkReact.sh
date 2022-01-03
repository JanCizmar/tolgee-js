#!/bin/bash
set -x

# link react testapp
(cd testapps/react/node_modules &&
  rm -rf react &&
  ln -sf ../../../packages/react/node_modules/react .)

# link next testapp
(cd testapps/next/node_modules && 
  rm -rf react &&
  ln -sf ../../../packages/react/node_modules/react .)

# link gatsby testapp
(cd testapps/gatsby/node_modules &&
  rm -rf react &&
  ln -sf ../../../packages/react/node_modules/react .)