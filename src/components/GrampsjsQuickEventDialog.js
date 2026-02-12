import {html} from 'lit'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'
import {emptyDate} from '../util.js'
import './GrampsjsFormSelectDate.js'
import './GrampsjsFormSelectObjectList.js'

const EVENT_TYPE_LABEL = {
  12: 'Birth',
  13: 'Death',
}

export class GrampsjsQuickEventDialog extends GrampsjsObjectForm {
  static get properties() {
    return {
      eventType: {type: Number},
    }
  }

  constructor() {
    super()
    this.eventType = 12
    this.data = {
      eventType: this.eventType,
      date: {...emptyDate},
      place: '',
    }
  }

  update(changed) {
    super.update(changed)
    if (changed.has('eventType')) {
      this.data = {
        ...this.data,
        eventType: this.eventType,
      }
    }
  }

  renderForm() {
    return html`
      <h4 class="label">${this._('Date')}</h4>
      <p>
        <grampsjs-form-select-date
          id="date"
          .data="${this.data.date || {...emptyDate}}"
          .appState="${this.appState}"
          @formdata:changed="${this._handleFormData}"
        ></grampsjs-form-select-date>
      </p>
      <h4 class="label">${this._('Place')}</h4>
      <p>
        <grampsjs-form-select-object-list
          fixedMenuPosition
          id="place"
          objectType="place"
          label="${this._('Select')}"
          .appState="${this.appState}"
          .objectsInitial="${[]}"
        ></grampsjs-form-select-object-list>
      </p>
    `
  }

  _handleDialogSave() {
    const payload = {
      ...this.data,
      eventType: this.eventType,
      date: this.data.date || {...emptyDate},
      place: this.data.place || '',
    }
    this.dispatchEvent(
      new CustomEvent('object:save', {
        bubbles: true,
        composed: true,
        detail: {data: payload},
      })
    )
    this._reset()
  }

  get isValid() {
    return this._areDateSelectValid()
  }

  get eventTypeLabel() {
    return EVENT_TYPE_LABEL[this.eventType] || this._('Event')
  }
}

window.customElements.define(
  'grampsjs-quick-event-dialog',
  GrampsjsQuickEventDialog
)
