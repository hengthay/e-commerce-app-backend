// Utility function to handle API responses
const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({
    status,
    message,
    data
  })
};

module.exports = handleResponse;