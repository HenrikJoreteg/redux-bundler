import { version } from '../../package.json'
import { HAS_DEBUG_FLAG } from '../utils'

const ENABLE = 'ENABLE_DEBUG'
const DISABLE = 'DISABLE_DEBUG'

export default {
  name: 'debug',
  reducer: (state = HAS_DEBUG_FLAG, { type }) => {
    if (type === ENABLE) {
      return true
    }
    if (type === DISABLE) {
      return false
    }
    return state
  },
  doEnableDebug: () => ({ type: ENABLE }),
  doDisableDebug: () => ({ type: DISABLE }),
  selectIsDebug: state => state.debug,
  getMiddleware: () => 
    store => next => action => {
      const isDebug = store.getState().debug
      const result = next(action)
    
      if (isDebug && !window.debugState.paused) {
        window.debugState.actionHistory.push(action)
      }

      return result
    },
  init: store => {
    if (store.selectIsDebug()) {
      const debugState = window.debugState = {
        initialData: store.getState(),
        actionHistory: []
      }
      store.pause = () => {
        if (debugState.paused) return
        debugState.dispatch = store.dispatch
        debugState.paused = true
        store.dispatch = () => {
          console.log('cannot dispatch APP IS PAUSED')
        } 
      }
      store.goTo = index => {
        if (!debugState.paused) {
          store.pause()
        }
        debugState.currentIndex = index
        const relevantHistory = debugState.actionHistory.slice(0, debugState.currentIndex)
        store.nextReaction = null
        store.activeReactor = null
        debugState.dispatch({type: '@@RESET', payload: debugState.initialData})
        console.clear()
        relevantHistory.map(action => debugState.dispatch(action))
        console.log(`STEP ${relevantHistory.length} OF ${debugState.actionHistory.length}`)
        console.log('app actions are paused')
      }
      store.resume = () => {
        if (!debugState.paused) return
        store.dispatch = debugState.dispatch
        debugState.paused = false
        delete debugState.dispatch
      }

      const getCurrentIndex = () => {
        if (!debugState.hasOwnProperty('currentIndex')) {
          debugState.currentIndex = debugState.actionHistory.length
        }
        return debugState.currentIndex
      }

      store.back = () => {
        const nextIndex = getCurrentIndex() - 1
        if (nextIndex < 0) {
          console.log('cannot go back further')
          return
        }
        store.goTo(nextIndex)
      }
      store.forward = () => {
        const nextIndex = getCurrentIndex() + 1
        if (!debugState.actionHistory[nextIndex - 1]) {
          console.log('cannot go forward further')
          return
        }
        store.goTo(nextIndex)
      }
      store.replayFromStart = (speed = 1500) => {
        let length = debugState.actionHistory.length
        let start = 0
        const goToNext = () => {
          if (start <= length) {
            store.goTo(start++)
            setTimeout(goToNext, speed)
          }
        }
        goToNext()
      }

      const names = store.meta.chunks[0].bundleNames
      self.store = store
      const actionCreators = []
      for (const key in store) {
        if (key.indexOf('do') === 0) {
          actionCreators.push(key)
        }
      }
      actionCreators.sort()
      const colorTitle = 'color: #1676D2;'
      const black = 'color: black;'
      const colorGreen = 'color: #4CAF50;'
      const colorOrange = 'color: #F57C00;'

      store.logSelectors = self.logSelectors = () => {
        if (!store.selectAll) return
        console.log('%cselectors:', colorGreen, store.selectAll())
      }

      store.logBundles = self.logBundles = () => {
        console.log(
          '%cinstalled bundles:\n  %c%s',
          colorTitle,
          black,
          names.join('\n  ')
        )
      }

      store.logActionCreators = self.logActionCreators = () => {
        console.groupCollapsed('%caction creators', colorOrange)
        actionCreators.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logReactors = self.logReactors = () => {
        console.groupCollapsed('%creactors', colorOrange)
        const { reactorNames } = store.meta
        reactorNames.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logNextReaction = self.logNextReaction = () => {
        const { nextReaction, activeReactor } = store
        if (nextReaction) {
          console.log(
            `%cnext reaction:\n  %c${activeReactor}`,
            colorOrange,
            black,
            nextReaction
          )
        }
      }

      console.groupCollapsed('%credux bundler v%s', colorTitle, version)
      store.logBundles()
      store.logSelectors()
      store.logReactors()
      console.groupEnd()
      if (store.isReacting) {
        console.log(`%cqueuing reaction:`, colorOrange)
      }
    }
  }
}
