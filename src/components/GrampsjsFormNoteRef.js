/*
Form for adding a new event reference
*/

import {html} from 'lit'
import '@material/mwc-textfield'
import '@material/mwc-icon-button'
import '@material/mwc-icon'
import '@material/mwc-button'

import './GrampsjsFormSelectType.js'
import './GrampsjsFormSelectObjectList.js'
import './GrampsjsFormString.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'

class GrampsjsFormNoteRef extends GrampsjsObjectForm {
  renderForm() {
    return html`
      <grampsjs-form-select-object-list
        fixedMenuPosition
        class="edit u-min-h-300"
        objectType="note"
        .appState="${this.appState}"
        id="note-select"
        label="${this._('Select')}"
      ></grampsjs-form-select-object-list>
    `
  }
}

window.customElements.define('grampsjs-form-noteref', GrampsjsFormNoteRef)
