export default {
  name: 'appTime',
  getReducer: () => {
    const now = Date.now()
    return (state = now, { type }) => {
      if (type.charAt(0) !== '@') {
        return Date.now()
      }
      return state
    }
  },
  selectAppTime: state => state.appTime
}
