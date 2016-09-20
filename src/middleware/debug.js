import { IS_DEBUG } from '../utils'

export default store => next => action => {
  if (IS_DEBUG) {
    console.group(action.type)
    console.info('action:', action)
  }

  const result = next(action)

  if (IS_DEBUG) {
    console.debug('state:', store.getState())
    window.listSelectors && window.listSelectors()
    window.listActiveEffects && window.listActiveEffects()
    console.groupEnd(action.type)
  }

  return result
}
