FROM solanalabs/solana:v1.18.26

COPY docker/prefetch.sh /usr/local/bin/prefetch.sh
COPY docker/validator-entrypoint.sh /usr/local/bin/validator-entrypoint.sh
COPY keys/ /data/keys/
COPY fixtures/ /data/fixtures/

RUN chmod +x /usr/local/bin/prefetch.sh /usr/local/bin/validator-entrypoint.sh

# Pre-fetch Nosana programs and accounts from devnet during build
# so the validator starts instantly without network access at runtime.
ARG SOURCE_CLUSTER_URL=https://api.devnet.solana.com
RUN SOURCE_CLUSTER_URL=${SOURCE_CLUSTER_URL} /usr/local/bin/prefetch.sh

EXPOSE 8899 8900 8001

HEALTHCHECK --interval=2s --timeout=5s --retries=20 \
  CMD solana cluster-version --url http://127.0.0.1:8899

ENTRYPOINT ["/bin/bash", "/usr/local/bin/validator-entrypoint.sh"]
