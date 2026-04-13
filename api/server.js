const { MongoClient } = require("mongodb");

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(process.env.MONGO_URL);
  const db = client.db(process.env.DB_NAME);

  cachedDb = db;
  return db;
}

// CORS Headers
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// Parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

// Route handlers
async function handleProducts(req, res) {
  return res.status(200).json([
    {
      id: "basmati-rice",
      name: "Basmati Rice",
      description: "Premium quality aromatic Basmati rice",
      image: "https://images.pexels.com/photos/36346844/pexels-photo-36346844.jpeg",
      category: "Rice",
    },
    {
      id: "yellow-corn",
      name: "Yellow Corn",
      description: "High-quality yellow corn",
      image: "https://images.pexels.com/photos/1459331/pexels-photo-1459331.jpeg",
      category: "Corn",
    },
  ]);
}

async function handleInquiry(req, res, db, body) {
  try {
    const { name, email, phone, product, message } = body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await db.collection("inquiries").insertOne({
      name,
      email,
      phone,
      product: product || "Not specified",
      message: message || "",
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      id: result.insertedId,
      message: "Inquiry received successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save inquiry" });
  }
}

async function handleContact(req, res, db, body) {
  try {
    const { name, email, phone, subject, message } = body;
    
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await db.collection("contacts").insertOne({
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      id: result.insertedId,
      message: "Contact message received",
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save contact" });
  }
}

async function handleBrochure(req, res, db, body) {
  try {
    const { name, email } = body;
    
    if (!name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await db.collection("brochure_downloads").insertOne({
      name,
      email,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      id: result.insertedId,
      message: "Brochure request received",
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save brochure request" });
  }
}

// Main handler
module.exports = async (req, res) => {
  setCorsHeaders(res);

  // Handle OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { url, method } = req;

    // GET routes
    if (method === "GET") {
      if (url === "/api/products") {
        return await handleProducts(req, res);
      }
      return res.status(404).json({ error: "Route not found" });
    }

    // POST routes (require DB)
    if (method === "POST") {
      const db = await connectToDatabase();
      const body = await parseBody(req);

      if (url === "/api/inquiry") {
        return await handleInquiry(req, res, db, body);
      }

      if (url === "/api/contact") {
        return await handleContact(req, res, db, body);
      }

      if (url === "/api/brochure-download") {
        return await handleBrochure(req, res, db, body);
      }

      return res.status(404).json({ error: "Route not found" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
