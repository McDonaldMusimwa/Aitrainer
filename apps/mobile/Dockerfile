FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# Optional build secret "extra_ca": a PEM root certificate npm should trust, for networks
# that inspect TLS. It is mounted only for this step and never stored in the image.
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -s /run/secrets/extra_ca ]; then \
        export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; \
    fi \
    && npm ci
COPY . .
EXPOSE 8081
CMD ["npx", "expo", "start", "--web", "--host", "lan", "--port", "8081"]
