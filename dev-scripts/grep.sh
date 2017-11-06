#!/usr/bin/env bash

if [[ -z "$1" ]]; then
    echo "please include an expression to search for as the first argument."
    exit 1;
fi

grep -r \
--exclude-dir="node_modules"              \
--exclude-dir=".git"                      \
--exclude-dir="dist"                      \
--exclude-dir=".idea"                     \
 "$1" .
