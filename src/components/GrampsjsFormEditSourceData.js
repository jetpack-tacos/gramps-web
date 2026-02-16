/*
Form for updating the propertoies of Source - Abbrevation, Author & Pub Info
*/

import {html} from 'lit'

import './GrampsjsFormString.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'

class GrampsjsFormEditSourceData extends GrampsjsObjectForm {
  renderForm() {
    return html`
      <div class="u-w-100" style="float:left;margin-bottom:20px;">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="abbrev"
          label="${this._('Abbrevation')}"
          value="${this.data?.abbrev || ''}"
        >
        </grampsjs-form-string>
      </div>
      <div class="u-w-100" style="float:left;margin-bottom:20px;">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="author"
          label="${this._('Author')}"
          value="${this.data?.author || ''}"
        >
        </grampsjs-form-string>
      </div>
      <div class="u-w-100" style="float:left;margin-bottom:20px;">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="pubinfo"
          label="${this._('Publication Info')}"
          value="${this.data?.pubinfo || ''}"
        >
        </grampsjs-form-string>
      </div>
    `
  }
}

window.customElements.define(
  'grampsjs-form-edit-source-data',
  GrampsjsFormEditSourceData
)
