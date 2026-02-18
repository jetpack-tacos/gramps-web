import {css, html} from 'lit'

import '@material/mwc-button'
import '@material/mwc-icon'
import '@material/mwc-textfield'
import '@material/web/select/filled-select'
import '@material/web/select/select-option'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsConnectedComponent} from './GrampsjsConnectedComponent.js'
import {fireEvent} from '../util.js'

const modeOptions = [
  {value: 'off', label: 'Off'},
  {value: 'auto', label: 'Auto'},
  {value: 'on', label: 'On'},
]

export class GrampsjsSearchGroundingSettings extends GrampsjsConnectedComponent {
  static get styles() {
    return [
      sharedStyles,
      css`
        .card {
          padding: 1em 1em;
          border-radius: 16px;
          background-color: var(--grampsjs-color-shade-230);
        }

        .head {
          display: flex;
          justify-content: space-between;
          gap: 1em;
          align-items: center;
          margin-bottom: 0.75em;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35em;
          border-radius: 999px;
          padding: 0.2em 0.7em;
          font-size: 13px;
          font-weight: 450;
          border: 1px solid var(--grampsjs-body-font-color-25);
          color: var(--grampsjs-body-font-color-80);
          background-color: var(--grampsjs-body-font-color-5);
        }

        .badge.near_limit {
          color: var(--grampsjs-alert-warn-font-color);
          border-color: var(--grampsjs-alert-warn-border-color);
          background-color: var(--grampsjs-alert-warn-background-color);
        }

        .badge.exhausted {
          color: var(--grampsjs-alert-error-font-color);
          border-color: var(--grampsjs-alert-error-border-color);
          background-color: var(--grampsjs-alert-error-background-color);
        }

        .controls {
          display: grid;
          gap: 0.75em;
          grid-template-columns: repeat(4, minmax(120px, 1fr));
          align-items: end;
        }

        .controls mwc-button {
          width: fit-content;
        }

        .summary {
          margin-top: 0.9em;
          display: grid;
          gap: 0.4em;
          grid-template-columns: repeat(2, minmax(200px, 1fr));
        }

        .summary-item {
          font-size: 14px;
          color: var(--grampsjs-body-font-color-70);
        }

        .summary-item strong {
          color: var(--grampsjs-body-font-color-90);
        }

        .save-status {
          margin: 0.8em 0 0;
          color: var(--grampsjs-body-font-color-50);
          font-size: 0.875rem;
        }

        .save-status.error {
          color: var(--md-sys-color-error);
        }

        @media (max-width: 920px) {
          .controls {
            grid-template-columns: repeat(2, minmax(120px, 1fr));
          }

          .summary {
            grid-template-columns: 1fr;
          }
        }
      `,
    ]
  }

  static get properties() {
    return {
      ...super.properties,
      _modeValue: {state: true},
      _softCapValue: {state: true},
      _hardCapValue: {state: true},
      _saving: {state: true},
      _saveErrorMessage: {state: true},
      _saveSuccessMessage: {state: true},
      _formInitialized: {state: true},
      _pollHandle: {state: false},
    }
  }

  constructor() {
    super()
    this._modeValue = 'auto'
    this._softCapValue = ''
    this._hardCapValue = ''
    this._saving = false
    this._saveErrorMessage = ''
    this._saveSuccessMessage = ''
    this._formInitialized = false
    this._pollHandle = null
  }

  connectedCallback() {
    super.connectedCallback()
    this._pollHandle = window.setInterval(() => {
      if (!this._saving && !this._hasUnsavedChanges()) {
        this._updateData(false)
      }
    }, 30000)
  }

  disconnectedCallback() {
    if (this._pollHandle) {
      window.clearInterval(this._pollHandle)
      this._pollHandle = null
    }
    super.disconnectedCallback()
  }

  updated(changed) {
    super.updated(changed)
    if (
      changed.has('_data') &&
      (!this._formInitialized || !this._hasUnsavedChanges())
    ) {
      this._syncFormFromData()
      this._formInitialized = true
    }
  }

  renderContent() {
    const status = this._data?.data?.usage?.free_tier_status || 'normal'
    let icon = 'check_circle'
    let modeLabel = this._('Normal')
    if (status === 'near_limit') {
      icon = 'warning'
      modeLabel = this._('Near limit')
    } else if (status === 'exhausted') {
      icon = 'error'
      modeLabel = this._('Free tier exhausted')
    }

    return html`
      <div class="card">
        <div class="head">
          <strong>${this._('Search grounding policy')}</strong>
          <span class="badge ${status}" role="status" aria-live="polite">
            <mwc-icon>${icon}</mwc-icon>
            ${modeLabel}
          </span>
        </div>

        <div class="controls">
          <md-filled-select
            label="${this._('Mode')}"
            .value="${this._modeValue}"
            @change="${this._handleModeChange}"
            ?disabled="${this._saving}"
          >
            ${modeOptions.map(
              option => html`
                <md-select-option value="${option.value}">
                  <div slot="headline">${this._(option.label)}</div>
                </md-select-option>
              `
            )}
          </md-filled-select>

          <mwc-textfield
            type="number"
            min="0"
            step="1"
            label="${this._('Soft cap')}"
            .value="${this._softCapValue}"
            @input="${this._handleSoftCapChange}"
            ?disabled="${this._saving}"
          ></mwc-textfield>

          <mwc-textfield
            type="number"
            min="0"
            step="1"
            label="${this._('Hard cap')}"
            .value="${this._hardCapValue}"
            @input="${this._handleHardCapChange}"
            ?disabled="${this._saving}"
          ></mwc-textfield>

          <mwc-button
            outlined
            @click="${this._saveSettings}"
            ?disabled="${this._saving || !this._hasUnsavedChanges()}"
          >
            ${this._saving ? this._('Saving...') : this._('Save')}
          </mwc-button>
        </div>

        ${this._renderSummary()}
        ${this._saveErrorMessage
          ? html`<p class="save-status error">${this._saveErrorMessage}</p>`
          : ''}
        ${this._saveSuccessMessage
          ? html`<p class="save-status">${this._saveSuccessMessage}</p>`
          : ''}
      </div>
    `
  }

