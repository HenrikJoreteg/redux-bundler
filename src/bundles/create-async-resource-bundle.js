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
    ERROR: `${actionBaseType}_ERROR`
  }

  const initialState = {
    isLoading: false,
    data: null,
    errorTimes: [],
    lastSuccess: null,
    failedPermanantly: false
  }

  const doFetchData = () => (args) => {
    const { dispatch } = args
    dispatch({type: actions.START})
    delete args.dispatch
    return opts.getPromise(args)
      .then(payload => dispatch({type: actions.SUCCESS, payload}))
      .catch(error => dispatch({type: actions.ERROR, error}))
  }

  const result = {
    name,
    reducer: (state = initialState, {type, payload, error}) => {
      if (type === actions.START) {
        return Object.assign({}, state, { isLoading: true })
      }
      if (type === actions.SUCCESS) {
        return Object.assign({}, state, {
          isLoading: false,
          data: payload,
          lastSuccess: Date.now(),
          errorTimes: [],
          failedPermanantly: false
        })
      }
      if (type === actions.ERROR) {
        return Object.assign({}, state, {
          isLoading: false,
          errorTimes: state.errorTimes.concat([Date.now()]),
          failedPermanantly: !!(error && error.permanent)
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
    [`doFetch${ucaseName}`]: doFetchData
  }

  if (opts.persist) {
    result.persistActions = [ actions.SUCCESS ]
  }

  return result
}
