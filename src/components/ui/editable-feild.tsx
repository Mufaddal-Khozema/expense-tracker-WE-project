import { useState } from "react"
import { Input } from "@/components/ui/input"

export const EditableField = ({
  value: externalValue,
  onBlur
}: {
  value: string
  onBlur: (value: string) => void
}) => {
  const [value, setValue] = useState<string>(externalValue)

  return (
    <Input
      className="border-none shadow-none"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onBlur(value)}
    />
  )
}
