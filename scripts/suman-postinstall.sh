#!/usr/bin/env bash

./scripts/create-suman-dir.js &&

DOT_SUMAN_DIR=$(cd ~/.suman && pwd)

echo "DOT_SUMAN_DIR => $DOT_SUMAN_DIR"

if [[ ! -d "$DOT_SUMAN_DIR" ]]; then
    echo " => Suman failed to create ~/.suman directory, exiting with 1"
    exit 1;
fi

SUMAN_CONF_JS=$(dirname $(dirname $PWD))/suman.conf.js

LOG_PATH=~/.suman/suman-debug.log

# get base directory, to uppercase  ( HOME, USERS, USR , etc.)
#BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2) | awk '{print tolower($0)}'

BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2)

echo " => Potential suman.conf.js file path => ${SUMAN_CONF_JS}"
echo " => BASE_DIRECTORY=> ${BASE_DIRECTORY}"

# if suman.conf.js exists, then we run things in "foreground", otherwise run as daemon
if [[ (-e "$SUMAN_CONF_JS") || ("home" == "$BASE_DIRECTORY") || ("users" == "$BASE_DIRECTORY") ]]; then
    echo " => suman.conf.js file found."
    echo " => suman.conf.js file found."
    echo " => suman.conf.js file found."
    ./scripts/install-suman-home.sh &&
    ./scripts/on-install-success.js
else
    echo " => suman.conf.js file *not* found."
    ./scripts/install-suman-home.sh > ${LOG_PATH} 2>&1 & echo " => Suman optional deps being installed as daemon.\n"
fi

