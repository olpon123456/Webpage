import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const POPADS_API_KEY = process.env.POPADS_API_KEY;
const WEBSITE_ID = process.env.WEBSITE_ID;

// Serve static files (like index.html) from "public"
app.use(express.static("public"));

// CORS for safety
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// --- Backend route that fetches ad code ---
app.get("/get-adcode", async (req, res) => {
  try {
    const response = await fetch(
      `https://www.popads.net/api/website_code?key=${POPADS_API_KEY}&website_id=${WEBSITE_ID}&tl=auto&of=1`
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("PopAds API error:", text);
      return res.status(500).send("Error fetching PopAds code");
    }

    let adcode = await response.text();

    adcode = adcode
      .replace(/<\/?script[^>]*>/gi, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .trim();

    res.json({ adcode });
  } catch (error) {
    console.error("Error fetching adcode:", error);
    res.status(500).send("Error retrieving adcode");
  }
});

// --- Serve front-end autorun script ---
app.get("/ad.js", async (req, res) => {
  const delay = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;
  const redirectUrl = "https://devlinks.link";

  const script = `
(async function() {
  try {
    const res = await fetch('/get-adcode');
    const data = await res.json();

    // Run PopAds adcode
    const script = document.createElement('script');
    script.innerHTML = data.adcode;
    document.head.appendChild(script);

    // Redirect after random delay
    setTimeout(() => {
      window.location.href = '${redirectUrl}';
    }, ${delay});
  } catch (e) {
    console.error('Ad load error:', e);
  }
})();
`;
  res.set("Content-Type", "application/javascript");
  res.send(script);
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
