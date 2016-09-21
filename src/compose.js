import debugMiddleware from './middleware/debug'
import thunkMiddleware from './middleware/custom-thunk'
import { createStore, combineReducers, applyMiddleware, bindActionCreators } from 'redux'
import { resolveSelectors } from 'create-selector'

const consumeBundle = (bundle, accum = {}, bundles) => {
  // simple test to see whether we have needed props
  if (!accum.reducers) {
    Object.assign(accum, {
      reducers: {},
      extraMiddleware: {},
      initMethods: {},
      extraArgs: {},
      itemsToExtract: {},
      actionCreators: {},
      selectors: {}
    })
  }
  const name = bundle.name
  Object.keys(bundle).forEach(key => {
    const value = bundle[key]
    if (key === 'reducer') {
      accum.reducers[name] = value
      return
    }
    if (key === 'getReducer') {
      accum.reducers[name] = value()
      return
    }
    if (key === 'getMiddleware') {
      accum.extraMiddleware[name] = value
      return
    }
    if (key === 'init') {
      accum.initMethods[name] = value
      return
    }
    if (key === 'extraArgs') {
      Object.assign(accum.extraArgs, value)
      return
    }
    if (key === 'extract') {
      accum.itemsToExtract[name] = bundles.reduce((accum, bundle) => {
        const extracted = bundle[value]
        if (extracted) {
          accum[bundle.name] || (accum[bundle.name] = [])
          accum[bundle.name].push(extracted)
        }
        return accum
      }, {})
    }
    if (key.indexOf('do') === 0) {
      const obj = {}
      obj[key] = value
      Object.assign(accum.actionCreators, obj)
      return
    }
    if (key.indexOf('select') === 0) {
      const obj = {}
      obj[key] = value
      Object.assign(accum.selectors, obj)
      return
    }
  })
  return accum
}

const bindSelectorsToStore = (store, selectors) => {
  for (const key in selectors) {
    const selector = selectors[key]
    store[key] = () =>
      selector(store.getState())
  }
}

const decorateStore = (store, meta) => {
  store.meta || (store.meta = {})
  const combinedSelectors = Object.assign(store.meta.selectors || {}, meta.selectors)
  resolveSelectors(combinedSelectors)
  store.meta.selectors = combinedSelectors
  bindSelectorsToStore(store, combinedSelectors)
  Object.assign(store, bindActionCreators(meta.actionCreators, store.dispatch))
  Object.assign(store.meta, meta)
  for (const appName in meta.initMethods) {
    meta.initMethods[appName](store, meta.itemsToExtract[appName])
  }
}

const composeBundles = (...bundles) => {
  // build out object of extracted bundle info
  const meta = {}
  bundles.forEach(bundle => consumeBundle(bundle, meta, bundles))
  return data => {
    const middleware = [
      thunkMiddleware.withExtraArgs(meta.extraArgs),
      debugMiddleware
    ]

    for (const appName in meta.extraMiddleware) {
      middleware.push(meta.extraMiddleware[appName](meta.itemsToExtract[appName]))
    }

    const store = createStore(
      combineReducers(meta.reducers),
      data,
      applyMiddleware(...middleware)
    )

    store.bundles = bundles

    decorateStore(store, meta)

    store.integrateBundles = (...bundlesToIntegrate) => {
      const { bundles } = store
      const bundleMap = bundles.reduce((acc, bundle, index) => acc[bundle.name] = index, {})
      bundlesToIntegrate.forEach(newBundle => {
        const currentIndex = bundleMap[newBundle.name]
        if (currentIndex != null) {
          bundles[currentIndex] = newBundle
        } else {
          bundles.push(newBundle)
        }
      })
      const meta = {}
      bundles.forEach(bundle => consumeBundle(bundle, meta, bundles))
      decorateStore(store, meta)
      store.replaceReducer(combineReducers(meta.reducers))
    }

    return store
  }
}

export default composeBundles
