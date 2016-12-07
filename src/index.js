import appTime from './bundles/app-time'
import asyncCount from './bundles/async-count'
import compose from './compose'
import inspect from './bundles/inspect'
import createRoutingBundle from './bundles/create-route-bundle'
import createAsyncResource from './bundles/create-async-resource-bundle'
import caching from './bundles/local-caching/index'
import geolocation from './bundles/geolocation'
import reactors from './bundles/reactors'
import url from './bundles/url'
import meta from './bundles/meta'
import online from './bundles/online'
export { createSelector, resolveSelectors } from 'create-selector'
export * from './utils'
export * from './bundles/local-caching/cache'

export const appTimeBundle = appTime
export const asyncCountBundle = asyncCount
export const inspectBundle = inspect
export const cachingBundle = caching
export const createRouteBundle = createRoutingBundle
export const createAsyncResourceBundle = createAsyncResource
export const reactorsBundle = reactors
export const onlineBundle = online
export const urlBundle = url
export const metaBundle = meta
export const composeBundlesRaw = compose
export const geolocationBundle = geolocation
export const composeBundles = (...userBundles) => {
  userBundles || (userBundles = [])
  const bundles = [
    appTime,
    asyncCount,
    online,
    meta,
    url(),
    reactors(),
    caching(),
    inspect,
    ...userBundles
  ]
  return compose(...bundles)
}
