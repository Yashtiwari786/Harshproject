const net = require('net');

const client = new net.Socket();
client.setTimeout(1500);

client.connect(27017, '127.0.0.1', () => {
  console.log('Local MongoDB running on 127.0.0.1:27017: YES');
  client.destroy();
});

client.on('error', () => {
  console.log('Local MongoDB running on 127.0.0.1:27017: NO');
});

client.on('timeout', () => {
  console.log('Local MongoDB running on 127.0.0.1:27017: NO');
  client.destroy();
});
