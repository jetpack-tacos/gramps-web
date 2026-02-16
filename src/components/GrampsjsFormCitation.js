/*
Form for adding a new event reference
*/

import {html} from 'lit'

import './GrampsjsFormSelectObjectList.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'

class GrampsjsFormCitation extends GrampsjsObjectForm {
  renderForm() {
    return html`
      <grampsjs-form-select-object-list
        notDeletable
        fixedMenuPosition
        class="edit u-min-h-300"
        objectType="citation"
        .appState="${this.appState}"
        id="citation-select"
        label="${this._('Select')}"
      ></grampsjs-form-select-object-list>
    `
  }
}

window.customElements.define('grampsjs-form-citation', GrampsjsFormCitation)
