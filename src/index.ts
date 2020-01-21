import "reflect-metadata";

import * as cors from "cors";
import * as express from "express";
import * as http from "http";
import { createConnection } from "typeorm";

import inventoryRoutes from "./routes/inventory";
import socketRoutes from "./routes/socket";
import transactionRoutes from "./routes/transaction";
import userRoutes from "./routes/user";
import tenantRoutes from "./routes/tenant";

createConnection().then(async connection => {

  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(userRoutes());
  app.use(transactionRoutes());
  app.use(inventoryRoutes());
  app.use(tenantRoutes());

  const server = http.createServer(app);

  socketRoutes

  socketRoutes(server);

  server.listen(process.env.PORT || 3000);

  console.log("Express server has started");

}).catch(error => console.log(error));
