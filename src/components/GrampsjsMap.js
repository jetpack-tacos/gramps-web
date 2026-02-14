import {html, LitElement} from 'lit'
import 'maplibre-gl'
import '@openhistoricalmap/maplibre-gl-dates'

import '@material/web/iconbutton/icon-button.js'
import '@material/web/menu/menu'
import '@material/web/menu/menu-item'
import '@material/web/checkbox/checkbox'

import './GrampsjsMapOverlay.js'
import './GrampsjsMapMarker.js'
import './GrampsjsMapLayerSwitcher.js'
import './GrampsjsIcon.js'
import {fireEvent} from '../util.js'
import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'

const defaultStaticRasterStyle = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

const defaultConfig = {
  mapStyle: defaultStaticRasterStyle,
  mapProjection: 'mercator',
  mapEnableGlobeControl: true,
  mapMaxParallelImageRequests: 24,
  mapMaxTileCacheZoomLevels: 8,
  mapFadeDuration: 120,
  mapCancelPendingTileRequestsWhileZooming: false,
  mapEnableDateFiltering: false,
}

const {maplibregl} = window

class GrampsjsMap extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [sharedStyles]
  }

  render() {
    return html`
      <link rel="stylesheet" href="maplibre-gl.css" />
      <div
        class="mapcontainer"
        style="width:${this.width}; height:${this.height};"
      >
        <div id="${this.mapid}" style="z-index: 0; width: 100%; height: 100%;">
          <slot> </slot>
        </div>
        ${this.layerSwitcher ? this._renderLayerSwitcher() : html`<div></div>`}
      </div>
    `
  }

  _renderLayerSwitcher() {
    if (this.overlays.length === 0) {
      return html`<div></div>`
    }
    return html`
      <div class="map-layerswitcher">
        <grampsjs-map-layer-switcher
          .appState="${this.appState}"
          .overlays="${this.overlays}"
          @map:overlay-toggle="${this._handleOverlayToggle}"
        ></grampsjs-map-layer-switcher>
      </div>
    `
  }

  static get properties() {
    return {
      height: {type: String},
      width: {type: String},
      latitude: {type: Number},
      longitude: {type: Number},
      year: {type: Number},
      mapid: {type: String},
      zoom: {type: Number},
      latMin: {type: Number},
      latMax: {type: Number},
      longMin: {type: Number},
      longMax: {type: Number},
      overlays: {type: Array},
      layerSwitcher: {type: Boolean},
      _map: {type: Object},
    }
  }

  constructor() {
    super()
    this.height = '500px'
    this.width = '100%'
    this.zoom = 13
    this.mapid = 'mapid'
    this.latitude = 0
    this.longitude = 0
    this.year = -1
    this.latMin = 0
    this.latMax = 0
    this.longMin = 0
    this.longMax = 0
    this.overlays = []
    this.layerSwitcher = false
    this._mapConfig = {...defaultConfig}
  }

  firstUpdated() {
    const mapel = this.shadowRoot.getElementById(this.mapid)
    this._mapConfig = this._getMapConfig()
    const styleUrl = this._getStyleUrl(this._mapConfig)
    this._configureGlobalMaplibreOptions(this._mapConfig)
    this._map = new maplibregl.Map({
      container: mapel,
      style: styleUrl,
      center: [this.longitude, this.latitude],
      zoom: this.zoom,
      attributionControl: true,
      fadeDuration: this._mapConfig.mapFadeDuration,
      maxTileCacheZoomLevels: this._mapConfig.mapMaxTileCacheZoomLevels,
      cancelPendingTileRequestsWhileZooming:
        this._mapConfig.mapCancelPendingTileRequestsWhileZooming,
    })
    this._map.on('click', e => {
      const mapContainer = this._map.getContainer()

      const customEvent = new CustomEvent('mapclick', {
        detail: e,
        bubbles: true,
        composed: true,
      })

      mapContainer.dispatchEvent(customEvent)
    })
    this._map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    this._addGlobeControl(this._mapConfig)
    // Add geolocate control to the map controller
    this._map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'bottom-right'
    )
    this._map.on('load', () => {
      this._setProjection(this._mapConfig.mapProjection)
      this._applyDateFilter()
      if (this.latMin !== 0 || this.latMax !== 0) {
        this._map.fitBounds([
          [this.longMin, this.latMin],
          [this.longMax, this.latMax],
        ])
      }
      fireEvent(this, 'map:moveend', {bounds: this._map.getBounds()})
    })
    this._map.on('styledata', () => {
      this._applyDateFilter()
    })
    this._map.on('moveend', () => {
      fireEvent(this, 'map:moveend', {bounds: this._map.getBounds()})
    })
  }

  get _slottedChildren() {
    const slot = this.shadowRoot.querySelector('slot')
    return slot.assignedElements({flatten: true})
  }

  panTo(latitude, longitude) {
    if (this._map !== undefined) {
      this._map.panTo([longitude, latitude])
    }
  }

  updated(changed) {
    if (changed.has('year') && this.year > 0 && this._map) {
      this._applyDateFilter()
      return
    }
    if (
      this._map !== undefined &&
      (changed.has('latitude') ||
        changed.has('longitude') ||
        changed.has('mapid') ||
        changed.has('zoom'))
    ) {
      if (this.latMin === 0 && this.latMax === 0) {
        this._map.setZoom(this.zoom)
        this._map.panTo([this.longitude, this.latitude])
      } else {
        this._map.fitBounds([
          [this.longMin, this.latMin],
          [this.longMax, this.latMax],
        ])
      }
    }
  }

  _reAddOverlays() {
    const overlays = this._slottedChildren.filter(
      el => el.tagName === 'GRAMPSJS-MAP-OVERLAY'
    )
    overlays.forEach(overlay => {
      overlay.addOverlay()
    })
  }

  // eslint-disable-next-line class-methods-use-this
  _getMapConfig() {
    return {...defaultConfig, ...window.grampsjsConfig}
  }

  // eslint-disable-next-line class-methods-use-this
  _getStyleUrl(config = this._getMapConfig()) {
    return config.mapStyle || config.mapOhmStyle
  }

  // eslint-disable-next-line class-methods-use-this
  _configureGlobalMaplibreOptions(config) {
    if (
      Number.isFinite(config.mapMaxParallelImageRequests) &&
      typeof maplibregl.setMaxParallelImageRequests === 'function'
    ) {
      maplibregl.setMaxParallelImageRequests(config.mapMaxParallelImageRequests)
    }
  }

  _addGlobeControl(config) {
    if (
      !config.mapEnableGlobeControl ||
      typeof maplibregl.GlobeControl !== 'function'
    ) {
      return
    }
    this._map.addControl(new maplibregl.GlobeControl(), 'bottom-right')
  }

  _setProjection(projection) {
    if (
      !this._map ||
      typeof this._map.setProjection !== 'function' ||
      typeof projection !== 'string'
    ) {
      return
    }
    const type = projection.toLowerCase()
    if (!['globe', 'mercator'].includes(type)) {
      return
    }
    this._map.setProjection({type})
  }

  _getFilterDate() {
    const year = Number(this.year)
    if (!Number.isFinite(year) || year <= 0) {
      return null
    }
    const now = new Date()
    if (year === now.getFullYear()) {
      // Use real "today" for current year so present-day names render on first load.
      return now
    }
    // For past/future years where only a year is selected, use mid-year to avoid edge effects.
    return new Date(Date.UTC(year, 6, 1))
  }

  _applyDateFilter() {
    if (!this._mapConfig?.mapEnableDateFiltering) {
      return
    }
    if (!this._map || typeof this._map.filterByDate !== 'function') {
      return
    }
    const date = this._getFilterDate()
    if (!date) {
      return
    }
    try {
      this._map.filterByDate(date)
    } catch (e) {
      // Ignore errors if filterByDate fails (e.g. style does not support it)
    }
  }
}

window.customElements.define('grampsjs-map', GrampsjsMap)
