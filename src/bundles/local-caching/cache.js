// Thin layer on top of idb-keyval with support for versioning and
// max age
import idbKeyVal from 'idb-keyval'

const defaultOpts = {maxAge: Infinity, version: 0, lib: idbKeyVal}

export const getCachedItem = (key, opts) => {
  const { maxAge, version, lib } = Object.assign({}, defaultOpts, opts)
  return lib.get(key)
    .then(JSON.parse)
    .then(parsed => {
      const age = Date.now() - parsed.time
      console.log('VERSION', version, parsed.version)
      if (age > maxAge || version !== parsed.version) {
        lib.delete(key)
        return null
      }
      return {
        age,
        data: parsed.data
      }
    })
    .catch(() => null)
}

export const getAllCached = spec => {
  const opts = Object.assign({}, defaultOpts, spec)
  let keys
  return opts.lib.keys()
    .then(retrievedKeys => {
      keys = retrievedKeys
      return Promise.all(keys.map(key =>
        getCachedItem(key, opts)
          .then(res => res.data)
      ))
    })
    .then(data => data.reduce((acc, bundleData, index) => {
      if (bundleData) {
        acc[keys[index]] = bundleData
      }
      return acc
    }, {}))
    .catch(() => {})
}

export const clearAllCached = (opts = defaultOpts) =>
  opts.lib.clear().catch(() => null)

export const cacheItem = (key, data, spec) => {
  const opts = Object.assign({}, defaultOpts, spec)
  return opts.lib.set(key, JSON.stringify({
    version: opts.version,
    time: Date.now(),
    data: data
  }))
  .catch(() => null)
}
