import {html, css} from 'lit'
import '@material/web/button/outlined-button'
import '@material/mwc-icon'
import '@material/mwc-icon-button'
import {mdiFamilyTree, mdiDna, mdiSearchWeb} from '@mdi/js'
import {GrampsjsObject} from './GrampsjsObject.js'
import {asteriskIcon, crossIcon} from '../icons.js'
import './GrampsJsImage.js'
import './GrampsjsEditGender.js'
import './GrampsjsFormEditName.js'
import './GrampsjsPersonRelationship.js'
import './GrampsjsFormExternalSearch.js'
import './GrampsjsPersonInsights.js'
import {fireEvent} from '../util.js'

export class GrampsjsPerson extends GrampsjsObject {
  static get styles() {
    return [
      super.styles,
      css`
        .missing-data {
          color: var(--md-sys-color-on-surface);
          background-color: var(--md-sys-color-surface-container-high);
          border: 1px solid var(--md-sys-color-outline-variant);
          border-radius: 999px;
          padding: 4px 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9em;
          margin-right: 6px;
        }

        .missing-data:hover {
          background-color: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
          border-color: var(--md-sys-color-primary);
        }

        .missing-data mwc-icon {
          font-size: 16px;
        }

        .editable-field {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .inline-edit-icon {
          --mdc-icon-size: 17px;
          color: var(--grampsjs-body-font-color-60);
          margin-left: 2px;
        }

        .inline-edit-icon:hover {
          color: var(--mdc-theme-primary);
        }
      `,
    ]
  }

