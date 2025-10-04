/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import useColorStore from '@/hooks/use-color-store'
import { useTheme } from 'next-themes'
import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  Cell,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: { value: number; payload: { _id: string } }[]
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Card>
        <CardContent className="p-2">
          <p className="text-sm font-semibold">{payload[0].payload._id}</p>
          <p className="text-primary text-lg font-bold">
            {payload[0].value} sales
          </p>
        </CardContent>
      </Card>
    )
  }
  return null
}

export default function SalesCategoryBarChart({ data }: { data: any[] }) {
  const { theme } = useTheme()
  const { cssColors } = useColorStore(theme)

  // Sort data by totalSales descending
  const sortedData = [...data].sort((a, b) => b.totalSales - a.totalSales)

  // Generate colors using theme's primary color with varying opacity
  const generateColors = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const opacity = 0.9 - (i * 0.15) // Decreasing opacity for visual distinction
      return `hsl(${cssColors['--primary']} / ${Math.max(opacity, 0.4)})`
    })
  }

  const colors = generateColors(sortedData.length)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        barSize={30}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" fontSize={12} />
        <YAxis
          type="category"
          dataKey="_id"
          fontSize={12}
          width={90}
          tick={{ fill: 'currentColor' }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
