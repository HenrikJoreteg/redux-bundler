import { IS_BROWSER, ric } from '../../utils'
import { cacheItem } from './cache'

const defaults = { version: 0, cacheFunction: cacheItem }
export default (spec) => {
  const opts = Object.assign({}, defaults, spec)

  return {
    name: 'localCache',
    getMiddleware: chunk => {
      const combinedActions = {}
      chunk.rawBundles.forEach(bundle => {
        if (bundle.persistActions) {
          bundle.persistActions.forEach(type => {
            combinedActions[type] || (combinedActions[type] = [])
            combinedActions[type].push(bundle.name)
          })
        }
      })

      return ({getState}) => (next) => (action) => {
        const keys = combinedActions[action.type]
        const res = next(action)
        const state = getState()
        if (keys) {
          if (IS_BROWSER) {
            ric(() => {
              Promise.all(keys.map(key =>
                opts.cacheFunction(key, state[key], {version: opts.version})
              )).then(() => {
                if (state.debug) {
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