  static get properties() {
    return {
      homePersonDetails: {type: Object},
      canEdit: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.homePersonDetails = {}
    this.canEdit = false
    this._objectsName = 'People'
    this._objectEndpoint = 'people'
    this._objectIcon = 'person'
    this._showReferences = false
    this._showPersonTimeline = true
  }

  renderProfile() {
    return html`
      <h2>
        <grampsjs-edit-gender
          ?edit="${this.edit}"
          ?alwaysEditable="${this.canEdit}"
          gender="${this.data.gender}"
        ></grampsjs-edit-gender>
        <span class="editable-field">
          ${this._displayName()}
          ${this.canEdit
            ? html`
                <mwc-icon-button
                  class="inline-edit-icon"
                  icon="edit"
                  @click="${this._promptEditPrimaryName}"
                ></mwc-icon-button>
              `
            : ''}
        </span>
      </h2>
      ${this._renderBirth()} ${this._renderDeath()} ${this._renderRelation()}
      <p class="button-list">
        ${this._renderTreeBtn()} ${this._renderDnaBtn()}
        ${this._renderExternalSearchBtn()}
      </p>
    `
  }

  renderInsights() {
    if (!this.canUseChat || !this.data?.gramps_id) {
      return html``
    }
    return html`
      <grampsjs-person-insights
        .grampsId="${this.data.gramps_id}"
        .appState="${this.appState}"
      ></grampsjs-person-insights>
    `
  }

  _displayName() {
    if (!this.data.profile) {
      return ''
    }
    const surname = this.data.profile.name_surname || '…'
    const suffix = this.data.profile.name_suffix || ''
    const call = this.data?.primary_name?.call
    let given = this.data.profile.name_given || call || '…'
    const callIndex = call && call !== given ? given.search(call) : -1
    given =
      callIndex > -1
        ? html`
            ${given.substring(0, callIndex)}
            <span class="given-name"
              >${given.substring(callIndex, callIndex + call.length)}</span
            >
            ${given.substring(callIndex + call.length)}
          `
        : given
    return html`${given} ${surname} ${suffix}`
  }

  _renderBirth() {
    const obj = this.data?.profile?.birth
    const hasBirthEvent = Boolean(this._getPrimaryEventHandle(12))
    if (obj?.date) {
      return html`
        <span class="event editable-field">
          <i>${asteriskIcon}</i>
          ${obj.date} ${obj.place ? this._('in') : ''}
          ${obj.place_name || obj.place || ''}
          ${this.canEdit
            ? html`
                <mwc-icon-button
                  class="inline-edit-icon"
                  icon="edit"
                  @click="${this._promptAddBirth}"
                ></mwc-icon-button>
              `
            : ''}
        </span>
      `
    }
    if (this.canEdit) {
      return html`
        <button
          type="button"
          class="missing-data"
          @click="${this._promptAddBirth}"
        >
          <mwc-icon>edit</mwc-icon>
          ${this._(
            hasBirthEvent
              ? 'Complete birth information'
              : 'Add birth information'
          )}
        </button>
      `
    }
    if (obj === undefined || Object.keys(obj).length === 0) {
      return ''
    }
    return html`
      <span class="event">
        <i>${asteriskIcon}</i>
        ${obj.date || ''} ${obj.place ? this._('in') : ''}
        ${obj.place_name || obj.place || ''}
      </span>
    `
  }

  _renderDeath() {
    const obj = this.data?.profile?.death
    const hasDeathEvent = Boolean(this._getPrimaryEventHandle(13))
    if (obj?.date) {
      return html`
        <span class="event editable-field">
          <i>${crossIcon}</i>
          ${obj.date} ${obj.place ? this._('in') : ''}
          ${obj.place_name || obj.place || ''}
          ${this.canEdit
            ? html`
                <mwc-icon-button
                  class="inline-edit-icon"
                  icon="edit"
                  @click="${this._promptAddDeath}"
                ></mwc-icon-button>
              `
            : ''}
        </span>
      `
    }
    if (this.canEdit) {
      return html`
        <button
          type="button"
          class="missing-data"
          @click="${this._promptAddDeath}"
        >
          <mwc-icon>edit</mwc-icon>
          ${this._(
            hasDeathEvent
              ? 'Complete death information'
              : 'Add death information'
          )}
        </button>
      `
    }
    if (obj === undefined || Object.keys(obj).length === 0) {
      return ''
    }
    return html`
      <span class="event">
        <i>${crossIcon}</i>
        ${obj.date || ''} ${obj.place ? this._('in') : ''}
        ${obj.place_name || obj.place || ''}
      </span>
    `
  }

  _renderRelation() {
    const hasParents = this.data?.parent_family_list?.length > 0
    const missingParentsPrompt =
      !hasParents && this.canEdit
        ? html`
            <button
              type="button"
              class="missing-data"
              @click="${this._promptAddParents}"
            >
              <mwc-icon>edit</mwc-icon>
              ${this._('Add parents')}
            </button>
          `
        : html``

    if (!this.homePersonDetails.handle) {
      // no home person set
      return missingParentsPrompt
    }
    return html`
      ${missingParentsPrompt}
      <dl>
        <dt>${this._('Relationship to home person')}</dt>
        <dd>
          <grampsjs-person-relationship
            person1="${this.homePersonDetails.handle}"
            person2="${this.data.handle}"
            .appState="${this.appState}"
          ></grampsjs-person-relationship>
        </dd>
      </dl>
    `
  }

  _renderTreeBtn() {
    return html`
      <md-outlined-button @click="${this._handleTreeButtonClick}">
        ${this._('Show in tree')}
        <grampsjs-icon
          path="${mdiFamilyTree}"
          color="var(--mdc-theme-primary)"
          slot="icon"
        >
        </grampsjs-icon>
      </md-outlined-button>
    `
  }

  _renderExternalSearchBtn() {
    return html`
      <md-outlined-button @click="${this._handleExternalSearchClick}">
        ${this._('External Search')}
        <grampsjs-icon
          path="${mdiSearchWeb}"
          color="var(--mdc-theme-primary)"
          slot="icon"
        >
        </grampsjs-icon>
      </md-outlined-button>
    `
  }

  _renderDnaBtn() {
    if (!this.data?.person_ref_list?.filter(ref => ref.rel === 'DNA').length) {
      // no DNA data
      return ''
    }
    return html`
      <md-outlined-button
        @click="${this._handleDnaButtonClick}"
        class="dna-btn"
      >
        ${this._('DNA matches')}
        <grampsjs-icon
          path="${mdiDna}"
          color="var(--mdc-theme-primary)"
          slot="icon"
        ></grampsjs-icon>
      </md-outlined-button>
    `
  }

  _handleTreeButtonClick() {
    this.dispatchEvent(
      new CustomEvent('pedigree:person-selected', {
        bubbles: true,
        composed: true,
        detail: {grampsId: this.data.gramps_id},
      })
    )
    fireEvent(this, 'nav', {path: 'tree'})
  }

  _handleExternalSearchClick() {
    // Helper to extract year from date string (format: "YYYY-MM-DD" or "YYYY")
    const extractYear = dateStr => {
      if (!dateStr) return ''
      const match = dateStr.match(/^\d{4}/)
      return match ? match[0] : ''
    }
    const data = {
      name_given: this.data?.profile?.name_given,
      name_surname: this.data?.profile?.name_surname,
      name_middle: this.data?.profile?.name_given?.split(' ')[1] || '',
      place_name:
        this.data?.profile?.birth?.place_name ||
        this.data?.profile?.birth?.place ||
        this.data?.profile?.death?.place_name ||
        this.data?.profile?.death?.place ||
        '',
      birth_year: extractYear(this.data?.profile?.birth?.date),
      death_year: extractYear(this.data?.profile?.death?.date),
    }
    this.dialogContent = html`
      <div>
        <grampsjs-form-external-search
          @object:cancel=${this._handleCancelDialog}
          .appState="${this.appState}"
          .data=${data}
          .dialogTitle=${this._('External Search')}
          .hideSaveButton=${true}
        >
        </grampsjs-form-external-search>
      </div>
    `
  }

  _handleCancelDialog() {
    this.dialogContent = ''
  }

  _handleDnaButtonClick() {
    fireEvent(this, 'nav', {path: `dna-matches/${this.data.gramps_id}`})
  }

  _promptEditPrimaryName() {
    this.dialogContent = html`
      <grampsjs-form-edit-name
        id="person-primary-name"
        @object:save="${this._handleSavePrimaryName}"
        @object:cancel="${this._handleCancelDialog}"
        .appState="${this.appState}"
        .data="${this.data?.primary_name || {}}"
      >
      </grampsjs-form-edit-name>
    `
  }

  _handleSavePrimaryName(e) {
    fireEvent(this, 'edit:action', {
      action: 'updateName',
      data: {index: 0, name: e.detail.data},
    })
    e.preventDefault()
    e.stopPropagation()
    this.dialogContent = ''
  }

  _promptAddBirth() {
    const eventHandle = this._getPrimaryEventHandle(12)
    fireEvent(this, 'edit:action', {
      action: 'quickAddEvent',
      data: {eventType: 12, eventHandle},
    })
  }

  _promptAddDeath() {
    const eventHandle = this._getPrimaryEventHandle(13)
    fireEvent(this, 'edit:action', {
      action: 'quickAddEvent',
      data: {eventType: 13, eventHandle},
    })
  }

  _promptAddParents() {
    fireEvent(this, 'edit-mode:toggle')
  }

  _getPrimaryEventHandle(eventType) {
    const refIndex =
      eventType === 12 ? this.data?.birth_ref_index : this.data?.death_ref_index
    if (!Number.isInteger(refIndex) || refIndex < 0) {
      return ''
    }
    return this.data?.event_ref_list?.[refIndex]?.ref || ''
  }
}

window.customElements.define('grampsjs-person', GrampsjsPerson)
