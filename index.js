import express from "express";

const app = express();

// 🔥 MUITO IMPORTANTE
app.use(express.json({ limit: "10mb" }));

// 🔹 TESTE ROOT
app.get("/", (req, res) => {
  res.send("NutriScan backend OK 🚀");
});

// 🔹 TESTE OPENAI
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
    const texto = data.output?.[0]?.content?.[0]?.text || "sem resposta";

    res.json({ resposta: texto });

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
                text: `
Analisa a imagem e devolve APENAS JSON puro (sem texto antes ou depois):

[
  {
    "nome": "alimento",
    "calorias": numero
  }
]

Regras:
- identifica TODOS os alimentos visíveis
- calorias aproximadas por porção visível
- NÃO escrever explicações
- NÃO usar markdown
- devolver apenas JSON válido
`
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

    let texto = data.output?.[0]?.content?.[0]?.text || "[]";

    // 🔥 LIMPAR RESPOSTA (caso venha com ```json ou texto extra)
    texto = texto.replace(/```json/g, "")
                 .replace(/```/g, "")
                 .trim();

    let alimentos = [];

    try {
      alimentos = JSON.parse(texto);
    } catch (e) {
      console.error("Erro parse JSON:", texto);
      alimentos = [{ nome: "desconhecido", calorias: 0 }];
    }

    // 🔥 CALCULAR TOTAL
    const total = alimentos.reduce((acc, item) => {
      return acc + (Number(item.calorias) || 0);
    }, 0);

    res.json({
      alimentos,
      total_calorias: total
    });

  } catch (error) {
    console.error("ERRO BACKEND:", error);
    res.status(500).json({ error: "erro backend" });
  }
});

// 🔥 PORTA (RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor a correr na porta " + PORT);
});
