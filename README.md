# OAuth2 Proxy

## Okta Dev Environment

Admin URL: `https://dev-82700910-admin.okta.com/admin/getting-started`
Credentials: _Mat W can create for you_

**Okta Client App Name:** `proxy-test-app-for-web-app`
**Okta Client ID:** `0oa5nxqk9zTjKvCqU5d7`
**Okta Client App Name:** [Retrieve from this link](https://dev-82700910-admin.okta.com/admin/app/oidc_client/instance/0oa5nxqk9zTjKvCqU5d7/#tab-general)

**Logs:** - you can view logs on Okta side of things at: https://dev-82700910-admin.okta.com/report/system_log_2

## Proxy Service

The proxy service in `/src/oauth2-proxy` is a NodeJS HTTPS proxy using the open source `mockttp` npm package (MIT License).

In order to modify proxied requests' OAuth2 parameters like `redirect_uri` or `state`, the proxy is configured as a non-transparent (SSL-intercepting) proxy, meaning that:

1. The proxy has its own CA Certificate

2. Client applications are configured to send requests to the proxy

3. Client app or host (it depends) has imported and trusted the proxy's CA Certificate

When the proxy service starts, it will check for a previously created CA Certificate (`oauth2-proxy-key.pem` and `oauth2-proxy-key.pem`). If either file is not present, it will generate new files and write them to `/home/node/app` within the container. Before deploying elsewhere, run the Docker Compose template locally, as it will mount the `/src/oauth2-proxy` as a volume at `/home/node/app` and allow you to easily grab the CA Certificate files.

