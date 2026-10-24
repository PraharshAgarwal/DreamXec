const validate = (schema) => (req, res, next) => {
  try {
    if (schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params)) {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
    } else {
      // Direct body schema
      const parsedBody = schema.parse(req.body);
      if (parsedBody && typeof parsedBody === 'object') {
        req.body = parsedBody;
      }
    }
    next();
  } catch (err) {
    // ZodError has an .issues array — map it to { field, message } pairs
    const errors = Array.isArray(err.issues)
      ? err.issues.map((issue) => {
          const pathArr = issue.path[0] === 'body' ? issue.path.slice(1) : issue.path;
          return {
            field: pathArr.join('.'),
            message: issue.message,
          };
        })
      : [{ field: 'general', message: err.message || 'Validation failed' }];

    console.error('Validation error:', JSON.stringify(errors, null, 2));

    return res.status(400).json({
      status: 'error',
      message: errors.map((e) => e.message).join('; '),
      errors,
    });
  }
};

module.exports = validate;