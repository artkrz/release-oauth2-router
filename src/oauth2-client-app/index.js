const ClientOAuth2 = require('client-oauth2');
const express = require('express');
const morgan = require('morgan');
const oauthConfigs = require('./oauth-configs');
const { addHTTPLogInfoToRequest, morganLogHandler } = require('./helpers');
const url = require('url');

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.json());
app.use(addHTTPLogInfoToRequest);
app.use(morgan(morganLogHandler));
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

var oauthAppConfig;

async function main() {
  oauthAppConfig = new ClientOAuth2(oauthConfigs.oktaWebApp);
  app.listen(PORT, () => { console.log(`listening on port ${PORT}\n`) });
}

app.get('/login', async function (req, res) {
  var uri;
  switch (req.query.flow) {
    case (oauthFlowTypes.AUTHORIZATION_CODE):
      uri = oauthAppConfig.code.getUri();
      break;
    default: 
      throw new Error('Unsupported oauth2 flow type: ' + req.query.flow);
  }
  console.log(`Oauth2 redirect to: ${uri}`);
  res.redirect(uri);
});

app.get('/', async function (req, res) {
  return res.render('index', { 
    title: 'OAuth2 Proxy Test App', 
    req: req.HTTPLogInfo
    }
  );
});

app.get('/callback', async function (req, res) {

  let messages = [];
  let token = false;
  let error_code = false;
  let error_message = false;  

  try {
    messages.push("Retrieved authorization grant: " + url.parse(req.originalUrl,true).query.code);
    console.log('Callback URL: ' + req.originalUrl)
    
    console.log(`Getting access token...`);
    token = await oauthAppConfig.code.getToken(req.originalUrl);
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

const oauthFlowTypes = {
  CODE: 'code'
};

(async function() {
  await main();
  // → 🎉
}());