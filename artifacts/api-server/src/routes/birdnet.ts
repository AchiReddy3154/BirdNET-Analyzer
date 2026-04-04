import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = Router();

const FLASK_URL = "http://127.0.0.1:8000";

const proxy = createProxyMiddleware({
  target: FLASK_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/birdnet": "" },
  on: {
    error(err, _req, res) {
      const r = res as import("express").Response;
      r.status(502).json({ error: "BirdNET service unavailable. Make sure the Flask API is running." });
    },
  },
});

router.use("/birdnet", proxy);

export default router;
