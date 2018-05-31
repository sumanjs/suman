#!/usr/bin/env bash

#set -e;

#which_istanbul="$(which istanbul)"
#
#if [[ -z "$which_istanbul" ]]; then
#    npm install -g istanbul --silent
#fi
#
#rm -rf node_modules
#npm cache verify # npm cache clean
#
#npm install --loglevel=warn ;
#
#npm link -f;
#npm link suman;

npm install         \
    "suman-types"   \
    "@types/async"  \
    "@types/chai"   \
    "@types/core-js" \
    "@types/lodash" \
    "@types/node"  \
    "@types/semver" \
    "@types/socket.io" \
    "@types/socket.io-client"

npm install -g typescript@2.8.3
tsc || echo "whatevs"
npm install
npm link -f
npm link suman

