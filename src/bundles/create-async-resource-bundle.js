import { createSelector } from 'create-selector'

const defaultOpts = {
  name: null,
  getPromise: null,
  actionBaseType: null,
  staleAfter: 900000, // fifteen minutes
  retryAfter: 60000, // one minute,
  expireAfter: Infinity,
  checkIfOnline: true,
  persist: true
}

export default spec => {
  const opts = Object.assign({}, defaultOpts, spec)
  const {
    name,
    staleAfter,
    retryAfter,
    actionBaseType,
    checkIfOnline,
    expireAfter
  } = opts
  const uCaseName = name.charAt(0).toUpperCase() + name.slice(1)
  const baseType = actionBaseType || name.toUpperCase()

  if (process.env.NODE_ENV !== 'production') {
    for (const item in opts) {
      if (opts[item] === null) {
        throw Error(
          `You must supply an ${item} option when creating a resource bundle`
        )
      }
    }
  }

  // build selectors
  const inputSelector = state => state[name]
  const dataSelector = state => state[name].data
  const lastSuccessSelector = state => state[name].lastSuccess
  const isExpiredSelector = state => state[name].isExpired
  const lastErrorSelector = createSelector(
    inputSelector,
    resource => resource.errorTimes.slice(-1)[0] || null
  )
  const isStaleSelector = createSelector(
    inputSelector,
    lastSuccessSelector,
    'selectAppTime',
    (state, time, appTime) => {
      if (state.isOutdated) {
        return true
      }
      if (!time) {
        return false
      }
      return appTime - time > staleAfter
    }
  )
  const isWaitingToRetrySelector = createSelector(
    lastErrorSelector,
    'selectAppTime',
    (time, appTime) => {
      if (!time) {
        return false
      }
      return appTime - time < retryAfter
    }
  )
  const isLoadingSelector = createSelector(
    inputSelector,
    resourceState => resourceState.isLoading
  )
  const failedPermanentlySelector = createSelector(
    inputSelector,
    resourceState => resourceState.failedPermanently
  )
  const shouldUpdateSelector = createSelector(
    isLoadingSelector,
    failedPermanentlySelector,
    isWaitingToRetrySelector,
    dataSelector,
    isStaleSelector,
    'selectIsOnline',
    (
      isLoading,
      failedPermanently,
      isWaitingToRetry,
      data,
      isStale,
      isOnline
    ) => {
      if (
        (checkIfOnline && !isOnline) ||
        isLoading ||
        failedPermanently ||
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

  // action types
  const actions = {
    STARTED: `${baseType}_FETCH_STARTED`,
    FINISHED: `${baseType}_FETCH_FINISHED`,
    FAILED: `${baseType}_FETCH_FAILED`,
    CLEARED: `${baseType}_CLEARED`,
    OUTDATED: `${baseType}_OUTDATED`,
    EXPIRED: `${baseType}_EXPIRED`
  }

  // action creators
  const doFetchError = error => ({ type: actions.FAILED, error })
  const doMarkAsOutdated = () => ({ type: actions.OUTDATED })
  const doClear = () => ({ type: actions.CLEARED })
  const doExpire = () => ({ type: actions.EXPIRED })
  const doFetchSuccess = payload => ({ type: actions.FINISHED, payload })
  const doFetchData = () => args => {
    const { dispatch } = args
    dispatch({ type: actions.STARTED })
    return opts.getPromise(args).then(
      payload => {
        dispatch(doFetchSuccess(payload))
      },
      error => {
        dispatch(doFetchError(error))
      }
    )
  }

  const initialState = {
    data: null,
    errorTimes: [],
    errorType: null,
    lastSuccess: null,
    isOutdated: false,
    isLoading: false,
    isExpired: false,
    failedPermanently: false
  }

  const result = {
    name,
    reducer: (state = initialState, { type, payload, error, merge }) => {
      if (type === actions.STARTED) {
        return Object.assign({}, state, { isLoading: true })
      }
      if (type === actions.FINISHED) {
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
          errorType: null,
          failedPermanently: false,
          isOutdated: false,
          isExpired: false
        })
      }
      if (type === actions.FAILED) {
        const errorMessage = (error && error.message) || error
        return Object.assign({}, state, {
          isLoading: false,
          errorTimes: state.errorTimes.concat([Date.now()]),
          errorType: errorMessage,
          failedPermanently: !!(error && error.permanent)
        })
      }
      if (type === actions.CLEARED) {
        return initialState
      }
      if (type === actions.EXPIRED) {
        return Object.assign({}, initialState, {
          isExpired: true,
          errorTimes: state.errorTimes,
          errorType: state.errorType
        })
      }
      if (type === actions.OUTDATED) {
        return Object.assign({}, state, { isOutdated: true })
      }
      return state
    },
    [`select${uCaseName}Raw`]: inputSelector,
    [`select${uCaseName}`]: dataSelector,
    [`select${uCaseName}IsStale`]: isStaleSelector,
    [`select${uCaseName}IsExpired`]: isExpiredSelector,
    [`select${uCaseName}LastError`]: lastErrorSelector,
    [`select${uCaseName}IsWaitingToRetry`]: isWaitingToRetrySelector,
    [`select${uCaseName}IsLoading`]: isLoadingSelector,
    [`select${uCaseName}FailedPermanently`]: failedPermanentlySelector,
    [`select${uCaseName}ShouldUpdate`]: shouldUpdateSelector,
    [`doFetch${uCaseName}`]: doFetchData,
    [`doMark${uCaseName}AsOutdated`]: doMarkAsOutdated,
    [`doClear${uCaseName}`]: doClear,
    [`doExpire${uCaseName}`]: doExpire
  }

  if (opts.persist) {
    result.persistActions = [
      actions.FINISHED,
      actions.EXPIRED,
      actions.OUTDATED,
      actions.CLEARED
    ]
  }

  if (expireAfter !== Infinity) {
    result[`reactExpire${uCaseName}`] = createSelector(
      lastSuccessSelector,
      'selectAppTime',
      (time, appTime) => {
        if (!time) {
          return false
        }
        if (appTime - time > expireAfter) {
          return doExpire()
        }
      }
    )
  }

  return result
}
