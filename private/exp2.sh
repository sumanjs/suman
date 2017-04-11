#!/usr/bin/env bash


NODE_PATH="$NODE_PATH:/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:\
/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:\
/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:\
/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:\
/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:\
/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules:/home/oleg/.suman/global/node_modules"



NODE_PATH=`echo -n ${NODE_PATH} | awk -v RS=: '{ if (!arr[$0]++) {printf("%s%s",!ln++?"":":",$0)}}'`

echo ${NODE_PATH}
