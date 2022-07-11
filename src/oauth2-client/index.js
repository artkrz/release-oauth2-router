const ClientOAuth2 = require('client-oauth2');       // Handles some of the OAuth logic for us, saves time from writing out each step ourselves
const express = require('express');                  // HTTP/S web server
const morgan = require('morgan');                    // Middleware for logging each request
const oauth2 = require('./lib/js/oauth2');           // Config for each OAuth provider (e.g. redirect URI, client ID, etc.)
const fs = require('fs');
const { 
  addHTTPLogInfoToRequest,
  morganLogHandler              
  } = require('./lib/js/helpers');
const url = require('url');

const PORT = process.env.PORT || 8080;

async function main() {
  printEnvironmentInfo();
  checkForProxyCertificate();
  const app = getExpressApp();
  const oauth2Client = new ClientOAuth2(oauth2.CLIENT_CONFIG.okta);
  await addOAuthClientHandlersToExpressApp(app, oauth2Client);
  app.listen(PORT, () => { console.log(`listening on port ${PORT}\n`) });
}


(async function() {
  await main();
  // → 🎉
}());


function checkForProxyCertificate() {
  if (!(process.env.SSL_CERT_FILE)) {
    console.error('SSL_CERT_FILE is not set and requests may go unproxied.');
    return;
  }
  if (!(fs.existsSync(process.env.SSL_CERT_FILE))) {
    console.log(`SSL_CERT_FILE=${process.env.SSL_CERT_FILE}, but file is missing!`);
  }
  else {
    console.log(`SSL_CERT_FILE found at ${process.env.SSL_CERT_FILE}`);
  }
}


function getExpressApp() {
  const forwardProxyApp = express();                    // Proxies requests from internal containers out to internet
  forwardProxyApp.use(express.json());
  forwardProxyApp.use(addHTTPLogInfoToRequest);
  forwardProxyApp.use(morgan(morganLogHandler));
  forwardProxyApp.set('view engine', 'pug');
  forwardProxyApp.set('views', __dirname + '/views');
  return forwardProxyApp;
}

/** Log useful debugging info, like certain proxy-related environment variables, to stdout  */
function printEnvironmentInfo() {
  require('dns').lookup(require('os').hostname(), function (err, add) {
    console.log('My container IP address is: ' + add);
  });
  // Any env var containing 'http' (case insensitive):
  Object.keys(process.env).sort().forEach((key) => {
    if (key.toLowerCase().includes('http')) console.log(`${key} = ${process.env[key]}`);
  });
}

async function addOAuthClientHandlersToExpressApp(app, oauth2Client) {

  // Display button(s) for supported OAuth2 test flows and clients
  app.get('/', async function (req, res) {
    // We're using pug templating engine. First parameter is name of view relative ./views,
    // and second parameter contains parameter(s) that we display or otherwise use in the template. 
    return res.render('index', { 
      title: 'OAuth2 Proxy Test App', 
      req: req.HTTPLogInfo
      }
    );
  });

  /** Start the OAuth2 code flow (browser-based login to authenticate and/or delegate access to scope(s) on the remote resource server) */
  app.get('/login', async function (req, res) {
    console.log('OAuth flow started: ' + req.query.flow );
    const uri = oauth2Client.code.getUri();
    let parsedUri = url.parse(uri);
    console.log(`Redirecting to ${parsedUri.protocol}://${parsedUri.hostname}${parsedUri.pathname}\n`);
    res.redirect(uri);
  });

  /**
   * This is the endpoint to which the remote OAuth2 server (e.g. Okta) sends results of a given client-initiated
   * flow, such as an authorization grant, access token, or refresh token. This value must match a pre-configured
   * redirect URI, though the ephemeral nature of Release environments and DNS endpoints means that it's not
   * practical to preconfigure these endpoints at scale... so when the original OAuth2 flow begins, the request is
   * proxied by the oauth2 proxy service which rewrites the redirect URI to a static DNS name of the proxy service. 
   * The proxy receives the original callback from the remote OAuth2 server and routes it back to the appropriate
   * ephemeral environment.
   */
  app.get('/callback', async function (req, res) {

    let messages = [];
    let token = false;
    let error_code = false;
    let error_message = false;  

    try {
      messages.push("Retrieved authorization grant: " + url.parse(req.originalUrl,true).query.code);
      console.log('Callback URL: ' + req.originalUrl)
      
      console.log(`Getting access token...`);
      token = await oauth2Client.code.getToken(req.originalUrl);
      console.log(`Access token retrieved.`);
      messages.push('Retrieved token.');
      token = token.data;
    } 
    catch(err) {
      console.error('Error retrieving access token: ' + err.code + ' - ' + err.message);
      error_code = err.code;
      error_message = err.message;
      messages.push('Failed to retrieve access token.');
    }

    return res.render('callback', { 
      title: 'OAuth2 callback result', 
      req: req.HTTPLogInfo,
      messages,
      token,
      error_code,
      error_message
      }
    );
    /*
    oauthAppConfig.code.getToken(req.originalUrl)
      .then(function (user) {
        console.log(user); //=> { accessToken: '...', tokenType: 'bearer', ... }

        // Refresh the current users access token.
        user.refresh().then(function (updatedUser) {
          console.log(updatedUser !== user) //=> true
          console.log(updatedUser.accessToken)
        });

        // Sign API requests on behalf of the current user.
        user.sign({
          method: 'get',
          url: 'http://example.com'
        });

        // We should store the token into a database.
        return res.send(user.accessToken);
        
      })
    */
  });

  app.all("*", function (req, res) {
    return res.render('page-not-found', { 
      title: 'Requested page not found', 
      req: req.HTTPLogInfo
      }
    );  
  });
}
