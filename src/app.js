const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const createUserTable = require('./data/createUserTable');
const createAddressesTable = require('./data/createAddressesTable');
const createCartsTable = require('./data/createCartsTable');
const createCartItemsTable = require('./data/createCartItemsTable');
const createOrdersTable = require('./data/createOrdersTable');
const createOrderItemsTable = require('./data/createOrderItemsTable');
const createCategoriesTable = require('./data/createCategoriesTable');
const createProductTable = require('./data/createProductTable');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const errorHandler = require('./middlewares/errorHandling');
const authenticateToken = require('./middlewares/authenticateToken');

// Middleware and route setups would go here
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use("/images", express.static(path.join(__dirname, "../images")));
console.log("Serving static files from:", path.join(__dirname, "../images"));

// Handle errors globally
app.use(errorHandler);

// Routes API endpoints would be defined here
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
// Dashboard route
app.get('/', authenticateToken, (req, res) => {
  console.log(req.user);
  res.json({
    message: "Welcome to E-Commerce-App",
    user: req.user
  })
})
// Create necessary tables in PostgreSQL database
// createUserTable();
// createAddressesTable();
// createCartsTable();
// createCartItemsTable();
// createOrdersTable();
// createOrderItemsTable();
// createCategoriesTable();
// createProductTable();

module.exports = app;