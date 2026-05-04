import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔥 ROUTE PRINCIPAL
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
              {
                type: "input_text",
                text: `
Analisa a imagem e identifica alimentos.

REGRAS:
- Apenas comida
- Usa nomes reais (frango, arroz, maçã)
- Não inventar
- Se não houver comida: []

FORMATO:
[
 {"nome":"frango","x":0.3,"y":0.3,"w":0.2,"h":0.2}
]

Apenas JSON.
`
              },
              {
                type: "input_image",
                image_url: image
              }
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

// 🔥 ROTA TESTE (IMPORTANTE)
app.get("/", (req, res) => {
  res.send("Backend NutriScan ONLINE 🚀");
});

// 🔥 PORTA CORRETA PARA RAILWAY
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor a correr na porta " + PORT);
});
