import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    itemCode: String,
    description: String,
    quantity: Number,
    receivedQuantity: Number
});

const documentSchema = new mongoose.Schema({
    documentType: {
        type: String,
        enum: ["po", "grn", "invoice"]
    },
    poNumber: String,
    data: Object,
    items: [itemSchema],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Document", documentSchema);
