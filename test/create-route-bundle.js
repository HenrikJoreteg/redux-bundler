// polyfill URL for node
global.URL = require('whatwg-url').URL
const test = require('tape')
const {
  composeBundlesRaw,
  createRouteBundle,
  createUrlBundle
} = require('../dist/redux-bundler')

test('create-route-bundle', t => {
  const startUrl = 'http://subdomain.something.com:3030/something#hi=there'

  const getStoreForRoutes = routes =>
    composeBundlesRaw(
      createUrlBundle(),
      createRouteBundle(routes)
    )({ url: startUrl })

  const routes = {
    '/': 'home',
    '/detail': 'detail',
    '/something': 'something'
  }

  const store = getStoreForRoutes(routes)
  t.equal(store.selectRoute(), 'something')
  const routeMatcher = store.selectRouteMatcher()
  t.equal(
    routeMatcher('/').value,
    'home',
    'route matcher can be used independently'
  )
  t.deepEqual(store.selectRoutes(), routes, 'can select entire route object')

  // route behavior when no matches
  store.doUpdateUrl('/blah')
  t.equal(store.selectRoute(), null, 'selectRoute() returns null if no matches')
  t.deepEqual(
    store.selectRouteParams(),
    {},
    'selectRouteParams() returns empty object if no matches'
  )

  t.equal(routeMatcher, store.selectRouteMatcher(), 'route matcher is cached')
  store.doReplaceRoutes({
    '/': 'updated',
    '/new': 'detail'
  })

  const newRouteMatcher = store.selectRouteMatcher()
  t.notEqual(newRouteMatcher, routeMatcher, 'route matcher is replaced')
  t.deepEqual(
    store.selectRoutes(),
    {
      '/': 'updated',
      '/new': 'detail'
    },
    'routes are completely replaced'
  )

  t.end()
})
