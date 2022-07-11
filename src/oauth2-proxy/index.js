const egressProxy = require('./lib/egress-proxy');

async function main() {

  // Egress proxy receives internal requests from client app and, if outbound, rewrites
  // the redirect URI as https://proxy:8214/callback to hit the ingress proxy endpoint.
  await egressProxy.start();

  //TODO: Create ingress proxy for https://proxy:8214/callback ; receives requests from
  // remote OAuth server and will route them back to proper environment/client based on
  // some sort of mapping or modified state parameter.

}

(async function() {
  await main();
  // → 🎉
}());