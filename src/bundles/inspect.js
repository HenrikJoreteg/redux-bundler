import { version } from '../../package.json'

let debug
try {
  debug = !!(window.localStorage.debug)
} catch (e) {}

export default {
  name: 'inspect',
  init: (store) => {
    if (debug) {
      const names = store.bundles.map(bundle => bundle.name)
      window.store = store
      const selectors = []
      const actionCreators = []
      for (const key in store) {
        const item = store[key]
        if (key.indexOf('select') === 0) {
          window[key] = item
          selectors.push(key)
        } else if (key.indexOf('do') === 0) {
          window[key] = item
          actionCreators.push(key)
        }
      }
      actionCreators.sort()
      selectors.sort()
      const colorTitle = 'color: #1676D2;'
      const black = 'color: black;'
      const colorGreen = 'color: #4CAF50;'
      const colorOrange = 'color: #F57C00;'
      const normal = 'font-weight: normal;'

      store.logSelectors = window.logSelectors = () => {
        const results = {}
        selectors.sort().forEach((selectorName) => {
          results[selectorName] = store[selectorName]()
        })
        console.log('%cselectors:', colorGreen, results)
      }

      store.logBundles = window.logBundles = () => {
        console.log('%cinstalled bundles:\n  %c%s', colorTitle, black, names.join('\n  '))
      }

      store.logActionCreators = window.logActionCreators = () => {
        console.groupCollapsed('%caction creators', colorOrange)
        actionCreators.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logReactors = window.logReactors = () => {
        console.groupCollapsed('%creactors', colorOrange)
        store.reactors && store.reactors.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logNextReaction = window.logNextReaction = () => {
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
      const exported = []
      for (const key in store) {
        if (key.indexOf('select') === 0 || key.indexOf('do') === 0) {
          exported.push(`${key}()`)
        }
      }
      exported.sort()
      exported.unshift('store')
      console.log(`%cattached to window:\n  %c${exported.join('\n  ')}`, colorTitle, black + normal)
      store.logSelectors()
      store.logReactors()
      console.groupEnd()
      store.logNextReaction()
    }
  }
}
