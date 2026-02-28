import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// --- Configuração do MongoDB ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/helpcar";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Conectado ao MongoDB com sucesso!"))
  .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// --- Modelos de Dados ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  type: { type: String, enum: ['fixo', 'prestador', 'n/a'], default: 'fixo' },
  status: { type: String, default: 'Disponível' }
});
const User = mongoose.model("User", UserSchema);

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- Rotas de Autenticação ---
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = await User.findOne({ email, password });
  if (user) {
    res.json({ ...user._doc, id: user._id });
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Servidor HELPCAR rodando na porta ${PORT}`);
});
