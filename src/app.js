const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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
const errorHandler = require('./middlewares/errorHandling');
const authenticateToken = require('./middlewares/authenticateToken');

// Middleware and route setups would go here
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Handle errors globally
app.use(errorHandler);

// Routes API endpoints would be defined here
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

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