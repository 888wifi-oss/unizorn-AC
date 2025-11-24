import type { UserOptions as AutoTableUserOptions } from "jspdf-autotable"

export type PaymentExportRow = Record<string, string | number>

export type PaymentExportColumn<T> = {
  header: string
  getValue: (item: T) => string | number
  align?: "left" | "right" | "center"
  width?: number | "auto" | "wrap"
}

export type BuildExportArgs<T> = {
  columns: PaymentExportColumn<T>[]
  data: T[]
  rowMapper?: (item: T, column: PaymentExportColumn<T>) => string | number
}

export const buildExportRows = <T>({ columns, data, rowMapper }: BuildExportArgs<T>): PaymentExportRow[] =>
  data.map((item) =>
    columns.reduce<PaymentExportRow>((acc, column) => {
      const value = rowMapper ? rowMapper(item, column) : column.getValue(item)
      acc[column.header] = value
      return acc
    }, {}),
  )

export const buildColumnStyles = <T>(columns: PaymentExportColumn<T>[]) =>
  columns.reduce<
    Record<
      string,
      {
        cellWidth?: number | "auto" | "wrap"
        halign?: "left" | "right" | "center"
      }
    >
  >((acc, column) => {
    acc[column.header] = {
      cellWidth: column.width ?? "auto",
      halign: column.align ?? "left",
    }
    return acc
  }, {})

export type BuildAutoTableOptionsArgs = {
  columns: string[]
  rows: (string | number)[][]
  columnStyles?: AutoTableUserOptions["columnStyles"]
}

export const buildAutoTableOptions = ({ columns, rows, columnStyles }: BuildAutoTableOptionsArgs): AutoTableUserOptions => ({
  startY: 24,
  head: [columns],
  body: rows,
  styles: { cellPadding: 3 },
  headStyles: { fillColor: [2, 132, 199], textColor: 255 },
  alternateRowStyles: { fillColor: [240, 248, 255] },
  columnStyles,
})





