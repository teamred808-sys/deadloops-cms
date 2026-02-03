import { useState, useMemo } from 'react';
import { ComparisonTableData } from '@/types/seo';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ComparisonTableProps {
  data: ComparisonTableData;
  className?: string;
  title?: string;
  sortable?: boolean;
  striped?: boolean;
  sticky?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export default function ComparisonTable({
  data,
  className,
  title,
  sortable = true,
  striped = true,
  sticky = true,
}: ComparisonTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Sort rows based on current sort state
  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return data.rows;

    return [...data.rows].sort((a, b) => {
      const aValue = a.cells[sortColumn] || '';
      const bValue = b.cells[sortColumn] || '';

      // Try numeric comparison first
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Fall back to string comparison
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data.rows, sortColumn, sortDirection]);

  const handleSort = (columnId: string) => {
    if (!sortable) return;

    if (sortColumn === columnId) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  if (data.columns.length === 0 || data.rows.length === 0) {
    return <ComparisonTablePlaceholder className={className} />;
  }

  return (
    <div className={cn('', className)}>
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}

      <ScrollArea className="w-full">
        <div className="min-w-full">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                {data.columns.map((column, index) => (
                  <th
                    key={column.id}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-foreground',
                      sticky && index === 0 && 'sticky left-0 bg-background z-10',
                      sortable && 'cursor-pointer hover:bg-muted/50 select-none'
                    )}
                    onClick={() => handleSort(column.id)}
                  >
                    <span className="flex items-center">
                      {column.header}
                      {sortable && getSortIcon(column.id)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b',
                    striped && rowIndex % 2 === 1 && 'bg-muted/30'
                  )}
                >
                  {data.columns.map((column, colIndex) => (
                    <td
                      key={column.id}
                      className={cn(
                        'px-4 py-3',
                        sticky && colIndex === 0 && 'sticky left-0 bg-background font-medium'
                      )}
                    >
                      {row.cells[column.id] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// Empty placeholder for admin
export function ComparisonTablePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center text-muted-foreground',
        className
      )}
    >
      <p className="font-medium">Comparison Table</p>
      <p className="text-sm mt-1">
        Add comparison data in the post editor to display a feature comparison table
      </p>
    </div>
  );
}

// Helper to create empty table structure
export function createEmptyComparisonTable(
  columnCount: number = 3,
  rowCount: number = 5
): ComparisonTableData {
  const columns = Array.from({ length: columnCount }, (_, i) => ({
    id: `col-${i}`,
    header: '', // To be filled by site owner
  }));

  const rows = Array.from({ length: rowCount }, (_, i) => ({
    id: `row-${i}`,
    cells: columns.reduce(
      (acc, col) => {
        acc[col.id] = ''; // To be filled by site owner
        return acc;
      },
      {} as Record<string, string>
    ),
  }));

  return { columns, rows };
}
