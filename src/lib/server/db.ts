import * as Prisma from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "$env/dynamic/private";

// Créer un pool de connexions PostgreSQL
const pool = new Pool({ connectionString: env.DATABASE_URL });

// Créer l'adapter Prisma pour PostgreSQL
const adapter = new PrismaPg(pool);

// Créer et exporter une instance unique de PrismaClient
export const prisma = new Prisma.PrismaClient({ adapter });
