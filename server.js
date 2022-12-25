const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Create a server
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded());
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => {
    res.send("Home page");
});

// Connect to MongoDB
const PORT = process.env.PORT || 5001;
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Connect to port ${PORT}`);
        })
    })
    .catch((error) => {
        console.log(error.message);
    })