import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔥 ROTA TESTE (OBRIGATÓRIA)
app.get("/", (req, res) => {
  res.send("OK");
});

// 🔥 ROTA PRINCIPAL
app.post("/analisar", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "imagem em falta" });
    }

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
    console.error(e);
    res.status(500).json({ error: "erro backend" });
  }
});

// 🔥 PORTA RAILWAY
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor a correr na porta " + PORT);
 });

