import React from 'react';

interface DndWrapperProps {
  children: React.ReactNode;
}

// Temporary: Disable DnD to fix "Cannot have two HTML5 backends" error
// Will re-implement with @dnd-kit or native HTML5 DnD later
export function DndWrapper({ children }: DndWrapperProps) {
  return <>{children}</>;
}
