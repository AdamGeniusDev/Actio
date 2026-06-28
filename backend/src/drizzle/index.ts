import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import env from "@/lib/env";
import schema from "./schema";

// Neon serverless a besoin d'un polyfill WebSocket en environnement non-edge
// (Bun/Node) pour son mode "pooled connection".
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool, { schema });

export default db;
