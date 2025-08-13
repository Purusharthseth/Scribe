import ApiError from "../utils/ApiError.js";

const errorHandler=(err, req, res, next)=>{
    let error = err;
    if(!(error instanceof ApiError)) error = new ApiError(error?.statusCode || 404, 
                error?.message || 404, error?.errors || [], err.stack);
    
    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? {stack: error.stack} : {})
    };
    console.log("Error: ", response);
    return res.status(error.statusCode).json(response);
    
};
export default errorHandler;