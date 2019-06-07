import appTime from './bundles/app-time'
import asyncCount from './bundles/async-count'
import compose from './compose/index'
import createRoutingBundle from './bundles/create-route-bundle'
import createAsyncResource from './bundles/create-async-resource-bundle'
import caching from './bundles/create-cache-bundle'
import geolocation from './bundles/create-geolocation-bundle'
import reactors, {
  getIdleDispatcher as idle
} from './bundles/create-reactor-bundle'
import url from './bundles/create-url-bundle'
import createDebug from './bundles/create-debug-bundle'
import online from './bundles/online'
export { createSelector, resolveSelectors } from 'create-selector'
export * from './utils'
export * from 'redux'

export const appTimeBundle = appTime
export const asyncCountBundle = asyncCount
export const createCacheBundle = caching
export const createRouteBundle = createRoutingBundle
export const createAsyncResourceBundle = createAsyncResource
export const createReactorBundle = reactors
export const getIdleDispatcher = idle
export const onlineBundle = online
export const createUrlBundle = url
export const createDebugBundle = createDebug
export const composeBundlesRaw = compose
export const createGeolocationBundle = geolocation
export const composeBundles = (...userBundles) => {
  userBundles || (userBundles = [])
  const bundles = [
    appTime,
    asyncCount,
    online,
    url(),
    reactors(),
    createDebug(),
    ...userBundles
  ]
  return compose(...bundles)
}
