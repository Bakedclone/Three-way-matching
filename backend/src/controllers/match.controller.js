import { matchDocuments } from "../services/match.service.js";

export const getMatch = async (req, res) => {
    try {
        const result = await matchDocuments(req.params.poNumber);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
