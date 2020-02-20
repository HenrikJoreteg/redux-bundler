import appTime from './bundles/app-time'
import asyncCount from './bundles/async-count'
import compose from './compose/index'
import createRoutingBundle from './bundles/create-route-bundle'
import caching from './bundles/create-cache-bundle'
import reactors, {
  getIdleDispatcher as idle
} from './bundles/create-reactor-bundle'
import url from './bundles/create-url-bundle'
import createDebug from './bundles/create-debug-bundle'

export { createSelector, resolveSelectors } from 'create-selector'
export * from './utils'
export * from 'redux'

export const appTimeBundle = appTime
export const asyncCountBundle = asyncCount
export const createCacheBundle = caching
export const createRouteBundle = createRoutingBundle
export const createReactorBundle = reactors
export const getIdleDispatcher = idle
export const createUrlBundle = url
export const createDebugBundle = createDebug
export const composeBundlesRaw = compose
export const composeBundles = (...userBundles) => {
  userBundles || (userBundles = [])
  const bundles = [
    appTime,
    asyncCount,
    url(),
    reactors(),
    createDebug(),
    ...userBundles
  ]
  return compose(...bundles)
}
