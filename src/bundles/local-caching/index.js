import { IS_DEBUG, IS_BROWSER } from '../../utils'
import { cacheItem } from './cache'
import ric from 'ric-shim'

const defaults = { version: 0 }
export default (spec) => {
  const opts = Object.assign({}, defaults, spec)

  return {
    name: 'localCache',
    extract: 'persistActions',
    getMiddleware: extracted => {
      const combinedActions = {}
      for (const bundleName in extracted) {
        (extracted[bundleName] || []).forEach(type => {
          combinedActions[type] || (combinedActions[type] = [])
          combinedActions[type].push(bundleName)
        })
      }

      return ({getState}) => (next) => (action) => {
        const keys = combinedActions[action.type]
        const res = next(action)
        const state = getState()
        if (keys) {
          if (IS_BROWSER) {
            ric(() => {
              Promise.all(keys.map(key =>
                cacheItem(key, state[key], {version: opts.version})
              )).then(() => {
                if (IS_DEBUG) {
                  console.info(`persisted ${keys.join(', ')} because of action ${action.type}`)
                }
              })
            })
          }
        }
        return res
      }
    }
  }
}
