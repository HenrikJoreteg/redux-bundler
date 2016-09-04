const changes = {
  'START': 1,
  'SUCCESS': -1,
  'ERROR': -1
}

export default {
  name: 'asyncCount',
  reducer: (state = 0, { type }) => {
    const last = type.split('_').slice(-1)[0]
    return state + (changes[last] || 0)
  },
  selectAsyncActive: state => state.asyncCount > 0
}
