import { createSelector } from 'create-selector'
import createRouteMatcher from 'feather-route-matcher'

export default (routes) => ({
  name: 'routes',
  selectRouteInfo: createSelector('selectPathname', createRouteMatcher(routes)),
  selectRouteParams: createSelector('selectRouteInfo', ({params}) => params),
  selectCurrentComponent: createSelector('selectRouteInfo', ({page}) => page)
})
