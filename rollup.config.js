import json from 'rollup-plugin-json'

export default {
  entry: 'src/index.js',
  format: 'cjs',
  plugins: [ json() ],
  dest: 'tmp.js'
}
