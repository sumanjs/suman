#!/usr/bin/env bash


echo "x" & X=$!
echo "y" & Y=$!
(  echo "z" && exit 1; ) & Z=$!;


wait ${Z} ; echo "Z $?" # returns exit code given the PID
wait ${X} ; echo "X $?" # returns exit code given the PID
wait ${Y} ; echo "Y $?" # returns exit code given the PID

