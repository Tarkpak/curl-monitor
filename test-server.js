const http = require('http');

let counter = 0;

const server = http.createServer((req, res) => {
  counter++;
  
  const data = {
    count: counter,
    timestamp: new Date().toISOString(),
    message: counter % 2 === 0 ? '偶数请求' : '奇数请求',
    items: [
      { id: 1, name: '项目A', status: counter % 3 === 0 ? 'done' : 'pending' },
      { id: 2, name: '项目B', value: counter * 10 }
    ]
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
  
  console.log(`[${counter}] 返回数据:`, JSON.stringify(data));
});

server.listen(4001, () => {
  console.log('测试服务运行在 http://localhost:4001');
  console.log('每次请求返回不同内容，用于测试变更检测');
});
