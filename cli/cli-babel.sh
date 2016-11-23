#!/usr/bin/env bash
SUMAN_EXTRANEOUS_EXECUTABLE=yes babel-node --presets stage-3 `dirname $0`/cli.js "$@"
