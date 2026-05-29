export const errorHandler = (err, req, res, next) => {
  console.error('--- Backend Error ---');
  console.error('Message:', err.message);
  console.error('Status:', err.status || err.response?.status);
  if (err.response?.data) {
    console.error('Response Data:', JSON.stringify(err.response.data));
  }
  
  const statusCode = err.status || err.response?.status || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    details: err.response?.data || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
