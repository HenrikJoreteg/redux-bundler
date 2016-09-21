// Thin layer on top of idbkey val with support for versioning and
// max age
import idbKeyval from 'idb-keyval'

const defaultOpts = {maxAge: Infinity, version: 0, lib: idbKeyval}

export const getCachedItem = (key, opts) => {
  const { maxAge, version, lib } = Object.assign(opts, defaultOpts)
  return lib.get(key)
    .then(JSON.parse)
    .then(parsed => {
      const age = Date.now() - parsed.time
      if (age > maxAge || version !== parsed.version) {
        lib.delete(key)
        return null
      }
      return {
        age,
        data: parsed.data
      }
    })
}

export const getAllCached = opts => {
  Object.assign(opts, defaultOpts)
  let keys
  return opts.lib.keys()
    .then(retrivedKeys => {
      keys = retrivedKeys
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
}

export const clearAllCached = (opts = defaultOpts) => opts.lib.clear()

export const cacheItem = (key, data, opts) => {
  Object.assign(opts, defaultOpts)
  return opts.lib.set(key, JSON.stringify({
    version: opts.version,
    time: Date.now(),
    data: data
  }))
}
