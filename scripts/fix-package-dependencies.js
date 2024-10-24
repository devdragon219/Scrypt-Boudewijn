const path = require('path')
const fs = require('fs')

const file = path.resolve(process.cwd(), process.argv[2], 'package.json')
const package = JSON.parse(fs.readFileSync(file))

fs.writeFileSync(file, JSON.stringify({...package, dependencies: {}, devDependencies: {frontends: ""}}, null, 4))