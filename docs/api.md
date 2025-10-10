# SuperSuper API Documentation

## Overview

The SuperSuper API provides endpoints for managing product comparisons and supermarket data.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Endpoints

### Health Check

**GET** `/health`

Returns the health status of the API.

**Response:**
```json
{
  "status": "OK",
  "message": "SuperSuper API is running",
  "timestamp": "2025-10-10T12:00:00.000Z"
}
```

## Future Endpoints

The following endpoints will be implemented in future iterations:

- `GET /products` - Retrieve all products
- `POST /products` - Add a new product
- `GET /products/:id` - Get product by ID
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /comparisons` - Get product comparisons
- `POST /comparisons` - Create new comparison

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error