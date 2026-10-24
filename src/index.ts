import "dotenv/config";
import express from "express";
import subjectRouter from "./routes/subject.js";
import cors from 'cors'
import securityMiddleware from "./middleware/security.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth.js'

const app = express();
const port = 8000;

if(!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is not set in .env file')
}

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}))

//Middlewares
app.all('/api/auth/{*splat', toNodeHandler(auth));
app.use(express.json());
app.use(securityMiddleware)

app.use('/api/subjects', subjectRouter);

app.get("/", (_request, response) => {
  response.send("Classroom Management API is running.");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});