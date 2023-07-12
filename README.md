# OAuth2 Router

## Okta Dev Environment

Admin URL: `https://dev-82700910-admin.okta.com/admin/getting-started`
Credentials: _Mat W can create for you_

**Okta Client App Name:** `proxy-test-app-for-web-app`
**Okta Client ID:** `0oa5nxqk9zTjKvCqU5d7`
**Okta Client App Secret:** [Retrieve from this link](https://dev-82700910-admin.okta.com/admin/app/oidc_client/instance/0oa5nxqk9zTjKvCqU5d7/#tab-general)

**Logs:** - you can view logs on Okta side of things at: https://dev-82700910-admin.okta.com/report/system_log_2


Create a `.env` file in the `./apps/oauth-client` directory with the following values:

```
OKTA_CLIENT_ID=0oa5nxqk9zTjKvCqU5d7
OKTA_CLIENT_SECRET=<secret-from-above>
OKTA_DOMAIN=dev-82700910-admin.okta.com
```

## Router

The router service in `./apps/oauth2-router` is a NodeJS Express web app that is designed to act as a central OAuth2 router that
forwards callbacks to the original ephemeral environment from which they were created. It operates by decoding the original URL from the
standard OAuth2 `state` query string parameter.

## Modifying your client app

To work with the router, your client app must:

1. Configure your OAuth2 client libraries to use the router's `/callback` endpoint as your app's `redirect_uri`.
2. Add logic to encode your ephemeral environment's final callback URL in the `state` parameter along with your original `state` value (see [example here](./apps/oauth2-client/src/lib/releasehub.js))

State must be a base64 encoded JSON object with the following structure:

```json
{
  "state": "<your-original-state-value>",
  "url": "<your-ephemeral-envs-callback-url>"
}
```

