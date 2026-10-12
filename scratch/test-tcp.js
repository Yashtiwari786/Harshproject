const net = require('net');

const client = new net.Socket();
client.setTimeout(5000);

console.log('Testing TCP connection to ac-lef6obn-shard-00-00.gy30quf.mongodb.net:27017...');

client.connect(27017, 'ac-lef6obn-shard-00-00.gy30quf.mongodb.net', () => {
  console.log('✅ TCP handshake SUCCESS! Port 27017 is reachable from this machine.');
  client.destroy();
});

client.on('error', (err) => {
  console.log('❌ TCP Connection failed:', err.message);
});

client.on('timeout', () => {
  console.log('❌ TCP Connection timed out (Firewall or IP Blocked by Atlas)');
  client.destroy();
});
