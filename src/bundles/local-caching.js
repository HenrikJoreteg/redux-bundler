import getPersistMiddleware from 'redux-persist-middleware'

export default cacheFn => {
  return {
    name: 'localCache',
    getMiddleware: chunk => {
      const actionMap = {}
      chunk.rawBundles.forEach(bundle => {
        if (bundle.persistActions) {
          bundle.persistActions.forEach(type => {
            actionMap[type] || (actionMap[type] = [])
            actionMap[type].push(bundle.name)
          })
        }
      })

      return getPersistMiddleware({
        actionMap,
        cacheFn
      })
    }
  }
}
