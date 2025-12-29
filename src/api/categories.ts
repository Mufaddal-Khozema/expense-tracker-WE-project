import { api } from "@/api/client";

export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
};

export function createCategory(input: {
  name: string;
  parent_id?: number;
}) {
  return api<Category>("/category", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCategories() {
  return api<Category[]>("/categories");
}
