import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const classes = await prisma.kelas.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-balance text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">
            Learn What You Love
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Discover and join online classes taught by experts. Learn at your own pace.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#classes">Browse Classes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Classes Section */}
      <section id="classes" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-balance text-3xl font-bold text-slate-900 dark:text-white">
          Featured Classes
        </h2>

        {classes.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
            <p className="text-slate-600 dark:text-slate-400">No classes available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((kelas) => (
              <Link key={kelas.id} href={`/kelas/${kelas.slug}`}>
                <Card className="h-full transition-all hover:shadow-lg hover:ring-2 hover:ring-indigo-600">
                  {kelas.thumbnail && (
                    <div className="h-48 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                      {/* Placeholder for thumbnail */}
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center text-white">
                          <div className="mb-2 text-4xl">📚</div>
                          <p className="text-sm font-medium">{kelas.title.slice(0, 20)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{kelas.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{kelas.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Price</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          Rp {kelas.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Button size="sm">Enroll Now</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
