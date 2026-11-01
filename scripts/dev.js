const { spawn } = require('node:child_process');
const { networkInterfaces } = require('node:os');
const { createInterface } = require('node:readline');

const interfaces = networkInterfaces();
const addresses = Object.values(interfaces)
  .flat()
  .filter((item) => item && item.family === 'IPv4' && !item.internal)
  .map((item) => item.address);

console.log('\nEndereços para acessar o app:');
console.log('  Local:   http://localhost:3000');
if (addresses.length) addresses.forEach((ip) => console.log(`  Network: http://${ip}:3000`));
else console.log('  Network: não foi possível detectar um IPv4. Consulte ipconfig.');
console.log('');

const command = process.platform === 'win32' ? 'cmd' : 'npm';
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'next dev --hostname 0.0.0.0 --port 3000']
  : ['exec', 'next', 'dev', '--', '--hostname', '0.0.0.0', '--port', '3000'];
const server = spawn(command, args, { stdio: ['inherit', 'pipe', 'inherit'], env: process.env });
createInterface({ input: server.stdout }).on('line', (line) => {
  const networkLine = line.match(/^(\s*- Network:\s+)http:\/\/0\.0\.0\.0(?=[:/])/);
  process.stdout.write(networkLine && addresses.length
    ? line.replace('http://0.0.0.0', `http://${addresses[0]}`) + '\n'
    : line + '\n');
});
server.on('exit', (code) => process.exit(code ?? 0));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
