#!/usr/bin/env bash

# note to reader - if you wish to modify this file please move outside the $HOME/.suman dir, because suman
# may periodically update this file's contents which would overwrite your changes

function suman {
  	   LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

  	   if [ -z "$LOCAL_SUMAN" ]; then
           echo "No local Suman executable could be found, given the current directory => $PWD"
           return 1;
       else
            node "$LOCAL_SUMAN" "$@";
            return 0;
  	   fi
       # echo "first arg => $1, second arg => $2"
  }

function suman-inspect {
  	   LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

  	   echo "suman inspect"

  	   if [ -z "$LOCAL_SUMAN" ]; then
           echo "No local Suman executable could be found, given the current directory => $PWD"
           return 1;
       else
            node "$LOCAL_SUMAN" "$@";
            return 0;
  	   fi
       # echo "first arg => $1, second arg => $2"
  }

function suman--debug {
  	   LOCAL_SUMAN=$(node $HOME/.suman/find-local-suman-executable.js);

  	   echo "suman inspect"

  	   if [ -z "$LOCAL_SUMAN" ]; then
           echo "No local Suman executable could be found, given the current directory => $PWD"
           return 1;
       else
            node "$LOCAL_SUMAN" "$@";
            return 0;
  	   fi
       # echo "first arg => $1, second arg => $2"
  }