import Document from "../models/document.model.js";

export const matchDocuments = async (poNumber) => {
  const docs = await Document.find({ poNumber });

  const po = docs.find(d => d.documentType === "po");
  const grns = docs.filter(d => d.documentType === "grn");
  const invoices = docs.filter(d => d.documentType === "invoice");

  if (!po) {
    return {
      status: "insufficient_documents",
      reasons: [{ type: "missing_po" }]
    };
  }

  let reasons = [];

  const poItemsMap = {};
  po.items.forEach(i => {
    poItemsMap[i.itemCode] = i.quantity;
  });

  const grnTotals = {};

  for (const grn of grns) {
    for (const i of grn.items) {
      if (!poItemsMap[i.itemCode]) {
        reasons.push({
          type: "item_missing_in_po",
          itemCode: i.itemCode,
          source: "grn"
        });
        continue;
      }

      if (i.receivedQuantity > poItemsMap[i.itemCode]) {
        reasons.push({
          type: "grn_qty_exceeds_po_qty",
          itemCode: i.itemCode,
          poQty: poItemsMap[i.itemCode],
          grnQty: i.receivedQuantity
        });
      }

      grnTotals[i.itemCode] =
        (grnTotals[i.itemCode] || 0) + i.receivedQuantity;
    }
  }

  for (const inv of invoices) {
    for (const i of inv.items) {
      if (!poItemsMap[i.itemCode]) {
        reasons.push({
          type: "item_missing_in_po",
          itemCode: i.itemCode,
          source: "invoice"
        });
        continue;
      }

      if (i.quantity > poItemsMap[i.itemCode]) {
        reasons.push({
          type: "invoice_qty_exceeds_po_qty",
          itemCode: i.itemCode,
          poQty: poItemsMap[i.itemCode],
          invoiceQty: i.quantity
        });
      }

      if (i.quantity > (grnTotals[i.itemCode] || 0)) {
        reasons.push({
          type: "invoice_qty_exceeds_grn_qty",
          itemCode: i.itemCode,
          grnTotal: grnTotals[i.itemCode] || 0,
          invoiceQty: i.quantity
        });
      }
    }

    if (inv.data.invoiceDate > po.data.poDate) {
      reasons.push({
        type: "invoice_date_after_po_date",
        invoiceDate: inv.data.invoiceDate,
        poDate: po.data.poDate
      });
    }
  }

  const uniqueReasons = Array.from(
    new Map(reasons.map(r => [JSON.stringify(r), r])).values()
  );

  let status = "matched";

  if (!grns.length || !invoices.length) {
    status = "partially_matched";
  }

  if (uniqueReasons.length > 0) {
    status = "mismatch";
  }

  return {
    status,
    reasons: uniqueReasons,
    documents: { po, grns, invoices }
  };
};