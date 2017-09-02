let debug = false
try { debug = !!window.localStorage.debug } catch (e) {}
export const HAS_DEBUG_FLAG = debug
export const HAS_WINDOW = typeof window !== 'undefined'
export const IS_BROWSER = HAS_WINDOW || typeof self !== 'undefined'
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
export const addGlobalListener = (eventName, handler) => {
  if (IS_BROWSER) {
    self.addEventListener(eventName, handler)
  }
}
export const selectorNameToValueName = name =>
  name.charAt(6).toLowerCase() + name.slice(7)
export const debounce = (fn, wait) => {
  let timeout
  const debounced = function () {
    let ctx = this
    let args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn.apply(ctx, args)
    }, wait)
  }

  debounced.cancel = () => {
    clearTimeout(timeout)
  }

  return debounced
}
