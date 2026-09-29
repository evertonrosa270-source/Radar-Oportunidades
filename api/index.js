import { app, dbReady } from "../server.js";

export default async function handler(req, res) {
  await dbReady;
  return app(req, res);
}
