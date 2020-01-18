import "reflect-metadata";
import { createConnection } from "typeorm";
import * as express from "express";
import * as cors from "cors";
import userRoutes from "./routes/user";
import transactionRoutes from "./routes/transaction";
import inventoryRoutes from "./routes/inventory";


createConnection().then(async connection => {

  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(userRoutes());
  app.use(transactionRoutes());
  app.use(inventoryRoutes());

  app.listen(process.env.PORT || 3000);

  console.log("Express server has started");

}).catch(error => console.log(error));
