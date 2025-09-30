"use client";

import type React from "react";

import { Input } from "@/components/ui/input";
import { forwardRef, type KeyboardEvent } from "react";

interface CustomDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CustomDateInput = forwardRef<HTMLInputElement, CustomDateInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "MMYYYY",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;

      // Allow backspace to delete the slash
      if (e.key === "Backspace") {
        if (cursorPosition === 3 && value.charAt(2) === "/") {
          // If cursor is right after the slash, delete the slash and the digit before it
          const newValue = value.slice(0, 1) + value.slice(3);
          onChange?.(newValue);
          e.preventDefault();
          setTimeout(() => {
            input.setSelectionRange(1, 1);
          }, 0);
          return;
        }
      }

      // Allow only numbers, backspace, delete, arrow keys, tab
      if (
        !/[0-9]/.test(e.key) &&
        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
          e.key
        )
      ) {
        e.preventDefault();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value.replace(/\D/g, ""); // Remove non-digits

      // Limit to 6 digits (MMYYYY)
      if (inputValue.length > 6) {
        inputValue = inputValue.slice(0, 6);
      }

      // Format as MM/YYYY
      let formattedValue = "";
      if (inputValue.length >= 1) {
        formattedValue = inputValue.slice(0, 2);
        if (inputValue.length > 2) {
          formattedValue += "/" + inputValue.slice(2, 6);
        }
      }

      // Validate month (01-12)
      if (formattedValue.length >= 2) {
        const month = Number.parseInt(formattedValue.slice(0, 2));
        if (month > 12) {
          formattedValue = "12" + formattedValue.slice(2);
        } else if (month === 0) {
          formattedValue = "01" + formattedValue.slice(2);
        }
      }

      onChange?.(formattedValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={7}
        disabled={disabled}
        className={className}
      />
    );
  }
);

CustomDateInput.displayName = "CustomDateInput";

export default CustomDateInput;
