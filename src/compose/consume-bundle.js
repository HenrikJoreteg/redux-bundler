import { startsWith } from '../utils'

export const normalizeBundle = bundle => {
  const { name } = bundle
  if (!name) throw TypeError('bundles must have a "name" property')
  const result = {
    name,
    reducer: bundle.reducer || (bundle.getReducer && bundle.getReducer()) || null,
    init: bundle.init || null,
    extraArgCreators: bundle.getExtraArgs || null,
    middlewareCreators: bundle.getMiddleware,
    actionCreators: null,
    selectors: null,
    reactorNames: null,
    rawBundle: bundle
  }
  Object.keys(bundle).forEach(key => {
    if (startsWith(key, 'do')) {
      (result.actionCreators || (result.actionCreators = {}))[key] = bundle[key]
      return
    }
    const isSelector = startsWith(key, 'select')
    const isReactor = startsWith(key, 'react')
    if (isSelector || isReactor) {
      (result.selectors || (result.selectors = {}))[key] = bundle[key]
      if (isReactor) {
        (result.reactorNames || (result.reactorNames = [])).push(key)
      }
      return
    }
  })
  return result
}

export const createChunk = (rawBundles) => {
  const normalizedBundles = rawBundles.map(normalizeBundle)
  const result = {
    bundleNames: [],
    reducers: {},
    selectors: {},
    actionCreators: {},
    rawBundles: [],
    processedBundles: [],
    initMethods: [],
    middlewareCreators: [],
    extraArgCreators: [],
    reactorNames: []
  }
  normalizedBundles.forEach(bundle => {
    result.bundleNames.push(bundle.name)
    Object.assign(result.selectors, bundle.selectors)
    Object.assign(result.actionCreators, bundle.actionCreators)
    if (bundle.reducer) Object.assign(result.reducers, {[bundle.name]: bundle.reducer})
    if (bundle.init) result.initMethods.push(bundle.init)
    if (bundle.middlewareCreators) result.middlewareCreators.push(bundle.middlewareCreators)
    if (bundle.extraArgCreators) result.extraArgCreators.push(bundle.extraArgCreators)
    if (bundle.reactorNames) result.reactorNames.push(...bundle.reactorNames)
    result.processedBundles.push(bundle)
    result.rawBundles.push(bundle.rawBundle)
  })
  return result
}
