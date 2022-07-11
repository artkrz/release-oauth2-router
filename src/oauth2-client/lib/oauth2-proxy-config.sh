# This file instructs our containers processes to proxy traffic through our proxy container. 

# This file will be copied to /etc/profile.d/oauth2-proxy-env-vars.sh within our Dockerfile.

# While http_proxy and https_proxy are typically used, some software / libraries / apps use
# the capitalized HTTP_PROXY and HTTPS_PROXY. Dep

if [ -n "${PROXY_HOST+set}" ]; then
  PROXY_HOST=proxy
  echo "PROXY_HOST unset. Using default value $PROXY_HOST"; 
fi

if [ -n "${PROXY_PORT+set}" ]; then
  PROXY_PORT=8213
  echo "PROXY_PORT unset. Using default value $PROXY_PORT"; 
fi

export http_proxy="http://$PROXY_HOST:$PROXY_PORT"
export https_proxy="https://$PROXY_HOST:$PROXY_PORT"
export HTTP_PROXY=$http_proxy
export HTTPS_PROXY=$https_proxy

# 169.254.169.254      = EC2 Metadata,
# 169.254.170.2        = IAM roles for ECS tasks, 
# /var/run/docker.sock = Docker daemon traffic
# Reference: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/http_proxy_config.html
export no_proxy=localhost,127.0.0.1,169.254.169.254,169.254.170.2,/var/run/docker.sock
export NO_PROXY=$no_proxy

# NodeJS doesn't honor normal variables. We have to use the below with NPM package global-agent
export GLOBAL_AGENT_HTTP_PROXY=$http_proxy
export GLOBAL_AGENT_HTTPS_PROXY=$https_proxy