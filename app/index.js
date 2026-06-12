const express = require('express');
const app = express();
const port = process.env.PORT || 80;
const env = process.env.APP_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || 'info';

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Kustomize Capstone App</title></head>
      <body style="font-family:Arial, sans-serif; line-height:1.6; padding:2rem;">
        <h1>Kustomize Capstone Web App</h1>
        <p>This is a simple web application running in the <strong>${env}</strong> environment.</p>
        <p><strong>Log level:</strong> ${logLevel}</p>
        <p><strong>Container port:</strong> ${port}</p>
        <p>Use Kustomize overlays to change the image tag, environment settings, and replicas per environment.</p>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`App listening on port ${port} in ${env} mode with log level ${logLevel}`);
});
