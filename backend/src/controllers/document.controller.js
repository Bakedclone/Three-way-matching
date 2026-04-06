import mongoose from "mongoose";
import Document from "../models/document.model.js";
import { parseDocument } from "../services/gemini.service.js";
import { matchDocuments } from "../services/match.service.js";


export const uploadDocument = async (req, res) => {
    try {
        const { documentType } = req.body;

        if (!req.file) {
        return res.status(400).json({ error: "File is required" });
        }

        const parsed = await parseDocument(
            req.file.buffer,
            req.file.mimetype,
            documentType
        );

        if (documentType === "po") {
            const existingPO = await Document.findOne({
                documentType: "po",
                poNumber: parsed.poNumber
            });

            if (existingPO) {
                return res.status(400).json({
                error: "PO already exists for this poNumber",
                reason: "duplicate_po",
                poNumber: parsed.poNumber
                });
            }
        }

        const doc = await Document.create({
            documentType,
            poNumber: parsed.poNumber,
            data: parsed,
            items: parsed.items
        });

        const match = await matchDocuments(parsed.poNumber);

        res.json({
            success: true,
            parsed,
            doc,
            match
        });

    } catch (err) {
        res.status(500).json({
        error: err.message
        });
    }
};

export const getDocument = async (req, res) => {
    try {
        const { id } = req.params;

        let doc = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            doc = await Document.findById(id);
        }

        if (!doc) {
            doc = await Document.findOne({
                $or: [
                { poNumber: id },                 // PO
                { "data.grnNumber": id },         // GRN
                { "data.invoiceNumber": id }      // Invoice
                ]
            });
        }

        if (!doc) {
            return res.status(404).json({
                error: "Document not found"
            });
        }

        res.json(doc);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};
