// This script seeds the database with sample data for testing
// Run with: pnpm dlx tsx scripts/seed.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample classes
  const classes = await Promise.all([
    prisma.kelas.create({
      data: {
        title: 'Web Development Fundamentals',
        slug: 'web-dev-fundamentals',
        description: 'Learn the basics of HTML, CSS, and JavaScript to build beautiful websites.',
        price: 299000,
        thumbnail: null,
        groupLink: 'https://t.me/example-group',
      },
    }),
    prisma.kelas.create({
      data: {
        title: 'Advanced React Patterns',
        slug: 'advanced-react-patterns',
        description: 'Master advanced React concepts including hooks, context, and performance optimization.',
        price: 499000,
        thumbnail: null,
        groupLink: 'https://t.me/example-group',
      },
    }),
    prisma.kelas.create({
      data: {
        title: 'Full Stack JavaScript with Next.js',
        slug: 'fullstack-nextjs',
        description: 'Build complete web applications using Next.js, including frontend and backend development.',
        price: 599000,
        thumbnail: null,
        groupLink: 'https://t.me/example-group',
      },
    }),
    prisma.kelas.create({
      data: {
        title: 'Database Design & SQL Mastery',
        slug: 'database-sql-mastery',
        description: 'Learn database design principles and SQL queries for building scalable applications.',
        price: 349000,
        thumbnail: null,
        groupLink: 'https://t.me/example-group',
      },
    }),
    prisma.kelas.create({
      data: {
        title: 'Mobile App Development with React Native',
        slug: 'react-native-mobile',
        description: 'Create iOS and Android apps using React Native with a single codebase.',
        price: 699000,
        thumbnail: null,
        groupLink: 'https://t.me/example-group',
      },
    }),
  ])

  console.log(`Created ${classes.length} sample classes`)
  console.log('Database seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
