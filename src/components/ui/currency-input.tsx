import React, { forwardRef, type InputHTMLAttributes } from "react"
import { Input } from "@/components/ui/input"

export interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string
  onChange: (value: string) => void
}

/**
 * A numeric input with Rs prefix.
 * Only allows numbers, optional decimals.
 */
export const CurrencyInput = (props: HTMLInputElement) => {
  return (
    <div className="relative w-full">
      {/* Prefix */}
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
        Rs
      </span>

      <Input
        {...props}
        className={`pl-8 ${props.className || ""}`}
      />
    </div>
  )
}
