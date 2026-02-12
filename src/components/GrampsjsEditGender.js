import {LitElement, html, css} from 'lit'

import '@material/mwc-icon-button'

import {sharedStyles} from '../SharedStyles.js'
import {fireEvent} from '../util.js'

const icons = {
  0: 'female',
  1: 'male',
  2: 'question_mark',
}

const newGender = {
  0: 1,
  1: 2,
  2: 0,
}

export class GrampsjsEditGender extends LitElement {
  static get styles() {
    return [
      sharedStyles,
      css`
        .gender-icon.always-editable {
          cursor: pointer;
        }

        .gender-icon.always-editable:hover {
          opacity: 0.7;
        }
      `,
    ]
  }

  static get properties() {
    return {
      gender: {type: Number},
      edit: {type: Boolean},
      alwaysEditable: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.gender = 2 // unkown
    this.edit = false
    this.alwaysEditable = false
  }

  render() {
    if (!this.edit && !this.alwaysEditable) {
      return ''
    }
    return html`
      <mwc-icon-button
        class="edit gender-icon ${this.alwaysEditable ? 'always-editable' : ''}"
        icon="${icons[this.gender]}"
        @click="${this._handleClick}"
      ></mwc-icon-button>
    `
  }

  _handleClick() {
    if (!this.edit && !this.alwaysEditable) {
      return
    }
    fireEvent(this, 'edit:action', {
      action: 'updateProp',
      data: {gender: newGender[this.gender]},
    })
  }
}

window.customElements.define('grampsjs-edit-gender', GrampsjsEditGender)
