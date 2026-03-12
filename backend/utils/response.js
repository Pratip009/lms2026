/**
 * Standardized API response helpers.
 */

const successResponse = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const createdResponse = (res, data = {}, message = "Created successfully") => {
  return successResponse(res, data, message, 201);
};

const paginatedResponse = (res, { data, total, page, limit }, message = "Success") => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { successResponse, createdResponse, paginatedResponse };
