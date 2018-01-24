import { connect } from 'redux-bundler-preact'
import { h } from 'preact'

const PersonDetailPage = ({routeParams, activePerson}) => (
  <article>
    <h1>Demo of an item detail view</h1>
    <p>the route parameters that are available in redux with this URL open:
      <pre><code>{JSON.stringify(routeParams, null, 2)}</code></pre>
    </p>
    <p>We can use this in our selectors to determine if this is data we have or need to fetch.</p>
    <p>
      <pre><code>{JSON.stringify(activePerson, null, 2)}</code></pre>
    </p>
  </article>
)

export default connect(
  'selectRouteParams',
  'selectActivePerson',
  PersonDetailPage
)
