const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.cluster0.gy30quf.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS SRV lookup failed:', err);
  } else {
    console.log('DNS SRV addresses found:', addresses);
  }
});
