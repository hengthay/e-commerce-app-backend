// Erorr handler 
const { getAllProductsService, getProductByIdService, createProductService, updateProductService, deleteProductService, getRecommendedProductsService } = require('../model/productModel');
const handleResponse = require('../utils/handleResponse');

// Get all products
const getAllProducts = async (req, res, next) => {
  try {
    // Fetch all products from the service
    const products = await getAllProductsService();

    console.log('All Products-----', products);
    // Check if products exist
    if(!products) return handleResponse(res, 404, 'No products found');
    // Return successful response with products
    return handleResponse(res, 200, 'Products retrieved successfully', products);

  } catch (error) {
    console.log('Unable to get all products', error);
    next(error);
  }
}
// Get recommended products
const getRecommendedProducts = async (req, res, next) => {
  try {
    // const { type } = req.params;
    // Fetch all products from the service
    const products = await getRecommendedProductsService('Fashion');

    console.log('All Recomended Products-----', products);
    // Check if products exist
    if(!products) return handleResponse(res, 404, 'No products found');
    // Return successful response with products
    return handleResponse(res, 200, 'Products retrieved successfully', products);

  } catch (error) {
    console.log('Unable to get all products', error);
    next(error);
  }
}

// Get individual product by ID
const getProductById = async (req, res, next) => {
  const { id } = req.params;
  console.log('Receive ID-----', id);
  try {
    const product = await getProductByIdService(id);
    console.log(`Product retrieved by ID: ${id} -`, product);

    if(!product) return handleResponse(res, 404, 'Product not found');

    return handleResponse(res, 200, 'Product retrieved successfully', product);
  } catch (error) { 
    console.log(`Unable to get product by ID: ${id}`, error);
    next(error);
  }
};

// Create new product
const createProduct = async (req, res, next) => {
  // Get product data from request body
  const { title, price, stock, image_url, description, category_id } = req.body;
  console.log(req.body);
  try {
    // Create new product using the service
    const newProduct = await createProductService(title, price, stock, image_url, description, category_id);

    console.log('New Product Created-----', newProduct);
    // Check if product creation was successful
    if(!newProduct) return handleResponse(res, 400, 'Product creation failed');
    // Return successful response with new product
    return handleResponse(res, 201, 'Product created successfully', newProduct);
  } catch (error) {
    console.log('Unable to create new product', error);
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  // Retrieve product ID from request parameters
  const id = req.params.id;
  // Get updated product data from request body
  const { title, price, stock, image_url, description, category_id } = req.body;
  try {
    // Update product using the service
    const updatedProduct = await updateProductService(id, title, price, stock, image_url, description, category_id);

    console.log(`Product ID: ${id} is successful updated ----`, updatedProduct);
    // Check if product update was successful
    if(!updatedProduct) return handleResponse(res, 400, 'Product update failed');

    return handleResponse(res, 200, 'Product updated successfully', updatedProduct);
  } catch (error) {
    console.log('Unable to update a product', error);
    next(error);
  }
}
// Delete product by ID
const deleteProduct = async (req, res, next) => {
  // Retrieve product ID from request parameters
  const { id } = req.params;
  try {
    const deletedProduct = await deleteProductService(id);

    console.log(`Product ID: ${id} is successful deleted ----`, deletedProduct);

    if(!deletedProduct) return handleResponse(res, 400, 'Product deletion failed');

    return handleResponse(res, 200, 'Product deleted successfully', deletedProduct);
  } catch (error) {
    console.log(`Unable to delete a product with ID: ${id}`, error);
    next(error);
  }
};
module.exports = {
  getAllProducts,
  getRecommendedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};