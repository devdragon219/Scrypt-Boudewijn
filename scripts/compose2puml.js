// Arguments:
//  1. path to compose.yaml file
//  2. path to output file (default: console.log)
//  3. name of the diagram (default: from input path)
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const file = path.resolve(process.cwd(), process.argv[2])
const compose = yaml.load(fs.readFileSync(file))

const diagram = process.argv[4]
  ?? process.argv[3]?.replace(/^.*\//, '').replace(/\.puml$/, '')
  ?? 'deployment' + (process.argv[2].replace(/\/[^/]*$/, '').replace(/^.*\//, '-'))
let output = []
const write = process.argv[3] ? s => output.push(s) : console.log

write(`@startuml ${diagram}`)

const networks = {}
Object.keys(compose.services).forEach(s => {
  const name = s.replace(/[^a-zA-Z0-9]/g, '_')
  let type = 'component'
  if (s.match(/kafka/i) || compose.services[s].image?.match(/kafka/i))
    type = 'queue'
  if (s.match(/redis/i) || compose.services[s].image?.match(/redis/i))
    type = 'database'
  if (s.match(/-db^/i) || compose.services[s].image?.match(/postgres|mariadb|mysql/i))
    type = 'database'
  write(`${type} "${s}" as ${name}`)
  if (compose.services[s].ports)
    write(`:user: --> ${name}`)
  compose.services[s].networks?.forEach(n => (networks[n] ??= []).push(name))
})
Object.keys(networks).forEach(n => {
  for (let i = 0; i < networks[n].length; ++i)
    for (let j = i + 1; j < networks[n].length; ++j)
      write(`${networks[n][i]} --> ${networks[n][j]}`)
})

write('@enduml')

if (process.argv[3]) fs.writeFileSync(process.argv[3].replace(/\.puml$/, '') + '.puml', output.join('\n'))