import qs from 'querystringify'
import { createSelector } from 'create-selector'
import { HAS_WINDOW } from '../utils'

export const isString = obj => Object.prototype.toString.call(obj) === '[object String]'
export const isDefined = thing => typeof thing !== 'undefined'
export const ensureString = input => isString(input) ? input : qs.stringify(input)
const IPRE = /^[0-9\.]+$/
export const parseSubdomains = (hostname, getBareHost) => {
  if (IPRE.test(hostname)) return []
  const parts = hostname.split('.')
  if (getBareHost) {
    return parts.slice(-2).join('.')
  }
  return hostname.split('.').slice(0, -2)
}
export const removeLeading = (char, string) =>
  string.charAt(0) === char ? string.slice(1) : string
export const ensureLeading = (char, string) => {
  if (string === char || string === '') {
    return ''
  }
  return string.charAt(0) !== char ? char + string : string
}
const loc = (() => {
  if (!HAS_WINDOW) return {}
  return window.location
})()
const defaults = {
  name: 'url',
  inert: !HAS_WINDOW,
  actionType: 'UPDATE_URL'
}

const makeSerializable = (url) => {
  const result = {}
  for (const key in url) {
    const val = url[key]
    if (isString(val)) {
      result[key] = val
    }
  }
  return result
}

export default (opts) => {
  const config = Object.assign({}, defaults, opts)
  const actionType = config.actionType

  const selectUrlRaw = state => state[config.name]
  const selectUrlObject = createSelector(selectUrlRaw, urlState => makeSerializable(new URL(urlState.url)))
  const selectQueryObject = createSelector(selectUrlObject, urlObj => qs.parse(urlObj.search))
  const selectQueryString = createSelector(selectQueryObject, queryObj => qs.stringify(queryObj))
  const selectPathname = createSelector(selectUrlObject, urlObj => urlObj.pathname)
  const selectHash = createSelector(selectUrlObject, urlObj => removeLeading('#', urlObj.hash))
  const selectHashObject = createSelector(selectHash, hash => qs.parse(hash))
  const selectHostname = createSelector(selectUrlObject, urlObj => urlObj.hostname)
  const selectSubdomains = createSelector(selectHostname, hostname => parseSubdomains(hostname))

  const doUpdateUrl = (newState, opts = {replace: false}) => ({dispatch, getState}) => {
    let state = newState
    if (typeof newState === 'string') {
      const parsed = new URL(newState.charAt(0) === '/' ? 'http://example.com' + newState : newState)
      state = {
        pathname: parsed.pathname,
        query: parsed.search || '',
        hash: parsed.hash || ''
      }
    }
    const url = new URL(selectUrlRaw(getState()).url)
    if (isDefined(state.pathname)) url.pathname = state.pathname
    if (isDefined(state.hash)) url.hash = ensureString(state.hash)
    if (isDefined(state.query)) url.search = ensureString(state.query)
    dispatch({ type: actionType, payload: { url: url.href, replace: opts.replace } })
  }
  const doReplaceUrl = (url) => doUpdateUrl(url, {replace: true})
  const doUpdateQuery = (query, opts = {replace: true}) =>
    doUpdateUrl({ query: ensureString(query) }, opts)
  const doUpdateHash = (hash, opts = {replace: false}) =>
    doUpdateUrl({ hash: ensureLeading('#', ensureString(hash)) }, opts)

  return {
    name: config.name,
    init: store => {
      if (config.inert) {
        return
      }

      let lastState = store.selectUrlRaw()

      const setCurrentUrl = () => {
        store.doUpdateUrl({
          pathname: loc.pathname,
          hash: loc.hash,
          query: loc.search
        })
      }

      window.addEventListener('popstate', setCurrentUrl)

      store.subscribe(() => {
        const newState = store.selectUrlRaw()
        const newUrl = newState.url
        if (lastState !== newState && newUrl !== loc.href) {
          try {
            window.history[newState.replace ? 'replaceState' : 'pushState']({}, null, newState.url)
            document.body.scrollTop = 0
          } catch (e) {
            console.error(e)
          }
        }
        lastState = newState
      })
    },
    getReducer: () => {
      const initialState = {
        url: !config.inert && HAS_WINDOW
          ? loc.href
          : '/',
        replace: false
      }

      return (state = initialState, {type, payload}) => {
        if (type === '@@redux/INIT' && typeof state === 'string') {
          return {
            url: state,
            replace: false
          }
        }
        if (type === actionType) {
          return Object.assign({
            url: payload.url || payload,
            replace: !!payload.replace
          })
        }
        return state
      }
    },
    doUpdateUrl,
    doReplaceUrl,
    doUpdateQuery,
    doUpdateHash,
    selectUrlRaw,
    selectUrlObject,
    selectQueryObject,
    selectQueryString,
    selectPathname,
    selectHash,
    selectHashObject,
    selectHostname,
    selectSubdomains
  }
}
