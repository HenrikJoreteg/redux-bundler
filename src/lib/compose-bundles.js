import debugMiddleware from '../middleware/debug'
import thunkMiddleware from '../middleware/custom-thunk'

const { createStore, combineReducers, applyMiddleware, bindActionCreators } = require('redux')
const { resolveSelectors } = require('create-selector')

export default (...bundles) => {
  const reducers = {}
  const initMethods = {}
  const extraArgs = {}
  const actionCreators = {}
  const selectors = {}
  const itemsToExtract = {}

  // not real pretty, but it means we only have
  // to loop through everything once
  bundles.forEach(bundle => {
    const name = bundle.name
    Object.keys(bundle).forEach(key => {
      const value = bundle[key]
      if (key === 'reducer') {
        reducers[name] = value
        return
      }
      if (key === 'getReducer') {
        reducers[name] = value()
        return
      }
      if (key === 'init') {
        initMethods[name] = value
        return
      }
      if (key === 'extraArgs') {
        Object.assign(extraArgs, value)
        return
      }
      if (key === 'extract') {
        itemsToExtract[name] = bundles
          .map(bundle => bundle[value])
          .filter(item => item)
      }
      if (key.indexOf('do') === 0) {
        const obj = {}
        obj[key] = value
        Object.assign(actionCreators, obj)
        return
      }
      if (key.indexOf('select') === 0) {
        const obj = {}
        obj[key] = value
        Object.assign(selectors, obj)
        return
      }
    })
  })

  return (data, opts = {}) => {
    const store = createStore(
      combineReducers(reducers),
      data,
      applyMiddleware(
        thunkMiddleware.withExtraArgs(extraArgs),
        debugMiddleware
      )
    )

    const boundActionCreators = bindActionCreators(actionCreators, store.dispatch)

    resolveSelectors(selectors)

    // bind to store
    for (const key in selectors) {
      const selector = selectors[key]
      selectors[key] = () =>
        selector(store.getState())
    }

    Object.assign(store, boundActionCreators, selectors)

    for (const appName in initMethods) {
      initMethods[appName](store, itemsToExtract[appName])
    }

    return store
  }
}
