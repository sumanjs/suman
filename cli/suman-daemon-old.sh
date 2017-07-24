#!/usr/bin/env bash

echo " => Original path of Suman executable => \"$0\""
DIRN=$(dirname "$0")
RL=$(readlink "$0");
EXECDIR=$(dirname $(dirname "$RL"));
MYPATH="$DIRN/$EXECDIR";
X="$(cd $(dirname ${MYPATH}) && pwd)/$(basename ${MYPATH})"

SUMAN_DAEMON_PATH="lib/cli-commands/suman-daemon/index.js" # points to index file
NEW_NODE_PATH="${NODE_PATH}:~/.suman/global/node_modules"
NEW_PATH="${PATH}:~/.suman/global/node_modules/.bin"

if [[ "${LOCAL_SUMAN_ALREADY_FOUND}" == "yes" ]]; then
    # we know that this directory contains the local version of suman we want to use
    NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} SUMAN_EXTRANEOUS_EXECUTABLE=yes \
    node "${X}/${SUMAN_DAEMON_PATH}" --daemon $@ &

else
    # we are probably in the global install space, so let's find the local installation given pwd/cwd
    LOCAL_SUMAN="$(node ${X}/scripts/find-local-suman-executable.js)"

    if [[ -z "$LOCAL_SUMAN" ]]; then
        # no local version found, so we fallback on the version in this directory, global or not
        echo " => No local Suman executable could be found, given the current directory => $PWD"
        echo " => Attempting to run installed version of Suman here => '${X}/cli.js'"
        NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} SUMAN_EXTRANEOUS_EXECUTABLE=yes \
        node "${X}/${SUMAN_DAEMON_PATH}" --daemon $@  &

    else
        # local version found, so we run it
        echo "found local"
        myp=$(dirname "${LOCAL_SUMAN}")/${SUMAN_DAEMON_PATH};
        echo "myp $myp";
        NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} SUMAN_EXTRANEOUS_EXECUTABLE=yes \
        node "$myp" --daemon $@

    fi
fi

sleep 1;
echo "--dummy" > ${SUMANPIPEIN} # put one dummy value into the pipe for initial read

SUMAN_CAT_PID=`cat $HOME/.suman/cat-suman-f.pid | xargs`  # trim white space using xargs

