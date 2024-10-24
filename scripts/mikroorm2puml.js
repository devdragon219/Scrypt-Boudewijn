// Arguments:
//  1. path to temp directory (default: ./temp)
//  2. path to output file (default: generated from name in ./doc)
//  3. name of the diagram (default: generated from path)
const path = require('path')
const fs = require('fs')

const dir = path.resolve(process.cwd(), process.argv[2] ?? 'temp')
const files = fs.readdirSync(dir).map(file => JSON.parse(fs.readFileSync(dir + '/' + file, 'utf8')))

const diagram = process.argv[4]
  ?? process.argv[3]?.replace(/^.*\//, '').replace(/\.puml$/, '')
  ?? 'database-' + dir.split('/').splice(-2, 1)[0]
let output = []
const write = s => output.push(s)
const outfile = (process.argv[3] ? process.argv[3].replace(/\.puml$/, '') : './doc/' + diagram) + '.puml'

const inherit = {}
const own = {}
const info = {}
write(`@startuml ${diagram}`)
write('')
files.forEach(({data}) => {
  const {className, properties, abstract, ...props} = data
  info[className] = data
  if (props.extends) inherit[className] = props.extends
  write(`  ${abstract ? 'abstract' : 'entity'} ${className} {`)
  Object.keys(properties ?? {}).forEach(key => {
    const {name, optional, array, items, kind, type, precision, scale, owner, cascade, orphanRemoval, columnTypes, ...more} = properties[key]
    write(`    ${name}${optional ? '?:' : ':'} ${items ? array ? 'Set<"' + items.join('"|"') + '">' : 'enum ' + JSON.stringify(items) : columnTypes?.length ? columnTypes.join(',') : type}${precision || scale ? '<' + precision + ',' + scale + '>' : ''}${more.default ? ' = ' + JSON.stringify(more.default) : more.defaultRaw ? ' = ' + more.defaultRaw : ''}`)
    if (kind !== 'scalar')
      (own[className] ??= []).push(properties[key])
  })
  write(`  }`)
  write('')
})
Object.keys(inherit).forEach(child => {
  write(`  ${inherit[child]} <|-${!info[inherit[child]].abstract || !info[child].abstract ? '-' : ''}${info[inherit[child]].abstract && !info[child].abstract ? '-' : ''} ${child}`)
})
write('')
Object.keys(own).forEach(className => own[className].forEach(properties => {
  const {optional, owner, kind, type, cascade, orphanRemoval} = properties
  const back = own[type].find(x => x.type === className)
  //console.log(`${className} -> ${type}`, properties, back)
  const has = ['all', 'delete'].some(i => cascade?.includes?.(i)) || orphanRemoval
  const [from, to] = kind.split(':')
  if (owner && !(['all', 'delete'].some(i => back?.cascade?.includes?.(i)) || back?.orphanRemoval)
    || ['all', 'delete'].some(i => cascade?.includes?.(i)) || orphanRemoval)
    write(`  ${className} "${from ?? kind}" ${has ? '*' : 'o'}---- "${optional ? '0…' : ''}${to}" ${type}`)
}))
write('')
write('@enduml')

const outdir = outfile.replace(/\/[^/]*$/, '')
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, {recursive: true})
fs.writeFileSync(outfile, output.join('\n'))
