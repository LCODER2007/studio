"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Suggestion } from "@/lib/types";
import { SuggestionStatuses } from "@/lib/types";
import { format } from "date-fns";

interface AdminSuggestionTableProps {
    suggestions: Suggestion[];
    onEdit: (suggestion: Suggestion) => void;
}

export default function AdminSuggestionTable({ suggestions, onEdit }: AdminSuggestionTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "submissionTimestamp", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<Suggestion>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div className="capitalize">{`${row.getValue("category")}`.replace(/_/g, " ").toLowerCase()}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("status")}</Badge>,
    },
    {
        accessorKey: "submissionTimestamp",
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Date Submitted</Button>,
        cell: ({ row }) => <div>{format(new Date(row.getValue("submissionTimestamp")), "PPP")}</div>,
    },
    {
        accessorKey: "upvotesCount",
        header: "Upvotes",
        cell: ({ row }) => <div className="text-center">{row.getValue("upvotesCount")}</div>,
    },
    {
        id: "avgScore",
        header: "Avg. Score",
        cell: ({ row }) => {
            const { impactScore, feasibilityRating, costEffectivenessRating } = row.original;
            if (impactScore === 0) return <div className="text-center text-muted-foreground">N/A</div>;
            const avg = ((impactScore + feasibilityRating + costEffectivenessRating) / 3).toFixed(1);
            return <div className="text-center font-mono">{avg}</div>
        }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
          <Edit className="h-4 w-4 mr-2" />
          Review
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: suggestions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
        pagination: {
            pageSize: 10,
        }
    }
  });

  React.useEffect(() => {
    table.getColumn("status")?.setFilterValue("SUBMITTED");
  }, [table]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                    Filter by Status <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                    checked={!table.getColumn("status")?.getFilterValue()}
                    onCheckedChange={() => table.getColumn("status")?.setFilterValue(undefined)}
                >
                    All Statuses
                </DropdownMenuCheckboxItem>
                {SuggestionStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={(table.getColumn("status")?.getFilterValue() as string) === status}
                        onCheckedChange={() => table.getColumn("status")?.setFilterValue(status)}
                    >
                        {status.replace(/_/g, " ").toLowerCase()}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} suggestion(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
