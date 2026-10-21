import express from "express";
import subjectRouter from "./routes/subject.js";
import cors from 'cors'

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

app.use(express.json());

app.use('/api/subjects', subjectRouter);

app.get("/", (_request, response) => {
  response.send("Classroom Management API is running.");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});