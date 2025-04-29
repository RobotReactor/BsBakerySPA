const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors"); // Import CORS for cross-origin requests
// const yourRoutes = require("./your-routes"); // REMOVED or commented out

const app = express();

// Middleware
app.use(cors({origin: true})); // Enable CORS for all origins (adjust if needed)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({extended: true})); // Parse URL-encoded bodies

// Routes
// app.use("/api", yourRoutes); // REMOVED or commented out

// Default route for testing if the function deploys and runs
app.get("/", (req, res) => {
  res.send("Cloud Function API endpoint is working!");
});

// You could add other specific function routes here if needed
// app.get("/hello", (req, res) => {
//   res.send("Hello from Cloud Function!");
// });

// Export the Express app as a Firebase Function named 'api'
// This means requests to your function URL will be handled by the 'app'
exports.api = functions.https.onRequest(app);

// You could also export other individual functions here if needed
// exports.myOtherFunction = functions.https.onRequest((req, res) => { ... });
