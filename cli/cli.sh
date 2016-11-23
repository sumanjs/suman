#!/usr/bin/env bash
SUMAN_EXTRANEOUS_EXECUTABLE=yes node $(node `dirname $0`/find-local-suman-executable.js) "$@"