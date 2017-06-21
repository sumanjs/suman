#!/usr/bin/env bash

# note to reader - if you wish to modify this file please move outside the ~/.suman dir, because suman
# may periodically update this file's contents which would overwrite your changes
# if you do so, just change your .bashrc or .zshrc, or whatever, to source your file instead of this one

function __handle_global_suman {

    WHICH_SUMAN=$(which suman);
    NEW_NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules
    NEW_PATH=${PATH}:~/.suman/global/node_modules/.bin

    if [ -z "${WHICH_SUMAN}" ]; then
        echo " => No global suman installation could be found with '\$ which suman', exitting..."
        return 1;
    else

        DIRN=$(dirname "$WHICH_SUMAN")
        RL=$(readlink "$WHICH_SUMAN");
        EXECDIR=$(dirname $(dirname "$RL"));
        MYPATH="$DIRN/$EXECDIR";
        X="$(cd $(dirname ${MYPATH}) && pwd)/$(basename ${MYPATH})"

        # $1 is the node exec args (inspect/debug etc), $2 is the original user args
        # we work with the first argument passed to this function
        local ref1="$1[@]";
        shift
        NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH}  node "${!ref1}" "${X}/cli.js" $@;
    fi
}


function suman {

    echo " => [suman] => Using 'suman' alias in suman-clis.sh..."
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

    NEW_NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules
    NEW_PATH=${PATH}:~/.suman/global/node_modules/.bin

    if [ -z "$LOCAL_SUMAN" ]; then
        echo " => No local Suman executable could be found, given the present working directory => $PWD"
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( )
        __handle_global_suman node_exec_args "$@"
    else
        NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} node "$LOCAL_SUMAN" $@;
    fi
}

function suman-inspect {

    echo " => Using 'suman-inspect' alias in suman-clis.sh..."
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

    NEW_NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules
    NEW_PATH=${PATH}:~/.suman/global/node_modules/.bin

    if [ -z "$LOCAL_SUMAN" ]; then
        echo " => No local Suman executable could be found, given the present working directory => $PWD"
        echo "You can use '$ which suman-debug' to find a globally installed version."
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( --inspect-brk )
        __handle_global_suman node_exec_args "$@"
    else
        echo "running node against local suman"
        NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} node --inspect-brk "$LOCAL_SUMAN" $@;
    fi
}

function suman-debug {

    echo " => Using 'suman-debug' alias in suman-clis.sh..."
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

    NEW_NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules
    NEW_PATH=${PATH}:~/.suman/global/node_modules/.bin

    if [ -z "$LOCAL_SUMAN" ]; then
        echo "No local Suman executable could be found, given the current directory => $PWD"
        echo "You can use '$ which suman-debug' to find a globally installed version."
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( debug )
        __handle_global_suman node_exec_args "$@"
    else
        NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} node debug "$LOCAL_SUMAN" $@;
    fi
}

function suman--debug {

    echo " => Using 'suman--debug' alias in suman-clis.sh..."
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

    NEW_NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules
    NEW_PATH=${PATH}:~/.suman/global/node_modules/.bin

    if [ -z "$LOCAL_SUMAN" ]; then
        echo "No local Suman executable could be found, given the current directory => $PWD"
        echo "Use '$ which suman--debug' to find a globally installed version."
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( --debug-brk=5858 --debug=5858 )
        __handle_global_suman node_exec_args "$@"
    else
        NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} node --debug-brk=5858 --debug=5858 "$LOCAL_SUMAN" $@;
    fi
}
