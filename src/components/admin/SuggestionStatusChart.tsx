"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Suggestion, SuggestionStatus } from "@/lib/types"
import { SuggestionStatuses } from "@/lib/types"


const chartConfig = {
  count: {
    label: "Count",
  },
  SUBMITTED: {
    label: "Submitted",
    color: "hsl(var(--chart-1))",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "hsl(var(--chart-2))",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    color: "hsl(var(--chart-3))",
  },
  ARCHIVED_REJECTED: {
    label: "Archived",
    color: "hsl(var(--chart-4))",
  },
  IMPLEMENTED: {
    label: "Implemented",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

interface SuggestionStatusChartProps {
    suggestions: Suggestion[];
}

export function SuggestionStatusChart({ suggestions }: SuggestionStatusChartProps) {
  const data = React.useMemo(() => {
    const statusCounts = suggestions.reduce((acc, suggestion) => {
        acc[suggestion.status] = (acc[suggestion.status] || 0) + 1;
        return acc;
    }, {} as Record<SuggestionStatus, number>);

    return SuggestionStatuses.map(status => ({
        status: status,
        count: statusCounts[status] || 0,
        fill: `var(--color-${status})`,
    }));
  }, [suggestions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggestion Status Overview</CardTitle>
        <CardDescription>A breakdown of all suggestions by their current status.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="status"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label.substring(0, 3)}
              />
              <YAxis />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="count" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
