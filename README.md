# 📄 Three-Way Match Engine (PO, GRN, Invoice)

## 🚀 Overview

This project implements a backend service for performing **three-way matching** between:

- Purchase Order (PO)  
- Goods Receipt Note (GRN)  
- Invoice  

The system allows users to upload documents, extract structured data using Gemini AI, store it in MongoDB, and validate consistency across documents using defined matching rules.

---

## 🧠 Approach

The system is designed with a **modular and event-driven approach**:

- Upload document via API  
- Parse document using Gemini AI  
- Store structured JSON in MongoDB  
- Trigger matching logic based on `poNumber`  
- Return real-time match status  

🔄 Matching is automatically re-evaluated whenever a new related document is uploaded.

---

## 🗄️ Data Model

A single `Document` collection is used to store all document types.

### Schema Structure

```js
{
  documentType: "po" | "grn" | "invoice",
  poNumber: String,
  data: Object,   // full parsed JSON
  items: [
    {
      itemCode: String,
      description: String,
      quantity: Number,
      receivedQuantity: Number
    }
  ]
}
```

### Key Design Decisions

- Common collection for flexibility  
- `poNumber` used as linking key  
- Items stored separately for fast matching  

---

## 🤖 Parsing Flow (Gemini Integration)

- File uploaded via `multer`  
- File buffer converted to base64  
- Sent to Gemini API with structured prompt  
- Gemini returns JSON  
- JSON is cleaned and parsed  
- Stored in MongoDB  

### Prompt Strategy

- Strict JSON output  
- Fixed schema enforcement  
- Handles missing values using `null`  

---

## ⚙️ Matching Logic

Matching is performed at the **item level** using `itemCode`.

### Rules Implemented

- GRN quantity ≤ PO quantity  
- Invoice quantity ≤ PO quantity  
- Invoice quantity ≤ total GRN quantity  
- Invoice date ≤ PO date  
- Item must exist in PO  

---

### Status Types

- `matched` → All validations passed  
- `partially_matched` → Missing GRN or Invoice  
- `mismatch` → Any validation failed  
- `insufficient_documents` → PO missing  

---

### Example Mismatch Reason

```json
{
  "type": "invoice_qty_exceeds_po_qty",
  "itemCode": "101",
  "poQty": 100,
  "invoiceQty": 120
}
```

---

## 🔄 Out-of-Order Upload Handling

The system supports **any upload order**.

### Strategy

- Documents stored independently  
- Matching triggered after each upload  
- Query always fetches latest related documents  

### Example Supported Flows

- Invoice → GRN → PO  
- GRN → PO → Invoice  
- PO → Invoice → GRN  

---

## 📡 API Endpoints

### 1. Upload Document

```http
POST /documents/upload
```

**Input:**
- `file`
- `documentType` (`po | grn | invoice`)

---

### 2. Get Document

```http
GET /documents/:id
```

Supports:
- Mongo `_id`
- `poNumber`
- `grnNumber`
- `invoiceNumber`

---

### 3. Get Match Result

```http
GET /match/:poNumber
```

**Returns:**
- Linked documents  
- Match status  
- Detailed mismatch reasons  

---

## ⚠️ Assumptions

- Each `poNumber` has only one PO  
- `itemCode` uniquely identifies items  
- Dates are comparable
- Gemini returns reasonably structured data  
- Documents contain required minimum fields  

---

## ⚖️ Tradeoffs

| Decision | Tradeoff |
|--------|--------|
| Single collection | Simpler design, less strict schema |
| AI parsing | Flexible but may be inconsistent |
| Real-time matching | Simpler logic, not optimized for scale |

---

## 🚀 Improvements (If More Time)

- Add schema validation 
- Implement retry for Gemini failures  
- Normalize DB (separate collections)  
- Add indexing on `poNumber`   
- Add authentication & role-based access  
- Build UI dashboard   

---

## 🧪 Example Output

```json
{
  "status": "matched",
  "reasons": [],
  "documents": {
    "po": {},
    "grns": [],
    "invoices": []
  }
}
```

---

## 🧩 Tech Stack

- Node.js  
- Express.js  
- MongoDB (Mongoose)  
- Gemini API  

---

## 🏁 Running the Project

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd backend
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Create `.env` File

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

```

### 4. Set Gemini API key

In this project, the API key is configured using a **config file**.

```js
const config = {
  GEMINI_API_KEY: "your_api_key_here",
};

export default config;
```

---

---

## ▶️ Start Server

```bash
npm start
```

Server will run on:

```
http://localhost:5000
```

---