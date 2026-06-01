'use strict';

const Parse = require('parse');

// Configurar Back4App
const appId = process.env.BACK4APP_APP_ID || 'M44vzQx2pIIofQDNpghpHl0J3n4LKF70BiKNKuED';
const jsKey = process.env.BACK4APP_JS_KEY || 'ZVNueKhFqeuR5OkAFd6yeUSNbzlqXmjRySHXslzI';
const clientKey = process.env.BACK4APP_CLIENT_KEY || 'CjZBJPILYnqXmrlSUMcTLtEACHbmUe6Y1mrIwPb1';
const serverUrl = 'https://parseapi.back4app.com';

Parse.initialize(appId, jsKey, clientKey);
Parse.serverURL = serverUrl;

console.log('✓ Back4App configurado');
console.log(`  App ID: ${appId.substring(0, 8)}...`);
console.log(`  URL: ${serverUrl}`);

module.exports = Parse;
