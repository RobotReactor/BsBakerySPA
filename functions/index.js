const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors"); // Import CORS for cross-origin requests
const yourRoutes = require("./your-routes"); // Import your routes

const app = express();

// Middleware
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Routes
app.use("/api", yourRoutes);

// Default route for testing
app.get("/", (req, res) => {
  res.send("API is working!");
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
