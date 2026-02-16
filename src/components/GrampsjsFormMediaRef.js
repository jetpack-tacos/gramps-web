/*
Form for adding a new event reference
*/

import {html} from 'lit'

import './GrampsjsFormSelectObjectList.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'

class GrampsjsFormMediaRef extends GrampsjsObjectForm {
  renderForm() {
    return html`
      <grampsjs-form-select-object-list
        fixedMenuPosition
        class="edit u-min-h-300"
        objectType="media"
        .appState="${this.appState}"
        id="media-select"
        label="${this._('Select')}"
      ></grampsjs-form-select-object-list>
    `
  }
}

window.customElements.define('grampsjs-form-mediaref', GrampsjsFormMediaRef)
