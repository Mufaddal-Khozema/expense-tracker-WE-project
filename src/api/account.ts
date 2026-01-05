import { api } from "@/api/client";

export type Account = {
  id: number;
  name: string;
  balance: number | null;
};

export function createAccount(input: {
  name: string;
  parent_id?: number;
}) {
  return api<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAccounts() {
  return api<Account[]>("/accounts");
}

export function updateAccount(input: {
  id: number;
  name?: string;
  amount?: number;
  parent_id?: number;
}) {
  return api<Account>(`/accounts/${input.id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
