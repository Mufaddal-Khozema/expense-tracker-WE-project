import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react';
import { useCreateCategory } from '@/hooks/use-create-category';

export const AddCategory = () => {
  const [name, setName] = useState<string>("");
  const createCategory = useCreateCategory();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Add Category</Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-y-2">
        <Input 
          type='text' 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='Enter category name'
        />
        <div className="self-end flex gap-2">
          <Button 
            onClick={() => {
              createCategory.mutate({ name })
            }} 
            className="bg-black"
          >
            Save
          </Button>
          <Button className="bg-gray-100 text-black">Cancel</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
