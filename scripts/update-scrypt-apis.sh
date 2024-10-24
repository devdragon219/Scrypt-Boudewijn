#!/bin/bash -e

path=${0%/*}/..
fix='false'
while [ $# -gt 0 ]; do
    case "$1" in
        -[!-]?*)
            a=$1
            shift
            set -- "$a" $(sed 's/./ -&/g' <<<${a#-}) "$@"
        ;;
        -h|--help)
          cat <<EOF
Rebuild Scrypt APIs, run e.g. when you added a new module or when
the APIs are somehow broken. If any file in libs/api is broken,
just delete it and run this script to repair.

SYNOPSIS
  $0 [OPTIONS] [MODULES...]

OPTIONS
  -f, --fix    fix a broken build, don't run rebuild:apis first
EOF
          exit 0
        ;;
        -f|--fix)
            fix='true'
        ;;
        *)
            ---> modules: $*
            break
        ;;
    esac
    shift
done

if [ "$fix" != 'true' ]; then
  echo "---- Rebuilding the APIs… → npm run rebuild:apis"
  if ! npm run rebuild:apis 2> /dev/null > /dev/null; then
    echo "#### ERROR: npm run rebuild:apis" 1>&2
    echo "     Please fix your build first" 1>&2
    exit 1
  fi
fi

for module in ${*:-$(find $path/backends -maxdepth 1 -mindepth 1 -name node_modules -prune -o -type d -print | sed 's,.*/,,g')}; do

MODULE=$(sed 's,-,_,g' <<<${module^^})
camel=$(sed 's,-.,\U&,g;s,-,,g' <<<"$module")
Camel=${camel^}

echo "---- Analyzing $module…"

if ! node ./backends/$module/dist/src/main.js -d 2> /dev/null > /dev/null; then
  echo "**** WARNING: node ./backends/$module/dist/src/main.js -d" 2>&1
  echo "     Generating an API for $module fails" 2>&1
  echo "     either it has no REST API defined, or you have a bug" 2>&1
  continue
fi

if node ./backends/$module/dist/src/main.js -d 2> /dev/null | grep -q '"paths": {}'; then
  echo "**** WARNING: no API defined for $module" 2>&1
  echo "     There's no REST API in $module, please add Controllers." 2>&1
  continue
fi

node << EOF
const {readFileSync, writeFileSync} = require("fs")
const path = require("path")
const p = JSON.parse(readFileSync('$path/package.json').toString())
if (!Object.keys(p.scripts).includes('$module-api')) {
  console.log('      → package.json: adding scripts.$module-api…')
  p.scripts['$module-api'] = 'node ./libs/openapi-client/generateOpenApi.js libs/api/src/${module}/${module}.json gen${Camel}Api > libs/api/src/${module}/${module}.ts'
}
if (!Object.keys(p.scripts).includes('pre$module-api')) {
  console.log('      → package.json: adding scripts.pre$module-api…')
  p.scripts['pre$module-api'] = 'rimraf ./temp; node ./backends/${module}/dist/src/main.js -d > libs/api/src/${module}/${module}.json'
}
if (!p.scripts.apis.match(/&& npm run $module-api/)) {
  console.log('      → package.json: adding $module to scripts.apis…')
  p.scripts.apis += ' && npm run $module-api'
  p.scripts.apis.split(' && ').sort().join(' && ')
}
writeFileSync('$path/package.json', Buffer.from(JSON.stringify(p, null, 2)))
EOF

if [ ! -d $path/libs/api/src/$module ]; then
  echo "      → create libs/api/src/$module"
  mkdir -p $path/libs/api/src/$module
  echo "      → build initial library files"
  if ! npm run $module-api 2> /dev/null > /dev/null; then
    echo "#### ERROR: npm run $module-api" 1>&2
    echo "     failed to build initial library files" 1>&2
    exit 1
  fi
fi
if [ ! -f $path/libs/api/src/$module/index.ts ]; then
  echo "      → $path/libs/api/src/$module/index.ts"
  cat >> $path/libs/api/src/$module/index.ts <<EOF
import {init} from '../initialize'
import {gen${Camel}Api} from './${module}'
export * from './${module}'

export const ${camel} = init('${module}', gen${Camel}Api)
EOF
fi

if ! grep -q "^import {$camel} from '\./$module'" $path/libs/api/src/index.ts; then
  echo "      → add import $camel in $path/libs/api/src/index.ts"
  sed -i "/^import/{:a;n;s/^import/&/;ta;s,^,import {$camel} from './$module'\n,}" $path/libs/api/src/index.ts
fi

if ! grep -q "^export \* from '\./$module'" $path/libs/api/src/index.ts; then
  echo "      → add export $camel in $path/libs/api/src/index.ts"
  sed -i "/^export \*/{:b;n;s/^export \*/&/;tb;s,^,export * from './$module'\n,}" $path/libs/api/src/index.ts
fi

if ! grep -q "^  \.\.\.$camel," $path/libs/api/src/index.ts; then
  echo "      → add $camel to api in $path/libs/api/src/index.ts"
  sed -i "/^  \.\.\./{:c;n;s/^  \.\.\./&/;tc;s/^/  ...$camel,\n/}" $path/libs/api/src/index.ts
fi

done

echo "---- Rebuilding the APIs… → npm run rebuild:apis"
if ! npm run rebuild:apis 2> /dev/null > /dev/null; then
  echo "#### ERROR: npm run rebuild:apis" 1>&2
  echo "     Please fix your build first" 1>&2
  exit 1
fi