FROM node:22-alpine

WORKDIR /app
COPY server.mjs ./server.mjs
RUN npm init -y && npm install --omit=dev ws@8.18.1

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
