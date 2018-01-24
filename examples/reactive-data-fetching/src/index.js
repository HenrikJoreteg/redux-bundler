import { render } from 'preact'
import getStore from './bundles'
import root from './components/root'
import { getAllCached } from 'redux-bundler'

// this is entirlely optional, but here we here we try to pull starting data
// from our local cache.
// This will only be returned if the version number is a match and it's not
// older than the maxAge.
// The version number should come from a config, this can protect you from trying
// load cached data when the internal data structures that your app expects
// have changed.
//
// Additionally, if you're caching user-specific data, you should build a
// version string that includes some user identifier along with your actual
// version number. This will ensure tha switching users won't result in
// someone loading someone else's cached data.
//
// So, there are gotchas, but it sure is cool when you've got it all set up.
getAllCached({maxAge: 1000 * 60 * 60, version: 1})
  .then(initialData => {
    if (initialData) {
      console.log('starting with locally cache data:', initialData)
    }
    render(root(getStore(initialData)), document.getElementById('app'))
  })
