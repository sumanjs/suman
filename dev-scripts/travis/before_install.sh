#!/usr/bin/env bash


which_istanbul="$(which istanbul)"

if [[ -z "$which_istanbul" ]]; then
    npm install -g istanbul --loglevel=warn
fi


which_tsc="$(which tsc)"

if [[ -z "$which_tsc" ]]; then
    npm install -g typescript@2.8.3 --loglevel=warn
fi
