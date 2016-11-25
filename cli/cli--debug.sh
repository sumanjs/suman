#!/usr/bin/env bash

echo " => Local suman found => $LOCAL_SUMAN_FOUND"

if [ "$LOCAL_SUMAN_FOUND" = "yes" ]; then
SUMAN_EXTRANEOUS_EXECUTABLE=yes node --debug-brk=5858 --debug=5858 `dirname $0`/suman__internal "$@"
else
SUMAN_EXTRANEOUS_EXECUTABLE=yes node --debug-brk=5858 --debug=5858 $(node `dirname $0`/find-local-suman-executable.js) "$@"
fi