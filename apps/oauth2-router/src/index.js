require("dotenv").config();

const ClientOAuth2 = require("client-oauth2"); // Handles some of the OAuth logic for us, saves time from writing out each step ourselves
const express = require("express"); // HTTP/S web server
const morgan = require("morgan"); // M"); // Config for each OAuth provider (e.g. redirect URI, client ID, etc.)
const { addHTTPLogInfoToRequest, morganLogHandler } = require("./lib/helpers");

const PORT = process.env.PORT || 8081;

// Returns an object in the form of {state: "original-state-param", url: "https://environment-redirect-uri/"}
function unwrapState(state) {
  return JSON.parse(Buffer.from(state, "base64").toString("utf8"));
}

const app = express();
app.use(express.json());
app.use(addHTTPLogInfoToRequest);
app.use(morgan(morganLogHandler));
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.get("/", async function (req, res) {
  return res.send("Hello from the OAuth2 router");
});

app.get("/callback", async function (req, res) {
  try {
    var reqUrl = new URL(`${req.protocol}://${req.get("host")}${req.url}`);
    console.log(`req.url: ${reqUrl}`);
    const wrappedState = reqUrl.searchParams.get("state");
    const { url, state } = unwrapState(wrappedState);
    const forwardToUrl = new URL(url);
    forwardToUrl.search = reqUrl.search;
    forwardToUrl.searchParams.set("state", state);
    console.log(`Redirecting to original callback URL: ${forwardToUrl}`);
    res.redirect(forwardToUrl);
  } catch (err) {
    console.error("Error forwarding to original callback URL: ", err);
    res.status(400);
    res.send(err.toString());
  }
});

app.all("*", function (req, res) {
  return res.render("page-not-found", {
    title: "Requested page not found",
    req: req.HTTPLogInfo,
  });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}\n`);
});
