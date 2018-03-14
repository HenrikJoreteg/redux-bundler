const changes = {
  STARTED: 1,
  FINISHED: -1,
  FAILED: -1
}

const re = /_(STARTED|FINISHED|FAILED)$/

export default {
  name: 'asyncCount',
  reducer: (state = 0, { type }) => {
    const result = re.exec(type)
    if (!result) return state
    return state + changes[result[1]]
  },
  selectAsyncActive: state => state.asyncCount > 0
}
