import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { ExternalLink, Users } from 'lucide-react'

export default async function KelasDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { userId } = await auth()

  const kelas = await prisma.kelas.findUnique({
    where: { slug },
  })

  if (!kelas) {
    notFound()
  }

  // Check if user already enrolled
  const enrollment = userId
    ? await prisma.transaction.findFirst({
        where: {
          kelasId: kelas.id,
          userId,
          status: 'success',
        },
      })
    : null

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 h-64 w-full overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4 text-6xl">📚</div>
                <p className="text-2xl font-bold">{kelas.title}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                {kelas.title}
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                {kelas.description}
              </p>
            </div>

            {/* Pricing Card */}
            <Card className="w-full md:w-96">
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <CardTitle className="text-3xl font-bold text-indigo-600">
                    Rp {kelas.price.toLocaleString('id-ID')}
                  </CardTitle>
                </div>
                <CardDescription>One-time payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollment ? (
                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      ✓ You are enrolled in this class
                    </p>
                    {kelas.groupLink && (
                      <Button asChild className="mt-3 w-full bg-green-600 hover:bg-green-700">
                        <a href={kelas.groupLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Join Group
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Link href={`/checkout/${kelas.id}`}>
                      Enroll Now
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
                About This Class
              </h2>
              <p className="text-slate-700 dark:text-slate-300">
                {kelas.description}
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
                What You'll Learn
              </h2>
              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="text-indigo-600">✓</span>
                  <span>Master the fundamentals and advanced concepts</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600">✓</span>
                  <span>Gain practical skills through hands-on projects</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600">✓</span>
                  <span>Get direct access to our expert community</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600">✓</span>
                  <span>Lifetime access to course materials</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Class Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Created</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(kelas.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
