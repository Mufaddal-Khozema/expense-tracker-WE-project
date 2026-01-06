import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type ReactNode, useState } from "react"
import { useCreateCategory } from "@/hooks/use-create-category"

export const AddCategory = ({
  parentId, 
  trigger,
  className
}: {
  parentId?: number
  trigger: ReactNode
  className: string
}) => {
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)
  const createCategory = useCreateCategory()

  const onSave = () => {
    if (!name.trim()) return

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className={className}>{trigger}</Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-y-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={
            parentId ? "Enter subcategory name" : "Enter category name"
          }
        />

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
      </PopoverContent>
    </Popover>
  )
}

