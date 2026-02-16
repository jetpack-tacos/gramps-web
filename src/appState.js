import {
  getSettings,
  getPermissions,
  apiGetNew,
  Auth,
  apiPutPostDeleteNew,
  updateSettings,
} from './api.js'
import {getCurrentTheme} from './theme.js'

export function getInitialAppState() {
  const auth = new Auth()
  return {
    auth,
    screenSize: 'small',
    progress: false,
    settings: getSettings(),
    dbInfo: {},
    frontendConfig: window.grampsjsConfig,
    permissions: {
      canAdd: false,
      canEdit: false,
      canViewPrivate: false,
      canManageUsers: false,
      canUseChat: false,
      canUpgradeTree: false,
    },
    i18n: {
      strings: {},
      lang: '',
    },
    path: {
      page: 'home',
      pageId: '',
      pageId2: '',
    },
    apiGet: endpoint => apiGetNew(auth, endpoint),
    apiPost: (endpoint, payload, options = {}) =>
      apiPutPostDeleteNew(auth, 'POST', endpoint, payload, options),
    apiPut: (endpoint, payload, options = {}) =>
      apiPutPostDeleteNew(auth, 'PUT', endpoint, payload, options),
    apiDelete: (endpoint, options = {}) =>
      apiPutPostDeleteNew(auth, 'DELETE', endpoint, {}, options),
    refreshTokenIfNeeded: (force = false) => auth.getValidAccessToken(force),
    signout: () => auth.signout(),
    updateSettings: (settings = {}, tree = false) =>
      updateSettings(settings, tree),
    getCurrentTheme: () => getCurrentTheme(getSettings().theme),
  }
}

export function appStateUpdatePermissions(appState) {
  const rawPermissions = getPermissions()
  const permissionsList = Array.isArray(rawPermissions) ? rawPermissions : []
  const permissions = {
    canAdd: permissionsList.includes('AddObject'),
    canEdit: permissionsList.includes('EditObject'),
    canViewPrivate: permissionsList.includes('ViewPrivate'),
    canManageUsers: permissionsList.includes('EditOtherUser'),
    canUseChat: permissionsList.includes('UseChat'),
    canUpgradeTree: permissionsList.includes('UpgradeSchema'),
  }
  return {...appState, permissions}
}
