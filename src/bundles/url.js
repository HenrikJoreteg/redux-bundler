import URL from 'url-parse'
import qs from 'querystringify'
import { createSelector } from 'create-selector'
import { HAS_WINDOW } from '../utils'

export const isDefined = thing => typeof thing !== 'undefined'
export const ensureString = input => typeof input === 'string' ? input : qs.stringify(input)
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

export default (opts) => {
  const config = Object.assign({}, defaults, opts)
  const actionType = config.actionType

  const selectUrlRaw = state => state[config.name]
  const selectUrlObject = createSelector(selectUrlRaw, urlState => new URL(urlState.url, true))
  const selectQueryObject = createSelector(selectUrlObject, urlObj => urlObj.query)
  const selectQueryString = createSelector(selectQueryObject, queryObj => qs.stringify(queryObj))
  const selectPathname = createSelector(selectUrlObject, urlObj => urlObj.pathname)
  const selectHash = createSelector(selectUrlObject, urlObj => removeLeading('#', urlObj.hash))
  const selectHashObject = createSelector(selectHash, hash => qs.parse(hash))
  const selectHostname = createSelector(selectUrlObject, urlObj => urlObj.hostname)
  const selectSubdomains = createSelector(selectHostname, hostname => parseSubdomains(hostname))
  const selectBareHostname = createSelector(selectHostname, hostname => parseSubdomains(hostname, true))

  const doUpdateUrl = (newState, opts = {replace: false}) => ({dispatch, getState}) => {
    const state = (typeof newState === 'string') ? { pathname: newState, hash: '', query: '' } : newState
    const url = new URL(selectUrlRaw(getState()).url, true)
    if (isDefined(state.pathname)) url.set('pathname', state.pathname)
    if (isDefined(state.hash)) url.set('hash', ensureString(state.hash))
    if (isDefined(state.query)) url.set('query', ensureString(state.query))
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
    selectBareHostname,
    selectSubdomains
  }
}
