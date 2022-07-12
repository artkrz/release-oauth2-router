require("dotenv").config();

const ClientOAuth2 = require("client-oauth2"); // Handles some of the OAuth logic for us, saves time from writing out each step ourselves
const express = require("express"); // HTTP/S web server
const morgan = require("morgan"); // Middleware for logging each request
const oauth2 = require("./lib/oauth2"); // Config for each OAuth provider (e.g. redirect URI, client ID, etc.)
const {
  addHTTPLogInfoToRequest,
  morganLogHandler,
  getRandomString,
} = require("./lib/helpers");
const url = require("url");
const { rewriteUrlForReleasehub } = require("./lib/releasehub");
const { parse } = require("path");
const { query } = require("express");

const PORT = process.env.PORT || 8080;

// This would be stored in the database in a real app
let lastState;

function main() {
  const app = getExpressApp();
  const oauth2Client = new ClientOAuth2(oauth2.CLIENT_CONFIG.okta);
  addOAuthClientHandlersToExpressApp(app, oauth2Client);
  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}\n`);
  });
}

main();

function getExpressApp() {
  const app = express();
  app.use(express.json());
  app.use(addHTTPLogInfoToRequest);
  app.use(morgan(morganLogHandler));
  app.set("view engine", "pug");
  app.set("views", __dirname + "/views");
  return app;
}

function addOAuthClientHandlersToExpressApp(app, oauth2Client) {
  // Display button(s) for supported OAuth2 test flows and clients
  app.get("/", async function (req, res) {
    // We're using pug templating engine. First parameter is name of view relative ./views,
    // and second parameter contains parameter(s) that we display or otherwise use in the template.
    return res.render("index", {
      title: "OAuth2 Proxy Test App",
      req: req.HTTPLogInfo,
    });
  });

  /** Start the OAuth2 code flow (browser-based login to authenticate and/or delegate access to scope(s) on the remote resource server) */
  app.get("/login", async function (req, res) {
    console.log("OAuth flow started: " + req.query.flow);
    lastState = getRandomString(16);
    const uri = oauth2Client.code.getUri({ state: lastState });
    console.log(`Original redirect URI ${uri}\n`);
    const rewrittenUri = rewriteUrlForReleasehub(uri);
    console.log(`Rewritten redirect URI ${rewrittenUri}\n`);
    res.redirect(rewrittenUri);
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
  app.get("/callback", async function (req, res) {
    let messages = [];
    let token = false;
    let error_code = false;
    let error_message = false;
    const parsedUrl = url.parse(req.originalUrl, true);
    const query = parsedUrl.query;

    if (lastState !== query.state) {
      return res.render("callback", {
        title: "OAuth2 callback result",
        req: req.HTTPLogInfo,
        messages,
        token,
        error_code: "STATE MISMATCH",
        error_message: `State in query string "${query.state}" does not match stored state "${lastState}"`,
      });
    }

    try {
      messages.push("Retrieved authorization grant: " + query.code);
      console.log("Callback URL: " + req.originalUrl);

      console.log(`Getting access token...`);
      token = await oauth2Client.code.getToken(req.originalUrl);
      console.log(`Access token retrieved.`);
      messages.push("Retrieved token.");
      token = token.data;
    } catch (err) {
      console.error(
        "Error retrieving access token: " + err.code + " - " + err.message
      );
      error_code = err.code;
      error_message = err.message;
      messages.push("Failed to retrieve access token.");
    }

    return res.render("callback", {
      title: "OAuth2 callback result",
      req: req.HTTPLogInfo,
      messages,
      token,
      error_code,
      error_message,
    });
  });

  app.all("*", function (req, res) {
    return res.render("page-not-found", {
      title: "Requested page not found",
      req: req.HTTPLogInfo,
    });
  });
}
