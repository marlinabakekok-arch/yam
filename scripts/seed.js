// This script seeds the database with sample data for testing
// Run with: pnpm dlx tsx scripts/seed.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up database - keeping only y and yy classes...')

  // Delete all classes except y and yy
  const deleted = await prisma.kelas.deleteMany({
    where: {
      slug: {
        notIn: ['y', 'yy'],
      },
    },
  })

  console.log(`Deleted ${deleted.count} demo classes`)
  console.log('Database cleanup complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