  renderLoading() {
    return html`
      <div class="card">
        <div class="head">
          <strong>${this._('Search grounding policy')}</strong>
          <span class="skeleton" style="width: 8em;">&nbsp;</span>
        </div>
        <div class="summary">
          <div class="summary-item">
            <span class="skeleton" style="width: 12em;">&nbsp;</span>
          </div>
          <div class="summary-item">
            <span class="skeleton" style="width: 12em;">&nbsp;</span>
          </div>
        </div>
      </div>
    `
  }

  _renderSummary() {
    const usage = this._data?.data?.usage || {}
    const caps = this._data?.data?.caps || {}
    const estimated = this._data?.data?.estimated_cost_usd_month ?? 0
    const cost = Number.isFinite(Number(estimated))
      ? Number(estimated).toFixed(2)
      : '0.00'
    return html`
      <div class="summary">
        <div class="summary-item">
          <strong>${this._('Free tier used')}:</strong>
          ${usage.free_tier_used ?? 0}/${caps.free_tier_limit ?? 0}
        </div>
        <div class="summary-item">
          <strong>${this._('Remaining')}:</strong>
          ${usage.free_tier_remaining ?? 0}
        </div>
        <div class="summary-item">
          <strong>${this._('Month resets (UTC)')}:</strong>
          ${usage.resets_at_utc || this._('Unknown')}
        </div>
        <div class="summary-item">
          <strong>${this._('Grounded prompts this month')}:</strong>
          ${usage.grounded_prompts_count ?? 0}
        </div>
        <div class="summary-item">
          <strong>${this._('Web search queries this month')}:</strong>
          ${usage.web_search_queries_count ?? 0}
        </div>
        <div class="summary-item">
          <strong>${this._('Estimated monthly grounding cost')}:</strong>
          $${cost}
        </div>
      </div>
    `
  }

  _syncFormFromData() {
    const data = this._data?.data || {}
    this._modeValue = data.effective_mode || 'auto'
    this._softCapValue = `${data?.caps?.soft_cap ?? ''}`
    this._hardCapValue = `${data?.caps?.hard_cap ?? ''}`
  }

  _hasUnsavedChanges() {
    const data = this._data?.data || {}
    const mode = data.effective_mode || 'auto'
    const softCap = `${data?.caps?.soft_cap ?? ''}`
    const hardCap = `${data?.caps?.hard_cap ?? ''}`
    return (
      this._modeValue !== mode ||
      `${this._softCapValue}` !== softCap ||
      `${this._hardCapValue}` !== hardCap
    )
  }

  _handleModeChange(event) {
    this._modeValue = event.target.value
    this._saveErrorMessage = ''
    this._saveSuccessMessage = ''
  }

  _handleSoftCapChange(event) {
    this._softCapValue = event.target.value
    this._saveErrorMessage = ''
    this._saveSuccessMessage = ''
  }

  _handleHardCapChange(event) {
    this._hardCapValue = event.target.value
    this._saveErrorMessage = ''
    this._saveSuccessMessage = ''
  }

  async _saveSettings() {
    const softCap = Number.parseInt(this._softCapValue, 10)
    const hardCap = Number.parseInt(this._hardCapValue, 10)
    if (
      Number.isNaN(softCap) ||
      Number.isNaN(hardCap) ||
      softCap < 0 ||
      hardCap < 0
    ) {
      this._saveErrorMessage = this._('Caps must be non-negative integers')
      return
    }
    if (hardCap > 0 && softCap > hardCap) {
      this._saveErrorMessage = this._('Soft cap cannot exceed hard cap')
      return
    }

    this._saving = true
    this._saveErrorMessage = ''
    this._saveSuccessMessage = ''

    const payload = {
      mode: this._modeValue,
      soft_cap: softCap,
      hard_cap: hardCap,
    }
    try {
      const data = await this.appState.apiPut(
        '/api/search-grounding/settings/',
        payload,
        {
          dbChanged: false,
        }
      )
      if (data && 'error' in data) {
        this._saveErrorMessage =
          data.error || this._('Failed to save search grounding settings')
        fireEvent(this, 'grampsjs:error', {message: this._saveErrorMessage})
        return
      }
      this._data = {data: data.data}
      this._syncFormFromData()
      this._saveSuccessMessage = this._('Settings saved')
    } catch (error) {
      this._saveErrorMessage =
        error?.message || this._('Failed to save search grounding settings')
      fireEvent(this, 'grampsjs:error', {message: this._saveErrorMessage})
    } finally {
      this._saving = false
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getUrl() {
    return '/api/search-grounding/settings/'
  }
}

window.customElements.define(
  'grampsjs-search-grounding-settings',
  GrampsjsSearchGroundingSettings
)
