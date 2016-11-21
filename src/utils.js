let debug = false
try { debug = !!window.localStorage.debug } catch (e) {}
export default debug

export const IS_BROWSER = typeof window !== 'undefined' || typeof self !== 'undefined'
export const IS_DEBUG = debug
export const flattenExtractedToObject = (extracted) => {
  const result = {}
  for (const appName in extracted) {
    Object.assign(result, extracted[appName])
  }
  return result
}
export const flattenExtractedToArray = (extracted) => {
  let accum = []
  for (const appName in extracted) {
    accum.push(...extracted[appName])
  }
  return accum
}
export const windowListen = (eventName, handler) => {
  if (IS_BROWSER) {
    window.addEventListener(eventName, handler)
  }
}