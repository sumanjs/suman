#!/usr/bin/env bash

if [[ "${SUMAN_ENV}" != "local" ]]; then
   echo ""; echo "suman-daemon will only run if \$SUMAN_ENV is set to 'local'."; echo "";
   exit 1;
fi

#set -e;

# TODO: we could use either $(npm root -g)/suman-daemon or .suman/global/node_modules/suman-daemon

echo "checking if existing process is listening on port"
which_false=$(which false); # /bin/false or /usr/bin/false depending on system

pkill -f suman-daemon  # kill any existing suman-daemon process

nc -zv localhost 9091  > /dev/null 2>&1
nc_exit=$?

echo "nc_exit => $nc_exit"

if [ ${nc_exit} -eq 0 ]; then
    echo "a process is already listening on the default port"
    echo "please choose another port with --port=x"
    echo "suman-daemon may already be running - check with 'ps aux | grep suman-daemon'"
    exit 1;
fi


# we use supervisor, so do not need to force kill
# we have to use the global version,
# because otherwise we would not know which suman installation to pre-load

mkdir -p ~/.suman/global
mkdir -p ~/.suman/logs


NPM_ROOT_GLOBAL="$(npm root -g)";

export NODE_PATH=${NODE_PATH}:"~/.suman/global/node_modules"
export PATH="~/.suman/global/node_modules/.bin":"${NPM_ROOT_GLOBAL}/suman-daemon/node_modules/.bin":${PATH}
export SUMAN_LIBRARY_ROOT_PATH="${NPM_ROOT_GLOBAL}/suman";

WHICH_FOREVER=$(which forever);

if [[ -z ${WHICH_FOREVER} ]]; then
 (cd ~/.suman/global && npm install forever)
fi

if [[ -L "${NPM_ROOT_GLOBAL}/suman" || -d "${NPM_ROOT_GLOBAL}/suman" ]]; then
    echo "suman is already installed globally, that is great.";
else
    # we need to install suman globally so that suman-daemon always pre-loads the same version of suman
    echo "suman is not installed globally, we will install suman globally now.";
    npm install -g suman
fi

daemon_log="$HOME/.suman/logs/suman-daemon.log";

echo "begin of new daemon process" > ${daemon_log};

if [[ -L "${NPM_ROOT_GLOBAL}/suman-daemon" || -d "${NPM_ROOT_GLOBAL}/suman-daemon" ]]; then

    echo "found suman-daemon global"
    node "${NPM_ROOT_GLOBAL}/suman-daemon/index.js" > ${daemon_log} 2>&1 # &
#      forever start "${NPM_ROOT_GLOBAL}/suman-daemon/index.js" --workingDir $(pwd)

else

   echo "installing suman-daemon globally, use --force-local to enforce local installations.";
   npm install -g suman-daemon &&
   node "${NPM_ROOT_GLOBAL}/suman-daemon/index.js" > ${daemon_log} 2>&1  #&
#    forever start "${NPM_ROOT_GLOBAL}/suman-daemon/index.js" --workingDir $(pwd)

fi


