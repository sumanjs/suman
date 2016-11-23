#!/usr/bin/env bash
SUMAN_EXTRANEOUS_EXECUTABLE=yes node --inspect --debug-brk `dirname $0`/cli.js "$@"