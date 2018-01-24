import { composeBundles, cachingBundle } from 'redux-bundler'
import routes from './routes'
import baseData from './base-data'
import people from './people'
import extraArgs from './extra-args'

export default composeBundles(
  routes,
  baseData,
  people,
  cachingBundle({version: 1}),
  extraArgs
)
