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
    if (!text) return res.status(400).send("Missing required parameter: text");

    // Controls
    const scale = Number(req.query.scale ?? 3);                 // overall size
    const includetext = String(req.query.includetext ?? "1") !== "0"; // 0 removes text
    const height = req.query.height != null ? Number(req.query.height) : undefined; // bar height (mm-ish units used by bwip-js)
    const width  = req.query.width  != null ? Number(req.query.width)  : undefined; // optional
    const padding = req.query.padding != null ? Number(req.query.padding) : 0;

    // Text controls (only applied if includetext = true)
    const textsize = req.query.textsize != null ? Number(req.query.textsize) : undefined;
    const textxalign = String(req.query.textxalign ?? "center"); // left|center|right

    // Guardrails
    if (!Number.isFinite(scale) || scale < 1 || scale > 10) return res.status(400).send("Invalid scale (1..10)");
    if (height !== undefined && (!Number.isFinite(height) || height < 5 || height > 200)) return res.status(400).send("Invalid height (5..200)");
    if (width  !== undefined && (!Number.isFinite(width)  || width  < 50 || width  > 2000)) return res.status(400).send("Invalid width (50..2000)");
    if (!Number.isFinite(padding) || padding < 0 || padding > 50) return res.status(400).send("Invalid padding (0..50)");
    if (textsize !== undefined && (!Number.isFinite(textsize) || textsize < 6 || textsize > 40)) return res.status(400).send("Invalid textsize (6..40)");

    const opts = {
      bcid,
      text,
      scale,
      includetext,
      textxalign,
      paddingwidth: padding,
      paddingheight: padding,
    };

    // Only set if provided (keeps defaults otherwise)
    if (height !== undefined) opts.height = height;
    if (width  !== undefined) opts.width  = width;
    if (includetext && textsize !== undefined) opts.textsize = textsize;

    const svg = bwipjs.toSVG(opts);

    res.set("Content-Type", "image/svg+xml; charset=utf-8");
    res.status(200).send(svg);
  } catch (e) {
    res.status(400).send("Invalid barcode parameters");
  }
});

const port = process.env.PORT || 3000; // Render sets PORT
app.listen(port, () => {
  console.log(`bwip-js barcode service listening on ${port}`);
});
