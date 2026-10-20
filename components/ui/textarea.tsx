import * as React from "react"

import { fieldCharacterLimit, limitFieldEdit } from "@/lib/field-policy"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, maxLength, ...props }, ref) => {
  const limit = maxLength ?? fieldCharacterLimit(props.name) ?? fieldCharacterLimit(props.id);
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] min-w-0 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
})
Textarea.displayName = "Textarea"

export { Textarea }
