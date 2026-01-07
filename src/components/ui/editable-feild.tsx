import { useState } from "react"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { CurrencyInput } from "./currency-input"

export const EditableField = ({
  value: externalValue,
  onBlur
}: {
  value: string
  onBlur: (value: string) => void
}) => {
  const [value, setValue] = useState<string>(externalValue)
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing) {
    return (
      <span
        className="cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        {formatCurrency(value)}
      </span>
    )
  }

  return (
    <CurrencyInput
      className="pl-8 border-none shadow-none"
      value={value}
      inputMode="numeric"
      pattern="[0-9]*"
      autoFocus
      onChange={(e) => {
        const numeric = e.target.value.replace(/\D/g, "")
        setValue(numeric)
      }}
      onBlur={() => {
        setIsEditing(false)
        onBlur(value)
      }}
    />
  )
}
