import express from "express";
import bwipjs from "bwip-js";

const app = express();

/**
 * Health check (Render will also use this for basic verification).
 */
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

/**
 * Barcode endpoint (SVG)
 * Example:
 *   /barcode?bcid=ean13&text=1234567890123&scale=3&includetext=1
 */
app.get("/barcode", (req, res) => {
  try {
    const bcid = String(req.query.bcid ?? "ean13");
    const text = String(req.query.text ?? "");
    const scale = Number(req.query.scale ?? 3);

    // includetext: default true unless explicitly "0"
    const includetext = String(req.query.includetext ?? "1") !== "0";

    // Basic input guardrails
    if (!text) {
      return res.status(400).send("Missing required parameter: text");
    }
    if (!Number.isFinite(scale) || scale < 1 || scale > 10) {
      return res.status(400).send("Invalid scale (use 1..10)");
    }

    // Generate SVG
    const svg = bwipjs.toSVG({
      bcid,
      text,
      scale,
      includetext,
      textxalign: "center",
      paddingwidth: 8,
      paddingheight: 8
    });

    res.set("Content-Type", "image/svg+xml; charset=utf-8");
    res.status(200).send(svg);
  } catch (err) {
    res.status(400).send("Invalid barcode parameters");
  }
});

const port = process.env.PORT || 3000; // Render sets PORT
app.listen(port, () => {
  console.log(`bwip-js barcode service listening on ${port}`);
});
