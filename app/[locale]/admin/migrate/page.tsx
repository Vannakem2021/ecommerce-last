'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { runCompleteMigration } from '@/lib/db/migrate-brands-categories'

export default function MigrationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleMigration = async () => {
    setIsRunning(true)
    setResult('Running migration...')
    
    try {
      const migrationResult = await runCompleteMigration()
      setResult(migrationResult.message)
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Database Migration</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            This will migrate existing brands and categories from products into separate collections.
            This is a one-time operation that should be run before updating the product model.
          </p>
          
          <Button 
            onClick={handleMigration} 
            disabled={isRunning}
            variant="default"
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </Button>
          
          {result && (
            <div className='mt-4 p-4 bg-muted rounded-md'>
              <pre className='whitespace-pre-wrap text-sm'>{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
