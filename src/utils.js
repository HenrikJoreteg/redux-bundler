let debug = false
try {
  debug = !!window.localStorage.debug
} catch (e) {}
export const HAS_DEBUG_FLAG = debug || false
export const HAS_WINDOW = !!globalThis.window
export const IS_BROWSER = HAS_WINDOW || !!globalThis.navigator
export const IS_PROD = process.env.NODE_ENV === 'production'
const fallback = func => setTimeout(func, 0)

export const raf =
  IS_BROWSER && globalThis.requestAnimationFrame
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : fallback
export const ric =
  IS_BROWSER && globalThis.requestIdleCallback
    ? globalThis.requestIdleCallback.bind(globalThis)
    : fallback

// can dump this once IE 11 support is no longer necessary
export const isPassiveSupported = () => {
  let passiveSupported = false
  try {
    var options = Object.defineProperty({}, 'passive', {
      /* eslint-disable getter-return */
      get: function () {
        passiveSupported = true
      }
      /* eslint-enable getter-return */
    })
    globalThis.addEventListener('test', options, options)
    globalThis.removeEventListener('test', options, options)
  } catch (err) {
    passiveSupported = false
  }
  return passiveSupported
}

export const PASSIVE_EVENTS_SUPPORTED = isPassiveSupported()

export const startsWith = (string, searchString) =>
  string.substr(0, searchString.length) === searchString

export const flattenExtractedToObject = extracted => {
  const result = {}
  for (const appName in extracted) {
    Object.assign(result, extracted[appName])
  }
  return result
}

export const flattenExtractedToArray = extracted => {
  const accum = []
  for (const appName in extracted) {
    accum.push(...extracted[appName])
  }
  return accum
}

export const addGlobalListener = (
  eventName,
  handler,
  opts = { passive: false }
) => {
  if (!IS_BROWSER) return () => {}

  const args = opts.passive
    ? PASSIVE_EVENTS_SUPPORTED
      ? [eventName, handler, { passive: true }]
      : [eventName, debounce(handler, 200), false]
    : [eventName, handler]

  globalThis.addEventListener(...args)

  return () => globalThis.removeEventListener(...args)
}

export const selectorNameToValueName = name => {
  const start = name[0] === 's' ? 6 : 5
  return name[start].toLowerCase() + name.slice(start + 1)
}

export const debounce = (fn, wait) => {
  let timeout
  const debounced = function () {
    const ctx = this
    const args = arguments
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

export const saveScrollPosition = () => {
  history.replaceState(
    {
      height: window.innerHeight,
      width: window.innerWidth,
      y: window.scrollY,
      x: window.scrollX
    },
    ''
  )
}

export const restoreScrollPosition = () => {
  const { state } = history
  if (state) {
    // we'll force it to our known height since the DOM rendering may
    // be async and the height may not be restored yet.
    setTimeout(() => {
      const newStyle = `height: ${state.height}px; width: ${state.width}px;`
      document.body.setAttribute('style', newStyle)
      window.scrollTo(state.x, state.y)
      ric(() => document.body.removeAttribute('style'))
    })
  }
}

export const initScrollPosition = () => {
  if (!HAS_WINDOW) {
    return
  }
  // turn off browser scroll restoration if available
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual'
  }
  const removePopstateListener = addGlobalListener(
    'popstate',
    restoreScrollPosition
  )
  const removeScrollListener = addGlobalListener(
    'scroll',
    debounce(saveScrollPosition, 300),
    {
      passive: true
    }
  )

  restoreScrollPosition()

  return () => {
    removePopstateListener()
    removeScrollListener()
  }
}
