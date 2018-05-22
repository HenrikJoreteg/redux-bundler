import { createSelector } from 'create-selector'
import createRouteMatcher from 'feather-route-matcher'

const defaults = {
  routeInfoSelector: 'selectPathname'
}

export default (routes, spec) => {
  const opts = Object.assign({}, defaults, spec)
  const { routeInfoSelector } = opts
  return {
    name: 'routes',
    selectRouteInfo: createSelector(
      routeInfoSelector,
      createRouteMatcher(routes)
    ),
    selectRouteParams: createSelector(
      'selectRouteInfo',
      ({ params }) => params
    ),
    selectRoute: createSelector('selectRouteInfo', ({ page }) => page)
  }
}
