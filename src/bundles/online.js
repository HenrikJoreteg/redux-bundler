import { windowListen } from '../utils'

const OFFLINE = 'OFFLINE'
const ONLINE = 'ONLINE'

export default {
  name: 'online',
  selectIsOnline: (state) => state.online,
  reducer: (state = true, {type}) => {
    if (type === OFFLINE) return false
    if (type === ONLINE) return true
    return state
  },
  init: (store) => {
    windowListen('online', () => store.dispatch({type: ONLINE}))
    windowListen('offline', () => store.dispatch({type: OFFLINE}))
  }
}
