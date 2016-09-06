import { createSelector } from 'reselect'
import qs from 'query-string'
import IS_BROWSER from '../utils/is-browser'

// declarations
const UPDATE_URL = 'UPDATE_URL'
const IPRE = /^[0-9\.]+$/

// utils
const isDefined = thing => typeof thing !== 'undefined'
const ensureString = input => typeof input === 'string' ? input : qs.stringify(input)
const parseSubdomains = (hostname) => {
  if (IPRE.test(hostname)) return []
  return hostname.split('.').slice(0, -2)
}
const removeLeading = (char, string) =>
  string.charAt(0) === char ? string.slice(1) : string
const loc = (() => {
  if (!IS_BROWSER) return {}
  return window.location || self.location
})()
const buildNewString = ({pathname, search, hash}) => {
  search = search ? `?${search}` : ''
  hash = hash ? `#${hash}` : ''
  return `${pathname}${search}${hash}`
}

// action creators
const doUpdateUrl = (newState, opts = {replace: false}) => {
  const state = (typeof newState === 'string') ? { pathname: newState, hash: '', search: '' } : newState
  if (isDefined(state.hash)) state.hash = ensureString(state.hash)
  if (isDefined(state.search)) state.search = ensureString(state.search)
  return { type: UPDATE_URL, payload: { state, opts } }
}
const doReplaceUrl = (arg) => doUpdateUrl(arg, {replace: true})
const doUpdateQuery = (search, opts = {replace: true}) =>
  doUpdateUrl({ search: ensureString(search) }, opts)
const doUpdateHash = (hash, opts = {replace: false}) =>
  doUpdateUrl({ hash: ensureString(hash) }, opts)

// browser interactions
const initialData = {
  pathname: '/',
  search: '',
  hash: '',
  hostname: IS_BROWSER && loc.hostname || '',
  subdomains: IS_BROWSER && parseSubdomains(loc.hostname) || []
}
const updateBrowser = (state, replace) => {
  const current = loc.href.replace(loc.origin, '')
  const newString = buildNewString(state)
  if (current !== newString) {
    window.history[replace ? 'replaceState' : 'pushState'](
      {}, null, buildNewString(state)
    )
  }
}
const readUrl = () => {
  if (!IS_BROWSER) return initialData
  return {
    pathname: loc.pathname,
    search: removeLeading('?', loc.search),
    hash: removeLeading('#', loc.hash),
    hostname: initialData.hostname,
    subdomains: initialData.subdomains
  }
}

// selectors
const selectUrlState = state => state.url
const selectQueryString = createSelector(selectUrlState, urlState => urlState.search)
const selectQueryObject = createSelector(selectQueryString, string => qs.parse(string))
const selectPathname = createSelector(selectUrlState, urlState => urlState.pathname)
const selectHash = createSelector(selectUrlState, urlState => urlState.hash)
const selectHashObject = createSelector(selectUrlState, urlState => qs.parse(urlState.hash))

export default {
  name: 'url',
  actions: { UPDATE_URL },
  getReducer: () => {
    return (state = readUrl(), {type, payload}) => {
      if (type === UPDATE_URL) {
        const payloadState = payload.state
        const newPathname = payloadState.pathname
        const newHash = payloadState.hash
        const newSearch = payloadState.search
        const actual = readUrl()
        const newState = {
          pathname: isDefined(newPathname) ? newPathname : actual.pathname,
          hash: isDefined(newHash) ? newHash : actual.hash,
          search: isDefined(newSearch) ? newSearch : actual.search
        }
        updateBrowser(newState, payload.opts.replace)
        return Object.assign({}, state, newState)
      }
      return state
    }
  },
  init: (store) => {
    if (!IS_BROWSER) return
    const setCurrentUrl = () => {
      store.doUpdateUrl(readUrl())
    }
    window.addEventListener('popstate', setCurrentUrl)
  },
  selectUrlState,
  selectQueryString,
  selectQueryObject,
  selectPathname,
  selectHash,
  selectHashObject,
  doReplaceUrl,
  doUpdateUrl,
  doUpdateQuery,
  doUpdateHash
}
