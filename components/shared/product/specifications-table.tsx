import { cn } from '@/lib/utils'

interface Specification {
  label: string
  value: string
}

interface SpecificationGroup {
  title?: string
  specs: Specification[]
}

interface SpecificationsTableProps {
  specifications: SpecificationGroup[]
  title?: string
  className?: string
}

export default function SpecificationsTable({
  specifications,
  title = "Technical Specifications",
  className,
}: SpecificationsTableProps) {
  if (!specifications || specifications.length === 0) return null

  return (
    <div className={cn('space-y-6', className)}>
      {title && (
        <h3 className='text-lg font-semibold'>{title}</h3>
      )}
      
      {specifications.map((group, groupIndex) => (
        <div key={groupIndex} className='space-y-3'>
          {group.title && (
            <h4 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
              {group.title}
            </h4>
          )}
          <div className='border rounded-lg overflow-hidden'>
            <table className='w-full'>
              <tbody>
                {group.specs.map((spec, specIndex) => (
                  <tr
                    key={specIndex}
                    className={cn(
                      'border-b last:border-b-0',
                      specIndex % 2 === 0 ? 'bg-muted/30' : 'bg-background'
                    )}
                  >
                    <td className='px-4 py-3 text-sm font-medium text-muted-foreground w-1/3'>
                      {spec.label}
                    </td>
                    <td className='px-4 py-3 text-sm'>
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
