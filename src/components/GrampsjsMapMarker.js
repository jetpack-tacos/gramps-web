import {html, LitElement} from 'lit'
import {mdiMapMarker} from '@mdi/js'

const {maplibregl} = window
const stripHtml = value => {
  if (!value) {
    return ''
  }
  const el = document.createElement('div')
  el.innerHTML = value
  return (el.textContent || el.innerText || '').trim()
}

class GrampsjsMapMarker extends LitElement {
  render() {
    return html`` // No need for leaflet.css
  }

  static get properties() {
    return {
      latitude: {type: Number},
      longitude: {type: Number},
      popupLabel: {type: String},
      tooltipLabel: {type: String},
      markerId: {type: String},
      opacity: {type: Number},
      size: {type: Number},
      _marker: {type: Object, attribute: false},
      _map: {type: Object, attribute: false},
      _markerElement: {type: Object, attribute: false},
    }
  }

  constructor() {
    super()
    this.popupLabel = ''
    this.tooltipLabel = ''
    this.markerId = ''
    this.opacity = 1
    this.size = 32
    this._markerElement = null
    this._boundClickHandler = this.clickHandler.bind(this)
  }

  updated(changed) {
    super.updated(changed)
    if (!this._marker) {
      return
    }
    if (changed.has('latitude') || changed.has('longitude')) {
      this._marker.setLngLat([this.longitude, this.latitude])
    }
    if (changed.has('opacity') || changed.has('size')) {
      this._updateMarkerElement()
    }
    if (changed.has('popupLabel') || changed.has('tooltipLabel')) {
      this._updatePopup()
    }
  }

  firstUpdated() {
    // Find the maplibre-gl map instance from the parent
    this._map = this.parentElement._map
    this.addMarker()
  }

  addMarker() {
    if (!this._map || this._marker) return
    this._markerElement = document.createElement('div')
    this._markerElement.style.cursor = 'pointer'
    this._markerElement.addEventListener('click', this._boundClickHandler)
    this._updateMarkerElement()
    this._marker = new maplibregl.Marker({element: this._markerElement})
      .setLngLat([this.longitude, this.latitude])
      .addTo(this._map)
    this._updatePopup()
  }

  clickHandler() {
    this.dispatchEvent(
      new CustomEvent('marker:clicked', {
        bubbles: true,
        composed: true,
        detail: {
          latitude: this.latitude,
          longitude: this.longitude,
          markerId: this.markerId,
        },
      })
    )
  }

  disconnectedCallback() {
    if (this._marker) {
      this._marker.remove()
      this._marker = null
    }
    if (this._markerElement) {
      this._markerElement.removeEventListener('click', this._boundClickHandler)
      this._markerElement = null
    }
    super.disconnectedCallback()
  }

  _updateMarkerElement() {
    if (!this._markerElement) {
      return
    }
    const size = Number(this.size) || 32
    const color =
      getComputedStyle(this)
        .getPropertyValue('--grampsjs-map-marker-color')
        .trim() || '#EA4335'
    this._markerElement.style.width = `${size}px`
    this._markerElement.style.height = `${size}px`
    this._markerElement.style.opacity = `${this.opacity}`
    this._markerElement.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${mdiMapMarker}" fill="${color}" />
      </svg>
    `
  }

  _updatePopup() {
    if (!this._markerElement) {
      return
    }
    const tooltip = this.tooltipLabel || stripHtml(this.popupLabel)
    if (tooltip) {
      this._markerElement.title = tooltip
    } else {
      this._markerElement.removeAttribute('title')
    }
    if (!this._marker || !this.popupLabel) {
      return
    }
    const popup = this._marker.getPopup()
    if (popup) {
      popup.setHTML(this.popupLabel)
      return
    }
    this._marker.setPopup(
      new maplibregl.Popup({offset: 25}).setHTML(this.popupLabel)
    )
  }
}

window.customElements.define('grampsjs-map-marker', GrampsjsMapMarker)
