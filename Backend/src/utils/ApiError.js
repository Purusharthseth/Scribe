class ApiError extends Error {
    constructor(statusCode, message="something went wrong", errors=[], stack=""){
        super(message);
        this.statusCode=statusCode
        this.data=null
        this.success=false
        this.errors=errors
        if(stack) this.stack=stack
        else Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;