import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "@/api/account";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
}
