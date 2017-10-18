// polyfill URL for node
global.URL = require('whatwg-url').URL
const test = require('tape')
const { composeBundlesRaw, urlBundle } = require('../')

test('url-bundle selectors', (t) => {
  const startUrl = 'http://subdomain.something.com:3030/something#hi=there'
  const store = composeBundlesRaw(urlBundle())({url: startUrl})
  t.deepEqual(store.selectUrlRaw(), {url: startUrl, replace: false}, 'returns basic start')
  t.equal(store.selectUrlObject().href, startUrl, 'returns href')
  t.deepEqual(store.selectQueryObject(), {}, 'returns parsed object')
  t.equal(store.selectQueryString(), '', 'returns href')
  t.equal(store.selectPathname(), '/something', 'returns href')
  t.equal(store.selectHash(), 'hi=there', 'returns hash')
  t.deepEqual(store.selectHashObject(), {hi: 'there'}, 'returns parsed hash')
  t.deepEqual(store.selectSubdomains(), ['subdomain'], 'get subdomains')
  t.deepEqual(store.selectHostname(), 'subdomain.something.com', 'get bare domain')

  const store2 = composeBundlesRaw(urlBundle())()
  t.deepEqual(store2.selectUrlRaw(), {url: '/', replace: false})
  t.end()
})

test('url-bundle actionCreators', (t) => {
  const start = 'http://something.com/something'
  let store
  const resetStore = (startUrl = start) => {
    store = composeBundlesRaw(urlBundle())({url: startUrl})
  }

  resetStore()
  store.doUpdateUrl('/')
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/', replace: false})

  resetStore()
  store.doUpdateUrl('/', {replace: true})
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/', replace: true})

  resetStore()
  store.doReplaceUrl('/hi')
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/hi', replace: true})

  resetStore()
  store.doUpdateQuery({ok: 'hi'})
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/something?ok=hi', replace: true})

  resetStore()
  store.doUpdateQuery('ok=hi')
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/something?ok=hi', replace: true})
  t.deepEqual(store.selectQueryObject(), {ok: 'hi'})

  resetStore()
  store.doUpdateHash({ok: 'hi'})
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/something#ok=hi', replace: false})

  resetStore()
  store.doUpdateUrl('/hi?there=you#something')
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/hi?there=you#something', replace: false})

  resetStore()
  store.doUpdateUrl('/hi?there=you')
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/hi?there=you', replace: false})

  resetStore()
  store.doUpdateUrl('/hi#something')
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/hi#something', replace: false})

  t.end()
})
