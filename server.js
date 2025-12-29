const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { toJsonString } = require('curlconverter');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'monitors.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const monitors = new Map();

// 默认配置
let config = {
  notifyUrls: [
    { 
      id: '1', 
      name: '默认通知', 
      type: 'bark',
      server: 'https://api.day.app',
      key: 'MEpXBFEed5N5qDu2UHJdWY',
      title: '内容变更通知',
      body: '监控检测到内容变化',
      // Bark 配置
      sound: 'default',
      level: 'active',  // active, timeSensitive, passive
      group: '',
      icon: '',
      badge: '',
      isArchive: true,
      autoCopy: false,
      call: false
    }
  ]
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig();
    return;
  }
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    console.log(`已加载 ${config.notifyUrls.length} 个通知配置`);
  } catch (err) {
    console.error('加载配置失败:', err.message);
  }
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function saveData() {
  const data = Array.from(monitors.values()).map(m => ({
    id: m.id, name: m.name || '', curlCommand: m.curlCommand, interval: m.interval, 
    status: m.status, lastResponse: m.lastResponse, notifyIds: m.notifyIds || [],
    createdAt: m.createdAt || Date.now(),
    history: m.history.map(h => ({
      id: h.id, time: h.time, changed: h.changed, error: h.error,
      response: h.response, previousBody: h.previousBody || null
    }))
  }));
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return;
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    data.forEach(m => {
      const monitor = { ...m, timer: null };
      monitors.set(m.id, monitor);
      if (monitor.status === 'running') {
        startMonitor(monitor);
      }
    });
    console.log(`已加载 ${data.length} 个监控任务`);
  } catch (err) {
    console.error('加载数据失败:', err.message);
  }
}

function parseCurl(curlCommand) {
  try {
    const json = JSON.parse(toJsonString(curlCommand));
    return {
      url: json.url,
      method: json.method || 'GET',
      headers: json.headers || {},
      body: json.data ? (typeof json.data === 'string' ? json.data : JSON.stringify(json.data)) : null
    };
  } catch (err) {
    throw new Error('curl 命令解析失败: ' + err.message);
  }
}

async function executeRequest(curlCommand) {
  const parsed = parseCurl(curlCommand);
  if (!parsed.url) throw new Error('无法解析 URL');
  
  const options = { method: parsed.method, headers: parsed.headers };
  if (parsed.body) options.body = parsed.body;
  
  const startTime = Date.now();
  const response = await fetch(parsed.url, options);
  const responseTime = Date.now() - startTime;
  const text = await response.text();
  
  return { 
    request: parsed,
    status: response.status, 
    statusText: response.statusText, 
    headers: Object.fromEntries(response.headers), 
    body: text, 
    responseTime 
  };
}

async function sendNotification(notifyIds = [], monitorInfo = {}) {
  const urlsToNotify = notifyIds.length > 0 
    ? config.notifyUrls.filter(n => notifyIds.includes(n.id))
    : config.notifyUrls;
  
  for (const notify of urlsToNotify) {
    try {
      if (notify.type === 'bark') {
        // Bark 推送 - 使用配置的标题和内容，支持变量替换
        const title = (notify.title || '内容变更通知')
          .replace('{url}', monitorInfo.url || '');
        const body = (notify.body || '监控检测到内容变化')
          .replace('{url}', monitorInfo.url || '');
        
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('body', body);
        if (notify.sound) params.append('sound', notify.sound);
        if (notify.level) params.append('level', notify.level);
        if (notify.group) params.append('group', notify.group);
        if (notify.icon) params.append('icon', notify.icon);
        if (notify.badge) params.append('badge', notify.badge);
        if (notify.isArchive) params.append('isArchive', '1');
        if (notify.autoCopy) params.append('autoCopy', '1');
        if (notify.call) params.append('call', '1');
        if (monitorInfo.url) params.append('url', monitorInfo.url);
        
        const server = notify.server.replace(/\/$/, '');
        await fetch(`${server}/${notify.key}?${params.toString()}`);
      } else {
        // 普通 URL 推送
        await fetch(notify.url);
      }
      console.log(`通知已发送: ${notify.name}`);
    } catch (err) {
      console.error(`发送通知失败 [${notify.name}]:`, err.message);
    }
  }
}

