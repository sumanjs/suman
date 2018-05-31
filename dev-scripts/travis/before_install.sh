#!/usr/bin/env bash


npm install -g typescript

npm install\
    "@types/async" \
    "@types/chai"\
    "@types/core-js" \
    "@types/lodash"\
    "@types/node"\
    "@types/semver"\
    "@types/socket.io"\
    "@types/socket.io-client"


tsc || echo "whatever";
