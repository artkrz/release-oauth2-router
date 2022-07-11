// Based on guide at https://httptoolkit.tech/blog/javascript-mitm-proxy-mockttp/
const mockttp = require('mockttp');
const egressProxy = require('./lib/egress-proxy');



async function main() {

  await egressProxy.start();

}

(async function() {
  await main();
  // → 🎉
}());