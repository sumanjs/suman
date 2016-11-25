#!/usr/bin/env bash

# :) http://stackoverflow.com/questions/3601515/how-to-check-if-a-variable-is-set-in-bash

echo "dammmm"

if ! [ -z "${LOCAL_SUMAN_ALREADY_FOUND+x}" ]; then
    echo " => \$LOCAL_SUMAN_ALREADY_FOUND ? => $LOCAL_SUMAN_ALREADY_FOUND"
fi

# echo "parent diretory of this script => " `which $0` $(dirname `dirname $0`)

echo "path of suman executable => $0"
DIRN=$(dirname "$0")
echo "DIRN => $DIRN"
RL=$(readlink "$0");
echo "readlink => $RL"
EXECDIR=$(dirname $(dirname "$RL"));
echo "EXECDIR => $EXECDIR"

#DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

X=$(node -e "var path = require('path'); process.stdout.write(path.resolve('$DIRN/$EXECDIR'))");

echo "X => $X"

echo "DDDDIR => $DIR"

if [ "$LOCAL_SUMAN_ALREADY_FOUND" = "yes" ]; then
    # we know that this directory contains the local version of suman we want to use
    SUMAN_EXTRANEOUS_EXECUTABLE=yes node $X/cli.js "$@"

else

    # we are probably in the global install space, so let's find the local installation given pwd/cwd

    LOCAL_SUMAN=$(node $X/scripts/find-local-suman-executable.js)

    if [ -z "$LOCAL_SUMAN" ]; then
        # no local version found, so we fallback on the version in this directory, global or not
        echo " => No local Suman executable could be found, given the current directory => $PWD"
        echo " => Attempting to run installed version of Suman here => `dirname $0`"
        SUMAN_EXTRANEOUS_EXECUTABLE=yes node $X/cli.js "$@"

    else
        # local version found, so we run it
        SUMAN_EXTRANEOUS_EXECUTABLE=yes node "$LOCAL_SUMAN" "$@"
    fi


fi
