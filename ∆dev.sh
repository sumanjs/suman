#!/usr/bin/env bash

WHICH_TSC=$(which tsc)

if [[ -z ${WHICH_TSC} ]]; then
    npm install -g typescript;
fi

tsc -w
