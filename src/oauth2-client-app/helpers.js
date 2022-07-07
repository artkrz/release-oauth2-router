const url = require('url');

exports.getRandomString = (length) => {
  // from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));   
   }
   return result; 
}

exports.addHTTPLogInfoToRequest = (req, res, next) => {
  req.HTTPLogInfo = {
    ip: req.ip,
    protocol: req.protocol,
    method: req.method,
    hostname: req.hostname,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: JSON.stringify(req.body, '<br/>', 2)
  };

  const fullUrl = `${req.protocol}://${req.hostname}${req.originalUrl}`;
  const urlQuery = url.parse(fullUrl, true).query;
  const queryInReq = Object.keys(req.query).length > 0;
  console.log(
    `${new Date().toISOString()} - ${req.ip} - ${req.method} ${req.protocol}://${req.hostname}`
  );
  const queryToPrint = queryInReq ? req.query : urlQuery;
  Object.keys(queryToPrint).forEach(key => {
    console.log(`  ${key} = ${queryToPrint[key]}`)
  });
  next();
}

exports.morganLogHandler = (tokens, req, res) => {

   var status = headersSent(res)
    ? res.statusCode
    : undefined

   // get status color
  var color = status >= 500 ? 31 // red
   : status >= 400 ? 33 // yellow
      : status >= 300 ? 36 // cyan
         : status >= 200 ? 32 // green
         : 0 // no color

   return [
     `Result =>`,
     `\x1b[${color}m` + status + '\x1b[0m', '-',
     tokens['response-time'](req, res), 'ms\n',
   ].join(' ')
}

// https://github.com/expressjs/morgan/blob/master/index.js
function headersSent (res) {
   // istanbul ignore next: node.js 0.8 support
   return typeof res.headersSent !== 'boolean'
     ? Boolean(res._header)
     : res.headersSent
}