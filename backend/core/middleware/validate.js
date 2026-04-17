export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      return res.status(400).json({ success: false, error: err.errors });
    }
  };
}
