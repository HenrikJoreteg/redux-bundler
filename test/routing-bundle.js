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

  const store = composeBundlesRaw(
    createUrlBundle(),
    createRouteBundle({
      '/': 'home',
      '/detail': 'detail',
      '/something': 'something'
    })
  )({ url: startUrl })
  t.equal(store.selectRoute(), 'something')
  const routeMatcher = store.selectRouteMatcher()
  t.equal(
    routeMatcher('/').page,
    'home',
    'route matcher can be used independently'
  )
  t.end()
})
