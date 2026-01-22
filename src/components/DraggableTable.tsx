import React, { useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';

export interface ColumnConfig {
  id: string;
  label: string;
  field?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  visible: boolean;
  render?: (item: any) => React.ReactNode;
}

interface DraggableTableProps {
  columns: ColumnConfig[];
  data: any[];
  onColumnMove: (fromIndex: number, toIndex: number) => void;
  onSort?: (field: string) => void;
  sortField?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  renderSortIcon?: (field: string) => React.ReactNode;
  className?: string;
}

interface DraggableHeaderProps {
  column: ColumnConfig;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onSort?: (field: string) => void;
  sortField?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  renderSortIcon?: (field: string) => React.ReactNode;
}

function DraggableHeader({ 
  column, 
  index, 
  onMove, 
  onSort,
  sortField,
  sortOrder,
  renderSortIcon 
}: DraggableHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null);
  const dragItemRef = useRef<{ index: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    dragItemRef.current = { index };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    dragItemRef.current = null;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (dragItemRef.current) {
      const dragIndex = dragItemRef.current.index;
      const hoverIndex = index;
      
      if (dragIndex !== hoverIndex) {
        onMove(dragIndex, hoverIndex);
      }
    }
  };

  const alignClass = 
    column.align === 'center' ? 'text-center' :
    column.align === 'right' ? 'text-right' : 'text-left';

  const canSort = column.sortable && column.field && onSort;

  return (
    <th
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`px-6 py-4 ${alignClass} ${
        isDragging ? 'opacity-30 bg-blue-50' : ''
      } ${isOver ? 'bg-blue-100' : ''} transition-all bg-gray-50 cursor-move`}
    >
      <div className="flex items-center gap-2">
        <div className="hover:bg-gray-200 rounded p-1 transition-colors" title="Kéo để sắp xếp">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        {canSort ? (
          <button
            onClick={() => onSort && column.field && onSort(column.field)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#004aad] transition-colors"
          >
            {column.label}
            {renderSortIcon && column.field && renderSortIcon(column.field)}
          </button>
        ) : (
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {column.label}
          </span>
        )}
      </div>
    </th>
  );
}

export function DraggableTable({
  columns,
  data,
  onColumnMove,
  onSort,
  sortField,
  sortOrder,
  renderSortIcon,
  className = ''
}: DraggableTableProps) {
  const visibleColumns = columns.filter(c => c.visible);

  return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead>
            <tr>
              {visibleColumns.map((column, index) => (
                <DraggableHeader
                  key={column.id}
                  column={column}
                  index={index}
                  onMove={onColumnMove}
                  onSort={onSort}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  renderSortIcon={renderSortIcon}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {visibleColumns.map((column) => {
                  const alignClass = 
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left';
                  
                  return (
                    <td key={column.id} className={`px-6 py-4 ${alignClass}`}>
                      {column.render 
                        ? column.render(item) 
                        : column.field 
                          ? item[column.field] 
                          : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không có dữ liệu</p>
          </div>
        )}
      </div>
  );
}
