// Based on guide at https://httptoolkit.tech/blog/javascript-mitm-proxy-mockttp/
const mockttp = require('mockttp');
const fs = require('fs');
const url = require('url');

const EGRESS_PORT = parseInt(process.env.PRIVATE_EGRESS_PROXY_PORT);
const INGRESS_PORT = parseInt(process.env.PUBLIC_INGRESS_PROXY_PORT);
const INGRESS_HOST = process.env.PUBLIC_INGRESS_PROXY_HOST;   // Hosts proxy callback URL which will forward to appropriate target
const SSL_KEY_PATH = 'oauth2-proxy-key.pem';
const SSL_CERT_PATH = 'oauth2-proxy-cert.pem';

//TODO: Add rewrite logic for state parameter (or store some sort of state within app as a mapping)

/** Starts an SSL-intercepting proxy server that rewrites OAuth redirect URIs */
const start = async function() {

    const https = await getProxyCertificate();
    const server = mockttp.getLocal({ https });
    printChromeTestInstructionsForEgress(https);
    
    // Unmatched rules, do nothing
    server.forUnmatchedRequest().thenPassThrough({
      beforeRequest: (request) => {
        let parsedUrl = url.parse(request.url, true);
        printRequestInfo(request, parsedUrl, false);
        // Don't change anything in request:
        return {};
      }, 
    });
  
    // Or wrap targets, transforming real requests & responses:
    //server.forAnyRequest().forHostname('okta.com').thenPassThrough({
    server.forAnyRequest().matching(request => isOAuthDomain(request)).thenPassThrough({
      beforeRequest: (request) => {
        let modifiedRequest = {};
        let parsedUrl = url.parse(request.url, true);
        let originalQuery = parsedUrl.query;
        printRequestInfo(request, parsedUrl, true);
        
        if (originalQuery.redirect_uri) {
          let originalRedirect = new URL(originalQuery.redirect_uri );
          //let originalRedirectQuery = new URLSearchParams(originalRedirectUri);
          let modifiedRedirectUri =getProxyRedirectHostname() + originalRedirect.search;
          let modifiedQuery = {...originalQuery, ...{ redirect_uri: modifiedRedirectUri} }
  
          console.log(`Modified query parameters:`);
          Object.keys(modifiedQuery).forEach(key => {console.log(`  - ${key} = ${modifiedQuery[key]}`); });
          console.log('');
        }
      
      // Merge new values into request
      return modifiedRequest;
  
      },
  
      beforeResponse: (response) => {
          // Here you can access the real response:
          console.log(`Received ${response.statusCode}`);
          return {};
        
      }
    });
  
    await server.start(EGRESS_PORT);
    console.log(`Server running on port ${server.port}`);
  
  }
  
  function getProxyRedirectHostname() {
    return `https://${INGRESS_HOST}:${INGRESS_PORT}/callback`;
  }
  
  function isOAuthDomain(request) {
    //console.log('URL to match: ' + request.url)
    const oAuthPaths = ['okta.com/oauth2']
  
    for (let i = 0; i < oAuthPaths.length; i++) {
      let oAuthPath = oAuthPaths[i];
      let escapedRegex = oAuthPath.replace('/','\\/').replace('.', '\\.');
      // Resulting pattern example:    ^https:\/\/.*\.okta\.com\/oauth2\/.*
      let find = '^https:\\/\\/.*\\.' + escapedRegex + '\\/.*';
      if (request.url.match(find)) {
        return true;
      }
    }
  
    // No matching OAuth domain found, do not inspect or change request
    return false;
  }
  
  function printRequestInfo(request, parsedUrl, isOAuthDomain) {
    if (parsedUrl.pathName !== 'favicon.ico') {
      console.log(`\nProxy request: ${request.method} ${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`);
      if (isOAuthDomain) {
        console.log('Path is OAuth2 endpoint subject to rewrite.');
        console.log('Original query parameters:');
        printHashMap(parsedUrl.query);
      }
    }
  }
  
  function printHashMap(hashMap) {
    Object.keys(hashMap).forEach(key => {
      console.log(`  - ${key} = ${hashMap[key]}`);
    });
    console.log('');
  }
  
  async function printChromeTestInstructionsForEgress(https) {
    const caFingerprint = mockttp.generateSPKIFingerprint(https.cert);
    console.log(`CA cert fingerprint ${caFingerprint}\n`);
    console.log(`To test locally with Chrome on MacOS, run the following:`);
    console.log(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --proxy-server=localhost:${EGRESS_PORT} --ignore-certificate-errors-spki-list=${caFingerprint} --user-data-dir=/tmp/chrome-proxy\n`)
  }
  
  
  /**
   * Get existing CA Cert from local files or, if not found, create and return new certificate.
   * @returns https
   */
  async function getProxyCertificate() {
    let https;
    if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
      console.log(`Loading existing SSL certificate files:\n - ${SSL_KEY_PATH}\n - ${SSL_CERT_PATH}`)
      https = {
        key:  fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH)
      };
    }
    else {
      console.log(`No prior CA certificate found, new cert created at:\n - ${SSL_KEY_PATH}\n - ${SSL_CERT_PATH}`)
      https = await mockttp.generateCACertificate();
      fs.writeFileSync(SSL_KEY_PATH, https.key);
      fs.writeFileSync(SSL_CERT_PATH, https.cert);
    }
    return https; 
  }

exports.start = start;