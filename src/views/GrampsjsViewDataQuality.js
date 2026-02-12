import {css, html} from 'lit'
import {GrampsjsView} from './GrampsjsView.js'
import {GrampsjsStaleDataMixin} from '../mixins/GrampsjsStaleDataMixin.js'
import {fireEvent} from '../util.js'
import '../components/GrampsjsDataQualityCard.js'
import '../components/GrampsjsPagination.js'
import '@material/mwc-button'

const BASE_DIR = ''
const COUNT_PAGE_SIZE = 1
const RECORDS_PAGE_SIZE = 20

function parseTotalCount(result) {
  const parsedCount = Number.parseInt(result.total_count, 10)
  if (!Number.isNaN(parsedCount)) {
    return parsedCount
  }
  if (Array.isArray(result.data)) {
    return result.data.length
  }
  return 0
}

const categories = [
  {
    key: 'unknown-gender',
    title: 'Unknown Gender',
    icon: 'transgender',
    filterRule: 'HasUnknownGender',
    values: [],
  },
  {
    key: 'no-birth',
    title: 'No Birth',
    icon: 'cake',
    filterRule: 'NoBirthdate',
    values: [],
  },
  {
    key: 'no-death',
    title: 'No Death',
    icon: 'deceased',
    filterRule: 'NoDeathdate',
    values: [],
  },
  {
    key: 'missing-parents',
    title: 'Missing Parents',
    icon: 'family_restroom',
    filterRule: 'MissingParent',
    values: [],
  },
  {
    key: 'disconnected',
    title: 'Disconnected',
    icon: 'device_hub',
    filterRule: 'Disconnected',
    values: [],
  },
  {
    key: 'incomplete-names',
    title: 'Incomplete Names',
    icon: 'badge',
    filterRule: 'IncompleteNames',
    values: [],
  },
  {
    key: 'incomplete-events',
    title: 'Incomplete Events',
    icon: 'event_busy',
    filterRule: 'PersonWithIncompleteEvent',
    values: [],
  },
  {
    key: 'no-marriage',
    title: 'No Marriage Records',
    icon: 'heart_broken',
    filterRule: 'NeverMarried',
    values: [],
  },
  {
    key: 'no-sources',
    title: 'No Sources',
    icon: 'menu_book',
    filterRule: 'HasSourceCount',
    values: ['0'],
  },
]

