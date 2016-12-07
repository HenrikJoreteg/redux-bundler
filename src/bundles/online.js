import { addGlobalListener } from '../utils'

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
    addGlobalListener('online', () => store.dispatch({type: ONLINE}))
    addGlobalListener('offline', () => store.dispatch({type: OFFLINE}))
  }
}
