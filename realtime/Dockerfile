FROM node:22-alpine

WORKDIR /app
COPY server.mjs ./server.mjs
ARG BUILD_ID=unknown
ENV BUILD_ID=$BUILD_ID
RUN npm init -y && npm install --omit=dev ws@8.21.3

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
