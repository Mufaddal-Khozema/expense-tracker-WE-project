import type { Transaction } from "@/api/transactions";
import { useTransactions } from "@/hooks/use-transactions";
import { createFileRoute } from "@tanstack/react-router"
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type ColumnDef, type Row } from "@tanstack/react-table";
import { Fragment, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useAccounts } from "@/hooks/use-accounts";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-categories";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useCreateTransaction } from "@/hooks/use-create-transaction";

export const Route = createFileRoute('/transactions')({
  component: TransactionPage,
})

const initialPlaceholder: Transaction = {
  id: 0,
  account_id: 1,
  category_id: "xyz",
  date: "2023-01-01",
  memo: "memo",
  amount: 100,
  payee: "payee",
}

const SubComponent = ({ 
  row, 
  setIsAdding, 
  placeholder
}: { 
  row: Row<Transaction> 
  setIsAdding: React.Dispatch<React.SetStateAction<boolean>>
  placeholder: Transaction
}) => {
  const createTransaction = useCreateTransaction();
  const onSave = () => {
    createTransaction.mutate(placeholder)
  }

  return (
    <>
    <pre style={{ fontSize: '10px' }}>
      <code>{JSON.stringify(placeholder, null, 2)}</code>
    </pre>
    <div className="flex justify-end gap-2">
      <Button
        onClick={onSave}
        className="bg-black text-white"
      >
        Save
      </Button>

      <Button
        variant="ghost"
        onClick={() => {
          setIsAdding(false)
        }}
      >
        Cancel
      </Button>
    </div>
    </>
  )
}

function TransactionPage() {
  const {data: transactionsApi, isLoading, refetch} = useTransactions()
  const {data: accounts} = useAccounts()
  const {data: categories} = useCategories()
  const [placeholder, setPlaceholder] = useState<Transaction>(initialPlaceholder)
  const [isAdding, setIsAdding] = useState(false)

  const setPlaceholderValue = (key: keyof Transaction, value: number) => {
    setPlaceholder((placeholder) => ({...placeholder, [key]: value}))
  }

  const columns: ColumnDef<Transaction>[] = useMemo(() => ([
      {
        accessorKey: 'account',
        header: 'ACCOUNT',
        cell: ({ row, cell }) => {
          const s = table.options.meta
          if (!s?.isAdding || row.original.id != 0) return cell.getValue() as string

          return (
            <Select
              value={String(s?.placeholder?.account_id)}
              onValueChange={(value) => setPlaceholderValue("account_id", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {s?.accounts?.map(account => (
                  <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
        size: 60,
      },
      {
        accessorKey: 'date',
        header: 'DATE',
        cell: ({ row, cell }) => {
          const s = table.options.meta
          if (!s?.isAdding || row.original.id != 0) return cell.getValue() as string

          return (
            <DatePicker 
              mode="single"
              selected={s?.placeholder?.date}
              captionLayout="dropdown"
              onSelect={(date) => {
                setPlaceholderValue("date", date)
              }}
            />
          )
        },
        size: 60,
      },
      {
        accessorKey: 'payee',
        header: 'PAYEE',
        cell: ({ row, cell }) => {
          const s = table.options.meta
          if (!s?.isAdding || row.original.id != 0) return cell.getValue() as string

          return (
            <Input
              value={s?.placeholder?.payee}
              onChange={(e) => setPlaceholderValue("payee", e.target.value)}
              placeholder="Enter payee"
              className="w-32"
            />
          )
        },
        size: 60,
      },
      {
        accessorKey: 'category',
        header: 'CATEGORY',
        cell: ({ row, cell }) => {
          const s = table.options.meta
          if (!s?.isAdding || row.original.id != 0) return cell.getValue() as string

          return (
            <Select
              value={String(s?.placeholder?.category_id)}
              onValueChange={(value) => setPlaceholderValue("category_id", Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {s?.categories?.map(category => (
                  <SelectGroup>
                    <SelectLabel>{category.name}</SelectLabel>
                    {category.categories.map(category => ( 
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )
        },
        size: 60,
      },
      {
        accessorKey: 'memo',
        header: 'MEMO',
        cell: ({ row, cell }) => {
          const s = table.options.meta
          if (!s?.isAdding || row.original.id != 0) return cell.getValue() as string

          return (
            <Input
              value={s?.placeholder?.memo}
              onChange={(e) => setPlaceholderValue("memo", e.target.value)}
              placeholder="Enter memo"
              className="w-32"
            />
          )
        },
        size: 60,
      },
      {
        accessorKey: 'amount',
        header: 'AMOUNT',
        cell: ({ row, cell }) => {
          const s = table.options.meta
          if (!s?.isAdding || row.original.id != 0) return cell.getValue() as string

          return (
            <CurrencyInput
              value={String(s?.placeholder?.amount)}
              onChange={(e) => setPlaceholderValue("amount", Number(e.target.value))}
              placeholder="Enter memo"
              className="w-32"
            />
          )
        },
        size: 60,
      },
    ]), [])

  const transactions = useMemo(() => {
    const transactions = transactionsApi??[]
    if (!isAdding) return transactions
    return transactions.concat(placeholder) }, [transactionsApi, isAdding])
  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    getExpandedRowModel: getExpandedRowModel(),
    getIsRowExpanded: (row) => row.id === '0',
    meta: {
      isAdding,
      placeholder,
      accounts,
      categories
    },
  });

  return (
    <main className="w-full h-full overflow-hidden">
      <section className="p-5 space-y-5">
        <h1 className="text-3xl">Transactions</h1>
        <Button
          onClick={() => setIsAdding(true)}
        >
          Add Transaction
        </Button>
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
              return (<Fragment key={row.id}>
                <TableRow>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell colSpan={row.getVisibleCells().length}>
                      <SubComponent 
                        row={row} 
                        setIsAdding={setIsAdding} 
                        placeholder={placeholder}
                      />
                    </TableCell>
                  </TableRow>
                )}
            </Fragment>)})}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
