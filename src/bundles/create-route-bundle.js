import { createSelector } from 'create-selector'
import createRouteMatcher from 'feather-route-matcher'

export default (routes, routeInfoSelector = 'selectPathname') => ({
  name: 'routes',
  selectRouteInfo: createSelector(routeInfoSelector, createRouteMatcher(routes)),
  selectRouteParams: createSelector('selectRouteInfo', ({ params }) => params),
  selectRoute: createSelector('selectRouteInfo', ({ page }) => page)
})
