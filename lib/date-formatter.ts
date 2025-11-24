import type { DateFormat, YearType } from "./settings-context"

export function formatDate(
  date: Date | string | number | null | undefined,
  format: DateFormat = "medium",
  yearType: YearType = "buddhist",
  options?: Intl.DateTimeFormatOptions,
): string {
  // Handle null or undefined
  if (date === null || date === undefined) {
    return "-"
  }

  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return "-"
  }

  // Base format options
  let formatOptions: Intl.DateTimeFormatOptions = {}

  switch (format) {
    case "short":
      formatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
      break
    case "medium":
      formatOptions = { day: "numeric", month: "short", year: "numeric" }
      break
    case "long":
      formatOptions = { day: "numeric", month: "long", year: "numeric" }
      break
  }

  // Merge with custom options if provided
  if (options) {
    formatOptions = { ...formatOptions, ...options }
  }

  // Format the date
  const formatted = dateObj.toLocaleDateString("th-TH", formatOptions)

  // Convert year if needed
  if (yearType === "christian") {
    // Convert Buddhist Era (BE) to Christian Era (AD) by subtracting 543
    const beYear = dateObj.getFullYear() + 543
    const adYear = dateObj.getFullYear()
    return formatted.replace(beYear.toString(), adYear.toString())
  }

  return formatted
}

export function formatMonth(
  date: Date | string | number | null | undefined,
  format: DateFormat = "medium",
  yearType: YearType = "buddhist",
): string {
  return formatDate(date, format, yearType, { day: undefined })
}

export function formatMonthYear(date: Date | string | number | null | undefined, yearType: YearType = "buddhist"): string {
  return formatDate(date, "long", yearType, { day: undefined, month: "long", year: "numeric" })
}
