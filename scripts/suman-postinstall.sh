#!/usr/bin/env bash


export SUMAN_DEBUG_LOG_PATH=$HOME/.suman/suman-debug.log
SUMAN_POSTINSTALL_IS_DAEMON=${SUMAN_POSTINSTALL_IS_DAEMON:-no}

SUMAN_START_TIME=$(node -e 'console.log(Date.now())')
SUMAN_DEBUG="$(echo -e "${SUMAN_DEBUG}" | tr -d '[:space:]')"

if [[ ! -z ${SUMAN_DEBUG} ]]; then
    echo " => SUMAN_DEBUG => '$SUMAN_DEBUG'" | tee -a  ${SUMAN_DEBUG_LOG_PATH}
fi

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

DOT_SUMAN_DIR=$(cd ~/.suman && pwd)
SUMAN_INSTALL_NODE_MODULES="no";

if [[ ! -d "$DOT_SUMAN_DIR" ]]; then
    echo " => Warning => Suman failed to create ~/.suman directory." | tee -a  ${SUMAN_DEBUG_LOG_PATH}
    SUMAN_INSTALL_NODE_MODULES="yes";
fi


if [ ! -z "$SUMAN_DEBUG" ]; then
    echo " => DOT_SUMAN_DIR (user/root) => $DOT_SUMAN_DIR" | tee -a  ${SUMAN_DEBUG_LOG_PATH}
fi

SUMAN_CONF_JS=$(node $HOME/.suman/find-project-root.js)/suman.conf.js
SUMAN_BASE_DIRECTORY=$(echo "$PWD" | cut -d "/" -f2)

echo " " >> ${SUMAN_DEBUG_LOG_PATH}
echo " => BASE_DIRECTORY => $SUMAN_BASE_DIRECTORY" >> ${SUMAN_DEBUG_LOG_PATH}
SUMAN_NPM_GLOBAL_ROOT=$(npm root -g)
echo " => NPM_GLOBAL_ROOT => npm root -g => $SUMAN_NPM_GLOBAL_ROOT" >> ${SUMAN_DEBUG_LOG_PATH}
echo " " >> ${SUMAN_DEBUG_LOG_PATH}

if [ -n "$SUMAN_DEBUG" ]; then
    echo " => Potential suman.conf.js file path => ${SUMAN_CONF_JS}" >> ${SUMAN_DEBUG_LOG_PATH};
    echo " => SUMAN_BASE_DIRECTORY => ${SUMAN_BASE_DIRECTORY}" >> ${SUMAN_DEBUG_LOG_PATH};
fi


if [ ! -z ${SUMAN_POSTINSTALL_IS_DAEMON} ]; then
    if [ -n "$SUMAN_DEBUG" ]; then
        echo " => SUMAN_POSTINSTALL_IS_DAEMON is set to value => ${SUMAN_POSTINSTALL_IS_DAEMON}" >> ${SUMAN_DEBUG_LOG_PATH};
    fi
fi


if [[ -e "$SUMAN_CONF_JS" ]]; then
    SUMAN_CONF_JS_FOUND="yes";
    if [[ -n "$SUMAN_DEBUG" ]]; then
        echo " => suman.conf.js file found at path $SUMAN_CONF_JS"  | tee -a  ${SUMAN_DEBUG_LOG_PATH}
    fi
else
    SUMAN_CONF_JS_FOUND="no";
     if [[ -n "$SUMAN_DEBUG" ]]; then
        echo " => suman.conf.js file *not* found at path $SUMAN_CONF_JS" | tee -a  ${SUMAN_DEBUG_LOG_PATH}
     fi
fi


SUMAN_WE_ARE_GLOBAL="yes";

if [[ "home" == "${SUMAN_BASE_DIRECTORY}" ]]; then
    SUMAN_WE_ARE_GLOBAL="no";
fi

if [[ "Users" == "${SUMAN_BASE_DIRECTORY}" ]]; then
    SUMAN_WE_ARE_GLOBAL="no";
