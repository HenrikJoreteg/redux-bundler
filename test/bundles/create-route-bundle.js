// polyfill URL for node
global.URL = require('whatwg-url').URL
const test = require('tape')
const {
  composeBundlesRaw,
  createRouteBundle,
  createUrlBundle
} = require('../../dist/redux-bundler')

test('create-route-bundle', t => {
  const startUrl = 'http://subdomain.something.com:3030/something#hi=there'

  const routes = {
    '/': 'home',
    '/detail': 'detail',
    '/something': 'something'
  }

  const store = composeBundlesRaw(createUrlBundle(), createRouteBundle(routes))(
    { url: startUrl }
  )
  t.equal(store.selectRoute(), 'something')
  const routeMatcher = store.selectRouteMatcher()
  t.equal(
    routeMatcher('/').page,
    'home',
    'route matcher can be used independently'
  )
  t.deepEqual(store.selectRoutes(), routes, 'can select entire route object')
  t.end()
})
