import { startsWith } from '../utils'

export const normalizeBundle = bundle => {
  const { name } = bundle
  if (!name) throw TypeError('Bundles must have a .name')
  const result = {
    name,
    reducer: bundle.reducer || (bundle.getReducer && bundle.getReducer()) || null,
    init: bundle.init || null,
    extraArgs: bundle.extraArgs || null,
    getMiddleware: bundle.getMiddleware,
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
    reducers: {},
    selectors: {},
    extraArgs: {},
    actionCreators: {},
    rawBundles: [],
    processedBundles: [],
    initMethods: [],
    middlewareCreators: [],
    reactorNames: []
  }
  normalizedBundles.forEach(bundle => {
    Object.assign(result.selectors, bundle.selectors)
    Object.assign(result.extraArgs, bundle.extraArgs)
    Object.assign(result.actionCreators, bundle.actionCreators)
    if (bundle.reducer) Object.assign(result.reducers, {[bundle.name]: bundle.reducer})
    if (bundle.init) result.initMethods.push(bundle.init)
    if (bundle.middlewareCreators) result.middlewareCreators.push(bundle.getMiddleware)
    if (bundle.reactorNames) result.reactorNames.push(...bundle.reactorNames)
    result.processedBundles.push(bundle)
    result.rawBundles.push(bundle.rawBundle)
  })
  return result
}
