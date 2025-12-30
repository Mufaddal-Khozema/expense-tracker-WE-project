import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategory } from "@/api/categories";

export function useUpdateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