fi

NVM_ROOT=$HOME/.nvm

echo " => PWD in suman-postinstall => $PWD" >> ${SUMAN_DEBUG_LOG_PATH}

if [[ "$PWD" =~ ^${NVM_ROOT}.* ]]; then
    echo " => PWD starts with nvm root, so we are installing globally" >> ${SUMAN_DEBUG_LOG_PATH};
    SUMAN_WE_ARE_GLOBAL="yes";
else
   echo " => PWD does not start with nvm root." >> ${SUMAN_DEBUG_LOG_PATH};
   if [[ ${SUMAN_WE_ARE_GLOBAL} == "no" ]]; then
     echo " => Looks like because we are not in global .nvm space and our PWD starts with '/home' or '/Users',
     that we are installing locally." >> ${SUMAN_DEBUG_LOG_PATH};
   fi
fi

echo " " >> ${SUMAN_DEBUG_LOG_PATH}
echo "SUMAN_POSTINSTALL_IS_DAEMON => ${SUMAN_POSTINSTALL_IS_DAEMON}" >> ${SUMAN_DEBUG_LOG_PATH}
echo "SUMAN_WE_ARE_GLOBAL => ${SUMAN_WE_ARE_GLOBAL}" >> ${SUMAN_DEBUG_LOG_PATH}
echo "SUMAN_CONF_JS_FOUND => ${SUMAN_CONF_JS_FOUND}" >> ${SUMAN_DEBUG_LOG_PATH}
echo " " >> ${SUMAN_DEBUG_LOG_PATH}


#  note: here we run things in "foreground", otherwise run as daemon

if [[ "${SUMAN_INSTALL_NODE_MODULES}" == "yes" || ( "${SUMAN_IN_CONTAINER}" == "yes" ) || \
  ( "${SUMAN_POSTINSTALL_IS_DAEMON}" == "no" ) || \
  (( "${SUMAN_WE_ARE_GLOBAL}" == "no" ) \
  && ( "yes" != "${SUMAN_POSTINSTALL_IS_DAEMON}" ) \
  &&  "${SUMAN_CONF_JS_FOUND}" == "yes" ) ]]; then

    echo " " >> ${SUMAN_DEBUG_LOG_PATH}
    echo " => Suman optional deps being installed in the foreground" | tee -a  ${SUMAN_DEBUG_LOG_PATH}
    echo " " >> ${SUMAN_DEBUG_LOG_PATH}

    SUMAN_NPM_GLOBAL_ROOT=${SUMAN_NPM_GLOBAL_ROOT}  SUMAN_BASE_DIRECTORY=${SUMAN_BASE_DIRECTORY}  ./scripts/install-suman-home.sh &&
    SUMAN_END_TIME=$(node -e 'console.log(Date.now())')
    SUMAN_TOTAL_TIME=$(expr ${SUMAN_END_TIME} - ${SUMAN_START_TIME})
    SUMAN_TOTAL_TIME=${SUMAN_TOTAL_TIME} ./scripts/on-install-success.js &&
     echo " => Suman => all done installing suman global deps in the foreground " | tee -a  ${SUMAN_DEBUG_LOG_PATH}
     echo " " | tee -a  ${SUMAN_DEBUG_LOG_PATH}

else

    SUMAN_NPM_GLOBAL_ROOT=${SUMAN_NPM_GLOBAL_ROOT}  SUMAN_BASE_DIRECTORY=${SUMAN_BASE_DIRECTORY}  \
    ./scripts/install-suman-home.sh >> ${SUMAN_DEBUG_LOG_PATH} 2>&1 &

    echo " " | tee -a  ${SUMAN_DEBUG_LOG_PATH}
    echo " => Suman optional deps being installed as daemon." | tee -a  ${SUMAN_DEBUG_LOG_PATH}
    echo " " | tee -a  ${SUMAN_DEBUG_LOG_PATH}

fi

