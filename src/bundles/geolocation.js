import createAsyncResourceBundle from './create-async-resource-bundle'
import { IS_BROWSER } from '../utils'

const getError = (message, permanent = false) => {
  const err = new Error(message)
  if (permanent) err.permanent = true
  return err
}

const geoErrorArray = [
  'An unknown geolocation error occured',
  'Geolocation permission denied',
  'Geolocation unavailable',
  'Geolocation request timed out'
]

const defaultOpts = {
  timeout: 60000,
  enableHighAccuracy: false,
  persist: true,
  staleAge: 900000, // fifteen minutes
  retryAfter: 60000 // one minute,
}

export default spec => {
  const opts = Object.assign({}, defaultOpts, spec)
  return createAsyncResourceBundle({
    name: 'geolocation',
    actionBaseType: 'REQUEST_GEOLOCATION',
    getPromise: () => new Promise((resolve, reject) => {
      if (!IS_BROWSER || !navigator.geolocation) {
        reject(getError('Geolocation not supported', true))
      }
      const success = (position) => {
        const res = {}
        const { coords } = position
        for (const key in coords) {
          res[key] = coords[key]
        }
        res.timestamp = position.timestamp
        resolve(res)
      }
      const fail = ({code}) => {
        reject(getError(geoErrorArray[code], code === 1))
      }
      const geoOpts = {
        timeout: opts.timeout,
        enableHighAccuracy: opts.enableHighAccuracy
      }
      navigator.geolocation.getCurrentPosition(success, fail, geoOpts)
    }),
    persist: opts.persist,
    staleAge: opts.staleAge,
    retryAfter: opts.retryAfter
  })
}
