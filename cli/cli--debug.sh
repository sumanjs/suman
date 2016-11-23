#!/usr/bin/env bash

# SUMAN_EXTRANEOUS_EXECUTABLE=yes node --debug-brk=5858 --debug=5858 cli.js
SUMAN_EXTRANEOUS_EXECUTABLE=yes node --debug-brk=5858 --debug=5858 $(node `dirname $0`/find-local-suman-executable.js) "$@"