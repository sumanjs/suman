#!/usr/bin/env bash


YARN=$(which yarn)
SUMAN_DEBUG_LOG_PATH=$HOME/.suman/suman-debug.log

if [ -z "${YARN}" ]; then
#    npm install -g yarn &&
    if [ ! -z "${SUMAN_DEBUG}" ]; then
        echo "need SUDO to install yarn installed successfully" >> ${SUMAN_DEBUG_LOG_PATH};
     fi
else
    if [ ! -z "${SUMAN_DEBUG}" ]; then
        echo "yarn already installed here => $YARN" >> ${SUMAN_DEBUG_LOG_PATH};
    fi
fi


# if BASE_DIRECTORY is not /home or /users, we are global
BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2)

if [ ! -z "${SUMAN_DEBUG}" ]; then
    echo "BASE_DIRECTORY of PWD => $BASE_DIRECTORY" ;
fi

# create a package.json skeleton just to keep NPM from complaining
# we can also keep track of which deps are actually installed, and their versions
# we execute in a subshell so we don't actually change the current directory
(cd $HOME/.suman/global && npm init -f )

node $(dirname "$0")/install-optional-deps.js >> ${SUMAN_DEBUG_LOG_PATH} 2>&1

