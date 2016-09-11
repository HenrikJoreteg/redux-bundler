const test = require('tape')
const { composeBundles, urlBundle } = require('../')

test('url-bundle selectors', (t) => {
  const startUrl = 'http://subdomain.something.com:3030/something#hi=there'
  const store = composeBundles(urlBundle())({url: startUrl})
  t.deepEqual(store.selectUrlRaw(), {url: startUrl, replace: false}, 'returns basic start')
  t.equal(store.selectUrlObject().href, startUrl, 'returns href')
  t.deepEqual(store.selectQueryObject(), {}, 'returns parsed object')
  t.equal(store.selectQueryString(), '', 'returns href')
  t.equal(store.selectPathname(), '/something', 'returns href')
  t.equal(store.selectHash(), 'hi=there', 'returns hash')
  t.deepEqual(store.selectHashObject(), {hi: 'there'}, 'returns parsed hash')
  t.deepEqual(store.selectSubdomains(), ['subdomain'], 'get subdomains')

  const store2 = composeBundles(urlBundle())()
  t.deepEqual(store2.selectUrlRaw(), {url: '/', replace: false})
  t.end()
})

test('url-bundle actionCreators', (t) => {
  const start = 'http://something.com/something'
  let store
  const resetStore = (startUrl = start) =>
    store = composeBundles(urlBundle())({url: startUrl})

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

  resetStore()
  store.doUpdateHash({ok: 'hi'})
  t.deepEqual(store.selectUrlRaw(), {url: 'http://something.com/something#ok=hi', replace: false})

  t.end()
})
