import React from 'react'
import { Star } from 'lucide-react'

export default function Rating({
  rating = 0,
  size = 6,
}: {
  rating: number
  size?: number
}) {
  const fullStars = Math.floor(rating)
  const partialStar = rating % 1
  const emptyStars = 5 - Math.ceil(rating)

  // Map size to Tailwind classes
  const sizeClass = size === 12 ? 'w-3 h-3' : size === 14 ? 'w-3.5 h-3.5' : 'w-6 h-6'

  return (
    <div
      className='flex items-center'
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${sizeClass} fill-yellow-400 text-yellow-400`}
        />
      ))}
      {partialStar > 0 && (
        <div className='relative inline-block'>
          <Star className={`${sizeClass} text-gray-300 dark:text-gray-600`} />
          <div
            className='absolute top-0 left-0 overflow-hidden'
            style={{ width: `${partialStar * 100}%` }}
          >
            <Star className={`${sizeClass} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`${sizeClass} text-gray-300 dark:text-gray-600`}
        />
      ))}
    </div>
  )
}
