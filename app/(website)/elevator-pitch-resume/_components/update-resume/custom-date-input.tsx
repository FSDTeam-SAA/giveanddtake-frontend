"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export const CustomDateInput = ({
  value,
  onChange,
  placeholder = "MMYYYY",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [internalValue, setInternalValue] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<number | "">("");
  const [pickerYear, setPickerYear] = useState<number | "">("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  // years range for picker
  const yearsRange = (from: number, to: number) => {
    const arr: number[] = [];
    for (let y = from; y <= to; y++) arr.push(y);
    return arr;
  };
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1..12
  const years = yearsRange(currentYear - 80, currentYear + 10);

  // clamp month to 01-12
  const clampMonth = (m: number) => {
    if (m <= 0) return 1;
    if (m > 12) return 12;
    return m;
  };

  // ensure mm/yyyy not after today
  const clampToToday = (mm: number, yyyy: number) => {
    if (yyyy > currentYear) return { mm: currentMonth, yyyy: currentYear };
    if (yyyy === currentYear && mm > currentMonth)
      return { mm: currentMonth, yyyy: currentYear };
    return { mm, yyyy };
  };

  const formatFromDigits = (digits: string) => {
    // digits only (max 6 -> MMYYYY)
    if (digits.length === 0) return "";

    // if user types single digit > '1', auto prefix '0' (3 -> 03)
    if (digits.length === 1) {
      const d = digits[0];
      if (d > "1") digits = "0" + d;
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

    // if full year present, clamp to today
    if (yyyy.length === 4) {
      const monthNum = Number(mm) || 1;
      const yearNum = Number(yyyy);
      const { mm: clampedM, yyyy: clampedY } = clampToToday(monthNum, yearNum);
      formatted = String(clampedM).padStart(2, "0") + "/" + String(clampedY);
    }

    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\\D/g, "");
    if (digits.length > 6) digits = digits.slice(0, 6);
    const formatted = formatFromDigits(digits);
    setInternalValue(formatted);
    onChange?.(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (e.ctrlKey || e.metaKey) return; // allow copy/paste/select all

    if (!/^[0-9]$/.test(e.key) && !allowed.includes(e.key)) {
      e.preventDefault();
    }

    // special backspace behaviour: if cursor is right after slash, delete previous digit too
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart || 0;
    if (e.key === "Backspace") {
      if (cursorPosition === 3 && internalValue.charAt(2) === "/") {
        e.preventDefault();
        // remove slash and the digit before it -> keep first digit only (e.g. "03/2024" => "0")
        const newValue = internalValue.slice(0, 1) + internalValue.slice(3);
        setInternalValue(newValue);
        onChange?.(newValue);
        // set caret after first char
        setTimeout(() => {
          input.setSelectionRange(1, 1);
        }, 0);
      }
    }
  };

  // open/close picker and init from internalValue when opening
  const openPicker = () => {
    // initialize picker month/year from current value
    const parts = (internalValue || "").split("/");
    if (parts.length === 2) {
      const m = Number(parts[0]);
      const y = Number(parts[1]);
      setPickerMonth(!Number.isNaN(m) ? clampMonth(m) : "");
      setPickerYear(!Number.isNaN(y) ? y : "");
    } else {
      setPickerMonth("");
      setPickerYear("");
    }
    setOpen(true);
  };
  const closePicker = () => setOpen(false);

  // apply picker month/year into value (enforces not after today)
  const applyPicker = (m?: number | "", y?: number | "") => {
    const month = m === undefined ? pickerMonth : m;
    const year = y === undefined ? pickerYear : y;
    if (month === "" || year === "") return;
    const mm = String(clampMonth(Number(month))).padStart(2, "0");
    const yyyy = String(year);
    const { mm: clampedM, yyyy: clampedY } = clampToToday(
      Number(mm),
      Number(yyyy)
    );
    const newVal = `${String(clampedM).padStart(2, "0")}/${String(clampedY)}`;
    setInternalValue(newVal);
    onChange?.(newVal);
  };

  const applyPickerAndClose = (m?: number | "", y?: number | "") => {
    applyPicker(m, y);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const clearValue = () => {
    setInternalValue("");
    onChange?.("");
    setPickerMonth("");
    setPickerYear("");
  };

  // close picker when clicking outside
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

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <Input
        ref={inputRef}
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={openPicker}
        placeholder={placeholder}
        maxLength={7}
        type="text"
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
              value={pickerMonth === "" ? "" : pickerMonth}
              onChange={(ev) =>
                setPickerMonth(
                  ev.target.value === "" ? "" : Number(ev.target.value)
                )
              }
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
              value={pickerYear === "" ? "" : pickerYear}
              onChange={(ev) => {
                const newYear =
                  ev.target.value === "" ? "" : Number(ev.target.value);
                setPickerYear(newYear);

                // After selecting year: auto-apply and close.
                // If month not chosen, default to currently selected month or today's month.
                const monthToUse =
                  pickerMonth === "" ? currentMonth : Number(pickerMonth);
                const yearToUse =
                  newYear === "" ? currentYear : Number(newYear);

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
            Tip: you can also type <code>MMYYYY</code> (digits only). The value
            cannot be a future date.
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateInput;
