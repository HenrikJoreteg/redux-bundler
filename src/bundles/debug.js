import { HAS_DEBUG_FLAG } from '../utils'

export default {
  name: 'debug',
  reducer: (state = HAS_DEBUG_FLAG, {type}) => {
    if (type === 'ENABLE_DEBUG') {
      return true
    }
    return state
  },
  selectIsDebug: state => state.debug
}
