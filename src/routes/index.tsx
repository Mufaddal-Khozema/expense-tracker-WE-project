import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'
import {flexRender, getCoreRowModel, getExpandedRowModel, useReactTable} from '@tanstack/react-table'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useReducer, useState } from 'react'
import { AddCategory } from '@/components/category/add-category'
import { useCreateCategory } from '@/hooks/use-create-category'
import { useCategories } from '@/hooks/use-categories'
import { useUpdateCategory } from '@/hooks/use-update-category'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/')({
  component: App,
})

// const data = [
//   {
//     name: "food",
//     amount: 10000,
//     categories: [
//       {
//         name: "chicken",
//         amount: 70000
//       },
//       {
//         name: "other",
//         amount: 3000
//       }
//     ]
//   },
//   {
//     name: "bike",
//     amount: 10000,
//   }
// ]

function App() {
  const {data: categories, isLoading} = useCategories()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()

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
            First Name
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
        cell: ({ cell, row }) => {
          const [value, setValue] = useState<number>(cell.getValue())
          return (
            <Input
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onBlur={() => updateCategoryMutation.mutate({ 
                id: row.original.id, 
                amount: value 
              })}
            />
          )
        },
        size: 400 
      }
    ],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.categories,
  });


  return (
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
            {table.getRowModel().rows.map((row) => {
              return (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
