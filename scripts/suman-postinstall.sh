#!/usr/bin/env bash


SUMAN_DEBUG="$(echo -e "${SUMAN_DEBUG}" | tr -d '[:space:]')"
echo " => SUMAN_DEBUG => '$SUMAN_DEBUG'"

./scripts/create-suman-dir.js &&

DOT_SUMAN_DIR=$(cd ~/.suman && pwd)

if [ ! -z "$SUMAN_DEBUG" ]; then echo "DOT_SUMAN_DIR => $DOT_SUMAN_DIR"; fi


if [[ ! -d "$DOT_SUMAN_DIR" ]]; then
    echo " => Suman failed to create ~/.suman directory, exiting with 1"
    exit 1;
fi

#SUMAN_CONF_JS=$(dirname $(dirname $PWD))/suman.conf.js
SUMAN_CONF_JS=$(node $HOME/.suman/find-project-root.js)/suman.conf.js
LOG_PATH=~/.suman/suman-debug.log

# get base directory, to uppercase  ( HOME, USERS, USR , etc.)
#BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2) | awk '{print tolower($0)}'

BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2)


if [ -n "$SUMAN_DEBUG" ]; then
    echo " => Potential suman.conf.js file path => ${SUMAN_CONF_JS}"
    echo " => BASE_DIRECTORY => ${BASE_DIRECTORY}"
fi


if [ "yes" = "${SUMAN_POSTINSTALL_IS_DAEMON}" ]; then
    if [ -n "$SUMAN_DEBUG" ]; then echo "SUMAN_POSTINSTALL_IS_DAEMON is set to value => ${SUMAN_POSTINSTALL_IS_DAEMON}" ; fi;
fi


if [ -e "$SUMAN_CONF_JS" ]; then
    SUMAN_CONF_JS_FOUND=true;
    if [ -n "$SUMAN_DEBUG" ]; then  echo " => suman.conf.js file found at path $SUMAN_CONF_JS" ; fi
else
    SUMAN_CONF_JS_FOUND=false;
     if [ -n "$SUMAN_DEBUG" ]; then echo " => suman.conf.js file *not* found at path $SUMAN_CONF_JS" ; fi
fi


if [ "home" == "${BASE_DIRECTORY}" ]; then
    HOME_IS_BASE_DIR=true
else
    HOME_IS_BASE_DIR=false
fi

if [ "Users" == "${BASE_DIRECTORY}" ]; then
    USERS_IS_BASE_DIR=true
else
    USERS_IS_BASE_DIR=false
fi


# if suman.conf.js exists, then we run things in "foreground", otherwise run as daemon
if [[ ( "no" = "${SUMAN_POSTINSTALL_IS_DAEMON}" ) \
  || ( ( "yes" != "${SUMAN_POSTINSTALL_IS_DAEMON}" ) && ( SUMAN_CONF_JS_FOUND || HOME_IS_BASE_DIR || USERS_IS_BASE_DIR ) ) ]]; then

    echo " => Suman optional deps being installed in the foreground"
    ./scripts/install-suman-home.sh &&
    ./scripts/on-install-success.js
else
    ./scripts/install-suman-home.sh > ${LOG_PATH} 2>&1 & echo " => Suman optional deps being installed as daemon.\n"
fi
