#!/usr/bin/env bash

set -e;

export SUMAN_DEBUG_LOG_PATH="$HOME/.suman/logs/suman-postinstall-debug.log"

mkdir -p "$HOME/.suman" && echo "created suman dir" || { echo " could not create suman dir"; exit 1; }
mkdir -p "$HOME/.suman/logs" && echo "create logs dir" || { echo " could not create logs dir"; exit 1; }
mkdir -p "$HOME/.suman/global" && echo "created global dir" || { echo " could not create global dir"; exit 1; }
mkdir -p "$HOME/.suman/database" && echo "created database dir" || { echo " could not create database dir"; exit 1; }

if [ -e ${SUMAN_DEBUG_LOG_PATH} ]; then
   echo "new install run" > ${SUMAN_DEBUG_LOG_PATH} && echo "created debug log file" \
   || { echo " could not create log file"; exit 1; }
else
   echo "new install run"  >> ${SUMAN_DEBUG_LOG_PATH}  && echo "created debug log file" \
   || { echo " could not create log file"; exit 1; }
fi

SUMAN_START_TIME=$(node -e 'console.log(Date.now())')
SUMAN_DEBUG="$(echo -e "${SUMAN_DEBUG}" | tr -d '[:space:]')"

SUMAN_IN_CONTAINER="no";

if [[ "lxc" == "${container}" ]]; then
    SUMAN_IN_CONTAINER="yes";
     echo " => Suman says => We are in a (Docker) container because of the
        container env var! " | tee -a  ${SUMAN_DEBUG_LOG_PATH}
fi

if [[ -f ~/.dockerenv ]]; then
    SUMAN_IN_CONTAINER="yes";
    echo " => Suman says => We are in a (Docker)
        container because of the presence of .dockerenv file! " | tee -a  ${SUMAN_DEBUG_LOG_PATH}
fi

./scripts/create-suman-dir.js

DOT_SUMAN_DIR="$(cd "$HOME/.suman" && pwd)"

if [[ -d "$DOT_SUMAN_DIR" ]]; then

(
   cd "$HOME/.suman/global" && echo "installing deps in suman home...";
   [[ -d "node_modules/chrome-launcher" ]] && npm install -S chrome-launcher
   [[ -d "node_modules/istanbul" ]] && npm install -S istanbul
)

else
    echo " => Warning => Suman failed to create ~/.suman directory." | tee -a  ${SUMAN_DEBUG_LOG_PATH}
fi


SUMAN_END_TIME=$(node -e 'console.log(Date.now())')
SUMAN_TOTAL_TIME=$(expr ${SUMAN_END_TIME} - ${SUMAN_START_TIME})
SUMAN_TOTAL_TIME=${SUMAN_TOTAL_TIME} ./scripts/on-install-success.js &&
echo " => Suman => all done with postinstall routine. " | tee -a  ${SUMAN_DEBUG_LOG_PATH}

# explicit for your pleasure
exit 0;


