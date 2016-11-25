#!/usr/bin/env bash

# note to reader - if you wish to modify this file please move outside the $HOME/.suman dir, because suman
# may periodically update this file's contents which would overwrite your changes

function suman {
LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

if [ -z "$LOCAL_SUMAN" ]; then
echo " => No local Suman executable could be found, given the current directory => $PWD"
echo " => Warning...attempting to run a globally installed version of Suman..."
SUMAN_LOCAL_ALREADY_FOUND=yes node $(which suman) "$@";
else
echo " => Using Suman alias in suman-clis.sh ZZZam!!..."
SUMAN_LOCAL_ALREADY_FOUND=yes node "$LOCAL_SUMAN" "$@";
fi
# echo "first arg => $1, second arg => $2"
}

function suman-inspect {
LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js --exec-name suman-inspect);

echo "suman inspect"

if [ -z "$LOCAL_SUMAN" ]; then
echo "No local Suman executable could be found, given the current directory => $PWD"
return 1;
else
SUMAN_LOCAL_ALREADY_FOUND=yes sh "$LOCAL_SUMAN" "$@";
return 0;
fi
# echo "first arg => $1, second arg => $2"
}

function suman-debug {
LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js --exec-name suman-debug);

echo "suman-debug"

if [ -z "$LOCAL_SUMAN" ]; then
echo "No local Suman executable could be found, given the current directory => $PWD"
echo "Use '$ which suman-debug' to find a globally installed version."
return 1;
else
SUMAN_LOCAL_ALREADY_FOUND=yes sh "$LOCAL_SUMAN" "$@";
return 0;
fi
# echo "first arg => $1, second arg => $2"
}

function suman--debug {
LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js --exec-name suman--debug);

echo "suman--debug"

if [ -z "$LOCAL_SUMAN" ]; then
echo "No local Suman executable could be found, given the current directory => $PWD"
echo "Use '$ which suman--debug' to find a globally installed version."
return 1;
else
SUMAN_LOCAL_ALREADY_FOUND=yes node "$LOCAL_SUMAN" "$@";
return 0;
fi
# echo "first arg => $1, second arg => $2"
}