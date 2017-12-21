#!/usr/bin/env bash

set -e;

rm -rf node_modules
npm cache clean

npm install --silent --no-optional

which_istanbul="$(which istanbul)"

if [[ -z "$which_istanbul" ]]; then
    npm install -g istanbul --silent
fi
