const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: 'kreato-droid' }];
const pems = selfsigned.generate(attrs, { days: 365 });

fs.writeFileSync('key.pem', pems.private);
fs.writeFileSync('cert.pem', pems.cert);

console.log('Certificates generated: key.pem, cert.pem');
