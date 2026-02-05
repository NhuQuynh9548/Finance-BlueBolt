const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// Proxy /api requests to backend FIRST (before static files)
app.use('/api', createProxyMiddleware({
    target: 'http://192.167.10.120:5001',
    changeOrigin: true
}));

// Serve static files from build folder
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback - serve index.html for all other routes
app.use(function(req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', function() {
    console.log('Frontend server running on port ' + PORT);
    console.log('API proxy: /api/* -> http://192.167.10.120:5001/api/*');
});
