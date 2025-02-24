const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: 'localhost' }];
const options = {
  keySize: 4096,
  days: 365,
  algorithm: 'sha256'
};

const cert = selfsigned.generate(attrs, options);

fs.writeFileSync('key.pem', cert.private);
fs.writeFileSync('cert.pem', cert.cert);

console.log('Certificado SSL gerado com sucesso!');
