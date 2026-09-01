import "dotenv/config";
import { createApp } from "./app.ts";
import { createDatabase } from "./db.ts";

const PORT = Number(process.env.PORT) || 3001;

const db = createDatabase();
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`Bana Ba Sawa UK API listening on http://127.0.0.1:${PORT}`);
});
