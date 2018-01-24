import { connect } from 'redux-bundler-preact'
import { h } from 'preact'

const HomePage = ({baseDataStatus, baseData}) => (
  <article>
    <p>Open dev tools to see output of debug bundle. The current version of redux-bundler you're running, the list of installed bundles, etc.</p>
    <p>This app uses the awesome <a href='https://swapi.co/'>SWAPI</a> as an API to demonstrate how you can reactively trigger data fetching due to the the application's current state rather than by some arbitrary component being displayed.</p>

    <p>It will never fetch unless its data is stale, or it needs to retry to do a failed attempt to fetch</p>

    <h3>Things to try</h3>
    <ul>
      <li class='mb2'>Leave this page open, and watch the log output in the console. The data will be refreshed if its older than one minute.</li>
      <li class='mb2'>While you have the page loaded, use devtools to force the app to go offline. It will keep showing the data it has, but will now retry more actively. These fetches will fail, but it will still show the data it has. Now, make it go online again, and you should see the data getting refreshed rather quickly.</li>
      <li class='mb2'>The "APP_IDLE" actions will only be dispatched when the tab is in focus. Test this out by opening the network tab in devtools and clearing it, now switching away to a different tab for a while. When you switch back you'll notice no fetches occured while you were away, but as soon as you switch back to this tab a fetch is immediately triggered.</li>
      <li class='mb3'>Whenever there has been a successful fetch, the data is persisted to indexedDB via the localCaching bundle (including metadata about the fetch). So if you refresh and it successfully fetched data recentl enough, no fetch is triggered at all.</li>
    </ul>

    <div class='ph3 ba br3 bg-lightest-blue'>
      <h3>Dynamically Fetched Data:</h3>
      <p>Source: https://swapi.co/api/</p>
      <p>Status: {baseDataStatus}</p>
      <p>result:
        <pre><code>{JSON.stringify(baseData, null, 2)}</code></pre>
      </p>
    </div>
  </article>
)

export default connect(
  'selectBaseDataStatus',
  'selectBaseData',
  HomePage
)
