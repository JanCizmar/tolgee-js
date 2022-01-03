#!/bin/bash

PATTERNS=(
  "Tomcat started on port(s):"
)

for run in {1..120}
do 
  echo "($(( run++ ))) waiting for patterns:";
  SUCCESSES=0
  for i in ${!PATTERNS[@]};
  do
    if docker compose logs | grep "${PATTERNS[$i]}" -q
      then (( SUCCESSES++ ))
      else echo "- \"${PATTERNS[$i]}\""
    fi
  done

  if [ "${#PATTERNS[@]}" -eq "${SUCCESSES}" ]
    then 
      echo "success" 
      exit 0
  fi

  sleep 1 ;
done

echo "timeout"
exit 1
