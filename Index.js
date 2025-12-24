const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

// Permite recibir JSON grandes (Base64)
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("OK: RealityCheck API is running");
});

// Limpia el prefijo data:image/... si existe
function cleanBase64(input) {
  if (!input) return null;
  const regex = /^data:image\/[a-zA-Z0-9+]+;base64,/;
  return input.replace(regex, "");
}

// POST /analyze
app.post("/analyze", async (req, res) => {
  try {
    // Aceptar varios nombres de campo
    let imageBase64 =
      req.body.imageBase64 ||
      req.body.image_base64 ||
      req.body.image;

    if (!imageBase64) {
      return res.status(400).json({
        ok: false,
        error: "Missing imageBase64/image_base64/image in request body"
      });
    }

    const cleanedBase64 = cleanBase64(imageBase64);

    if (!GOOGLE_VISION_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Missing GOOGLE_VISION_API_KEY in environment"
      });
    }

    const visionUrl =
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

    const visionRequestBody = {
      requests: [
        {
          image: { content: cleanedBase64 },
          features: [
            { type: "FACE_DETECTION", maxResults: 5 },
            { type: "LABEL_DETECTION", maxResults: 10 },
            { type: "SAFE_SEARCH_DETECTION" }
          ]
        }
      ]
    };

    const visionResponse = await axios.post(visionUrl, visionRequestBody);

    return res.json({
      ok: true,
      data: visionResponse.data
    });

  } catch (error) {
    console.error("Error in /analyze:", error.response?.data || error.message);

    return res.status(500).json({
      ok: false,
      error: "Internal server error",
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`RealityCheck API listening on port ${PORT}`);
});
