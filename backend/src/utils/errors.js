export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function setCors(req, res) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://cpmku.shop'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,DELETE,OPTIONS'
  );

  res.setHeader(
    'Vary',
    'Origin'
  );
}

export function asyncHandler(fn) {
  return async (req, res) => {
    setCors(
      req,
      res
    );

    if (
      req.method ===
      'OPTIONS'
    ) {
      return res
        .status(204)
        .end();
    }

    try {
      return await fn(
        req,
        res
      );
    } catch (e) {
      const status =
        Number.isInteger(
          e?.status
        )
          ? e.status
          : 500;

      const body = {
        error:
          e?.message ||
          'Internal server error'
      };

      if (
        Number.isInteger(
          e?.retryAfter
        )
      ) {
        body.retryAfter =
          e.retryAfter;

        res.setHeader(
          'Retry-After',
          String(
            e.retryAfter
          )
        );
      }

      res
        .status(status)
        .json(body);
    }
  };
}
