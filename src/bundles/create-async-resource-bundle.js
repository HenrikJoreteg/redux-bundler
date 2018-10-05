import { createSelector } from 'create-selector'

const defaultOpts = {
  actionBaseType: null,
  staleAfter: 900000, // fifteen minutes
  retryAfter: 60000, // one minute,
  expireAfter: Infinity,
  checkIfOnline: true,
  persist: true
}

export default spec => {
  const opts = Object.assign({}, defaultOpts, spec)

  if (process.env.NODE_ENV !== 'production') {
    const requiredOptions = ['name', 'getPromise']
    requiredOptions.forEach(requiredOption => {
      if (!opts[requiredOption]) {
        throw Error(
          `You must supply a ${requiredOption} option when creating a resource bundle.`
        )
      }
    })
  }

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

  // build selectors
  const inputSelectorName = `select${uCaseName}Raw`
  const inputSelector = state => state[name]
  const dataSelectorName = `select${uCaseName}`
  const dataSelector = createSelector(inputSelectorName, root => root.data)
  const lastSuccessSelectorName = `select${uCaseName}LastSuccess`
  const lastSuccessSelector = createSelector(
    inputSelectorName,
    root => root.lastSuccess
  )
  const isExpiredSelectorName = `select${uCaseName}IsExpired`
  const isExpiredSelector = createSelector(
    inputSelectorName,
    root => root.isExpired
  )
  const lastErrorSelectorName = `select${uCaseName}LastError`
  const lastErrorSelector = createSelector(
    inputSelectorName,
    resource => resource.errorTimes.slice(-1)[0] || null
  )
  const isStaleSelectorName = `select${uCaseName}IsStale`
  const isStaleSelector = createSelector(
    inputSelectorName,
    lastSuccessSelectorName,
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
  const isWaitingToRetrySelectorName = `select${uCaseName}IsWaitingToRetry`
  const isWaitingToRetrySelector = createSelector(
    lastErrorSelectorName,
    'selectAppTime',
    (time, appTime) => {
      if (!time) {
        return false
      }
      return appTime - time < retryAfter
    }
  )
  const isLoadingSelectorName = `select${uCaseName}IsLoading`
  const isLoadingSelector = createSelector(
    inputSelectorName,
    resourceState => resourceState.isLoading
  )
  const failedPermanentlySelectorName = `select${uCaseName}FailedPermanently`
  const failedPermanentlySelector = createSelector(
    inputSelectorName,
    resourceState => resourceState.failedPermanently
  )
  const shouldUpdateSelectorName = `select${uCaseName}ShouldUpdate`
  const shouldUpdateSelector = createSelector(
    isLoadingSelectorName,
    failedPermanentlySelectorName,
    isWaitingToRetrySelectorName,
    dataSelectorName,
    isStaleSelectorName,
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
    [inputSelectorName]: inputSelector,
    [dataSelectorName]: dataSelector,
    [isStaleSelectorName]: isStaleSelector,
    [isExpiredSelectorName]: isExpiredSelector,
    [lastErrorSelectorName]: lastErrorSelector,
    [lastSuccessSelectorName]: lastSuccessSelector,
    [isWaitingToRetrySelectorName]: isWaitingToRetrySelector,
    [isLoadingSelectorName]: isLoadingSelector,
    [failedPermanentlySelectorName]: failedPermanentlySelector,
    [shouldUpdateSelectorName]: shouldUpdateSelector,
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
