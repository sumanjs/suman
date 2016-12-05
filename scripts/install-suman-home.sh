#!/usr/bin/env bash


YARN=$(which yarn)

if [ -z "${YARN}" ]; then
    npm install -g yarn &&
    echo "yarn installed successfully"
fi


# if BASE_DIRECTORY is not /home or /users, we are global
BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2)

echo "BASE_DIRECTORY => $BASE_DIRECTORY"
LOG_PATH=~/.suman/suman-debug.log
node $(dirname "$0")/install-optional-deps.js

#cd ~/.suman && npm update --progress=false --loglevel=silent suman-home@latest > ${LOG_PATH} 2>&1
#cd ~/.suman/ && yarn add suman-home > ${LOG_PATH}  2>&1

#echo "suman-home install happening in background" > ${DEBUG_LOG_PATH} &
