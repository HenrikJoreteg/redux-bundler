import { createSelector } from 'reselect'
import appTimeBundle from './app-time'
import onlineBundle from './online'

const createTimeCheckSelector = (timeSelector, age, invert = true) => createSelector(
  timeSelector,
  appTimeBundle.selectAppTime,
  (time, appTime) => {
    if (!time) {
      return false
    }
    const elapsed = appTime - time
    if (invert) {
      return elapsed > age
    } else {
      return elapsed < age
    }
  }
)

const defaultOpts = {
  name: null,
  getPromise: null,
  actionBaseType: null,
  staleAge: 900000, // fifteen minutes
  retryAfter: 60000, // one minute,
  checkIfOnline: true,
  persist: true
}

export default (spec) => {
  const opts = Object.assign({}, defaultOpts, spec)
  const { name, staleAge, retryAfter, actionBaseType, checkIfOnline } = opts
  const ucaseName = name.charAt(0).toUpperCase() + name.slice(1)

  if (process.env.NODE_ENV !== 'production') {
    for (const item in opts) {
      if (opts[item] === null) {
        throw Error(`You must supply an ${item} option when creating a resource bundle`)
      }
    }
  }

  // build selectors
  const inputSelector = state => state[name]
  const dataSelector = createSelector(
    inputSelector,
    resourceState => resourceState.data
  )
  const lastSuccessSelector = createSelector(inputSelector, resource => resource.lastSuccess)
  const lastErrorSelector = createSelector(
    inputSelector,
    resource => resource.errorTimes.slice(-1)[0] || null
  )
  const isStaleSelector = createTimeCheckSelector(lastSuccessSelector, staleAge)
  const isWaitingToRetrySelector = createTimeCheckSelector(lastErrorSelector, retryAfter, false)
  const isLoadingSelector = createSelector(
    inputSelector,
    resourceState => resourceState.isLoading
  )
  const failedPermanentlySelector = createSelector(
    inputSelector,
    resourceState => resourceState.failedPermanantly
  )
  const shouldUpdateSelector = createSelector(
    isLoadingSelector,
    failedPermanentlySelector,
    isWaitingToRetrySelector,
    dataSelector,
    isStaleSelector,
    onlineBundle.selectIsOnline,
    (isLoading, failedPermanantly, isWaitingToRetry, data, isStale, isOnline) => {
      if (
        (checkIfOnline && !isOnline) ||
        isLoading ||
        failedPermanantly ||
        isWaitingToRetry
      ) {
        return false
      }
      if (!data) {
        return true
      }
      return isStale
    }
  )

  const actions = {
    START: `${actionBaseType}_START`,
    SUCCESS: `${actionBaseType}_SUCCESS`,
    ERROR: `${actionBaseType}_ERROR`,
    MAKE_STALE: `${actionBaseType}_MAKE_STALE`
  }

  const initialState = {
    isLoading: false,
    data: null,
    errorTimes: [],
    lastSuccess: null,
    stale: false,
    failedPermanantly: false
  }

  const doFetchError = (error) => ({type: actions.ERROR, error})
  const doMarkAsStale = (error) => ({type: actions.ERROR, error})
  const doFetchSuccess = (payload) => ({type: actions.SUCCESS, payload})
  const doFetchData = () => (args) => {
    const { dispatch } = args
    dispatch({type: actions.START})
    return opts.getPromise(args)
      .then(
        (payload) => { dispatch(doFetchSuccess(payload)) },
        (error) => { dispatch(doFetchError(error)) }
      )
  }

  const result = {
    name,
    reducer: (state = initialState, {type, payload, error, merge}) => {
      if (type === actions.START) {
        return Object.assign({}, state, { isLoading: true })
      }
      if (type === actions.SUCCESS) {
        let updatedData
        if (merge) {
          updatedData = Object.assign({}, state.data, payload)
        } else {
          updatedData = payload
        }
        return Object.assign({}, state, {
          isLoading: false,
          data: updatedData,
          lastSuccess: Date.now(),
          errorTimes: [],
          failedPermanantly: false,
          stale: false
        })
      }
      if (type === actions.ERROR) {
        return Object.assign({}, state, {
          isLoading: false,
          errorTimes: state.errorTimes.concat([Date.now()]),
          failedPermanantly: !!(error && error.permanent)
        })
      }
      if (type === actions.MAKE_STALE) {
        return Object.assign({}, state, {
          errorTimes: [],
          stale: true
        })
      }
      return state
    },
    [`select${ucaseName}Raw`]: inputSelector,
    [`select${ucaseName}`]: dataSelector,
    [`select${ucaseName}IsStale`]: isStaleSelector,
    [`select${ucaseName}LastError`]: lastErrorSelector,
    [`select${ucaseName}IsWaitingToRetry`]: isWaitingToRetrySelector,
    [`select${ucaseName}IsLoading`]: isLoadingSelector,
    [`select${ucaseName}FailedPermanantly`]: failedPermanentlySelector,
    [`select${ucaseName}ShouldUpdate`]: shouldUpdateSelector,
    [`doFetch${ucaseName}`]: doFetchData,
    [`doFetch${ucaseName}Success`]: doFetchSuccess,
    [`doFetch${ucaseName}Error`]: doFetchError,
    [`doMark${ucaseName}AsStale`]: doMarkAsStale
  }

  if (opts.persist) {
    result.persistActions = [ actions.SUCCESS ]
  }

  return result
}
