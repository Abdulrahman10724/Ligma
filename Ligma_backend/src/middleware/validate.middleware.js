const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Replace with validated data to ensure clean/parsed fields
    if (validated.body) req.body = validated.body;
    if (validated.query) req.query = validated.query;
    if (validated.params) req.params = validated.params;

    next();
  } catch (error) {
    // Format error to pass to centralized error handler
    const validationError = new Error("Validation Error");
    validationError.statusCode = 400;
    validationError.errors = error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    next(validationError);
  }
};

export default validate;
