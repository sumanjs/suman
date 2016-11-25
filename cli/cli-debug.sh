#!/usr/bin/env bash

if [ -z "$LOCAL_SUMAN_FOUND" ]; then
echo " => \$LOCAL_SUMAN_FOUND => $LOCAL_SUMAN_FOUND"
fi

if [ "$LOCAL_SUMAN_FOUND" = "yes" ]; then
SUMAN_EXTRANEOUS_EXECUTABLE=yes node debug `dirname $0`/suman__internal "$@"
else
SUMAN_EXTRANEOUS_EXECUTABLE=yes node debug $(node `dirname $0`/find-local-suman-executable.js) "$@"
fi

