#!/usr/bin/env bash


echo " => Local suman found => $LOCAL_SUMAN_FOUND"

if [ "$LOCAL_SUMAN_FOUND" = "yes" ]; then
SUMAN_EXTRANEOUS_EXECUTABLE=yes babel-node --presets stage-3 `dirname $0`/suman__internal "$@"
else
SUMAN_EXTRANEOUS_EXECUTABLE=yes babel-node --presets stage-3 $(node `dirname $0`/find-local-suman-executable.js) "$@"
fi

