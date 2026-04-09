import { getExportRows } from "../models/exportModel.js";

function escapeCsvValue(value) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(rows) {
  const headers = ["Date", "Title", "Category", "Amount", "Type", "Paid By", "Owed By", "Status"];
  const body = rows.map((row) =>
    [
      row.date,
      row.title,
      row.category,
      Number(row.amount).toFixed(2),
      row.type,
      row.paid_by,
      row.owed_by,
      row.status,
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

export async function exportCsv(req, res) {
  const rows = await getExportRows(req.user.username);
  const csv = toCsv(rows);
  const safeUsername = String(req.user.username).replace(/[^a-zA-Z0-9_-]/g, "_");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeUsername}-expense-export.csv"`);
  res.status(200).send(csv);
}
