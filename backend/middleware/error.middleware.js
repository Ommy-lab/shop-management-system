// middleware/error.middleware.js

/*
|--------------------------------------------------------------------------
| 404 NOT FOUND HANDLER
|--------------------------------------------------------------------------
| This middleware runs when no route matches the incoming request.
|
| Example:
| GET /api/unknown-route
|--------------------------------------------------------------------------
*/
export const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};


/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
| This is the final safety net for unexpected errors.
|
| Any controller/middleware can forward an error using:
|
| next(error)
|
| and this middleware will return a consistent response.
|--------------------------------------------------------------------------
*/
export const globalErrorHandler = (
    error,
    req,
    res,
    next
) => {
    /*
    |--------------------------------------------------------------------------
    | LOG REAL ERROR ON SERVER
    |--------------------------------------------------------------------------
    | We log the full error for debugging but don't expose sensitive
    | technical details to the frontend.
    |--------------------------------------------------------------------------
    */
    console.error("Unhandled application error:", error);

    /*
    |--------------------------------------------------------------------------
    | USE ERROR STATUS IF AVAILABLE
    |--------------------------------------------------------------------------
    */
    const statusCode =
        error.statusCode ||
        error.status ||
        500;

    /*
    |--------------------------------------------------------------------------
    | CLIENT RESPONSE
    |--------------------------------------------------------------------------
    */
    return res.status(statusCode).json({
        success: false,

        message:
            statusCode === 500
                ? "Internal server error"
                : error.message || "Request failed",
    });
};