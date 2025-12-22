---
title: Health Checks
---

In this section we will go through the steps of creating an image with the health check functionality. The health check functionality is available in the job definition to provide you an interface to check the liveliness of your service. In this example it is implemented using a simple Node.JS HTTP server, that will return an HTTP response with status code 200, and a simple json.

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "nginx",
      "args": {
        "cmd": [],
        "image": "nginx",
        "expose": [
          {
            "port": 80,
            "health_checks": [
              {
                "type": "http",
                "path": "/",
                "method": "GET",
                "expected_status": 200
              }
            ]
          }
        ]
      }
    }
  ]
}
```

the health check is per port and can have multiple health checks per port.

## Setting Up a Project Folder to use to show health check functionality

```json
my-local-healthcheck/
├── Dockerfile
├── index.js
```

```javascript
// index.js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
```

This is the `index.js` file where we create a server that exposes the `/health` endpoint to be used for the health check.

```docker
FROM node:18-alpine

WORKDIR /app
COPY index.js .

EXPOSE 8080

CMD ["node", "index.js"]
```

This is the Dockerfile that will be used to build the image for the Job Definition.

```docker
docker build -t my-local-image .
```

This command will build the image, which can then be used in the Job Definition.

So after creating the image and building it, it can now be used in the Job Definition.

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "local-check",
      "args": {
        "cmd": [],
        "image": "my-local-image",
        "expose": [
          {
            "port": 8080,
            "health_checks": [
              {
                "type": "http",
                "path": "/health",
                "method": "GET",
                "expected_status": 200
              }
            ]
          }
        ]
      }
    }
  ]
}
```

This is the Job Definition for running the image. The health check targets the `/health` path using the HTTP protocol and `GET` method. This endpoint is called at regular intervals to confirm liveliness.

