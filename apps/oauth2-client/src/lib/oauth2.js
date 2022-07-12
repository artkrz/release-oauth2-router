const OKTA_DOMAIN = process.env.OKTA_DOMAIN;
const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID;
const OKTA_CLIENT_SECRET = process.env.OKTA_CLIENT_SECRET;

if (!OKTA_DOMAIN) throw new Error("Missing environment variable OKTA_DOMAIN");
if (!OKTA_CLIENT_ID)
  throw new Error("Missing environment variable OKTA_CLIENT_ID");
if (!OKTA_CLIENT_SECRET)
  throw new Error("Missing environment variable OKTA_CLIENT_SECRET");

exports.FLOW_TYPE = {
  code: "code",
};

exports.CLIENT_CONFIG = {
  okta: {
    clientId: OKTA_CLIENT_ID,
    clientSecret: OKTA_CLIENT_SECRET,
    accessTokenUri: `https://${OKTA_DOMAIN}/oauth2/v1/token`,
    authorizationUri: `https://${OKTA_DOMAIN}/oauth2/v1/authorize`,
    redirectUri: `http://localhost:8081/callback`, // Callback URI for the proxy
    scopes: ["okta.apps.read"],
  },
};
