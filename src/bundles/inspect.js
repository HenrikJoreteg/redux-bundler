import { version } from '../../package.json'

export default {
  name: 'inspect',
  init: (store) => {
    if (store.selectIsDebug()) {
      const names = store.bundles.map(bundle => bundle.name)
      self.store = store
      const selectors = []
      const actionCreators = []
      for (const key in store) {
        const item = store[key]
        if (key.indexOf('select') === 0) {
          self[key] = item
          selectors.push(key)
        } else if (key.indexOf('do') === 0) {
          self[key] = item
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

      store.logSelectors = self.logSelectors = () => {
        const results = {}
        selectors.sort().forEach((selectorName) => {
          results[selectorName] = store[selectorName]()
        })
        console.log('%cselectors:', colorGreen, results)
      }

      store.logBundles = self.logBundles = () => {
        console.log('%cinstalled bundles:\n  %c%s', colorTitle, black, names.join('\n  '))
      }

      store.logActionCreators = self.logActionCreators = () => {
        console.groupCollapsed('%caction creators', colorOrange)
        actionCreators.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logReactors = self.logReactors = () => {
        console.groupCollapsed('%creactors', colorOrange)
        store.reactors && store.reactors.forEach(name => console.log(name))
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
      const exported = []
      for (const key in store) {
        if (key.indexOf('select') === 0 || key.indexOf('do') === 0) {
          exported.push(`${key}()`)
        }
      }
      exported.sort()
      exported.unshift('store')
      console.log(`%cattached to self/window:\n  %c${exported.join('\n  ')}`, colorTitle, black + normal)
      store.logSelectors()
      store.logReactors()
      console.groupEnd()
      store.logNextReaction()
    }
  }
}
