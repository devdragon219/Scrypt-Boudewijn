import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'

export default [{
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    name: '${NAME}',
    sourcemap: true
  },
  plugins: [
    typescript({tsconfig: 'tsconfig.cjs.json'}),
    json()
  ]
}, {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    name: '${NAME}',
    sourcemap: true
  },
  plugins: [
    typescript({tsconfig: 'tsconfig.esm.json'}),
    json()
  ]
}]
