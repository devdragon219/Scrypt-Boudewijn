#!/bin/bash

METHOD=$1
PATH_=$2
BODY=$3

if [ -z "$BODY" ]; then
    curl -sX ${METHOD} ${URL}${PATH_} \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json"
else
    curl -sX ${METHOD} ${URL}${PATH_} \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${BODY}"
fi