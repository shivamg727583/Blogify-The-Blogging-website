require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');

const blogModel = require('./models/blog');
const userRouter = require('./routes/user-router');
const blogRouter = require("./routes/blog-router");
const { checkForAuthenticationCookie } = require('./middleware/authentication');

const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000 // 30 seconds
})
.then(() => {
  console.log("Connected to database");
})
.catch((err) => {
  console.error("Database connection error:", err);
});

// Set view engine to EJS
app.set('view engine', 'ejs');

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));

// Routes
app.use('/', userRouter);
app.use("/", blogRouter);

// Home route
app.get('/', async (req, res) => {
  try {
    // Fetch all blogs and populate the createdBy field with user details
    const allBlogs = await blogModel.find().populate('createdBy');

    // Render the index template with the blogs and user data
    res.render('index', { user: req.user, blogs: allBlogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