export class GrampsjsViewDataQuality extends GrampsjsStaleDataMixin(
  GrampsjsView
) {
  static get styles() {
    return [
      super.styles,
      css`
        .dq-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }

        .dq-active-category {
          color: var(--grampsjs-color-icon-selected);
          font-weight: 500;
        }

        .dq-records {
          border: 1px solid
            var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.12));
          border-radius: 8px;
          padding: 12px;
          background-color: var(--md-sys-color-surface);
        }

        .dq-record-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .dq-record {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid
            var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.08));
        }

        .dq-record:last-child {
          border-bottom: none;
        }

        .dq-record-person {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
        }

        .dq-record-name {
          background: none;
          border: none;
          color: var(--mdc-theme-primary);
          cursor: pointer;
          font: inherit;
          padding: 0;
          text-align: left;
          text-decoration: underline;
        }

        .dq-record-name:hover {
          opacity: 0.8;
        }

        .dq-record-id {
          color: var(--grampsjs-body-font-color-60);
          font-size: 0.9rem;
        }

        .dq-gender-symbol {
          color: var(--grampsjs-body-font-color-60);
          width: 1rem;
        }

        .dq-row-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .dq-empty-state {
          margin: 0;
          color: var(--grampsjs-body-font-color-60);
        }
      `,
    ]
  }

  static get properties() {
    return {
      _categories: {type: Array},
      _activeCategoryKey: {type: String},
      _records: {type: Array},
      _recordsLoading: {type: Boolean},
      _recordsPage: {type: Number},
      _recordsPages: {type: Number},
      _recordsTotalCount: {type: Number},
      _pendingGenderHandle: {type: String},
    }
  }

  constructor() {
    super()
    this._categories = categories.map(category => ({...category, count: 0}))
    this._activeCategoryKey = this._categories[0].key
    this._records = []
    this._recordsLoading = false
    this._recordsPage = 1
    this._recordsPages = 0
    this._recordsTotalCount = 0
    this._pendingGenderHandle = ''
  }

  renderContent() {
    const activeCategory = this._categories.find(
      category => category.key === this._activeCategoryKey
    )
    return html`
      <h2>${this._('Data Quality')}</h2>
      <div class="dq-cards">
        ${this._categories.map(
          category => html`
            <grampsjs-data-quality-card
              .title=${this._(category.title)}
              .icon=${category.icon}
              .count=${category.count}
              ?selected=${this._activeCategoryKey === category.key}
              @dq:select=${() => this._handleSelectCategory(category.key)}
            ></grampsjs-data-quality-card>
          `
        )}
      </div>
      <p>
        ${this._('Selected category')}:
        <span class="dq-active-category"
          >${this._(activeCategory?.title || '')}</span
        >
      </p>
      <div class="dq-records">
        <p>${this._('Records')}: ${this._recordsTotalCount}</p>
        ${this._renderRecordList(activeCategory)}
        ${this._recordsPages > 1
          ? html`
              <grampsjs-pagination
                page="${this._recordsPage}"
                pages="${this._recordsPages}"
                .appState="${this.appState}"
                @page:changed="${this._handlePageChanged}"
              ></grampsjs-pagination>
            `
          : ''}
      </div>
    `
  }

  _renderRecordList(activeCategory) {
    if (this._recordsLoading) {
      return html`<p class="dq-empty-state">${this._('Loading...')}</p>`
    }
    if (this._records.length === 0) {
      return html`<p class="dq-empty-state">${this._('None')}</p>`
    }
    return html`
      <ul class="dq-record-list">
        ${this._records.map(record =>
          this._renderRecordRow(record, activeCategory)
        )}
      </ul>
    `
  }

  _renderRecordRow(record, activeCategory) {
    const isUnknownGender = activeCategory?.key === 'unknown-gender'
    const canEditGender = this.appState.permissions?.canEdit
    const isPending = this._pendingGenderHandle === record.handle
    return html`
      <li class="dq-record">
        <div class="dq-record-person">
          <span class="dq-gender-symbol"
            >${this._getGenderSymbol(record.gender)}</span
          >
          <button
            class="dq-record-name"
            @click=${() => this._navigateToPerson(record)}
          >
            ${this._personDisplayName(record)}
          </button>
          <span class="dq-record-id">${record.gramps_id || ''}</span>
        </div>
        ${isUnknownGender && canEditGender
          ? html`
              <div class="dq-row-actions">
                <mwc-button
                  dense
                  outlined
                  ?disabled=${isPending}
                  @click=${() => this._updateGender(record, 0)}
                  >${this._('Set female')}</mwc-button
                >
                <mwc-button
                  dense
                  outlined
                  ?disabled=${isPending}
                  @click=${() => this._updateGender(record, 1)}
                  >${this._('Set male')}</mwc-button
                >
              </div>
            `
          : ''}
      </li>
    `
  }

  firstUpdated() {
    super.firstUpdated()
    if (this.appState.i18n.lang) {
      this._fetchCategoryCounts()
      this._fetchActiveCategoryRecords()
    }
  }

  update(changed) {
    super.update(changed)
    if (changed.has('active') && this.active && !this.loading) {
      this._fetchCategoryCounts()
      this._fetchActiveCategoryRecords()
    }
    if (
      changed.has('appState') &&
      changed.get('appState')?.i18n?.lang !== this.appState.i18n.lang &&
      this.active
    ) {
      this._fetchCategoryCounts()
      this._fetchActiveCategoryRecords()
    }
  }

  async _fetchCategoryCounts() {
    this.loading = true
    const countedCategories = await Promise.all(
      this._categories.map(async category => ({
        ...category,
        count: await this._fetchCategoryCount(category),
      }))
    )
    this._categories = countedCategories
    this.loading = false
  }

  async _fetchCategoryCount(category) {
    const rules = {
      rules: [{name: category.filterRule, values: category.values}],
    }
    const uri = `/api/people/?rules=${encodeURIComponent(
      JSON.stringify(rules)
    )}&page=1&pagesize=${COUNT_PAGE_SIZE}&profile=self&locale=${
      this.appState.i18n.lang || 'en'
    }`
    const result = await this.appState.apiGet(uri)
    if ('error' in result) {
      return -1
    }
    const parsedCount = Number.parseInt(result.total_count, 10)
    if (!Number.isNaN(parsedCount)) {
      return parsedCount
    }
    if (Array.isArray(result.data)) {
      return result.data.length
    }
    return 0
  }

  _handleSelectCategory(key) {
    this._recordsPage = 1
    this._activeCategoryKey = key
    this._fetchActiveCategoryRecords(1)
  }

  _handlePageChanged(event) {
    this._fetchActiveCategoryRecords(event.detail.page)
  }

  _fetchActiveCategoryRecords(page = 1) {
    const category = this._categories.find(
      currentCategory => currentCategory.key === this._activeCategoryKey
    )
    if (!category) {
      return
    }
    this._fetchCategoryRecords(category, page)
  }

  async _fetchCategoryRecords(category, page = 1) {
    this._recordsLoading = true
    const rules = {
      rules: [{name: category.filterRule, values: category.values}],
    }
    const uri = `/api/people/?rules=${encodeURIComponent(
      JSON.stringify(rules)
    )}&page=${page}&pagesize=${RECORDS_PAGE_SIZE}&profile=self&locale=${
      this.appState.i18n.lang || 'en'
    }`
    const result = await this.appState.apiGet(uri)
    this._recordsLoading = false
    if ('error' in result) {
      this.error = true
      this._errorMessage = result.error
      this._records = []
      this._recordsTotalCount = 0
      this._recordsPages = 0
      return
    }
    this.error = false
    this._errorMessage = ''
    this._records = Array.isArray(result.data) ? result.data : []
    this._recordsPage = page
    this._recordsTotalCount = parseTotalCount(result)
    this._recordsPages = Math.ceil(this._recordsTotalCount / RECORDS_PAGE_SIZE)
  }

  async _updateGender(person, newGender) {
    this._pendingGenderHandle = person.handle
    const personResult = await this.appState.apiGet(
      `/api/people/${person.handle}`
    )
    if ('error' in personResult) {
      this._pendingGenderHandle = ''
      fireEvent(this, 'grampsjs:error', {message: personResult.error})
      return
    }
    const cleanPerson = {...personResult.data}
    delete cleanPerson.extended
    delete cleanPerson.profile
    delete cleanPerson.backlinks
    delete cleanPerson.formatted
    const updatedPerson = {_class: 'Person', ...cleanPerson, gender: newGender}
    const updateResult = await this.appState.apiPut(
      `/api/people/${person.handle}`,
      updatedPerson
    )
    this._pendingGenderHandle = ''
    if ('error' in updateResult) {
      fireEvent(this, 'grampsjs:error', {message: updateResult.error})
      return
    }
    fireEvent(this, 'grampsjs:notification', {
      message: this._('Gender updated for %s', this._personDisplayName(person)),
    })
    await this._fetchCategoryCounts()
    await this._fetchActiveCategoryRecords(this._recordsPage)
  }

  // eslint-disable-next-line class-methods-use-this
  _getGenderSymbol(gender) {
    return {0: '♀', 1: '♂', 2: '?'}[gender] || '?'
  }

  // eslint-disable-next-line class-methods-use-this
  _personDisplayName(person) {
    const given = person?.profile?.name_given || ''
    const surname = person?.profile?.name_surname || ''
    const name = `${given} ${surname}`.trim()
    return name || person?.gramps_id || '...'
  }

  _navigateToPerson(record) {
    if (record?.gramps_id) {
      fireEvent(this, 'nav', {path: `person/${record.gramps_id}`})
      return
    }
    if (record?.handle) {
      window.location.href = `${BASE_DIR}/person/${record.handle}`
    }
  }

  handleUpdateStaleData() {
    this._fetchCategoryCounts()
    this._fetchActiveCategoryRecords(this._recordsPage)
  }
}

window.customElements.define(
  'grampsjs-view-data-quality',
  GrampsjsViewDataQuality
)
