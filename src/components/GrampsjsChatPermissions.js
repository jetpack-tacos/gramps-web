import {css, html} from 'lit'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsConnectedComponent} from './GrampsjsConnectedComponent.js'
import {fireEvent} from '../util.js'

// options for min_role_ai
const roleAiOptions = {
  4: 'Owners and administrators',
  3: 'Editor and above',
  2: 'Contributor and above',
  1: 'Member and above',
  0: 'Everybody',
  99: 'Nobody',
}

export class GrampsjsChatPermissions extends GrampsjsConnectedComponent {
  static get styles() {
    return [
      sharedStyles,
      css`
        p {
          padding-bottom: 15px;
        }

        .margin-left {
          margin-left: 1em;
        }

        .hidden {
          visibility: hidden;
        }

        .save-status {
          margin: 8px 0 0;
          color: var(--grampsjs-body-font-color-50);
          font-size: 0.875rem;
        }

        .save-status.error {
          color: var(--md-sys-color-error);
        }
      `,
    ]
  }

  static get properties() {
    return {
      ...super.properties,
      _saving: {state: true},
      _saveErrorMessage: {state: true},
    }
  }

  constructor() {
    super()
    this._saving = false
    this._saveErrorMessage = ''
  }

  renderContent() {
    let minRoleAi = this._data?.data?.min_role_ai ?? 99
    minRoleAi = minRoleAi > 5 ? 99 : minRoleAi
    return html`
      <p>
        ${this._('User groups allowed to use AI chat:')}
        <md-filled-select
          id="select-role-ai"
          class="margin-left"
          @change="${this._handleChange}"
          ?disabled="${this._saving}"
        >
          ${Object.keys(roleAiOptions).map(
            key => html`
              <md-select-option
                value="${key}"
                ?selected="${`${key}` === `${minRoleAi}`}"
              >
                <div slot="headline">${this._(roleAiOptions[key])}</div>
              </md-select-option>
            `
          )}
        </md-filled-select>
      </p>
      ${this._saving
        ? html`<p class="save-status">
            ${this._('Saving chat permissions...')}
          </p>`
        : ''}
      ${this._saveErrorMessage
        ? html`<p class="save-status error">${this._saveErrorMessage}</p>`
        : ''}
    `
  }

  // eslint-disable-next-line class-methods-use-this
  renderLoading() {
    return html`
      <p>
        ${this._('User groups allowed to use AI chat:')}
        <span class="skeleton margin-left">
          <md-filled-select class="hidden"> </md-filled-select>
        </span>
      </p>
    `
  }

  async _handleChange(event) {
    const minRoleAi = parseInt(event.target.value, 10)
    if (Number.isNaN(minRoleAi)) {
      return
    }

    const payload = {min_role_ai: minRoleAi}
    this._saving = true
    this._saveErrorMessage = ''

    try {
      const data = await this.appState.apiPut('/api/trees/-', payload)
      if (data && 'error' in data) {
        this._saveErrorMessage =
          data.error || this._('Failed to save chat permissions')
        fireEvent(this, 'grampsjs:error', {message: this._saveErrorMessage})
        this._updateData(false)
        return
      }
      fireEvent(this, 'token:refresh', {})
    } catch (error) {
      this._saveErrorMessage =
        error?.message || this._('Failed to save chat permissions')
      fireEvent(this, 'grampsjs:error', {message: this._saveErrorMessage})
      this._updateData(false)
    } finally {
      this._saving = false
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getUrl() {
    return '/api/trees/-'
  }
}

window.customElements.define(
  'grampsjs-chat-permissions',
  GrampsjsChatPermissions
)
