import appTime from './bundles/app-time'
import asyncCount from './bundles/async-count'
import compose from './compose'
import inspect from './bundles/inspect'
import createRoutingBundle from './bundles/create-route-bundle'
import caching from './bundles/local-caching/index'
import effects from './bundles/effects'
import url from './bundles/url'
export { createSelector, resolveSelectors } from 'create-selector'
export * from './utils'
export * from './bundles/local-caching/cache'

export const appTimeBundle = appTime
export const asyncCountBundle = asyncCount
export const inspectBundle = inspect
export const cachingBundle = caching
export const createRouteBundle = createRoutingBundle
export const effectsBundle = effects
export const urlBundle = url
export const composeBundlesRaw = compose
export const composeBundles = (...userBundles) => {
  userBundles || (userBundles = [])
  const bundles = [
    appTime,
    asyncCount,
    url(),
    effects(),
    caching(),
    inspect,
    ...userBundles
  ]
  return compose(...bundles)
}
