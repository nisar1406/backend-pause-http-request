import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import fileRoutes from "./routes/file";

const app = express();


const whitelist = ['http://localhost:3000', 'https://pause-http-request.vercel.app/'];

app.use(cors({origin: whitelist}));
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
app.use('/file', fileRoutes);

app.listen(9000, () => console.log("Server started"));
