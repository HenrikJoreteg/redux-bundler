import { IS_BROWSER, ric } from '../utils'

export default ({ cacheFn, logger, enabled = IS_BROWSER }) => {
  return {
    name: 'localCache',
    init: store => {
      store.buildPersistActionMap = () => {
        store.meta.persistActionMap = store.meta.chunks.reduce(
          (actionMap, chunk) => {
            chunk.rawBundles.forEach(bundle => {
              if (bundle.persistActions) {
                bundle.persistActions.forEach(type => {
                  actionMap[type] || (actionMap[type] = [])
                  actionMap[type].push(bundle.name)
                })
              }
            })
            return actionMap
          },
          {}
        )
      }
      store.buildPersistActionMap()
    },
    getMiddleware: () => {
      return store => next => action => {
        const { getState, meta } = store
        const { persistActionMap } = meta
        const reducersToPersist = persistActionMap[action.type]
        const res = next(action)
        const state = getState()
        if (enabled && reducersToPersist) {
          ric(
            () => {
              Promise.all(
                reducersToPersist.map(key => cacheFn(key, state[key]))
              ).then(() => {
                if (logger) {
                  logger(
                    `cached ${reducersToPersist.join(', ')} due to ${
                      action.type
                    }`
                  )
                }
              })
            },
            { timeout: 500 }
          )
        }
        return res
      }
    }
  }
}
