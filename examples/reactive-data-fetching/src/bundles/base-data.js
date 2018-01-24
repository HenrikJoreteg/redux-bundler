import { createSelector } from 'redux-bundler'

export default {
  name: 'baseData',
  getReducer: () => {
    const initialState = {
      loading: false,
      lastError: null,
      lastFetch: null,
      data: null
    }
    // this is just a normal redux reducer
    return (state = initialState, {type, payload}) => {
      if (type === 'FETCH_BASE_START') {
        return Object.assign({}, state, {
          loading: true
        })
      }
      // In the case of an error, we store
      // a timestamp of the error so we can
      // chose to automatically retry later
      // if we want
      if (type === 'FETCH_BASE_ERROR') {
        return Object.assign({}, state, {
          lastError: Date.now(),
          loading: false
        })
      }
      // we also store metadata about the fetch
      // along with the resulting data
      if (type === 'FETCH_BASE_SUCCESS') {
        return Object.assign({}, state, {
          lastFetch: Date.now(),
          loading: false,
          lastError: null,
          data: Object.keys(payload).map(key => ({id: key, url: payload[key]}))
        })
      }

      return state
    }
  },
  // see /src/bundles/extra-args to see how swapiFetch becomes
  // available here
  doFetchBaseData: () => ({dispatch, swapiFetch}) => {
    dispatch({type: 'FETCH_BASE_START'})
    swapiFetch('/')
      .then(payload => {
        dispatch({type: 'FETCH_BASE_SUCCESS', payload})
      })
      .catch(error => {
        dispatch({type: 'FETCH_BASE_ERROR', error})
      })
  },
  // selector for the whole contents of the reducer
  // including metadata about fetches
  selectBaseDataRaw: state => state.baseData,
  // selector for just the actual data if we have it
  selectBaseData: state => state.baseData.data,

  // we'll extract a status string here, for display, just to show
  // the type of information available about the data
  selectBaseDataStatus: createSelector(
    'selectBaseDataRaw',
    baseData => {
      const { data, lastError, lastFetch, loading } = baseData

      let result = ''

      if (data) {
        result += 'Has data'
      } else {
        result += 'Does not have data'
      }

      if (loading) {
        return result + ' and is fetching currently'
      }

      if (lastError) {
        return result + ` but had an error at ${lastError} and will retry after ~30 seconds`
      }

      if (lastFetch) {
        return result + ` that was fetched at ${lastFetch} but will updated a minute later`
      }
    }
  ),

  // here's our first "reactor"
  reactShouldFetchBaseData: createSelector(
    // this is the selector we defined above, note that we can
    // just reference it by it's string name, but we could have
    // also assigned the function to a variable and passed that
    // function directly here instead.
    'selectBaseDataRaw',
    // this is one of the selectors that is made available by
    // one of the included bundles called 'appTime' this bundle
    // timestamps all actions and we also run an "app idle"
    // dispatch every 30 seconds if there have been no actions
    // dispatched and using requestAnimationFrame, this will
    // only happen if the tab is visible.
    // All this to say, we have a self-updating timestamp in our
    // redux state that we can use to see how long it's been.
    'selectAppTime',
    (baseData, appTime) => {
      // never trigger another fetch if we're already fetching
      if (baseData.loading) {
        return null
      }

      // for readability in this example I'm going to break out
      // and comment on the various conditions here. In reality
      // you'd likely want to write an abstraction that lets you describe
      // all this at a higher level. One such, abstraction is
      // included in the "/bundles" dir of the redux-bundler repo
      let shouldFetch = false

      // if we don't have data at all we definitely want to fetch
      if (!baseData.data) {
        shouldFetch = true
      }

      // was there an error last time we tried to fetch?
      // if it's been 15 seconds, give it another go...
      else if (baseData.lastError) {
        const timePassed = appTime - baseData.lastError
        if (timePassed > 15000) {
          shouldFetch = true
        }
      }

      // maybe our data is just stale?
      // I've made this arbitrarily short at just 1 minute
      // so you can see it working.
      // Note that we don't wipe out existing data if we have
      // it.
      else if (baseData.lastFetch) {
        const timePassed = appTime - baseData.lastFetch
        if (timePassed > 60000) {
          shouldFetch = true
        }
      }

      // here we can either return an actual action object to dispatch
      // by using `{type: 'SOME_ACTION'}` or we can just specify the
      // name of the action creator function we want to run, and optionally
      // any args we want to pass to it.
      if (shouldFetch) {
        return {actionCreator: 'doFetchBaseData'}
      }
    }
  ),
  persistActions: ['FETCH_BASE_SUCCESS']
}
