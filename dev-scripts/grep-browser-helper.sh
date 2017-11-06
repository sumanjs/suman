#!/usr/bin/env bash

# https://unix.stackexchange.com/questions/399590/get-unique-list-of-files-in-a-directory-that-do-not-contain-a-line

grep -r \
--exclude-dir="node_modules"                 \
--exclude-dir=".git"                         \
--exclude-dir="dist"                         \
--exclude-dir=".idea"                        \
--exclude-dir="test"                        \
--exclude="*.d.ts"                           \
--exclude="*.sh"                            \
--exclude="*.md"                            \
--exclude="*.json"                            \
--exclude="*.gitkeep"                            \
-FL                                           \
"suman-browser-polyfills/modules/process" \
.
