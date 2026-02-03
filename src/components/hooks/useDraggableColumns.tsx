import { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';

export interface ColumnConfig {
  id: string;
  label: string;
  field?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  visible: boolean;
}

interface UseDraggableColumnsProps {
  defaultColumns: ColumnConfig[];
  storageKey: string;
  userId?: string;
}

export function useDraggableColumns({
  defaultColumns,
  storageKey,
  userId = 'default'
}: UseDraggableColumnsProps) {
  // Column order state with localStorage persistence
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}-${userId}`);
      return saved ? JSON.parse(saved) : defaultColumns;
    } catch {
      return defaultColumns;
    }
  });

  // Save column config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}-${userId}`, JSON.stringify(columns));
    } catch (error) {
      console.error('Failed to save column config:', error);
    }
  }, [columns, storageKey, userId]);

  // Move column function for drag & drop
  const moveColumn = (fromIndex: number, toIndex: number) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const [movedColumn] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, movedColumn);
      return newColumns;
    });
  };

  // Reset to default
  const resetColumns = () => {
    if (window.confirm('Đặt lại thứ tự cột về mặc định?')) {
      setColumns(defaultColumns);
    }
  };

  return {
    columns,
    setColumns,
    moveColumn,
    resetColumns
  };
}

interface DraggableColumnHeaderProps {
  column: ColumnConfig;
  index: number;
  moveColumn: (fromIndex: number, toIndex: number) => void;
  onSort?: (field: string) => void;
  sortField?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  renderSortIcon?: (field: string) => React.ReactNode;
}

export function DraggableColumnHeader({
  column,
  index,
  moveColumn,
  onSort,
  sortField,
  sortOrder,
  renderSortIcon
}: DraggableColumnHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null);
  // Native HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('column-index', index.toString());

    // Add dragging visual feedback
    if (ref.current) {
      ref.current.style.opacity = '0.4';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (ref.current) {
      ref.current.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (ref.current) {
      ref.current.classList.add('bg-blue-100');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (ref.current) {
      ref.current.classList.remove('bg-blue-100');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (ref.current) {
      ref.current.classList.remove('bg-blue-100');
    }

    const dragIndexStr = e.dataTransfer.getData('column-index');
    if (dragIndexStr) {
      const dragIndex = parseInt(dragIndexStr, 10);
      const hoverIndex = index;

      if (dragIndex !== hoverIndex) {
        moveColumn(dragIndex, hoverIndex);
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
      className={`px-6 py-4 ${alignClass} transition-all cursor-move`}
    >
      <div className="flex items-center gap-2">
        <div className="hover:bg-gray-200 rounded p-1 transition-colors" title="Kéo để sắp xếp">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        {canSort ? (
          <button
            onClick={() => onSort && column.field && onSort(column.field)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-[#004aad] transition-colors"
          >
            {column.label}
            {renderSortIcon && column.field && renderSortIcon(column.field)}
          </button>
        ) : (
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {column.label}
          </span>
        )}
      </div>
    </th>
  );
}
