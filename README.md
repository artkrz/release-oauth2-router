# OAuth2 Router

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
