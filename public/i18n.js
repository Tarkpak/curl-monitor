// i18n configuration
const i18n = {
  zh: {
    // Page title
    pageTitle: 'Curl 内容监控',
    
    // Buttons
    config: '⚙ 配置',
    addMonitor: '+ 添加监控',
    edit: '编辑',
    pause: '暂停',
    resume: '恢复',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    close: '关闭',
    test: '测试',
    add: '添加',
    back: '←',
    
    // Table headers
    nameUrl: '名称 / URL',
    interval: '间隔',
    status: '状态',
    lastCheck: '最近检查',
    createdAt: '添加时间',
    actions: '操作',
    
    // Status
    normal: '正常',
    changed: '变更',
    error: '错误',
    paused: '已暂停',
    
    // Notify config
    notifyConfig: '通知配置',
    notifyList: '通知列表',
    addNotify: '+ 添加通知',
    notifyName: '名称',
    notifyType: '类型',
    barkServer: 'Bark 服务器',
    barkServerPlaceholder: '如: https://api.day.app',
    deviceKey: '设备 Key',
    deviceKeyPlaceholder: '你的设备 Key',
    pushTitle: '推送标题',
    pushTitlePlaceholder: '支持 {url} 变量',
    pushBody: '推送内容',
    pushBodyPlaceholder: '支持 {url} 变量',
    sound: '声音',
    notifyLevel: '通知等级',
    levelActive: '默认',
    levelTimeSensitive: '时效性',
    levelPassive: '静默',
    group: '分组',
    icon: '图标 URL',
    badge: '角标',
    isArchive: '保存到历史',
    autoCopy: '自动复制',
    call: '持续响铃',
    
    // Add monitor
    addMonitorTitle: '添加监控',
    editMonitorTitle: '编辑监控',
    monitorName: '监控名称',
    monitorNamePlaceholder: '给监控起个名字',
    curlCommand: 'Curl 命令',
    curlPlaceholder: '粘贴从浏览器复制的 curl 命令',
    checkInterval: '检测间隔 (秒)',
    notifyChannels: '通知渠道',
    selectNotify: '请选择通知渠道',
    noNotifyConfig: '请先配置通知',
    mustSelectNotify: '请至少选择一个通知渠道',
    
    // Drawer
    monitorDetail: '监控详情',
    fullUrl: '完整 URL',
    checkHistory: '检测历史',
    detailTitle: '检测详情',
    
    // Request/Response
    request: '请求',
    response: '响应',
    requestHeaders: '请求头',
    requestBody: '请求体',
    responseHeaders: '响应头',
    responseBody: '响应体',
    queryParams: 'Query 参数',
    
    // Diff
    diffTitle: '变更对比',
    diffCount: '共 {count} 处变更:',
    noChange: '无变化',
    added: '+ 新增',
    removed: '- 删除',
    modified: '~ 修改',
    oldValue: '旧值:',
    newValue: '新值:',
    
    // Confirm
    confirmDelete: '确定删除此监控?',
    confirmDeleteNotify: '确定删除此通知配置?',
    
    // Tips
    testSuccess: '测试通知发送成功',
    testFailed: '测试通知发送失败',
    saveFailed: '保存失败',
    loadFailed: '加载失败',
    fillName: '请填写名称',
    fillBarkServer: '请填写服务器地址和设备Key',
    fillUrl: '请填写通知URL',
  },
  
  en: {
    // Page title
    pageTitle: 'Curl Content Monitor',
    
    // Buttons
    config: '⚙ Config',
    addMonitor: '+ Add Monitor',
    edit: 'Edit',
    pause: 'Pause',
    resume: 'Resume',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    test: 'Test',
    add: 'Add',
    back: '←',
    
    // Table headers
    nameUrl: 'Name / URL',
    interval: 'Interval',
    status: 'Status',
    lastCheck: 'Last Check',
    createdAt: 'Created',
    actions: 'Actions',
    
    // Status
    normal: 'Normal',
    changed: 'Changed',
    error: 'Error',
    paused: 'Paused',
    
    // Notify config
    notifyConfig: 'Notification Config',
    notifyList: 'Notifications',
    addNotify: '+ Add Notification',
    notifyName: 'Name',
    notifyType: 'Type',
    barkServer: 'Bark Server',
    barkServerPlaceholder: 'e.g. https://api.day.app',
    deviceKey: 'Device Key',
    deviceKeyPlaceholder: 'Your device key',
    pushTitle: 'Push Title',
    pushTitlePlaceholder: 'Supports {url} variable',
    pushBody: 'Push Body',
    pushBodyPlaceholder: 'Supports {url} variable',
    sound: 'Sound',
    notifyLevel: 'Level',
    levelActive: 'Default',
    levelTimeSensitive: 'Time Sensitive',
    levelPassive: 'Passive',
    group: 'Group',
    icon: 'Icon URL',
    badge: 'Badge',
    isArchive: 'Save to History',
    autoCopy: 'Auto Copy',
    call: 'Continuous Ring',
    
    // Add monitor
    addMonitorTitle: 'Add Monitor',
    editMonitorTitle: 'Edit Monitor',
    monitorName: 'Monitor Name',
    monitorNamePlaceholder: 'Give it a name',
    curlCommand: 'Curl Command',
    curlPlaceholder: 'Paste curl command from browser',
    checkInterval: 'Check Interval (sec)',
    notifyChannels: 'Notify Channels',
    selectNotify: 'Select notification channels',
    noNotifyConfig: 'Please configure notifications first',
    mustSelectNotify: 'Please select at least one notification channel',
    
    // Drawer
    monitorDetail: 'Monitor Detail',
    fullUrl: 'Full URL',
    checkHistory: 'Check History',
    detailTitle: 'Check Detail',
    
    // Request/Response
    request: 'Request',
    response: 'Response',
    requestHeaders: 'Request Headers',
    requestBody: 'Request Body',
    responseHeaders: 'Response Headers',
    responseBody: 'Response Body',
    queryParams: 'Query Params',
    
    // Diff
    diffTitle: 'Changes',
    diffCount: '{count} changes:',
    noChange: 'No changes',
    added: '+ Added',
    removed: '- Removed',
    modified: '~ Modified',
    oldValue: 'Old:',
    newValue: 'New:',
    
    // Confirm
    confirmDelete: 'Delete this monitor?',
    confirmDeleteNotify: 'Delete this notification?',
    
    // Tips
    testSuccess: 'Test notification sent',
    testFailed: 'Test notification failed',
    saveFailed: 'Save failed',
    loadFailed: 'Load failed',
    fillName: 'Please fill in the name',
    fillBarkServer: 'Please fill in server address and device key',
    fillUrl: 'Please fill in notification URL',
  }
};

// Detect browser language
function detectLanguage() {
  const lang = navigator.language || navigator.userLanguage || 'en';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

// Current language
let currentLang = detectLanguage();

// Get translation
function t(key) {
  return i18n[currentLang][key] || i18n['en'][key] || key;
}

// Set language
function setLanguage(lang) {
  currentLang = lang;
  document.dispatchEvent(new CustomEvent('language-changed', { detail: lang }));
}

// Get current language
function getLanguage() {
  return currentLang;
}

// Export
window.i18n = { t, setLanguage, getLanguage, detectLanguage };
