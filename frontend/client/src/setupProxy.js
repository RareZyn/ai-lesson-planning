const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy for regular API calls
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
      timeout: 300000, // 5 minutes for regular API calls
      proxyTimeout: 300000,
      logLevel: "debug",
    })
  );

  // Special proxy configuration for OCR endpoints with longer timeout
  app.use(
    "/api/ocr",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
      timeout: 600000, // 10 minutes for OCR processing
      proxyTimeout: 600000,
      logLevel: "debug",
      onError: (err, req, res) => {
        console.error("OCR Proxy Error:", err.message);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "OCR service timeout or connection error",
            error: err.message,
            suggestion: "Try with a smaller image or enable preprocessing",
          });
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`OCR Proxy Request: ${req.method} ${req.url}`);
        // Set longer timeout for outgoing requests
        proxyReq.setTimeout(600000);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(
          `OCR Proxy Response: ${proxyRes.statusCode} for ${req.url}`
        );
      },
    })
  );
};
