import express from "express";

const app = express();

// MUITO IMPORTANTE
app.use(express.json({ limit: "10mb" }));

// 🔹 TESTE ROOT
app.get("/", (req, res) => {
  res.send("NutriScan backend OK 🚀");
});

// 🔹 TESTE OPENAI (para browser)
app.get("/teste", async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: "Diz só: backend a funcionar",
      }),
    });

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("ERRO TESTE:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 API PRINCIPAL
app.post("/analisar", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Imagem não enviada" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Identifica os alimentos presentes na imagem e devolve em JSON.",
              },
              {
                type: "input_image",
                image_url: image,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("ERRO BACKEND:", error);
    res.status(500).json({ error: "erro backend" });
  }
});

// 🔥 PORTA (ESSENCIAL PARA RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor a correr na porta " + PORT);
});
