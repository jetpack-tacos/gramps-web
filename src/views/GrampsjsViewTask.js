import {html} from 'lit'

import '../components/GrampsjsTask.js'
import {GrampsjsViewSource} from './GrampsjsViewSource.js'
import {fireEvent} from '../util.js'

export class GrampsjsViewTask extends GrampsjsViewSource {
  constructor() {
    super()
    this._className = 'source'
  }

  renderElement() {
    return html`
      <grampsjs-task
        @task:update-note-text="${this._handleUpdateNoteText}"
        @task:add-note-text="${this._handleAddNoteText}"
        .source="${this._data}"
        .appState="${this.appState}"
        ?edit="${this.edit}"
        ?canEdit="${this.canEdit}"
      ></grampsjs-task>
    `
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

  async _handleUpdateNoteText(event) {
    const data = event.detail
    this.loading = true
    this.error = false
    this._errorMessage = ''
    let shouldRefresh = false

    try {
      const result = await this.appState.apiPut(
        `/api/notes/${data.handle}`,
        data
      )
      if (result && 'error' in result) {
        throw new Error(result.error || 'Failed to update task note')
      }
      shouldRefresh = true
    } catch (error) {
      const message = this._resolveErrorMessage(
        error,
        'Failed to update task note'
      )
      this.error = true
      this._errorMessage = message
      fireEvent(this, 'grampsjs:error', {message})
    } finally {
      if (shouldRefresh) {
        this._updateData(false)
      } else {
        this.loading = false
      }
    }
  }

  async _handleAddNoteText(event) {
    const data = event.detail
    this.loading = true
    this.error = false
    this._errorMessage = ''
    let shouldRefresh = false

    try {
      const result = await this.appState.apiPost('/api/notes/', data)
      if (result && 'error' in result) {
        throw new Error(result.error || 'Failed to add task note')
      }
      if (result && 'data' in result) {
        const [obj] = result.data || []
        if (obj?.handle) {
          this.addHandle(obj.handle, this._data, this._className, 'note_list')
        }
      }
      shouldRefresh = true
    } catch (error) {
      const message = this._resolveErrorMessage(
        error,
        'Failed to add task note'
      )
      this.error = true
      this._errorMessage = message
      fireEvent(this, 'grampsjs:error', {message})
    } finally {
      if (shouldRefresh) {
        this._updateData(false)
      } else {
        this.loading = false
      }
    }
  }

  // no FAB
  // eslint-disable-next-line class-methods-use-this
  renderFab() {
    return ''
  }
}

window.customElements.define('grampsjs-view-task', GrampsjsViewTask)
