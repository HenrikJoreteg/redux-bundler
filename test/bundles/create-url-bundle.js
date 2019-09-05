// polyfill URL for node
global.URL = require('whatwg-url').URL
const test = require('tape')
const {
  composeBundlesRaw,
  createUrlBundle
} = require('../../dist/redux-bundler')

test('url-bundle selectors', t => {
  const startUrl = 'http://subdomain.something.com:3030/something#hi=there'
  const store = composeBundlesRaw(createUrlBundle())({ url: startUrl })
  t.deepEqual(
    store.selectUrlRaw(),
    { url: startUrl, replace: false, maintainScrollPosition: false },
    'returns basic start'
  )
  // make sure object will be serializable
  const urlObj = store.selectUrlObject()
  for (const key in urlObj) {
    const val = urlObj[key]
    if (typeof val !== 'string') {
      t.fail('all object values should be strings')
    }
  }
  t.equal(store.selectUrlObject().href, startUrl, 'returns href')
  t.deepEqual(store.selectQueryObject(), {}, 'returns parsed object')
  t.equal(store.selectQueryString(), '', 'returns href')
  t.equal(store.selectPathname(), '/something', 'returns href')
  t.equal(store.selectHash(), 'hi=there', 'returns hash')
  t.deepEqual(store.selectHashObject(), { hi: 'there' }, 'returns parsed hash')
  t.deepEqual(store.selectSubdomains(), ['subdomain'], 'get subdomains')
  t.deepEqual(
    store.selectHostname(),
    'subdomain.something.com',
    'get bare domain'
  )

  const store2 = composeBundlesRaw(createUrlBundle())()
  t.deepEqual(store2.selectUrlRaw(), {
    url: '/',
    replace: false,
    maintainScrollPosition: false
  })
  t.end()
})

test('url-bundle actionCreators', t => {
  const start = 'http://something.com/something'
  let store
  const resetStore = (startUrl = start) => {
    store = composeBundlesRaw(createUrlBundle())({ url: startUrl })
  }

  resetStore()
  store.doUpdateUrl('/')
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/',
    replace: false,
    maintainScrollPosition: false
  })

  resetStore()
  store.doUpdateUrl('/', { replace: true })
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/',
    replace: true,
    maintainScrollPosition: false
  })

  resetStore()
  store.doReplaceUrl('/hi')
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/hi',
    replace: true,
    maintainScrollPosition: false
  })

  resetStore()
  store.doUpdateQuery({ ok: 'hi' })
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/something?ok=hi',
    replace: true,
    maintainScrollPosition: false
  })

  resetStore()
  store.doUpdateQuery('ok=hi')
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/something?ok=hi',
    replace: true,
    maintainScrollPosition: false
  })
  t.deepEqual(store.selectQueryObject(), { ok: 'hi' })

  resetStore()
  store.doUpdateHash({ ok: 'hi' })
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/something#ok=hi',
    replace: false,
    maintainScrollPosition: false
  })

  resetStore()
  store.doUpdateUrl('/hi?there=you#something')
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/hi?there=you#something',
    replace: false,
    maintainScrollPosition: false
  })
  store.doUpdateUrl('/boo')
  t.deepEqual(
    store.selectUrlRaw(),
    {
      url: 'http://something.com/boo',
      replace: false,
      maintainScrollPosition: false
    },
    'clears existing when passing full string'
  )

  resetStore()
  store.doUpdateUrl('/hi?there=you')
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/hi?there=you',
    replace: false,
    maintainScrollPosition: false
  })

  resetStore()
  store.doUpdateUrl('/hi#something')
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/hi#something',
    replace: false,
    maintainScrollPosition: false
  })

  resetStore()
  store.doUpdateUrl('/hi', { maintainScrollPosition: true })
  t.deepEqual(store.selectUrlRaw(), {
    url: 'http://something.com/hi',
    replace: false,
    maintainScrollPosition: true
  })

  t.end()
})
