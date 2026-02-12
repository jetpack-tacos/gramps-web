/*
Places list view with batch geocoding
*/

import {html, css} from 'lit'
import {GrampsjsViewObjectsBase} from './GrampsjsViewObjectsBase.js'
import {
  prettyTimeDiffTimestamp,
  filterCounts,
  clickKeyHandler,
} from '../util.js'
import '@material/mwc-button'

export class GrampsjsViewPlaces extends GrampsjsViewObjectsBase {
  static get styles() {
    return [
      super.styles,
      css`
        .geocode-section {
          display: flex;
          align-items: center;
          gap: 1em;
          margin: 1em 0;
          padding: 1em;
          background-color: var(--grampsjs-color-shade-230);
          border-radius: 8px;
        }

        .geocode-section mwc-button {
          --mdc-theme-primary: var(--md-sys-color-primary);
        }

        .geocode-status {
          font-size: 14px;
          color: var(--md-sys-color-on-surface-variant);
        }

        .geocode-status.success {
          color: var(--grampsjs-success-color, #4caf50);
        }

        .geocode-status.error {
          color: var(--grampsjs-alert-error-font-color, #d32f2f);
        }

        .geocode-status.running {
          color: var(--md-sys-color-primary);
        }
      `,
    ]
  }

  static get properties() {
    return {
      ...super.properties,
      _geocodeStatus: {type: String},
      _geocodeMessage: {type: String},
      _geocodeRunning: {type: Boolean},
    }
  }

  constructor() {
    super()
    this._columns = {
      grampsId: {title: 'GenAI ID', sort: 'gramps_id'},
      title: {title: 'Name', sort: 'title'},
      change: {title: 'Last changed', sort: 'change'},
    }
    this._objectsName = 'places'
    this._geocodeStatus = ''
    this._geocodeMessage = ''
    this._geocodeRunning = false
  }

  // eslint-disable-next-line class-methods-use-this
  get _fetchUrl() {
    return '/api/places/?keys=gramps_id,name,change'
  }

  // eslint-disable-next-line class-methods-use-this
  _getItemPath(item) {
    return `place/${item.grampsId}`
  }

  // eslint-disable-next-line class-methods-use-this
  _getAddPath() {
    return 'new_place'
  }

  renderFilters() {
    return html`
      <grampsjs-filter-properties
        hasCount
        .appState="${this.appState}"
        .props="${filterCounts.places}"
        label="${this._('Associations')}"
      ></grampsjs-filter-properties>

      <grampsjs-filter-tags .appState="${this.appState}"></grampsjs-filter-tags>
    `
  }

  _renderFilter() {
    return html`
      ${super._renderFilter()}
      <div class="geocode-section">
        <mwc-button
          outlined
          icon="location_on"
          ?disabled=${this._geocodeRunning}
          @click="${this._handleGeocodeClick}"
          @keydown="${clickKeyHandler}"
        >
          ${this._geocodeRunning ? 'Geocoding...' : 'Batch Geocode Places'}
        </mwc-button>
        ${this._geocodeMessage
          ? html`<span class="geocode-status ${this._geocodeStatus}"
              >${this._geocodeMessage}</span
            >`
          : html`<span class="geocode-status"
              >Add coordinates to places without lat/long</span
            >`}
      </div>
    `
  }

  async _handleGeocodeClick() {
    this._geocodeRunning = true
    this._geocodeStatus = 'running'
    this._geocodeMessage = 'Starting geocoding...'

    try {
      const response = await this.appState.apiPost('/api/places/geocode/')

      if ('error' in response) {
        this._geocodeStatus = 'error'
        this._geocodeMessage = `Error: ${response.error}`
      } else if ('task' in response) {
        // Celery task was started
        this._geocodeStatus = 'running'
        this._geocodeMessage =
          'Geocoding task started. This may take a few minutes...'
        // Poll for task completion
        this._pollGeocodeTask(response.task.id)
      } else if ('updated' in response) {
        // Synchronous response (if Celery not available)
        this._geocodeStatus = 'success'
        this._geocodeMessage = `Done! Updated ${response.updated} places.`
        this._geocodeRunning = false
        // Refresh the data
        this._fetchData()
      } else {
        this._geocodeStatus = 'success'
        this._geocodeMessage = 'Geocoding complete!'
        this._geocodeRunning = false
      }
    } catch (err) {
      this._geocodeStatus = 'error'
      this._geocodeMessage = `Error: ${err.message}`
      this._geocodeRunning = false
    }
  }

  async _pollGeocodeTask(taskId) {
    const pollInterval = 3000 // 3 seconds
    const maxAttempts = 600 // 30 minutes max

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await this.appState.apiGet(`/api/tasks/${taskId}`)

        if ('error' in response) {
          this._geocodeStatus = 'error'
          this._geocodeMessage = `Error checking task: ${response.error}`
          this._geocodeRunning = false
          return
        }

        const status = response.data?.status || response.status

        if (status === 'SUCCESS' || status === 'COMPLETE') {
          const info = response.data?.info || response.info || {}
          this._geocodeStatus = 'success'
          this._geocodeMessage = `Done! Updated ${info.updated || 0} of ${
            info.total || 0
          } places.`
          this._geocodeRunning = false
          // Refresh the data
          this._fetchData()
          return
        }

        if (status === 'FAILURE' || status === 'ERROR') {
          const info =
            response.data?.info || response.info || response.data?.result || {}
          const errorDetail = info.error || info.message || ''
          this._geocodeStatus = 'error'
          this._geocodeMessage = `Geocoding task failed.${
            errorDetail ? ` ${errorDetail}` : ' Check server logs.'
          }`
          this._geocodeRunning = false
          return
        }

        // Still running, update progress if available
        const info = response.data?.info || response.info || {}
        if (info.current !== undefined && info.total !== undefined) {
          const parts = [`${info.current}/${info.total} places`]
          if (info.updated !== undefined) parts.push(`${info.updated} updated`)
          if (info.errors !== undefined && info.errors > 0)
            parts.push(`${info.errors} errors`)
          this._geocodeMessage = `Geocoding... ${parts.join(', ')}`
        }
      } catch (err) {
        // Network error, keep trying
        // eslint-disable-next-line no-console
        console.warn('Error polling geocode task:', err)
      }
    }

    // Timeout
    this._geocodeStatus = 'error'
    this._geocodeMessage = 'Geocoding task timed out. Check server logs.'
    this._geocodeRunning = false
  }

  // eslint-disable-next-line class-methods-use-this
  _formatRow(row) {
    const formattedRow = {
      grampsId: row.gramps_id,
      title: row.name.value,
      change: prettyTimeDiffTimestamp(row.change, this.appState.i18n.lang),
    }
    return formattedRow
  }
}

window.customElements.define('grampsjs-view-places', GrampsjsViewPlaces)
