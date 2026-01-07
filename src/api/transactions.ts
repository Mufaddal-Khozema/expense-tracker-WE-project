import { api } from "@/api/client";

export type Transaction = {
  id: number
  account_id: number
  category_id?: number | null
  payee?: string | null
  memo?: string | null
  amount: number
  date: string
  transfer_account_id?: number | null
  created_at: string
  updated_at: string
  is_deleted: number
}

export function createTransaction(input: {
  account_id: number
  category_id?: number | null
  payee?: string | null
  memo?: string | null
  amount: number
  date: string
  transfer_account_id?: number | null
}) {
  return api<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function getTransactions() {
  return api<Transaction[]>("/transactions");
}

export function updateTransaction(input: {
  id: number
  account_id?: number
  category_id?: number | null
  payee?: string | null
  memo?: string | null
  amount?: number
  date?: string
  transfer_account_id?: number | null
}) {
  return api<Transaction>(`/transactions/${input.id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}
