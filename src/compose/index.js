import namedActionMiddleware from '../middleware/named-action'
import thunkMiddleware from '../middleware/custom-thunk'
import customApplyMiddleware from '../middleware/custom-apply-middleware'
import {
  bindActionCreators,
  combineReducers,
  compose,
  createStore
} from 'redux'
import { resolveSelectors } from 'create-selector'
import { createChunk } from './consume-bundle'
import addBindingMethods from './add-binding-methods'
import {
  HAS_WINDOW,
  HAS_DEBUG_FLAG,
  IS_PROD,
  selectorNameToValueName
} from '../utils'

const bindSelectorsToStore = (store, selectors) => {
  for (const key in selectors) {
    const selector = selectors[key]
    if (!store[key]) {
      store[key] = () => selector(store.getState())
    }
  }
}

const decorateStore = (store, processed) => {
  if (!store.meta) {
    store.meta = {
      chunks: [],
      unboundSelectors: {},
      unboundActionCreators: {},
      reactorNames: []
    }
  }

  const { meta } = store

  // attach for reference
  meta.chunks.push(processed)

  // grab existing unbound (but resolved) selectors, combine with new ones
  const combinedSelectors = Object.assign(
    meta.unboundSelectors,
    processed.selectors
  )

  // run resolver
  resolveSelectors(combinedSelectors)

  // update collection of resolved selectors
  meta.unboundSelectors = combinedSelectors

  // make sure all selectors are bound (won't overwrite if already bound)
  bindSelectorsToStore(store, combinedSelectors)

  // build our list of reactor names
  meta.reactorNames = meta.reactorNames.concat(processed.reactorNames)

  // extend global collections with new stuff
  Object.assign(meta.unboundActionCreators, processed.actionCreators)

  // bind and attach only the next action creators to the store
  Object.assign(
    store,
    bindActionCreators(processed.actionCreators, store.dispatch)
  )

  // run any new init methods
  processed.initMethods.forEach(fn => fn(store))
}

const enableBatchDispatch = reducer => (state, action) => {
  if (action.type === 'BATCH_ACTIONS') {
    return action.actions.reduce(reducer, state)
  }
  return reducer(state, action)
}

const devTools = () =>
  (!IS_PROD && HAS_WINDOW && window.__REDUX_DEVTOOLS_EXTENSION__) ||
  (HAS_DEBUG_FLAG && HAS_WINDOW && window.__REDUX_DEVTOOLS_EXTENSION__)
    ? window.__REDUX_DEVTOOLS_EXTENSION__()
    : null

const composeBundles = (...bundles) => {
  // build out object of extracted bundle info
  const firstChunk = createChunk(bundles)

  return data => {
    // actually init our store
    const store = createStore(
      enableBatchDispatch(combineReducers(firstChunk.reducers)),
      data,
      compose(
        customApplyMiddleware(
          ...[
            namedActionMiddleware,
            thunkMiddleware(firstChunk.extraArgCreators),
            ...firstChunk.middlewareCreators.map(fn => fn(firstChunk))
          ]
        ),
        devTools()
      )
    )

    // get values from an array of selector names
    store.select = selectorNames =>
      selectorNames.reduce((obj, name) => {
        if (!store[name]) throw Error(`SelectorNotFound ${name}`)
        obj[selectorNameToValueName(name)] = store[name]()
        return obj
      }, {})

    // get all values from all available selectors (even if added later)
    store.selectAll = () =>
      store.select(Object.keys(store.meta.unboundSelectors))

    // add support for dispatching an action by name
    store.action = (name, args) => store[name](...args)

    // adds support for subscribing to changes from an array of selector strings
    addBindingMethods(store)

    // add all the gathered bundle data into the store
    decorateStore(store, firstChunk)

    // defines method for integrating other bundles later
    store.integrateBundles = (...bundlesToIntegrate) => {
      decorateStore(store, createChunk(bundlesToIntegrate))
      const allReducers = store.meta.chunks.reduce(
        (accum, chunk) => Object.assign(accum, chunk.reducers),
        {}
      )
      store.replaceReducer(enableBatchDispatch(combineReducers(allReducers)))
    }

    return store
  }
}

export default composeBundles
