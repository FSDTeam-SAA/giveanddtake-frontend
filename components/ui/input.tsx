import * as React from "react"

import { fieldCharacterLimit, limitFieldEdit } from "@/lib/field-policy"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, maxLength, ...props }, ref) => {
    const limit = maxLength ?? ([undefined, "text", "search", "email", "url", "tel"].includes(type) ? fieldCharacterLimit(props.name) ?? fieldCharacterLimit(props.id) ?? fieldCharacterLimit(props.placeholder) : undefined);
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 min-w-0 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
        maxLength={limit}
        onChange={(event) => {
          const limited = limitFieldEdit(event.target.value, limit, typeof props.value === "string" ? props.value : undefined);
          if (limited !== event.target.value) event.target.value = limited;
          props.onChange?.(event);
        }}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
