import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'
import {flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type Row} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useReducer, useState, type CSSProperties } from 'react'
import { AddCategory } from '@/components/category/add-category'
import { useCreateCategory } from '@/hooks/use-create-category'
import { useCategories } from '@/hooks/use-categories'
import { useUpdateCategory } from '@/hooks/use-update-category'
import { Input } from '@/components/ui/input'
import { EditableField } from '@/components/ui/editable-feild'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category } from '@/api/categories'
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type UniqueIdentifier } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useReorderCategory } from '@/hooks/use-reorder-category'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const {data: categories, isLoading, refetch} = useCategories()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const reorderCategoryMutation = useReorderCategory()

  const table = useReactTable({
    data: categories??[],
    columns: [
      {
        accessorKey: 'firstName',
        header: ({ table }) => (
          <>
            <input
              type="checkbox"
              {...{
                checked: table.getIsAllRowsSelected(),
                onChange: table.getToggleAllRowsSelectedHandler(),
              }}
            />{' '}
            <button
              {...{
                onClick: table.getToggleAllRowsExpandedHandler(),
              }}
            >
              {table.getIsAllRowsExpanded() ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
            </button>{' '}
          </>
        ),
        cell: ({ row, getValue }) => (
          <div
            style={{
              // Since rows are flattened by default,
              // we can use the row.depth property
              // and paddingLeft to visually indicate the depth
              // of the row
              paddingLeft: `${row.depth * 2}rem`,
            }}
          >
            <div>
              <input
                type="checkbox"
                {...{
                  checked: row.getIsSelected(),
                  onChange: row.getToggleSelectedHandler(),
                }}
              />{' '}
              {row.getCanExpand() && (
                <button
                  {...{
                    onClick: row.getToggleExpandedHandler(),
                    style: { cursor: 'pointer' },
                  }}
                >
                  {row.getIsExpanded() ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </button>
              )}{' '}
              {getValue<boolean>()}
            </div>
          </div>
        ),
        footer: (props) => props.column.id,
        size: 120, // small
      },
      { accessorKey: "name", size: 400 },
      { 
        accessorKey: "amount", 
        cell: ({ cell, row }) => (
          <EditableField 
            onBlur={(value) => updateCategoryMutation.mutate({ 
              id: row.original.id, 
              amount: Number(value)
            })}
            value={cell.getValue()}
          />
        ),
        size: 400 
      }
    ],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.categories,
  });

  // Row Component
  const DraggableRow = ({ row }: { row: Row<Category> }) => {
    const { transform, transition, setNodeRef, isDragging, attributes, listeners } = useSortable({
      id: row.original.id,
    })

    const style: CSSProperties = {
      transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
      transition: transition,
      opacity: isDragging ? 0.8 : 1,
      zIndex: isDragging ? 1 : 0,
      position: 'relative',
    }
    return (
      // connect row ref to dnd-kit, apply important styles
      <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    )
  }

  const dataIds = useMemo<UniqueIdentifier[]>(
    () => categories?.map(({ id }) => id) ?? [],
    [categories]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      //setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        async function reorder() {
          await reorderCategoryMutation.mutateAsync({
            id: Number(active.id), 
            oldIndex, 
            newIndex
          }); 
          refetch()
        }
        reorder()
      //});
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
    <main className="w-full h-full overflow-hidden">
      <section className="p-5 space-y-5">
        <h1 className="text-3xl">Categories</h1>
        <AddCategory />
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
            {table.getRowModel().rows.map((row) => {
              return (
                <DraggableRow key={row.id} row={row} />
              )
            })}
            </SortableContext>
          </TableBody>
        </Table>
      </section>
    </main>
    </DndContext>
  )
}

