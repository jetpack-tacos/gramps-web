import {html} from 'lit'

import {GrampsjsView} from './GrampsjsView.js'
import '../components/GrampsjsSharedDiscoveries.js'

export class GrampsjsViewSharedDiscoveries extends GrampsjsView {
  renderContent() {
    return html`
      <grampsjs-shared-discoveries
        .appState="${this.appState}"
      ></grampsjs-shared-discoveries>
    `
  }
}

window.customElements.define(
  'grampsjs-view-shared-discoveries',
  GrampsjsViewSharedDiscoveries
)
