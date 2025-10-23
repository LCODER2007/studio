"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import type { Suggestion } from "@/lib/types";

interface ResourceAllocationProps {
    suggestions: Suggestion[];
}

export function ResourceAllocation({ suggestions }: ResourceAllocationProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
            <CardDescription>Overview of resources allocated to implemented suggestions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Suggestion</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suggestions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                No implemented suggestions yet.
                            </TableCell>
                        </TableRow>
                    )}
                    {suggestions.map((suggestion) => (
                        <TableRow key={suggestion.suggestionId}>
                            <TableCell className="font-medium">{suggestion.title}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {suggestion.category.replace(/_/g, " ").toLowerCase()}
                                </Badge>
                            </TableCell>
                            {/* Placeholder for cost */}
                            <TableCell className="text-right">$ {(suggestion.costEffectivenessRating * 1250).toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
      </CardContent>
    </Card>
  )
}
