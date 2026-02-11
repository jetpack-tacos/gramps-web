import {html, css, LitElement} from 'lit'
import {sharedStyles} from '../SharedStyles.js'
import '@material/mwc-button'

import './GrampsJsImage.js'
import './GrampsjsGallery.js'
import './GrampsjsTimedelta.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderMarkdownLinks} from '../util.js'

export class GrampsjsBlogPost extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        h2 {
          color: var(--grampsjs-note-color);
          font-weight: 530;
          font-size: 37px;
          padding-bottom: 0.75em;
          margin-bottom: 0.5em;
          padding-top: 0.5em;
          text-align: center;
          border-bottom: 2px solid var(--grampsjs-note-color);
        }

        h3.author {
          font-family: var(--grampsjs-body-font-family);
          font-weight: 300;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 60px;
          text-align: center;
        }

        #img-container {
          width: 100%;
          text-align: center;
        }

        #image {
          margin-top: 2em;
          margin-bottom: 3em;
        }

        #note {
          margin: 4em 0em;
        }

        #note-wrapper {
          margin: 0 auto;
          max-width: 40em;
        }

        .blog-body {
          line-height: 1.7em;
          font-size: 18px;
        }

        .blog-body p {
          margin-bottom: 1em;
        }

        .blog-body a {
          color: var(--md-sys-color-primary, #6750a4);
          text-decoration: none;
          font-weight: 500;
        }

        .blog-body a:hover {
          text-decoration: underline;
        }

        #btn-details {
          margin-top: 2em;
        }

        @media (min-width: 768px) {
          h2 {
            font-size: 60px;
            padding-bottom: 0.3em;
          }

          .blog-body {
            font-size: 23px;
          }
        }
      `,
    ]
  }

  static get properties() {
    return {
      source: {type: Object},
      note: {type: Object},
    }
  }

  constructor() {
    super()
    this.source = {}
    this.note = {}
  }

  render() {
    if (Object.keys(this.source).length === 0) {
      return html``
    }
    return html`
      <div class="blog-preview">
        <h2>${this.source.title}</h2>
        <h3 class="author">
          ${this.source.author} ~
          ${this.appState.i18n.lang
            ? html`<grampsjs-timedelta
                timestamp="${this.source.change}"
                locale="${this.appState.i18n.lang}"
              ></grampsjs-timedelta>`
            : ''}
        </h3>
        <div id="image">
          ${this.source?.media_list?.length ? this._renderImage() : ''}
        </div>
        <div id="note">
          <div id="note-wrapper">
            <div class="blog-body">${this._renderBlogContent()}</div>

            ${this.source?.media_list?.length > 1
              ? html`
                  <grampsjs-gallery
                    .appState="${this.appState}"
                    .media=${this.source?.extended?.media}
                    .mediaRef=${this.source?.media_list}
                  ></grampsjs-gallery>
                `
              : ''}

            <mwc-button
              id="btn-details"
              @click="${() => this._clickDetails(this.source.gramps_id)}"
              >Details</mwc-button
            >
          </div>
        </div>
      </div>
    `
  }

  _renderBlogContent() {
    const text = this.note?.text?.string || this.note?.formatted?.html || ''
    if (!text) {
      return html``
    }
    // Split on double newlines for paragraphs, render markdown links in each
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
    return paragraphs.map(p => html`<p>${renderMarkdownLinks(p.trim())}</p>`)
  }

  _clickDetails(grampsId) {
    this.dispatchEvent(
      new CustomEvent('nav', {
        bubbles: true,
        composed: true,
        detail: {path: `source/${grampsId}`},
      })
    )
  }

  _renderImage() {
    const ref = this.source.media_list[0]
    const obj = this.source.extended.media[0]
    return html`
      <div id="img-container">
        <grampsjs-img
          handle="${obj.handle}"
          size="1000"
          .rect="${ref.rect || []}"
          mime="${obj.mime}"
        ></grampsjs-img>
      </div>
    `
  }
}

window.customElements.define('grampsjs-blog-post', GrampsjsBlogPost)
