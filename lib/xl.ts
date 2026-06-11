// ExcelJS styling helpers — use via dynamic import in components

export const C = {
  navy:    "FF0F172A",
  navyDim: "FF1E293B",
  lime:    "FF84CC16",
  white:   "FFFFFFFF",
  gray50:  "FFF8FAFC",
  gray100: "FFF1F5F9",
  gray200: "FFE2E8F0",
  slate:   "FF64748B",
  green:   "FF16A34A",
  yellow:  "FFF59E0B",
  red:     "FFEF4444",
} as const

export const FMT = {
  brl:  '"R$"\\ #,##0.00',
  date: "DD/MM/YYYY",
  int:  "#,##0",
  pct:  '0.0"%"',
}

// ─── row helpers ──────────────────────────────────────────────────────────────

export function hdr(row: any, n: number) {
  row.height = 32
  row.font = { bold: true, color: { argb: C.white }, name: "Calibri", size: 10 }
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.navy } }
  for (let i = 1; i <= n; i++) {
    const cell = row.getCell(i)
    cell.alignment = { vertical: "middle", wrapText: false }
    cell.border = { bottom: { style: "medium", color: { argb: C.lime } } }
  }
}

export function drow(row: any, idx: number, n: number) {
  row.height = 20
  row.font = { name: "Calibri", size: 9, color: { argb: C.navy } }
  row.fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: idx % 2 === 0 ? C.white : C.gray50 },
  }
  for (let i = 1; i <= n; i++) {
    const cell = row.getCell(i)
    cell.alignment = { vertical: "middle", wrapText: false }
    cell.border = { bottom: { style: "thin", color: { argb: C.gray200 } } }
  }
}

// ─── layout helpers ───────────────────────────────────────────────────────────

export function banner(ws: any, text: string, cols: number, opts?: {
  height?: number; size?: number; bold?: boolean; color?: string; bg?: string
}) {
  const row = ws.addRow([text])
  row.height = opts?.height ?? 42
  row.font = { bold: opts?.bold ?? true, color: { argb: opts?.color ?? C.white }, name: "Calibri", size: opts?.size ?? 18 }
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts?.bg ?? C.navy } }
  row.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 2 }
  if (cols > 1) ws.mergeCells(row.number, 1, row.number, cols)
  return row
}

export function section(ws: any, text: string, cols: number) {
  const sp = ws.addRow([])
  sp.height = 8
  const row = ws.addRow([text])
  row.height = 24
  row.font = { bold: true, color: { argb: C.white }, name: "Calibri", size: 9 }
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.navyDim } }
  const cell = row.getCell(1)
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
  cell.border = { left: { style: "thick", color: { argb: C.lime } } }
  if (cols > 1) ws.mergeCells(row.number, 1, row.number, cols)
  return row
}

export function kv(ws: any, label: string, value: any, fmt?: string) {
  const row = ws.addRow([label, value])
  row.height = 20
  row.getCell(1).font = { name: "Calibri", size: 9, color: { argb: C.slate }, bold: true }
  row.getCell(1).alignment = { vertical: "middle" }
  row.getCell(2).font = { name: "Calibri", size: 9, color: { argb: C.navy } }
  row.getCell(2).alignment = { vertical: "middle", wrapText: false }
  if (fmt) row.getCell(2).numFmt = fmt
  row.getCell(1).border = { bottom: { style: "thin", color: { argb: C.gray200 } } }
  row.getCell(2).border = { bottom: { style: "thin", color: { argb: C.gray200 } } }
  return row
}

// ─── KPI card grid ────────────────────────────────────────────────────────────
// Adds a 2-row block: label row (gray) + value row (large bold) for each stat
export function kpiGrid(
  ws: any,
  stats: { label: string; value: any; fmt?: string; color?: string }[],
  colCount: number
) {
  // Label row
  const labelRow = ws.addRow(stats.map((s) => s.label))
  labelRow.height = 20
  for (let i = 1; i <= colCount; i++) {
    const cell = labelRow.getCell(i)
    cell.font = { bold: true, name: "Calibri", size: 8, color: { argb: C.white } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.navy } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = { top: { style: "thick", color: { argb: C.lime } } }
  }

  // Value row
  const valueRow = ws.addRow(stats.map((s) => s.value))
  valueRow.height = 46
  for (let i = 1; i <= colCount; i++) {
    const cell = valueRow.getCell(i)
    cell.font = { bold: true, name: "Calibri", size: 22, color: { argb: stats[i - 1]?.color ?? C.navy } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.gray100 } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = { bottom: { style: "thick", color: { argb: C.lime } } }
    if (stats[i - 1]?.fmt) cell.numFmt = stats[i - 1].fmt!
  }

  return { labelRow, valueRow }
}

// ─── full table ───────────────────────────────────────────────────────────────
// colDefs: { header, key, width, fmt?, align? }[]
export function table(
  ws: any,
  colDefs: { header: string; key: string; width: number; fmt?: string; align?: string; color?: string }[],
  rows: Record<string, any>[],
  opts?: { freeze?: boolean; autoFilter?: boolean }
) {
  const n = colDefs.length

  // Set column widths
  ws.columns = colDefs.map((c) => ({ key: c.key, width: c.width }))

  // Header row
  const headerRow = ws.addRow(Object.fromEntries(colDefs.map((c) => [c.key, c.header])))
  hdr(headerRow, n)
  colDefs.forEach((c, i) => {
    if (c.align) headerRow.getCell(i + 1).alignment = { horizontal: c.align as any, vertical: "middle" }
  })

  const headerRowNum = headerRow.number

  // Data rows
  rows.forEach((rowData, idx) => {
    const row = ws.addRow(rowData)
    drow(row, idx, n)
    colDefs.forEach((c, i) => {
      const cell = row.getCell(i + 1)
      if (c.align) cell.alignment = { horizontal: c.align as any, vertical: "middle" }
      if (c.fmt) cell.numFmt = c.fmt
      if (c.color && rowData[c.key] !== undefined && rowData[c.key] !== "" && rowData[c.key] !== null) {
        cell.font = { name: "Calibri", size: 9, color: { argb: c.color }, bold: true }
      }
    })
  })

  if (opts?.freeze !== false) {
    ws.views = [{ state: "frozen", ySplit: headerRowNum, xSplit: 0 }]
  }
  if (opts?.autoFilter !== false && rows.length > 0) {
    ws.autoFilter = {
      from: { row: headerRowNum, column: 1 },
      to:   { row: headerRowNum, column: n },
    }
  }
}
