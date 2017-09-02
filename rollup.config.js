import json from 'rollup-plugin-json'

export default {
  input: 'src/index.js',
  output: {
    format: 'cjs',
    file: 'tmp.js'
  },
  plugins: [ json() ],
  external: [
    'create-selector',
    'redux',
    'feather-route-matcher',
    'idb-keyval',
    'ric-shim',
    'reselect',
    'url-parse',
    'querystringify'
  ]
}
