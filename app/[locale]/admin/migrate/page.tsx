'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { runCompleteMigration } from '@/lib/db/migrate-brands-categories'
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
      const migrationResult = await runCompleteMigration()
      setResult(migrationResult.message)
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
          <CardTitle>Product Sales System Migration</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            This will migrate products from the tag-based "todays-deal" system to the new time-based sale system.
            Products with "todays-deal" tag will get sale dates (30 days from now) and the tag will be removed.
          </p>

          <div className='bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-4'>
            <p className='text-sm text-yellow-800 dark:text-yellow-200'>
              <strong>Warning:</strong> Please backup your database before running this migration.
              This operation modifies product data and cannot be easily undone without the rollback function.
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
