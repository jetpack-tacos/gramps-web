import {html, css, LitElement} from 'lit'
import '@material/web/icon/icon.js'
import '@material/web/iconbutton/icon-button.js'

import {mdiMenu} from '@mdi/js'
import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderIconSvg} from '../icons.js'
import {fireEvent} from '../util.js'
import './GrampsjsChatSidebar.js'
import './GrampsjsChatMessages.js'
import './GrampsjsChatPrompt.js'

class GrampsjsChat extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
          flex: 1;
          height: 100%;
        }

        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .header {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid var(--grampsjs-color-shade-220);
          flex-shrink: 0;
        }

        .header-title {
          font-size: 18px;
          font-weight: 450;
          flex: 1;
        }

        .menu-btn {
          display: none;
          --md-icon-button-icon-size: 22px;
        }

        .prompt {
          padding: 10px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .menu-btn {
            display: inline-flex;
            margin-right: 8px;
          }
        }
      `,
    ]
  }

  static get properties() {
    return {
      conversations: {type: Array},
      activeConversationId: {type: String},
      messages: {type: Array},
      loading: {type: Boolean},
      conversationsLoading: {type: Boolean},
      conversationsError: {type: String},
      _chatError: {type: String},
      _sidebarOpen: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.conversations = []
    this.activeConversationId = null
    this.messages = []
    this.loading = false
    this.conversationsLoading = false
    this.conversationsError = ''
    this._chatError = ''
    this._sidebarOpen = false
  }

  render() {
    return html`
      <grampsjs-chat-sidebar
        .appState="${this.appState}"
        .conversations="${this.conversations}"
        .activeConversationId="${this.activeConversationId}"
        ?loading="${this.conversationsLoading}"
        .errorMessage="${this.conversationsError}"
        ?open="${this._sidebarOpen}"
        @chat:new-conversation="${this._handleNewConversation}"
        @chat:select-conversation="${this._handleSelectConversation}"
        @chat:delete-conversation="${this._handleDeleteConversation}"
        @chat:retry-conversations="${this._fetchConversations}"
      ></grampsjs-chat-sidebar>
      <div class="main-area">
        <div class="header">
          <md-icon-button
            class="menu-btn"
            @click="${() => {
              this._sidebarOpen = !this._sidebarOpen
            }}"
          >
            <md-icon
              >${renderIconSvg(
                mdiMenu,
                'var(--grampsjs-body-font-color)'
              )}</md-icon
            >
          </md-icon-button>
          <span class="header-title">${this._('Chat')}</span>
        </div>
        <grampsjs-chat-messages
          .appState="${this.appState}"
          .messages="${this.messages}"
          ?loading="${this.loading}"
        ></grampsjs-chat-messages>
        <div class="prompt">
          <grampsjs-chat-prompt
            ?loading="${this.loading}"
            @chat:prompt="${this._handlePrompt}"
            .appState="${this.appState}"
          ></grampsjs-chat-prompt>
        </div>
      </div>
    `
  }

  connectedCallback() {
    super.connectedCallback()
    this._fetchConversations()
  }

  async _fetchConversations() {
    this.conversationsLoading = true
    this.conversationsError = ''
    try {
      const data = await this.appState.apiGet(
        '/api/conversations/?page=1&pagesize=50'
      )
      if (data?.data && Array.isArray(data.data)) {
        this.conversations = data.data
        return
      }
      if (Array.isArray(data)) {
        this.conversations = data
        return
      }
      const errorMessage = this._resolveErrorMessage(
        data,
        'Failed to load conversations'
      )
      this.conversations = []
      this.conversationsError = errorMessage
      fireEvent(this, 'grampsjs:error', {message: errorMessage})
    } catch (error) {
      const errorMessage = this._resolveErrorMessage(
        error,
        'Failed to load conversations'
      )
      this.conversations = []
      this.conversationsError = errorMessage
      fireEvent(this, 'grampsjs:error', {message: errorMessage})
    } finally {
      this.conversationsLoading = false
    }
  }

  _resolveErrorMessage(errorOrResponse, fallback) {
    if (typeof errorOrResponse?.error === 'string' && errorOrResponse.error) {
      return errorOrResponse.error
    }
    if (
      typeof errorOrResponse?.message === 'string' &&
      errorOrResponse.message
    ) {
      return errorOrResponse.message
    }
    return this._(fallback)
  }

  // eslint-disable-next-line class-methods-use-this
  _normalizeRole(role) {
    if (role === 'user' || role === 'human') return 'human'
    if (role === 'assistant' || role === 'model' || role === 'ai') return 'ai'
    return role
  }

  async _handleSelectConversation(e) {
    const {id} = e.detail
    if (!id || id === this.activeConversationId) return

    this.activeConversationId = id
    this.messages = []
    this.loading = true
    this._chatError = ''

    try {
      const data = await this.appState.apiGet(`/api/conversations/${id}/`)
      if (data && 'error' in data) {
        throw new Error(data.error || 'Failed to load conversation')
      }
      const rawMessages = data?.data?.messages || data?.messages || []
      this.messages = rawMessages.map(msg => ({
        role: this._normalizeRole(msg.role),
        content: msg.content,
      }))
    } catch (error) {
      this._chatError = this._resolveErrorMessage(
        error,
        'Failed to load conversation'
      )
      this.messages = [
        ...this.messages,
        {role: 'error', content: this._chatError},
      ]
      fireEvent(this, 'grampsjs:error', {message: this._chatError})
    } finally {
      this.loading = false
    }
  }

  _handleNewConversation() {
    this.activeConversationId = null
    this.messages = []
    this._chatError = ''
    this._sidebarOpen = false
    this._focusInput()
  }

  async _handleDeleteConversation(e) {
    const {id} = e.detail
    try {
      const data = await this.appState.apiDelete(`/api/conversations/${id}/`)
      if (data?.error) {
        throw new Error(data.error || 'An error occurred')
      }
      this.conversations = this.conversations.filter(c => c.id !== id)

      if (this.activeConversationId === id) {
        this.activeConversationId = null
        this.messages = []
      }
    } catch (error) {
      this._chatError = this._resolveErrorMessage(error, 'An error occurred')
      this.messages = [
        ...this.messages,
        {role: 'error', content: this._chatError},
      ]
      fireEvent(this, 'grampsjs:error', {message: this._chatError})
    }
  }

  _handlePrompt(event) {
    const userContent = event.detail.message
    this._chatError = ''
    this.messages = [...this.messages, {role: 'human', content: userContent}]
    this._generateResponse(userContent)
  }

  async _generateResponse(query) {
    this.loading = true
    this._chatError = ''

    const payload = {query}
    if (this.activeConversationId) {
      payload.conversation_id = this.activeConversationId
    }

    try {
      const data = await this.appState.apiPost('/api/chat/', payload, {
        dbChanged: false,
      })
      if ((data && 'error' in data) || !data?.data?.response) {
        throw new Error(data?.error || 'An error occurred')
      }
      this.messages = [
        ...this.messages,
        {role: 'ai', content: data.data.response},
      ]

      // Update conversation ID from response (new conversation case)
      if (data.data.conversation_id) {
        this.activeConversationId = data.data.conversation_id
      }

      // Refresh sidebar to show new/updated conversation
      this._fetchConversations()
    } catch (error) {
      this._chatError = this._resolveErrorMessage(error, 'An error occurred')
      this.messages = [
        ...this.messages,
        {role: 'error', content: this._chatError},
      ]
      fireEvent(this, 'grampsjs:error', {message: this._chatError})
    } finally {
      this.loading = false
    }
  }

  focusInput(retry = true) {
    this._focusInput(retry)
  }

  _focusInput(retry = true) {
    const ele = this.renderRoot.querySelector('grampsjs-chat-prompt')
    if (ele !== null) {
      ele.focusInput()
    } else if (retry) {
      setTimeout(() => this._focusInput(false), 500)
    }
  }
}

window.customElements.define('grampsjs-chat', GrampsjsChat)
