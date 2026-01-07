import { getTransactions } from "@/api/transactions";
import { useQuery } from "@tanstack/react-query";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
}
