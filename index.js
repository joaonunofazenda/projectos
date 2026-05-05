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
Analisa a imagem e devolve APENAS JSON puro:

[
  {
    "nome": "alimento",
    "percentagem": numero_0_a_100,
    "calorias_100g": numero
  }
]

Regras:
- identificar TODOS os alimentos
- percentagem relativa do prato (estimativa visual)
- calorias por 100g (valor médio)
- soma das percentagens ~100
- sem texto extra
- sem markdown
- só JSON válido
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

    texto = texto.replace(/```json/g, "")
                 .replace(/```/g, "")
                 .trim();

    let alimentos = [];

    try {
      alimentos = JSON.parse(texto);
    } catch (e) {
      console.error("Erro parse JSON:", texto);
      alimentos = [];
    }

    // 🔥 PESO TOTAL FIXO BASE (ajustado depois no Android)
    const pesoTotalEstimado = 400; // gramas (base média prato)

    let totalCalorias = 0;

    const alimentosCompletos = alimentos.map(item => {

      const percent = Number(item.percentagem) || 0;
      const kcal100g = Number(item.calorias_100g) || 0;

      const peso = (pesoTotalEstimado * percent) / 100;
      const calorias = Math.round((peso * kcal100g) / 100);

      totalCalorias += calorias;

      return {
        nome: item.nome,
        percentagem: percent,
        peso: Math.round(peso),
        calorias: calorias
      };
    });

    res.json({
      alimentos: alimentosCompletos,
      total_calorias: totalCalorias,
      peso_total: pesoTotalEstimado
    });

  } catch (error) {
    console.error("ERRO BACKEND:", error);
    res.status(500).json({ error: "erro backend" });
  }
});

// 🔥 PORTA
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor a correr na porta " + PORT);
});
