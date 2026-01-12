import * as Prisma from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new Prisma.PrismaClient({ adapter });

async function resetDatabase() {
  try {
    console.log('Suppression de toutes les collections et parties...');

    await prisma.$executeRawUnsafe('TRUNCATE TABLE "CoupNoeud", "TransitionPartie", "CommentaireNoeud", "PartieTag", "PartieTravail", "CalculAgregatStatut", "AgregatCoupsCollection", "CollectionClosure", "Collection" RESTART IDENTITY CASCADE');
    
    console.log('✓ Toutes les tables supprimées avec CASCADE');
    console.log('\n✅ Base de données réinitialisée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resetDatabase();
