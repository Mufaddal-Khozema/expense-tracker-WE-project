import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccount } from "@/api/account";

export function useCreateAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
