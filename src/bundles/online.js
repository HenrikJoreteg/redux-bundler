import { addGlobalListener, IS_BROWSER } from '../utils'

const OFFLINE = 'OFFLINE'
const ONLINE = 'ONLINE'

export default {
  name: 'online',
  selectIsOnline: state => state.online,

  getReducer () {
    const initialState = IS_BROWSER ? navigator.onLine : true

    return (state = initialState, { type }) => {
      if (type === OFFLINE) return false
      if (type === ONLINE) return true

      return state
    }
  },

  init (store) {
    const removeOnlineListener = addGlobalListener('online', () =>
      store.dispatch({ type: ONLINE })
    )
    const removeOfflineListener = addGlobalListener('offline', () =>
      store.dispatch({ type: OFFLINE })
    )

    return () => {
      removeOnlineListener()
      removeOfflineListener()
    }
  }
}
