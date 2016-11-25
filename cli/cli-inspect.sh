#!/usr/bin/env bash

if [ -z "$LOCAL_SUMAN_FOUND" ]; then
echo " => \$LOCAL_SUMAN_FOUND => $LOCAL_SUMAN_FOUND"
fi

DIRN=$(dirname "$0")
echo "DIRN => $DIRN"
RL=$(readlink "$0");
echo "readlink => $RL"
EXECDIR=$(dirname $(dirname "$RL"));
echo "EXECDIR => $EXECDIR"

#DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

X=$(node -e "var path = require('path'); process.stdout.write(path.resolve('$DIRN/$EXECDIR'))");
echo "X => $X"

if [ "$LOCAL_SUMAN_ALREADY_FOUND" = "yes" ]; then
SUMAN_EXTRANEOUS_EXECUTABLE=yes node --inspect --debug-brk $X/cli.js "$@"
else

 LOCAL_SUMAN=$(node $X/scripts/find-local-suman-executable.js)

    if [ -z "$LOCAL_SUMAN" ]; then
        # no local version found, so we fallback on the version in this directory, global or not
        echo " => No local Suman executable could be found, given the current directory => $PWD"
        echo " => Attempting to run installed version of Suman here => `dirname $0`"
        SUMAN_EXTRANEOUS_EXECUTABLE=yes node --inspect --debug-brk $X/cli.js "$@"

    else
        # local version found, so we run it
        SUMAN_EXTRANEOUS_EXECUTABLE=yes node --inspect --debug-brk "$LOCAL_SUMAN" "$@"
    fi

fi
