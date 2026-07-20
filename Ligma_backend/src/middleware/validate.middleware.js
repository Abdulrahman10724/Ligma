const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace with validated data to ensure clean/parsed fields.
    // req.query is read-only in Express 5 (getter-only) — mutate its
    // properties in place instead of reassigning the object itself.
    if (validated.body) req.body = validated.body;
    if (validated.params) req.params = validated.params;
    if (validated.query) {
      for (const key of Object.keys(req.query)) {
        delete req.query[key];
      }
      Object.assign(req.query, validated.query);
    }

    next();
  } catch (error) {
    const validationError = new Error("Validation Error");
    validationError.statusCode = 400;
    const issues = error.issues || error.errors || [];
    validationError.errors = issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    next(validationError);
  }
};

export default validate;