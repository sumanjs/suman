#!/usr/bin/env bash
#SUMAN_EXTRANEOUS_EXECUTABLE=yes node --inspect --debug-brk `dirname $0`/cli.js "$@"
SUMAN_EXTRANEOUS_EXECUTABLE=yes node --inspect --debug-brk $(node `dirname $0`/find-local-suman-executable.js) "$@"