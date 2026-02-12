import {css, html} from 'lit'
import {GrampsjsView} from './GrampsjsView.js'
import {GrampsjsStaleDataMixin} from '../mixins/GrampsjsStaleDataMixin.js'
import '../components/GrampsjsDataQualityCard.js'

const DEFAULT_PAGE_SIZE = 1

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
      `,
    ]
  }

  static get properties() {
    return {
      _categories: {type: Array},
      _activeCategoryKey: {type: String},
    }
  }

  constructor() {
    super()
    this._categories = categories.map(category => ({...category, count: 0}))
    this._activeCategoryKey = this._categories[0].key
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
    `
  }

  firstUpdated() {
    super.firstUpdated()
    if (this.appState.i18n.lang) {
      this._fetchCategoryCounts()
    }
  }

  update(changed) {
    super.update(changed)
    if (changed.has('active') && this.active && !this.loading) {
      this._fetchCategoryCounts()
    }
    if (
      changed.has('appState') &&
      changed.get('appState')?.i18n?.lang !== this.appState.i18n.lang &&
      this.active
    ) {
      this._fetchCategoryCounts()
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
    )}&page=1&pagesize=${DEFAULT_PAGE_SIZE}&profile=self&locale=${
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
    this._activeCategoryKey = key
  }

  handleUpdateStaleData() {
    this._fetchCategoryCounts()
  }
}

window.customElements.define(
  'grampsjs-view-data-quality',
  GrampsjsViewDataQuality
)
