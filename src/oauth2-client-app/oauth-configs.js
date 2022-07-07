const OKTA_DOMAIN = "dev-82700910.okta.com";
const OKTA_CLIENT_SECRET = process.env.OKTA_CLIENT_SECRET;

if (!OKTA_CLIENT_SECRET) throw new Error('Missing environment variable OKTA_CLIENT_SECRET');

const oauthConfigs = {
    oktaWebApp: {
        clientId:  "0oa5nxqk9zTjKvCqU5d7",
        clientSecret: OKTA_CLIENT_SECRET,
        accessTokenUri: `https://${OKTA_DOMAIN}/oauth2/v1/token`, 
        authorizationUri: `https://${OKTA_DOMAIN}/oauth2/v1/authorize`,
        redirectUri: `http://localhost:8080/callback`,
        scopes: ['okta.apps.read'],
        state: 'thisIsSomeRaandomState123'
    }
};

module.exports = oauthConfigs;