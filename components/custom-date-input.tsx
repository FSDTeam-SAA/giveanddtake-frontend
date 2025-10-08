"use client";

import React, {
  forwardRef,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/input";

interface CustomDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const yearsRange = (from: number, to: number) => {
  const arr: number[] = [];
  for (let y = from; y <= to; y++) arr.push(y);
  return arr;
};

const CustomDateInput = forwardRef<HTMLInputElement, CustomDateInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "MM/YYYY",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value || "");
    const [pickerMonth, setPickerMonth] = useState<number | null>(null);
    const [pickerYear, setPickerYear] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      setInternalValue(value || "");
    }, [value]);

    useEffect(() => {
      if (open) {
        // initialize picker from value
        const parts = (internalValue || "").split("/");
        if (parts.length === 2) {
          const m = Number(parts[0]);
          const y = Number(parts[1]);
          if (!Number.isNaN(m)) setPickerMonth(m);
          if (!Number.isNaN(y)) setPickerYear(y);
        }
      }
    }, [open]);

    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1..12
    const years = yearsRange(currentYear - 80, currentYear + 10);

    const clampMonth = (m: number) => {
      if (m <= 0) return 1;
      if (m > 12) return 12;
      return m;
    };

    const clampToToday = (mm: number, yyyy: number) => {
      // ensure date mm/yyyy is not after today
      if (yyyy > currentYear) {
        return { mm: currentMonth, yyyy: currentYear };
      }
      if (yyyy === currentYear && mm > currentMonth) {
        return { mm: currentMonth, yyyy: currentYear };
      }
      return { mm, yyyy };
    };

    const formatFromDigits = (digits: string) => {
      // digits contains only numbers, max 6 (MMYYYY)
      if (digits.length === 0) return "";

      // if user types a single digit > '1', treat it as month with leading zero -> e.g. '3' => '03'
      if (digits.length === 1) {
        const d = digits[0];
        if (d > "1") {
          digits = "0" + d; // auto prefix
        }
      }

      let mm = digits.slice(0, 2);
      let yyyy = digits.slice(2, 6);

      if (mm.length === 2) {
        let monthNum = Number(mm);
        if (Number.isNaN(monthNum)) monthNum = 1;
        monthNum = clampMonth(monthNum);
        mm = monthNum.toString().padStart(2, "0");
      }

      let formatted = mm;
      if (yyyy.length > 0) formatted += "/" + yyyy;

      // If full year present, make sure it's not after today
      if (yyyy.length === 4) {
        const monthNum = Number(mm) || 1;
        const yearNum = Number(yyyy);
        const { mm: clampedM, yyyy: clampedY } = clampToToday(
          monthNum,
          yearNum
        );
        formatted = String(clampedM).padStart(2, "0") + "/" + String(clampedY);
      }

      return formatted;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputDigits = e.target.value.replace(/\D/g, "");
      if (inputDigits.length > 6) inputDigits = inputDigits.slice(0, 6);
      const formatted = formatFromDigits(inputDigits);
      setInternalValue(formatted);
      onChange?.(formatted);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
      // allow ctrl/cmd + A/C/V/X
      if (e.ctrlKey || e.metaKey) return;

      if (!/^[0-9]$/.test(e.key) && !allowed.includes(e.key)) {
        e.preventDefault();
      }

      // special backspace behavior: if cursor just after slash, delete previous digit too
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;
      if (e.key === "Backspace") {
        if (cursorPosition === 3 && internalValue.charAt(2) === "/") {
          // remove the slash and the digit before
          const newValue = internalValue.slice(0, 1) + internalValue.slice(3);
          setInternalValue(newValue);
          onChange?.(newValue);
          e.preventDefault();
          setTimeout(() => {
            input.setSelectionRange(1, 1);
          }, 0);
        }
      }
    };

    const openPicker = () => setOpen(true);
    const closePicker = () => setOpen(false);

    const applyPicker = (m?: number | null, y?: number | null) => {
      const month = m ?? pickerMonth ?? 1;
      const year = y ?? pickerYear ?? currentYear;
      const mm = String(clampMonth(month)).padStart(2, "0");
      const yyyy = String(year);
      // enforce not after today
      const { mm: clampedM, yyyy: clampedY } = clampToToday(
        Number(mm),
        Number(yyyy)
      );
      const newVal = `${String(clampedM).padStart(2, "0")}/${String(clampedY)}`;
      setInternalValue(newVal);
      onChange?.(newVal);
    };

    const applyPickerAndClose = (m?: number | null, y?: number | null) => {
      applyPicker(m, y);
      setOpen(false);
    };

    const clearValue = () => {
      setInternalValue("");
      onChange?.("");
    };

    return (
      <div
        ref={containerRef}
        style={{ position: "relative", display: "inline-block" }}
      >
        <Input
          {...props}
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={openPicker}
          placeholder={placeholder}
          maxLength={7}
          disabled={disabled}
          className={className}
        />

        {open && (
          <div
            role="dialog"
            aria-modal="false"
            style={{
              position: "absolute",
              zIndex: 9999,
              top: "calc(100% + 6px)",
              left: 0,
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              padding: 12,
              borderRadius: 8,
              minWidth: 220,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                aria-label="Month"
                value={pickerMonth ?? ""}
                onChange={(ev) => {
                  const val = Number(ev.target.value) || null;
                  setPickerMonth(val);
                }}
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i + 1}>
                    {(i + 1).toString().padStart(2, "0")}
                  </option>
                ))}
              </select>

              <select
                aria-label="Year"
                value={pickerYear ?? ""}
                onChange={(ev) => {
                  const val = Number(ev.target.value) || null;
                  setPickerYear(val);

                  // After selecting year: auto-apply and close.
                  // If month is not chosen, use the currently selected month or today's month.
                  const monthToUse = pickerMonth ?? currentMonth;
                  const yearToUse = val ?? currentYear;

                  // Apply with clamping so date is not after today, and then close
                  applyPickerAndClose(monthToUse, yearToUse);
                }}
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 10,
              }}
            >
              <button
                type="button"
                onClick={clearValue}
                style={{ padding: "6px 10px" }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={closePicker}
                style={{ padding: "6px 10px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // apply current selections and keep popover open (legacy behavior)
                  applyPicker();
                }}
                style={{ padding: "6px 10px" }}
              >
                Apply
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
              Tip: you can also type <code>MMYYYY</code> (digits only). The
              value cannot be a future date.
            </div>
          </div>
        )}
      </div>
    );
  }
);

CustomDateInput.displayName = "CustomDateInput";

export default CustomDateInput;
