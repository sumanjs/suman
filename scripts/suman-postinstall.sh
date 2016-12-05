#!/usr/bin/env bash

./scripts/create-suman-dir.js &&


if [ -e "$(cd ~/.suman && pwd)" ]; then
    echo " => Suman failed to create ~/.suman directory, exiting with 1"
    exit 1;
fi

SUMAN_CONF_JS=$(dirname $(dirname $PWD))/suman.conf.js

LOG_PATH=~/.suman/suman-debug.log

echo " => Potential suman.conf.js file path => ${SUMAN_CONF_JS}"

# if suman.conf.js exists, then we run things in "foreground", otherwise run as daemon
if [ -e "$SUMAN_CONF_JS" ]; then
    echo " => suman.conf.js file found."
    ./scripts/install-suman-home.sh &&
    ./scripts/on-install-success.js
else
    echo " => suman.conf.js file *not* found."
    ./scripts/install-suman-home.sh > ${LOG_PATH} 2>&1 & echo " => Suman optional deps being installed as daemon.\n"
fi

