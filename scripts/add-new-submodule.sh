#!/bin/bash -e

path=$1
url=$2

echo "Make sure, $url is an existing repository"

if [ -z "$path" -o -z "$url" ] || ! [[ "$url" =~ ^git@github.com:Scrypt-Swiss/ ]]; then
    echo "#### ERROR:  invalid syntax" 1>&2
    echo "     USAGE:  $0 <path> <git-url>" 1>&2
    echo "     SAMPLE: $0 backends/custody git@github.com:Scrypt-Swiss/custody.git" 1>&2
    exit 1
fi

cd ${0%/*}/..

if ! test -e $path/README.md; then
    echo "#### ERROR:  please first prepare your project in $path" 1>&2
    exit 1
fi

cd $path
git init
git remote add origin $url
git add .
git commit -am "initial" || true
git push --set-upstream origin master
git checkout -b develop
git push --set-upstream origin develop

cd -
git submodule add $url $path