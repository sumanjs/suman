#!/usr/bin/env bash


#!/usr/bin/env bash

if ! [ -z "${LOCAL_SUMAN_ALREADY_FOUND+x}" ]; then
    echo " => \$LOCAL_SUMAN_ALREADY_FOUND ? => $LOCAL_SUMAN_ALREADY_FOUND"
fi

echo " => Original path of Suman executable => \"$0\""
DIRN=$(dirname "$0")
RL=$(readlink "$0");
EXECDIR=$(dirname $(dirname "${RL}"));
MYPATH="$DIRN/$EXECDIR";
X=$(cd $(dirname ${MYPATH}) && pwd)/$(basename ${MYPATH})


export NODE_PATH=${NODE_PATH}:~/.suman/node_modules

if [ "${LOCAL_SUMAN_ALREADY_FOUND}" = "yes" ]; then
SUMAN_EXTRANEOUS_EXECUTABLE=yes babel-node --presets stage-3 ${X}/cli.js "$@"
else

 LOCAL_SUMAN=$(node ${X}/scripts/find-local-suman-executable.js)

    if [ -z "${LOCAL_SUMAN}" ]; then
        # no local version found, so we fallback on the version in this directory, global or not
        echo " => No local Suman executable could be found, given the current directory => $PWD"
        echo " => Attempting to run installed version of Suman here => `dirname $0`"
        SUMAN_EXTRANEOUS_EXECUTABLE=yes babel-node --presets stage-3 ${X}/cli.js "$@"

    else
        # local version found, so we run it
        SUMAN_EXTRANEOUS_EXECUTABLE=yes babel-node --presets stage-3 "${LOCAL_SUMAN}" "$@"
    fi

fi


