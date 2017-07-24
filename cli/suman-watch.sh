#!/usr/bin/env bash


suman_watch_location="$HOME/.suman/global/node_modules/suman-watch";
watch_log="$HOME/.suman/logs/suman-watch.log";

echo "start of suman watch process" > "$HOME/.suman/logs/suman-watch.log"
npm_global_root=$(npm root -g);
suman_watch_global=${npm_global_root}/suman-watch/cli.js


if [[ -L ${suman_watch_global} || -f ${suman_watch_global} ]]; then

    echo "running the global suman watch"
    node ${suman_watch_global} $@

elif [[ -L "${suman_watch_location}" || ( -d "${suman_watch_location}" && -f "${suman_watch_location}/cli.js" ) ]]; then

    echo "found suman-watch installion in suman home dir."
    echo "running now..."
    node "${suman_watch_location}/cli.js" >> ${watch_log} 2>&1

else

   echo "installing suman-watch, use --force-local to enforce local installations.";
   (cd ~/.suman/global && npm install -S github:sumanjs/suman-watch >> ${watch_log} 2>&1) &&
   echo "starting suman watch..."
   node "${suman_watch_location}/cli.js" >> ${watch_log} 2>&1

fi
