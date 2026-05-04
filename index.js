import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/analisar", async (req, res) => {
  try {
    const { image } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Identifica alimentos." },
              { type: "input_image", image_url: image }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (e) {
    res.status(500).json({ error: "erro backend" });
  }
});

app.listen(3000, () => {
  console.log("Servidor a correr");
});
