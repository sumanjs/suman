#!/usr/bin/env bash


SUMAN_DEBUG="$(echo -e "${SUMAN_DEBUG}" | tr -d '[:space:]')"

if [[ ! -z ${SUMAN_DEBUG} ]]; then
echo " => SUMAN_DEBUG => '$SUMAN_DEBUG'"
fi


IN_CONTAINER=false;

if [[ "lxc" == "${container}" ]]; then
IN_CONTAINER=true;
echo " => Suman says => We are in a (Docker) container! "
fi


./scripts/create-suman-dir.js &&

DOT_SUMAN_DIR=$(cd ~/.suman && pwd)

if [[ ! -d "$DOT_SUMAN_DIR" ]]; then
    echo " => Suman failed to create ~/.suman directory, exiting with 1"
    exit 1;
fi

SUMAN_DEBUG_LOG_PATH=$HOME/.suman/suman-debug.log

if [ ! -z "$SUMAN_DEBUG" ]; then
    echo " => DOT_SUMAN_DIR (user/root) => $DOT_SUMAN_DIR" >> ${SUMAN_DEBUG_LOG_PATH};
fi

SUMAN_CONF_JS=$(node $HOME/.suman/find-project-root.js)/suman.conf.js
LOG_PATH=~/.suman/suman-debug.log

BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2)

if [ -n "$SUMAN_DEBUG" ]; then
    echo " => Potential suman.conf.js file path => ${SUMAN_CONF_JS}" >> ${SUMAN_DEBUG_LOG_PATH};
    echo " => BASE_DIRECTORY => ${BASE_DIRECTORY}" >> ${SUMAN_DEBUG_LOG_PATH};
fi


if [ ! -z ${SUMAN_POSTINSTALL_IS_DAEMON} ]; then
    if [ -n "$SUMAN_DEBUG" ]; then
        echo " => SUMAN_POSTINSTALL_IS_DAEMON is set to value => ${SUMAN_POSTINSTALL_IS_DAEMON}" >> ${SUMAN_DEBUG_LOG_PATH};
    fi
fi


if [[ -e "$SUMAN_CONF_JS" ]]; then
    SUMAN_CONF_JS_FOUND=true;
    if [[ -n "$SUMAN_DEBUG" ]]; then
        echo " => suman.conf.js file found at path $SUMAN_CONF_JS"  >> ${SUMAN_DEBUG_LOG_PATH};
    fi
else
    SUMAN_CONF_JS_FOUND=false;
     if [[ -n "$SUMAN_DEBUG" ]]; then
        echo " => suman.conf.js file *not* found at path $SUMAN_CONF_JS" >> ${SUMAN_DEBUG_LOG_PATH};
     fi
fi


WE_ARE_GLOBAL=true;

if [[ "home" == "${BASE_DIRECTORY}" ]]; then
    WE_ARE_GLOBAL=false;
fi

if [[ "Users" == "${BASE_DIRECTORY}" ]]; then
    WE_ARE_GLOBAL=false;
fi

NVM_ROOT=$HOME/.nvm

echo " => PWD in suman-postinstall => $PWD" >> ${SUMAN_DEBUG_LOG_PATH}

if [[ "$PWD" =~ ^${NVM_ROOT}.* ]]; then
    echo " => PWD starts with nvm root, so we are installing globally" >> ${SUMAN_DEBUG_LOG_PATH};
    WE_ARE_GLOBAL=true;
else
   echo " => PWD does not start with nvm root." >> ${SUMAN_DEBUG_LOG_PATH};
   if [[ WE_ARE_GLOBAL = false ]]; then
     echo " => Looks like because we are not in global .nvm space and our PWD starts with '/home' or '/Users',
     that we are installing locally." >> ${SUMAN_DEBUG_LOG_PATH};
   fi
fi


# if suman.conf.js exists, then we run things in "foreground", otherwise run as daemon
if [[ ( "no" == "${SUMAN_POSTINSTALL_IS_DAEMON}" ) \
  || ( ( WE_ARE_GLOBAL = false ) \
  && ( "yes" != "${SUMAN_POSTINSTALL_IS_DAEMON}" ) \
  &&  SUMAN_CONF_JS_FOUND ) ]]; then

    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
    echo " => Suman optional deps being installed in the foreground" >> ${SUMAN_DEBUG_LOG_PATH}
    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
    ./scripts/install-suman-home.sh &&
    ./scripts/on-install-success.js &&
     echo " "

else

    ./scripts/install-suman-home.sh > ${SUMAN_DEBUG_LOG_PATH} 2>&1 &
    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
    echo " => Suman optional deps being installed as daemon." >> ${SUMAN_DEBUG_LOG_PATH}
    echo " " >> ${SUMAN_DEBUG_LOG_PATH}

fi

