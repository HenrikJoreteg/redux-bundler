const changes = {
  START: 1,
  SUCCESS: -1,
  ERROR: -1
}

const re = /_(START|SUCCESS|ERROR)$/

export default {
  name: 'asyncCount',
  reducer: (state = 0, { type }) => {
    const result = re.exec(type)
    if (!result) return state
    return state + changes[result[1]]
  },
  selectAsyncActive: state => state.asyncCount > 0
}
