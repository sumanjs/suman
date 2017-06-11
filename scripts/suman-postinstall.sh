#!/usr/bin/env bash

START_TIME=$(date "+%s")
SUMAN_DEBUG_LOG_PATH=$HOME/.suman/suman-debug.log
SUMAN_DEBUG="$(echo -e "${SUMAN_DEBUG}" | tr -d '[:space:]')"

if [[ ! -z ${SUMAN_DEBUG} ]]; then
    echo " => SUMAN_DEBUG => '$SUMAN_DEBUG'"
fi


IN_CONTAINER=false;

if [[ "lxc" == "${container}" ]]; then
    IN_CONTAINER=true;
     echo " => Suman says => We are in a (Docker) container because of the
        container env var! "
     echo " => Suman says => We are in a (Docker) container because of the
        container env var! " >> ${SUMAN_DEBUG_LOG_PATH}
fi

if [[ -f ~/.dockerenv ]]; then
    IN_CONTAINER=true;
    echo " => Suman says => We are in a (Docker)
        container because of the presence of .dockerenv file! "
    echo " => Suman says => We are in a (Docker)
        container because of the presence of .dockerenv file! " >> ${SUMAN_DEBUG_LOG_PATH}
fi

./scripts/create-suman-dir.js

DOT_SUMAN_DIR=$(cd ~/.suman && pwd)
INSTALL_NODE_MODULES="no";

if [[ ! -d "$DOT_SUMAN_DIR" ]]; then
    echo " => Warning => Suman failed to create ~/.suman directory."
    echo " => Suman failed to create ~/.suman directory." >> ${SUMAN_DEBUG_LOG_PATH}
    INSTALL_NODE_MODULES="yes";
fi


if [ ! -z "$SUMAN_DEBUG" ]; then
    echo " => DOT_SUMAN_DIR (user/root) => $DOT_SUMAN_DIR" >> ${SUMAN_DEBUG_LOG_PATH};
fi

SUMAN_CONF_JS=$(node $HOME/.suman/find-project-root.js)/suman.conf.js
BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2)

echo " " >> ${SUMAN_DEBUG_LOG_PATH}
echo " => BASE_DIRECTORY => $BASE_DIRECTORY" >> ${SUMAN_DEBUG_LOG_PATH}
NPM_GLOBAL_ROOT=$(npm root -g)
echo " => NPM_GLOBAL_ROOT => npm root -g => $NPM_GLOBAL_ROOT" >> ${SUMAN_DEBUG_LOG_PATH}
echo " " >> ${SUMAN_DEBUG_LOG_PATH}

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
   if [[ ${WE_ARE_GLOBAL} == false ]]; then
     echo " => Looks like because we are not in global .nvm space and our PWD starts with '/home' or '/Users',
     that we are installing locally." >> ${SUMAN_DEBUG_LOG_PATH};
   fi
fi

echo " " >> ${SUMAN_DEBUG_LOG_PATH}
echo "SUMAN_POSTINSTALL_IS_DAEMON => ${SUMAN_POSTINSTALL_IS_DAEMON}" >> ${SUMAN_DEBUG_LOG_PATH}
echo "WE_ARE_GLOBAL => ${WE_ARE_GLOBAL}" >> ${SUMAN_DEBUG_LOG_PATH}
echo "SUMAN_CONF_JS_FOUND => ${SUMAN_CONF_JS_FOUND}" >> ${SUMAN_DEBUG_LOG_PATH}
echo " " >> ${SUMAN_DEBUG_LOG_PATH}


#  note: here we run things in "foreground", otherwise run as daemon

if [[ ${INSTALL_NODE_MODULES} == "yes" || ( ${IN_CONTAINER} == true ) || ( "no" == "${SUMAN_POSTINSTALL_IS_DAEMON}" ) || ( ( ${WE_ARE_GLOBAL} == false ) \
  && ( "yes" != "${SUMAN_POSTINSTALL_IS_DAEMON}" ) \
  &&  ${SUMAN_CONF_JS_FOUND} == true ) ]]; then

    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
    echo " => Suman optional deps being installed in the foreground" >> ${SUMAN_DEBUG_LOG_PATH}
    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
    NPM_GLOBAL_ROOT=${NPM_GLOBAL_ROOT}  BASE_DIRECTORY=${BASE_DIRECTORY}  ./scripts/install-suman-home.sh &&
    END_TIME=$(date "+%s")
    TOTAL_TIME=(${END_TIME} - ${START_TIME})
    TOTAL_TIME=${TOTAL_TIME} ./scripts/on-install-success.js &&
     echo " all done installing suman global deps in the foreground " >> ${SUMAN_DEBUG_LOG_PATH}
     echo " "

else
    NPM_GLOBAL_ROOT=${NPM_GLOBAL_ROOT}  BASE_DIRECTORY=${BASE_DIRECTORY} ./scripts/install-suman-home.sh >> ${SUMAN_DEBUG_LOG_PATH} 2>&1 &
    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
    echo " => Suman optional deps being installed as daemon." >> ${SUMAN_DEBUG_LOG_PATH}
    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
fi

