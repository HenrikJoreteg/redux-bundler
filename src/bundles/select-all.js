import { selectorNameToValueName } from '../utils'

export default {
  name: 'selectAll',
  init: (store) => {
    const selectorNames = Object.keys(store.meta.selectors).sort()
    store.selectAll = () =>
      selectorNames.reduce((accum, key) => {
        accum[selectorNameToValueName(key)] = store[key]()
        return accum
      }, {})
  }
}
