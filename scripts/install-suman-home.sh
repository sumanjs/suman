#!/usr/bin/env bash


YARN=$(which yarn)

if [ -z "${YARN}" ]; then
    npm install -g yarn &&
    echo "yarn installed successfully"
fi



LOG_PATH=~/.suman/suman-debug.log
node ./install-optional-deps.js

#cd ~/.suman && npm update --progress=false --loglevel=silent suman-home@latest > ${LOG_PATH} 2>&1
#cd ~/.suman/ && yarn add suman-home > ${LOG_PATH}  2>&1

#echo "suman-home install happening in background" > ${DEBUG_LOG_PATH} &