function formatTime(date) {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function startMonitor(monitor) {
  const check = async () => {
    const record = { id: Date.now(), time: formatTime(new Date()), changed: false, error: null, response: null, previousBody: null };
    let monitorUrl = '';
    try {
      const parsed = parseCurl(monitor.curlCommand);
      monitorUrl = parsed.url;
    } catch {}
    
    try {
      const result = await executeRequest(monitor.curlCommand);
      record.response = result;
      
      if (monitor.lastResponse !== null && monitor.lastResponse !== result.body) {
        record.changed = true;
        record.previousBody = monitor.lastResponse;
        console.log(`[${monitor.id}] 内容变更检测到!`);
        await sendNotification(monitor.notifyIds, {
          title: '内容变更通知',
          body: `监控检测到内容变化`,
          url: monitorUrl
        });
      }
      monitor.lastResponse = result.body;
      console.log(`[${monitor.id}] 检查完成 - ${record.time}`);
    } catch (err) {
      record.error = err.message;
      console.error(`[${monitor.id}] 执行失败:`, err.message);
    }
    monitor.history.unshift(record);
    // 只保留最近两天的数据
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    monitor.history = monitor.history.filter(h => h.id > twoDaysAgo);
    saveData();
  };

  check();
  monitor.timer = setInterval(check, monitor.interval);
}

function createMonitor(id, curlCommand, interval = 60000, notifyIds = [], name = '') {
  const monitor = { 
    id, 
    name: name || '', 
    curlCommand, 
    interval, 
    lastResponse: null, 
    timer: null, 
    status: 'running', 
    history: [], 
    notifyIds,
    createdAt: Date.now()
  };
  monitors.set(id, monitor);
  startMonitor(monitor);
  saveData();
  return monitor;
}

app.post('/add', (req, res) => {
  const { curl, interval, notifyIds, name } = req.body;
  if (!curl) return res.status(400).send('请提供 curl 命令');
  try {
    parseCurl(curl.trim());
    // 处理逗号分隔的字符串或数组
    let ids = [];
    if (typeof notifyIds === 'string' && notifyIds) {
      ids = notifyIds.split(',').filter(id => id.trim());
    } else if (Array.isArray(notifyIds)) {
      ids = notifyIds;
    }
    createMonitor(Date.now().toString(), curl.trim(), (parseInt(interval) || 60) * 1000, ids, name || '');
    res.redirect('/');
  } catch (err) {
    res.status(400).send('curl 命令解析失败: ' + err.message);
  }
});

app.get('/list', (req, res) => {
  const list = Array.from(monitors.values())
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(m => {
      let url = '-', method = 'GET';
      try { 
        const parsed = parseCurl(m.curlCommand);
        url = parsed.url;
        method = parsed.method;
      } catch {}
      return { 
        id: m.id, 
        name: m.name || '', 
        url, 
        method, 
        interval: m.interval, 
        status: m.status, 
        history: m.history, 
        notifyIds: m.notifyIds || [],
        createdAt: m.createdAt || 0
      };
    });
  res.json(list);
});

// 配置相关接口
app.get('/config', (req, res) => {
  res.json(config);
});

app.post('/config/notify', (req, res) => {
  const { name, type, server, key, url, title, body, sound, level, group, icon, badge, isArchive, autoCopy, call } = req.body;
  if (!name) return res.status(400).json({ error: '请提供名称' });
  if (type === 'bark' && (!server || !key)) return res.status(400).json({ error: '请提供服务器地址和Key' });
  if (type === 'url' && !url) return res.status(400).json({ error: '请提供URL' });
  
  const id = Date.now().toString();
  const notify = { 
    id, name,
    type: type || 'bark',
    server: server || '',
    key: key || '',
    url: url || '',
    title: title || '内容变更通知',
    body: body || '监控检测到内容变化',
    sound: sound || 'default',
    level: level || 'active',
    group: group || '',
    icon: icon || '',
    badge: badge || '',
    isArchive: isArchive !== false,
    autoCopy: autoCopy === true,
    call: call === true
  };
  config.notifyUrls.push(notify);
  saveConfig();
  res.json({ success: true, id });
});

app.put('/config/notify/:id', (req, res) => {
  const idx = config.notifyUrls.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '未找到' });
  const { name, type, server, key, url, title, body, sound, level, group, icon, badge, isArchive, autoCopy, call } = req.body;
  const old = config.notifyUrls[idx];
  config.notifyUrls[idx] = {
    ...old,
    name: name || old.name,
    type: type || old.type,
    server: server !== undefined ? server : old.server,
    key: key !== undefined ? key : old.key,
    url: url !== undefined ? url : old.url,
    title: title !== undefined ? title : old.title,
    body: body !== undefined ? body : old.body,
    sound: sound !== undefined ? sound : old.sound,
    level: level || old.level,
    group: group !== undefined ? group : old.group,
    icon: icon !== undefined ? icon : old.icon,
    badge: badge !== undefined ? badge : old.badge,
    isArchive: isArchive !== undefined ? isArchive : old.isArchive,
    autoCopy: autoCopy !== undefined ? autoCopy : old.autoCopy,
    call: call !== undefined ? call : old.call
  };
  saveConfig();
  res.json({ success: true });
});

