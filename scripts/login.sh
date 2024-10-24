#!/bin/bash

USER=${1:-admin}
PASSWORD=${2:-fVWYcQCefr6nRDXmWfGwkYkhZ0hIBTfuvWgSLDJY}
export URL=${3:-http://localhost:4000}
res=$(curl -sX POST ${URL}/auth/login \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${USER}\",
            \"password\": \"${PASSWORD}\"
            }")
echo "RESULT: $res"
export TOKEN=$(echo $res | jq -r .access_token)
