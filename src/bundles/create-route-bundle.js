import { createSelector } from 'create-selector'
import createRouteMatcher from 'feather-route-matcher'

const defaults = {
  routeInfoSelector: 'selectPathname',
  replaceAction: 'ROUTE_MATCHER_REPLACED'
}

export default (routes, spec) => {
  const opts = Object.assign({}, defaults, spec)
  const { routeInfoSelector, replaceAction } = opts
  const routeMatcher = createRouteMatcher(routes)
  return {
    name: 'routes',
    reducer: (state = { routes, routeMatcher }, { type, payload }) =>
      type === replaceAction
        ? { routes: payload.routes, routeMatcher: payload.routeMatcher }
        : state,
    selectRoutes: state => state.routes.routes,
    selectRouteMatcher: state => state.routes.routeMatcher,
    selectRouteInfo: createSelector(
      'selectRouteMatcher',
      routeInfoSelector,
      (routeMatcher, url) => routeMatcher(url)
    ),
    selectRouteParams: createSelector(
      'selectRouteInfo',
      match => (match && match.params) || {}
    ),
    selectRoute: createSelector(
      'selectRouteInfo',
      match => (match && match.value) || null
    ),
    doReplaceRoutes: routes => ({
      type: replaceAction,
      payload: { routeMatcher: createRouteMatcher(routes), routes }
    })
  }
}
