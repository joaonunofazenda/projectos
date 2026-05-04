import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "10mb" }));

// 🔥 ROTA TESTE (para veres se está online)
app.get("/", (req, res) => {
  res.send("NutriScan backend OK 🚀");
});

// 🔥 ROTA PRINCIPAL
app.post("/analisar", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Imagem não enviada" });
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
                text: "Identifica os alimentos presentes na imagem e devolve em JSON."
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

  } catch (error) {
    console.error("ERRO BACKEND:", error);
    res.status(500).json({ error: "erro backend" });
  }
});

// 🔥 IMPORTANTE PARA RAILWAY
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor a correr na porta " + PORT);
});
