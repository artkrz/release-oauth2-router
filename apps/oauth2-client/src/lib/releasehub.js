function isEphemeralEnvironment() {
  // In the real app this should be detected from the appropriate Release env var
  return true;
}

function getRouterCallbackUrl() {
  // In the real app this should be set through an env var
  return "http://localhost:8081/callback";
}

function getFinalCallbackUrl() {
  // In the real app this should be constructed from the Release ingress URL env var or some
  // other means to determine the callback URL of this environment
  return "http://localhost:8080/callback";
}

function rewriteUrlForReleasehub(origUrl) {
  if (!isEphemeralEnvironment()) return origUrl;

  const url = new URL(origUrl);
  const params = url.searchParams;
  const newState = wrapState(params.get("state"));
  params.set("state", newState);
  params.set("redirect_uri", getRouterCallbackUrl());
  return url.toString();
}

function wrapState(origState, environmentRedirectUri) {
  const newStateJson = JSON.stringify({
    state: origState,
    url: getFinalCallbackUrl(),
  });
  return Buffer.from(newStateJson, "utf8").toString("base64");
}

module.exports = { rewriteUrlForReleasehub, wrapState };
