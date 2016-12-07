let debug = false
try { debug = !!window.localStorage.debug } catch (e) {}

export default {
  name: 'debug',
  reducer: (state = debug, {type}) => {
    if (type === 'ENABLE_DEBUG') {
      return true
    }
    return state
  },
  selectIsDebug: state => state.debug
}