app.delete('/config/notify/:id', (req, res) => {
  config.notifyUrls = config.notifyUrls.filter(n => n.id !== req.params.id);
  saveConfig();
  res.json({ success: true });
});

app.post('/config/notify/:id/test', async (req, res) => {
  const notify = config.notifyUrls.find(n => n.id === req.params.id);
  if (!notify) return res.status(404).json({ error: '未找到' });
  try {
    await sendNotification([notify.id], { title: '测试通知', body: '这是一条测试消息', url: '' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/delete/:id', (req, res) => {
  const monitor = monitors.get(req.params.id);
  if (monitor) { clearInterval(monitor.timer); monitors.delete(req.params.id); saveData(); }
  res.redirect('/');
});

app.get('/monitor/:id', (req, res) => {
  const monitor = monitors.get(req.params.id);
  if (!monitor) return res.status(404).json({ error: '未找到' });
  res.json({
    id: monitor.id,
    name: monitor.name || '',
    curlCommand: monitor.curlCommand,
    interval: monitor.interval,
    notifyIds: monitor.notifyIds || []
  });
});

app.put('/monitor/:id', (req, res) => {
  const monitor = monitors.get(req.params.id);
  if (!monitor) return res.status(404).json({ error: '未找到' });
  
  const { curl, interval, notifyIds, name } = req.body;
  if (name !== undefined) monitor.name = name;
  if (curl) {
    try {
      parseCurl(curl.trim());
      monitor.curlCommand = curl.trim();
    } catch (err) {
      return res.status(400).json({ error: 'curl 命令解析失败: ' + err.message });
    }
  }
  if (interval) monitor.interval = (parseInt(interval) || 60) * 1000;
  if (notifyIds !== undefined) {
    monitor.notifyIds = typeof notifyIds === 'string' ? notifyIds.split(',').filter(id => id.trim()) : notifyIds;
  }
  
  // 重启定时器
  if (monitor.status === 'running') {
    clearInterval(monitor.timer);
    monitor.timer = setInterval(async () => {
      const record = { id: Date.now(), time: formatTime(new Date()), changed: false, error: null, response: null, previousBody: null };
      let monitorUrl = '';
      try { monitorUrl = parseCurl(monitor.curlCommand).url; } catch {}
      try {
        const result = await executeRequest(monitor.curlCommand);
        record.response = result;
        if (monitor.lastResponse !== null && monitor.lastResponse !== result.body) {
          record.changed = true;
          record.previousBody = monitor.lastResponse;
          await sendNotification(monitor.notifyIds, { title: '内容变更通知', body: '监控检测到内容变化', url: monitorUrl });
        }
        monitor.lastResponse = result.body;
      } catch (err) {
        record.error = err.message;
      }
      monitor.history.unshift(record);
      // 只保留最近两天的数据
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      monitor.history = monitor.history.filter(h => h.id > twoDaysAgo);
      saveData();
    }, monitor.interval);
  }
  
  saveData();
  res.json({ success: true });
});

app.post('/pause/:id', (req, res) => {
  const monitor = monitors.get(req.params.id);
  if (!monitor) return res.status(404).json({ error: '未找到' });
  if (monitor.status === 'running') {
    clearInterval(monitor.timer);
    monitor.timer = null;
    monitor.status = 'paused';
    saveData();
  }
  res.json({ success: true, status: monitor.status });
});

app.post('/resume/:id', (req, res) => {
  const monitor = monitors.get(req.params.id);
  if (!monitor) return res.status(404).json({ error: '未找到' });
  if (monitor.status === 'paused') {
    monitor.status = 'running';
    startMonitor(monitor);
    saveData();
  }
  res.json({ success: true, status: monitor.status });
});

const PORT = process.env.PORT || 4000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`服务运行在 http://localhost:${port}`);
    loadConfig();
    loadData();
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已被占用，尝试 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('启动失败:', err.message);
    }
  });
}

startServer(PORT);
