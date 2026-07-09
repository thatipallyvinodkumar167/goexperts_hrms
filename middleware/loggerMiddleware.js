
const logger = (req, res, next) => {
  const startedAt = Date.now();
  let responseBody;

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const message = responseBody?.message ? ` | message: ${responseBody.message}` : "";
    console.log(`${req.method} ${req.url} -> ${res.statusCode} (${durationMs}ms)${message}`);
  });

  next();
};

export default logger;
