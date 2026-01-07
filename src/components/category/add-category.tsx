import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type ReactNode, useState } from "react"
import { useCreateCategory } from "@/hooks/use-create-category"
import { initializeContext } from "zod/v4/core"
import { cn } from "@/lib/utils"
import { useDeleteCategory } from "@/hooks/use-delete-category"
import { useUpdateCategory } from "@/hooks/use-update-category"

export const AddCategory = ({
  mode = "add",
  id,
  name: initialName = "",
  parentId, 
  trigger,
}: {
  mode?: "add" | "edit"
  id?: number
  name?: string
  parentId?: number
  trigger: ReactNode
}) => {
  const [name, setName] = useState(initialName)
  const [open, setOpen] = useState(false)
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()
  const updateCategoryMutation = useUpdateCategory()

  const onSave = () => {
    if (!name.trim()) return

    if (mode === "edit") {
      updateCategoryMutation.mutate(
        { id, name },
        {
          onSuccess: () => {
            setName("")
            setOpen(false)
          },
        }
      )
    } else {
      createCategory.mutate(
        { name, parent_id: parentId },
        {
          onSuccess: () => {
            setName("")
            setOpen(false)
          },
        }
      )
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
         {trigger}
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-y-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={
            parentId ? "Enter subcategory name" : "Enter category name"
          }
        />

        <div className={cn("flex gap-2", mode === "edit" ? "justify-between" : "justify-end")}>
          {mode === "edit" && <Button
            variant="ghost"
            onClick={() => {
              if (!id) return
              deleteCategory.mutate({ id })
            }}
            className="text-red-500 hover:text-red-600"
          >
            Delete
          </Button>}

          <div className="self-end flex gap-2">
            <Button
              onClick={onSave}
              className="bg-black text-white"
            >
              Save
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setName("")
                setOpen(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

