import { reorderCategory } from "@/api/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useReorderCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: reorderCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

