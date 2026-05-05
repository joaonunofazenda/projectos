import express from "express";

const app = express();

app.use(express.json({ limit: "10mb" }));

// =============================
// TESTE ROOT
// =============================
app.get("/", (req, res) => {
  res.send("NutriScan backend OK 🚀");
});

// =============================
// TESTE OPENAI
// =============================
app.get("/teste", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY não configurada no servidor"
      });
    }

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

    if (!response.ok) {
      console.error("ERRO OPENAI:", data);
      return res.status(response.status).json({
        error: "Erro na OpenAI",
        detalhes: data
      });
    }

    const texto =
      data.output?.[0]?.content?.[0]?.text ||
      "sem resposta";

    res.json({ resposta: texto });

  } catch (error) {
    console.error("ERRO TESTE:", error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// API PRINCIPAL - ANALISAR PRATO
// =============================
app.post("/analisar", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY não configurada no servidor"
      });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "Imagem não enviada"
      });
    }

    if (typeof image !== "string") {
      return res.status(400).json({
        error: "Imagem inválida"
      });
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
Analisa a imagem de um prato, marmita ou tupperware.

Devolve APENAS JSON puro, sem markdown, sem explicações, neste formato:

[
  {
    "nome": "nome do alimento",
    "percentagem": 40,
    "calorias_100g": 130,
    "confianca": 85
  }
]

Regras obrigatórias:
- identifica todos os alimentos visíveis
- se houver dúvida, usa um nome genérico como "alimento não identificado"
- percentagem deve representar a ocupação visual no prato
- a soma das percentagens deve aproximar-se de 100
- calorias_100g deve ser um valor médio realista
- confianca deve ir de 0 a 100
- não envies texto fora do JSON
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

    if (!response.ok) {
      console.error("ERRO OPENAI:", data);
      return res.status(response.status).json({
        error: "Erro ao analisar imagem",
        detalhes: data
      });
    }

    let texto = data.output?.[0]?.content?.[0]?.text || "[]";

    texto = texto
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let alimentos = [];

    try {
      alimentos = JSON.parse(texto);

      if (!Array.isArray(alimentos)) {
        alimentos = [];
      }

    } catch (e) {
      console.error("ERRO AO CONVERTER JSON:", texto);
      alimentos = [];
    }

    const pesoTotalEstimado = 400;

    let totalCalorias = 0;

    const alimentosCompletos = alimentos.map((item) => {
      const nome = item.nome || "alimento não identificado";
      const percentagem = Number(item.percentagem) || 0;
      const calorias100g = Number(item.calorias_100g) || 0;
      const confianca = Number(item.confianca) || 0;

      const peso = Math.round((pesoTotalEstimado * percentagem) / 100);
      const calorias = Math.round((peso * calorias100g) / 100);

      totalCalorias += calorias;

      return {
        nome,
        percentagem,
        peso,
        calorias_100g: calorias100g,
        calorias,
        confianca
      };
    });

    res.json({
      sucesso: true,
      alimentos: alimentosCompletos,
      total_calorias: totalCalorias,
      peso_total_estimado: pesoTotalEstimado
    });

  } catch (error) {
    console.error("ERRO BACKEND:", error);
    res.status(500).json({
      sucesso: false,
      error: "Erro interno no backend"
    });
  }
});

// =============================
// PORTA
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor a correr na porta " + PORT);
});
