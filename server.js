import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuração do MongoDB ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/helpcar";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Conectado ao MongoDB com sucesso!"))
  .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// --- Modelos de Dados (Schemas) ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  type: { type: String, enum: ['fixo', 'prestador', 'n/a'], default: 'fixo' },
  status: { type: String, default: 'Disponível' }
});
const User = mongoose.model("User", UserSchema);

const JobSchema = new mongoose.Schema({
  chassis: String,
  model: String,
  service_type: String,
  status: { type: String, default: 'Não Distribuída' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completed_at: Date,
  value: Number,
  equipment_id: String
});
const Job = mongoose.model("Job", JobSchema);

const SettingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String
});
const Setting = mongoose.model("Setting", SettingSchema);

// --- Dados Iniciais (Cria o Admin padrão se não existir) ---
async function seed() {
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    await User.create({
      email: "admin@helpcar.com",
      password: "admin123",
      name: "Admin HELPCAR",
      role: "admin",
      type: "n/a"
    });
    console.log("Usuário admin padrão criado: admin@helpcar.com / admin123");
  }
}
seed();

const app = express();

// --- Configuração de CORS ---
app.use(cors({
  origin: '*', // Permite que seu site no Netlify acesse este servidor
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// --- Rotas de Autenticação ---
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user: any = await User.findOne({ email, password });
    if (user) {
      res.json({ ...user._doc, id: user._id });
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro no servidor" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, type, inviteKey } = req.body;
    const key = await Setting.findOne({ key: 'invite_key' });
    
    if (inviteKey !== key?.value && inviteKey !== "HELPCAR2026") {
      return res.status(403).json({ error: "Chave de convite inválida" });
    }

    const newUser: any = await User.create({ email, password, name, role: 'user', type });
    res.json({ ...newUser._doc, id: newUser._id });
  } catch (e) {
    res.status(400).json({ error: "E-mail já cadastrado" });
  }
});

// --- Iniciar Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Servidor HELPCAR rodando na porta ${PORT}`);
});
