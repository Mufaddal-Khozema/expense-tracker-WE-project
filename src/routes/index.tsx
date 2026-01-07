import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'
import {flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type ColumnDef, type Row} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight, Grip, Plus } from 'lucide-react'
import { useMemo, useReducer, useState, type CSSProperties } from 'react'
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
import { Button } from '@/components/ui/button'
import { AddCategory } from '@/components/category/add-category'
import { cn, formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { useAccounts } from '@/hooks/use-accounts'

export const Route = createFileRoute('/')({
  component: App,
})

const RowDragHandleCell = ({ rowId }: { rowId: string }) => {
  const { attributes, listeners } = useSortable({
    id: rowId,
  })
  return (
    // Alternatively, you could set these attributes on the rows themselves
    <button {...attributes} {...listeners}>
      <Grip className="text-gray-500" />
    </button>
  )
}

function App() {
  const {data: categories, isLoading, refetch} = useCategories()
  const {data: accounts} = useAccounts()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const reorderCategoryMutation = useReorderCategory()


  const columns: ColumnDef<Category>[] = useMemo(() => ([
      {
        id: 'drag-handle',
        header: '',
        cell: ({ row }) => <RowDragHandleCell rowId={row.id} />,
        size: 60,
      },
      {
        accessorKey: 'firstName',
        header: ({ table }) => (
          <button
            {...{
              onClick: table.getToggleAllRowsExpandedHandler(),
            }}
          >
            {table.getIsAllRowsExpanded() ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </button>
        ),
        cell: ({ row, getValue }) => (
          <div
            style={{
              paddingLeft: `${row.depth * 2}rem`,
            }}
          >
            <div>
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
      {
        accessorKey: "name",
        header: "Name",
        size: 400,
        cell: ({ row }) => {
          const name = row.original.name

          return (
            <div className="group flex items-center gap-2">
              <AddCategory 
                name={name}
                mode="edit"
                id={row.original.id}
                trigger={
                  <Button 
                    variant="ghost"
                    className="font-normal hover:underline hover:bg-transparent px-0"
                    //className={`opacity-0 group-hover:opacity-100 transition-opacity 
                    //  text-xs text-white text-muted-foreground hover:text-primary 
                    //  rounded-full h-6 w-4`}
                  >
                    {name}
                  </Button>
                } 
             />

              {row.depth == 0 && <AddCategory 
                parentId={row.original.id}
                trigger={
                  <Button 
                    className={`opacity-0 group-hover:opacity-100 transition-opacity 
                      text-xs text-white text-muted-foreground hover:text-primary 
                      rounded-full h-6 w-4`}
                  >
                    <Plus className="text-white" size={4} />
                  </Button>
                } 
               />}
            </div>
          )
        },
      },
      { 
        accessorKey: "amount", 
        header: "Amount",
        cell: ({ cell, row }) => (
          row.depth == 0 ? (
            <span>{formatCurrency(cell.getValue() as number)}</span>
          ) : (
            <EditableField 
              onBlur={(value) => updateCategoryMutation.mutate({ 
                id: row.original.id, 
                amount: Number(value)
              })}
              value={cell.getValue()}
            />
            )
          ),
        size: 400 
      }
  ]), [])

  const table = useReactTable({
    data: categories??[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.categories,
    getRowId: (row) => row.id
  });

  // Row Component
  const DraggableRow = ({ row }: { row: Row<Category> }) => {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
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
      <TableRow ref={setNodeRef} style={style} className={cn(row.depth == 0 ? 'bg-gray-100' : 'bg-white')}>
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl">Categories</h1>
          <Card className="p-3 w-48">
            <CardContent className="flex flex-col p-0">
              <span className="text-right">{formatCurrency((accounts??[]).reduce((acc, account) => acc + (account.balance??0), 0) - (categories??[]).reduce((acc, cat) => acc + (cat.amount??0), 0))}</span>
              <span className="text-xs">Able to assign</span>
            </CardContent>
          </Card>
        </div>
        <AddCategory trigger={<Button>Add Category</Button>} />
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

