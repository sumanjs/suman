#!/usr/bin/env bash

./scripts/create-suman-dir.js &&
SUMAN_CONF_JS=$(dirname $(dirname $PWD))/suman.conf.js

echo " => Potential suman.conf.js file path => ${SUMAN_CONF_JS}"

# if suman.conf.js exists, then we run things in "foreground", otherwise run as daemon
if [ -e "$SUMAN_CONF_JS" ]; then
    ./scripts/install-suman-home.sh && echo " => Suman optional deps installed successfully.\n"
else
    ./scripts/install-suman-home.sh & echo " => Suman optional deps being installed as daemon.\n"
fi

wait
./scripts/on-install-success.js
