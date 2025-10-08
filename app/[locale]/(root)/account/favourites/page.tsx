import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'My Favourites',
}

export default async function FavouritesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Favourites</h1>
        <p className="text-muted-foreground">
          Products you've saved for later
        </p>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No favourites yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Start adding products to your favourites by clicking the heart icon on product cards
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
