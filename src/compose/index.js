import debugMiddleware from '../middleware/debug'
import thunkMiddleware from '../middleware/custom-thunk'
import customApplyMiddleware from '../middleware/custom-apply-middleware'
import { createStore, combineReducers, bindActionCreators } from 'redux'
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
  const { name } = bundle
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
          accum[bundle.name] = extracted
        }
        return accum
      }, {})
    }
    if (key.slice(0, 2) === 'do') {
      const obj = {}
      obj[key] = value
      Object.assign(accum.actionCreators, obj)
      return
    }
    if (key.slice(0, 6) === 'select') {
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
  Object.assign(store, {unboundActionCreators: meta.actionCreators}, bindActionCreators(meta.actionCreators, store.dispatch))
  Object.assign(store.meta, meta)
  for (const appName in meta.initMethods) {
    meta.initMethods[appName](store, meta.itemsToExtract[appName])
  }
}

const enableBatchDispatch = reducer => (state, action) => {
  if (action.type === 'BATCH_ACTIONS') {
    return action.actions.reduce(reducer, state)
  }
  return reducer(state, action)
}

const composeBundles = (...bundles) => {
  // build out object of extracted bundle info
  const meta = {}
  bundles.forEach(bundle => consumeBundle(bundle, meta, bundles))
  return data => {
    const middleware = [
      thunkMiddleware,
      debugMiddleware
    ]

    for (const appName in meta.extraMiddleware) {
      middleware.push(meta.extraMiddleware[appName](meta.itemsToExtract[appName]))
    }

    const store = createStore(
      enableBatchDispatch(combineReducers(meta.reducers)),
      data,
      customApplyMiddleware(...middleware)
    )

    const { dispatch } = store
    store.dispatch = (...actions) => {
      dispatch(actions.length > 1 ? {type: 'BATCH_ACTIONS', actions} : actions[0])
    }

    store.bundles = bundles

    decorateStore(store, meta)

    store.integrateBundles = (...bundlesToIntegrate) => {
      const { bundles } = store
      const bundleMap = bundles.reduce((acc, bundle, index) => {
        acc[bundle.name] = index
        return acc
      }, {})
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
