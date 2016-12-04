#!/usr/bin/env bash

# note to reader - if you wish to modify this file please move outside the ~/.suman dir, because suman
# may periodically update this file's contents which would overwrite your changes
# if you do so, just change your .bashrc or .zshrc, or whatever, to source your file instead of this one

function __handle_global_suman {

    WHICH_SUMAN=$(which suman);

    if [ -z "${WHICH_SUMAN}" ]; then
        echo " => No global suman installation could be found with '\$ which suman', exitting..."
        return 1;
    else

        DIRN=$(dirname "$WHICH_SUMAN")
        RL=$(readlink "$WHICH_SUMAN");
        EXECDIR=$(dirname $(dirname "$RL"));
        MYPATH="$DIRN/$EXECDIR";
        X="$(cd$(dirname${MYPATH})&&pwd)/$(basename${MYPATH})"
        NODE_PATH=${NODE_PATH}:~/.suman/node_modules

        # $1 is the node exec args (inspect/debug etc), $2 is the original user args
        # we work with the first argument passed to this function
        local ref="$1[@]";
        shift
        SUMAN_LOCAL_ALREADY_FOUND=yes node "${!ref}" "${X}/cli.js" "${2}";
    fi
}


function suman {

    echo " => Using 'suman' alias in suman-clis.sh..."
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);
    NODE_PATH=${NODE_PATH}:~/.suman/node_modules
    if [ -z "$LOCAL_SUMAN" ]; then
        echo " => No local Suman executable could be found, given the present working directory => $PWD"
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( )
        __handle_global_suman node_exec_args "$@"
    else
        SUMAN_LOCAL_ALREADY_FOUND=yes node "$LOCAL_SUMAN" "$@";
    fi
}

function suman-inspect {

    echo " => Using 'suman-inspect' alias in suman-clis.sh..."
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js --exec-name suman-inspect);
    NODE_PATH=${NODE_PATH}:~/.suman/node_modules

    if [ -z "$LOCAL_SUMAN" ]; then
        echo " => No local Suman executable could be found, given the present working directory => $PWD"
        echo "You can use '$ which suman-debug' to find a globally installed version."
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( --inspect --debug-brk )
        __handle_global_suman node_exec_args "$@"
    else
        SUMAN_LOCAL_ALREADY_FOUND=yes  node "$LOCAL_SUMAN" "$@";
    fi
}

function suman-debug {
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js --exec-name suman-debug);

    echo " => Using 'suman-debug' alias in suman-clis.sh..."

    NODE_PATH=${NODE_PATH}:~/.suman/node_modules

    if [ -z "$LOCAL_SUMAN" ]; then
        echo "No local Suman executable could be found, given the current directory => $PWD"
        echo "You can use '$ which suman-debug' to find a globally installed version."
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( debug )
        __handle_global_suman node_exec_args "$@"
    else
        SUMAN_LOCAL_ALREADY_FOUND=yes  node "$LOCAL_SUMAN" "$@";
    fi
}

function suman--debug {
    LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js --exec-name suman--debug);

    echo "suman--debug"

    NODE_PATH=${NODE_PATH}:~/.suman/node_modules

    if [ -z "$LOCAL_SUMAN" ]; then
        echo "No local Suman executable could be found, given the current directory => $PWD"
        echo "Use '$ which suman--debug' to find a globally installed version."
        echo " => Warning...attempting to run a globally installed version of Suman..."
        local -a node_exec_args=( --debug-brk=5858 --debug=5858 )
        __handle_global_suman node_exec_args "$@"
    else
        SUMAN_LOCAL_ALREADY_FOUND=yes node "$LOCAL_SUMAN" "$@";
    fi
}
