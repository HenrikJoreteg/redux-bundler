import { IS_DEBUG } from '../utils'

export default store => next => action => {
  if (IS_DEBUG) {
    console.group(action.type)
    console.info('action:', action)
  }

  const result = next(action)

  if (IS_DEBUG) {
    console.debug('state:', store.getState())
    window.logSelectors && window.logSelectors()
    window.logNextReaction && window.logNextReaction()
    console.groupEnd(action.type)
  }

  return result
}
