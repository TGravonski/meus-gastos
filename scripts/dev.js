const { spawn } = require('node:child_process');
const { networkInterfaces } = require('node:os');

const interfaces = networkInterfaces();
const addresses = Object.values(interfaces)
  .flat()
  .filter((item) => item && item.family === 'IPv4' && !item.internal)
  .map((item) => item.address);

console.log('\nEndereços para testar na rede local:');
if (addresses.length) addresses.forEach((ip) => console.log(`  http://${ip}:3000`));
else console.log('  Não foi possível detectar um IPv4. Consulte ipconfig.');
console.log('');

const command = process.platform === 'win32' ? 'cmd' : 'npm';
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'next dev --hostname 0.0.0.0 --port 3000']
  : ['exec', 'next', 'dev', '--', '--hostname', '0.0.0.0', '--port', '3000'];
const server = spawn(command, args, { stdio: 'inherit', env: process.env });
server.on('exit', (code) => process.exit(code ?? 0));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
