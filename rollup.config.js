import json from 'rollup-plugin-json'
import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.js',
  output: {
    format: 'cjs',
    file: 'index.js'
  },
  plugins: [
    json(),
    buble(),
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs()
  ],
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
