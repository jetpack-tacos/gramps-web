import {html, css, LitElement} from 'lit'
import {classMap} from 'lit/directives/class-map.js'
import '@material/web/icon/icon.js'
import {mdiFamilyTree} from '@mdi/js'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderIconSvg} from '../icons.js'

class GrampsjsChatMessage extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
        }

        .container {
          margin: 12px 0;
          font-size: 16px;
          line-height: 24px;
          font-weight: 340;
          max-width: 90%;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .container.human {
          background-color: transparent;
          color: var(--grampsjs-body-font-color-60);
          padding: 0;
          border-radius: 0;
          width: fit-content;
          margin-left: auto;
          max-width: 70%;
          margin-right: 10px;
        }

        .container.alert {
          max-width: 70%;
          margin-left: auto;
          margin-right: auto;
          width: fit-content;
          border-radius: 16px;
          border: 0;
        }

        .container.error .slot-wrap {
          color: var(--md-sys-color-error, #b3261e);
          font-size: 14px;
        }

        .slot-wrap {
          white-space: pre-wrap;
          flex-grow: 1;
          overflow: hidden;
        }

        .container.human .slot-wrap {
          flex-grow: 0;
        }

        .container.human .slot-wrap p {
          margin: 0;
        }

        .slot-wrap > :first-child {
          margin-top: 0;
        }

        .slot-wrap > :last-child {
          margin-bottom: 0;
        }

        .avatar {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
        }

        .avatar md-icon {
          --md-icon-size: 20px;
          position: relative;
          top: 3px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      type: {type: String},
    }
  }

  constructor() {
    super()
    this.type = 'human'
  }

  render() {
    return html`
      <div
        class="${classMap({
          container: true,
          human: this.type === 'human',
          ai: this.type === 'ai',
          alert: this.type === 'error',
          error: this.type === 'error',
        })}"
      >
        ${this.type === 'ai'
          ? html`
              <div class="avatar">
                <md-icon
                  >${renderIconSvg(
                    mdiFamilyTree,
                    'var(--grampsjs-body-font-color-40)',
                    270
                  )}</md-icon
                >
              </div>
            `
          : ''}
        <slot name="no-wrap"></slot>
        <!-- prettier-ignore -->
        <div class="slot-wrap"><slot></slot></div>
      </div>
    `
  }
}

window.customElements.define('grampsjs-chat-message', GrampsjsChatMessage)
