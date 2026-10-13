import express from "express";
import subjectsRouter from "./routes/subjects.js";
import cors from 'cors'

const app = express();
const port = 8000;
app.use(cors({
  origin: process.env.FRONTEND_URL ,
  methods: ['GET','POST', 'PUT','DELETE'],
  credentials: true
}))

app.use(express.json());
app.use("/api/subjects", subjectsRouter);

app.get("/", (_req, res) => {
  res.send("Classroom management server is running.");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});