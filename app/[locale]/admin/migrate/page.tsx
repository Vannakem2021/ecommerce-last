'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
// import { runCompleteMigration } from '@/lib/db/migrate-brands-categories'
import { migrateProductSales, rollbackProductSalesMigration } from '@/lib/migrations/migrate-product-sales'

export default function MigrationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string>('')
  const [salesMigrationRunning, setSalesMigrationRunning] = useState(false)
  const [salesMigrationResult, setSalesMigrationResult] = useState<string>('')

  const handleMigration = async () => {
    setIsRunning(true)
    setResult('Running migration...')

    try {
      // const migrationResult = await runCompleteMigration()
      // setResult(migrationResult.message)
      setResult('Migration feature temporarily disabled')
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSalesMigration = async (dryRun: boolean = false) => {
    setSalesMigrationRunning(true)
    setSalesMigrationResult(dryRun ? 'Running dry run...' : 'Running migration...')

    try {
      const migrationResult = await migrateProductSales(dryRun)
      setSalesMigrationResult(
        `${migrationResult.success ? 'Success' : 'Failed'}: ${migrationResult.message}\n` +
        `Migrated: ${migrationResult.migratedCount} products\n` +
        (migrationResult.errors.length > 0 ? `Errors:\n${migrationResult.errors.join('\n')}` : '')
      )
    } catch (error) {
      setSalesMigrationResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSalesMigrationRunning(false)
    }
  }

  const handleSalesRollback = async () => {
    setSalesMigrationRunning(true)
    setSalesMigrationResult('Running rollback...')

    try {
      const rollbackResult = await rollbackProductSalesMigration()
      setSalesMigrationResult(
        `${rollbackResult.success ? 'Success' : 'Failed'}: ${rollbackResult.message}\n` +
        `Rolled back: ${rollbackResult.migratedCount} products\n` +
        (rollbackResult.errors.length > 0 ? `Errors:\n${rollbackResult.errors.join('\n')}` : '')
      )
    } catch (error) {
      setSalesMigrationResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSalesMigrationRunning(false)
    }
  }

  return (
    <div className='max-w-4xl mx-auto p-4 space-y-6'>
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

      <Card>
        <CardHeader>
          <CardTitle>Simplified Sales System Migration</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-muted-foreground'>
              This migrates products from tag-based &quot;todays-deal&quot; system to simplified time-based sales.
            </p>
            <div className='text-sm text-muted-foreground space-y-1'>
              <p><strong>What this does:</strong></p>
              <ul className='list-disc list-inside space-y-1 ml-2'>
                <li>Converts products with &quot;todays-deal&quot; tag to time-based sales</li>
                <li>Sets sale period (30 days from migration date)</li>
                <li>Removes the manual &quot;todays-deal&quot; tag</li>
                <li>Products become eligible for Today&apos;s Deals through database logic</li>
              </ul>
              <p className='mt-2'><strong>Simplified approach:</strong> No complex salePrice field needed - uses regular price with time-based availability.</p>
            </div>
          </div>

          <div className='bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4'>
            <p className='text-sm text-blue-800 dark:text-blue-200'>
              <strong>Migration Benefits:</strong> This simplifies your sales system by using database logic instead of manual tags.
              Today&apos;s Deals will automatically update based on sale periods without manual intervention.
            </p>
          </div>

          <div className='bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-4'>
            <p className='text-sm text-yellow-800 dark:text-yellow-200'>
              <strong>Backup recommended:</strong> While this migration is reversible, backing up your database is recommended before proceeding.
            </p>
          </div>

          <div className='flex gap-2 flex-wrap'>
            <Button
              onClick={() => handleSalesMigration(true)}
              disabled={salesMigrationRunning}
              variant="outline"
            >
              {salesMigrationRunning ? 'Running...' : 'Dry Run (Preview)'}
            </Button>

            <Button
              onClick={() => handleSalesMigration(false)}
              disabled={salesMigrationRunning}
              variant="default"
            >
              {salesMigrationRunning ? 'Running Migration...' : 'Run Migration'}
            </Button>

            <Button
              onClick={handleSalesRollback}
              disabled={salesMigrationRunning}
              variant="destructive"
            >
              {salesMigrationRunning ? 'Running Rollback...' : 'Rollback Migration'}
            </Button>
          </div>

          {salesMigrationResult && (
            <div className='mt-4 p-4 bg-muted rounded-md'>
              <pre className='whitespace-pre-wrap text-sm'>{salesMigrationResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
