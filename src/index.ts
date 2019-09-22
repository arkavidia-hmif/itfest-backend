import "reflect-metadata";
import { createConnection } from "typeorm";
import * as express from "express";
import * as cors from "cors";
import userRoutes from "./routes/user"

createConnection().then(async connection => {

  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(userRoutes())

  app.listen(process.env.PORT || 3000);

  console.log("Express server has started");

}).catch(error => console.log(error));
