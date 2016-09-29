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

export default createAsyncResourceBundle({
  name: 'geolocation',
  actionBaseType: 'REQUEST_GEOLOCATION',
  getPromise: () => new Promise((resolve, reject) => {
    if (!IS_BROWSER || !navigator.geolocation) {
      reject(getError('Geolocation not supported', true))
    }
    const success = () => {

    }
    const fail = ({code}) => {
      reject(getError(geoErrorArray[code], code === 1))
    }
    const opts = {
      timeout: 60000 // 1 minute
    }
    navigator.geolocation.getCurrentPosition(success, fail, opts)
  })
})
