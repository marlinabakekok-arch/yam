// This script seeds the database with sample fashion products
// Run with: pnpm db:seed

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding fashion boutique database...')

  // Delete existing products to ensure clean seed
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.product.deleteMany({})

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Black Minimalist Hoodie',
        slug: 'black-minimalist-hoodie',
        description: 'Premium quality hoodie perfect for casual wear. Comfortable and stylish.',
        price: 299000,
        category: 'fashion',
        images: [
          'https://images.unsplash.com/photo-1556821552-7f41c5d440db?w=500',
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'White', 'Gray', 'Navy'],
        stock: 50,
      },
    }),
    prisma.product.create({
      data: {
        name: 'White Cotton T-Shirt',
        slug: 'white-cotton-tshirt',
        description: 'Classic white t-shirt made from 100% cotton. Perfect for everyday wear.',
        price: 149000,
        category: 'fashion',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['White', 'Black', 'Red', 'Blue'],
        stock: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gold Pendant Necklace',
        slug: 'gold-pendant-necklace',
        description: 'Elegant gold pendant necklace with 18K gold plating. Perfect for any occasion.',
        price: 450000,
        category: 'kalung',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500',
        ],
        sizes: ['One Size'],
        colors: ['Gold', 'Silver', 'Rose Gold'],
        stock: 30,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Blue Denim Jacket',
        slug: 'blue-denim-jacket',
        description: 'Classic denim jacket with adjustable fit. Great for layering.',
        price: 599000,
        category: 'fashion',
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500',
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Light Blue', 'Dark Blue', 'Black'],
        stock: 25,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Silver Chain Bracelet',
        slug: 'silver-chain-bracelet',
        description: 'Beautiful silver chain bracelet with clasp. Adjustable size.',
        price: 299000,
        category: 'kalung',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500',
        ],
        sizes: ['15cm', '17cm', '19cm', '21cm'],
        colors: ['Silver', 'Gold', 'Rose Gold'],
        stock: 40,
      },
    }),
  ])

  console.log(`Created ${products.length} fashion products`)
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
