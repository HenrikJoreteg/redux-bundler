import appTime from './bundles/app-time'
import asyncCount from './bundles/async-count'
import compose from './compose'
import createRoutingBundle from './bundles/create-route-bundle'
import createAsyncResource from './bundles/create-async-resource-bundle'
import caching from './bundles/local-caching/index'
import geolocation from './bundles/geolocation'
import reactors from './bundles/reactors'
import url from './bundles/url'
import debug from './bundles/debug'
import online from './bundles/online'
import selectAll from './bundles/select-all'
export { createSelector, resolveSelectors } from 'create-selector'
export * from './utils'
export * from './bundles/local-caching/cache'

export const appTimeBundle = appTime
export const asyncCountBundle = asyncCount
export const cachingBundle = caching
export const createRouteBundle = createRoutingBundle
export const createAsyncResourceBundle = createAsyncResource
export const reactorsBundle = reactors
export const onlineBundle = online
export const urlBundle = url
export const debugBundle = debug
export const composeBundlesRaw = compose
export const geolocationBundle = geolocation
export const selectAllBundle = selectAll
export const composeBundles = (...userBundles) => {
  userBundles || (userBundles = [])
  const bundles = [
    appTime,
    asyncCount,
    online,
    url(),
    reactors(),
    caching(),
    selectAll,
    debug,
    ...userBundles
  ]
  return compose(...bundles)
}
