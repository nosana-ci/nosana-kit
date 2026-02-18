FROM node:22 as base
WORKDIR /app
COPY . .
RUN npm ci
CMD ["npm", "run", "build"]