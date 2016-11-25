#!/usr/bin/env bash

# :) http://stackoverflow.com/questions/3601515/how-to-check-if-a-variable-is-set-in-bash

if ! [ -z "${LOCAL_SUMAN_FOUND+x}" ]; then
    echo " => \$LOCAL_SUMAN_FOUND ? => $LOCAL_SUMAN_FOUND"
fi

if [ "$LOCAL_SUMAN_FOUND" = "yes" ]; then
    # we know that this directory contains the local version of suman we want to use
    SUMAN_EXTRANEOUS_EXECUTABLE=yes node `dirname $0`/suman__internal "$@"

else

    # we are probably in the global install space, so let's find the local installation given pwd/cwd
    LOCAL_SUMAN=$(node `dirname $0`/find-local-suman-executable.js)

    if [ -z "$LOCAL_SUMAN" ]; then
        # no local version found, so we fallback on the version in this directory, global or not
        echo " => No local Suman executable could be found, given the current directory => $PWD"
        echo " => Attempting to run installed version of Suman here => `dirname $0`"
        SUMAN_EXTRANEOUS_EXECUTABLE=yes node `dirname $0`/suman__internal "$@"

    else
        # local version found, so we run it
        SUMAN_EXTRANEOUS_EXECUTABLE=yes node "$LOCAL_SUMAN" "$@"
    fi


fi
