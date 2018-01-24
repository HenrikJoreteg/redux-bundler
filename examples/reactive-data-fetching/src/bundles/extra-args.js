/* global fetch */

export default {
  name: 'extra-args',
  // note that the store gets passed in here:
  getExtraArgs: (store) => {
    return {
      swapiFetch: (urlPath) =>
        // if your API requires an authentication token or whatnot
        // here would be a great place to select it from your store
        // and pass it along with the fetch. Then none of your individual
        // action creators need to worry about this.
        fetch(`https://swapi.co/api${urlPath}`)
          .then(res => res.json())
          .catch(err => {
            // if you wanted to, you could look for errors caused
            // by failed authentication to trigger something
            // else on the store here if it existed. Such as redirecting
            // the user to a login page, or whatnot. You have access
            // to the store object itself.
            //
            // The store has all the action creators on it so you
            // can call `store.doWhatever()`
            // but for our purposes we'll just throw here
            throw err
          })
    }
  }
}
