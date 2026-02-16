import {html, css, LitElement} from 'lit'
import {classMap} from 'lit/directives/class-map.js'
import '@material/web/icon/icon.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/button/filled-tonal-button.js'

import {mdiDelete, mdiPlus} from '@mdi/js'
import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import {renderIconSvg} from '../icons.js'
import {groupConversationsByTime} from '../chatSidebarUtils.js'

class GrampsjsChatSidebar extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--grampsjs-color-shade-240);
          border-right: 1px solid var(--grampsjs-color-shade-220);
          width: 260px;
          min-width: 260px;
          overflow: hidden;
        }

        .header {
          padding: 12px;
          flex-shrink: 0;
        }

        .header md-filled-tonal-button {
          width: 100%;
          --md-filled-tonal-button-container-height: 40px;
        }

        .conversations {
          flex: 1;
          overflow-y: auto;
          padding: 0 8px 8px 8px;
        }

        .group-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--grampsjs-body-font-color-50);
          padding: 12px 8px 4px 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          padding: 8px 8px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          line-height: 20px;
          color: var(--grampsjs-body-font-color);
          transition: background-color 0.15s;
        }

        .conversation-item:hover {
          background-color: var(--grampsjs-color-shade-220);
        }

        .conversation-item.active {
          background-color: var(--grampsjs-color-shade-210);
          font-weight: 450;
        }

        .conversation-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .delete-btn {
          opacity: 0;
          transition: opacity 0.15s;
          flex-shrink: 0;
          --md-icon-button-icon-size: 18px;
          --md-icon-button-state-layer-height: 28px;
          --md-icon-button-state-layer-width: 28px;
        }

        .conversation-item:hover .delete-btn {
          opacity: 1;
        }

        .empty-state {
          padding: 20px 16px;
          text-align: center;
          color: var(--grampsjs-body-font-color-50);
          font-size: 14px;
        }

        .status {
          padding: 20px 16px;
          text-align: center;
          color: var(--grampsjs-body-font-color-50);
          font-size: 14px;
        }

        .status.error {
          color: var(--md-sys-color-error);
        }

        .retry-btn {
          margin-top: 10px;
          width: 100%;
          --md-filled-tonal-button-container-height: 36px;
        }

        @media (max-width: 768px) {
          :host {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 10;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
          }

          :host([open]) {
            transform: translateX(0);
          }
        }
      `,
    ]
  }

  static get properties() {
    return {
      conversations: {type: Array},
      activeConversationId: {type: String},
      loading: {type: Boolean},
      errorMessage: {type: String},
      open: {type: Boolean, reflect: true},
    }
  }

  constructor() {
    super()
    this.conversations = []
    this.activeConversationId = null
    this.loading = false
    this.errorMessage = ''
    this.open = false
  }

  render() {
    const grouped = groupConversationsByTime(this.conversations)
    let conversationsContent = ''
    if (this.loading) {
      conversationsContent = html`
        <div class="status">${this._('Loading conversations...')}</div>
      `
    } else if (this.errorMessage) {
      conversationsContent = html`
        <div class="status error">
          <div>${this.errorMessage}</div>
          <md-filled-tonal-button
            class="retry-btn"
            @click="${this._handleRetry}"
          >
            ${this._('Retry')}
          </md-filled-tonal-button>
        </div>
      `
    } else if (this.conversations.length === 0) {
      conversationsContent = html`
        <div class="empty-state">${this._('No conversations yet')}</div>
      `
    } else {
      conversationsContent = grouped.map(
        group => html`
          <div class="group-label">${group.label}</div>
          ${group.items.map(conv => this._renderConversation(conv))}
        `
      )
    }

    return html`
      <div class="header">
        <md-filled-tonal-button @click="${this._handleNewChat}">
          <md-icon slot="icon"
            >${renderIconSvg(mdiPlus, 'currentColor')}</md-icon
          >
          ${this._('New Chat')}
        </md-filled-tonal-button>
      </div>
      <div class="conversations">${conversationsContent}</div>
    `
  }

  _renderConversation(conv) {
    return html`
      <div
        class="${classMap({
          'conversation-item': true,
          active: conv.id === this.activeConversationId,
        })}"
        role="button"
        tabindex="0"
        @click="${() => this._handleSelect(conv.id)}"
        @keydown="${e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this._handleSelect(conv.id)
          }
        }}"
      >
        <span class="conversation-title"
          >${conv.title || this._('New conversation')}</span
        >
        <md-icon-button
          class="delete-btn"
          @click="${e => this._handleDelete(e, conv.id)}"
        >
          <md-icon
            >${renderIconSvg(
              mdiDelete,
              'var(--grampsjs-body-font-color-50)'
            )}</md-icon
          >
        </md-icon-button>
      </div>
    `
  }

  _handleNewChat() {
    fireEvent(this, 'chat:new-conversation')
    this.open = false
  }

  _handleSelect(id) {
    if (this.loading) {
      return
    }
    fireEvent(this, 'chat:select-conversation', {id})
    this.open = false
  }

  _handleDelete(e, id) {
    if (this.loading) {
      return
    }
    e.stopPropagation()
    fireEvent(this, 'chat:delete-conversation', {id})
  }

  _handleRetry() {
    fireEvent(this, 'chat:retry-conversations')
  }
}

window.customElements.define('grampsjs-chat-sidebar', GrampsjsChatSidebar)
