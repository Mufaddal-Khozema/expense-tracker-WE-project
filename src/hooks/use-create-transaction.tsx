import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction } from "@/api/transactions";

export function useCreateTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", "accounts", "categories" ]});
    },
  });
}
