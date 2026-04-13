const { MongoClient } = require("mongodb");

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(process.env.MONGO_URL);
  const db = client.db(process.env.DB_NAME);

  cachedDb = db;
  return db;
}

module.exports = async (req, res) => {
  const db = await connectToDatabase();

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url, method } = req;

  // ROUTES

  if (url === "/api/products" && method === "GET") {
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

  if (url === "/api/inquiry" && method === "POST") {
    const body = req.body;

    await db.collection("inquiries").insertOne({
      ...body,
      timestamp: new Date(),
    });

    return res.status(200).json(body);
  }

  if (url === "/api/contact" && method === "POST") {
    const body = req.body;

    await db.collection("contacts").insertOne({
      ...body,
      timestamp: new Date(),
    });

    return res.status(200).json(body);
  }

  if (url === "/api/brochure-download" && method === "POST") {
    const body = req.body;

    await db.collection("brochure_downloads").insertOne({
      ...body,
      timestamp: new Date(),
    });

    return res.status(200).json(body);
  }

  return res.status(404).json({ error: "Not found" });
};