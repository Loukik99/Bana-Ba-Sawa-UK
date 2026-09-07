import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "./create-server.js";

const PORT = Number(process.env.PORT) || 3001;
const { app } = await createServer();

if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Bana Ba Sawa UK API listening on http://127.0.0.1:${PORT}`);
});
