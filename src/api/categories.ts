import { api } from "@/api/client";

export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  categories: Category[]
};

export function createCategory(input: {
  name: string;
  parent_id?: number;
}) {
  return api<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCategories() {
  return api<Category[]>("/categories");
}

export function updateCategory(input: {
  id: number;
  name?: string;
  amount?: number;
  parent_id?: number;
}) {
  return api<Category>(`/categories/${input.id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function reorderCategory(input: {
  id: number;
  oldIndex?: number;
  newIndex?: number;
}) {
  return api<Category>(`/categories/reorder/${input.id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(input: {
  id: number;
}) {
  return api<Category>(`/categories/${input.id}`, {
    method: "DELETE",
  });
}
