import {
  HttpError,
  asyncHandler
} from '../src/utils/errors.js';

function setCors(res) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );
}

function setHealthResponse(res) {
  res.status(200).json({
    ok: true,
    service:
      'johan-marketplace-backend',
    time:
      new Date().toISOString()
  });
}

function getPath(req) {
  const rawPath =
    req.query?.path;

  if (
    Array.isArray(rawPath)
  ) {
    return rawPath.join('/');
  }

  if (
    typeof rawPath === 'string'
  ) {
    return rawPath;
  }

  return '';
}

function getSegments(req) {
  const path =
    getPath(req);

  return path
    .split('/')
    .map(
      (segment) =>
        segment.trim()
    )
    .filter(Boolean);
}

async function getControllers() {
  return import(
    '../src/controllers/index.js'
  );
}

async function getAuthMiddleware() {
  return import(
    '../src/middleware/auth.js'
  );
}

async function getAdminMiddleware() {
  return import(
    '../src/middleware/admin.js'
  );
}

async function router(
  req,
  res
) {
  setCors(res);

  const method =
    req.method?.toUpperCase();

  if (
    method === 'OPTIONS'
  ) {
    return res
      .status(204)
      .end();
  }

  const path =
    getPath(req);

  if (
    path === 'health' &&
    method === 'GET'
  ) {
    return setHealthResponse(
      res
    );
  }

  const segments =
    getSegments(req);

  const resource =
    segments[0];

  const id =
    segments[1];

  const {
    me,
    profilePhotoSignature,
    profilePhotoUpdate,
    sellerApply,
    productCreate,
    orderCreate,
    orderDone,
    messageCreate,
    sellerCall,
    dashboard,
    list,
    status,
    settings,
    updateUser,
    health,
    bad
  } = await getControllers();

  const {
    requireAuth
  } = await getAuthMiddleware();

  const {
    requireAdmin
  } = await getAdminMiddleware();

  if (
    path === 'me' &&
    method === 'GET'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        me(
          req,
          res
        )
    );
  }

  if (
    path ===
      'profile/photo/signature' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        profilePhotoSignature(
          req,
          res
        )
    );
  }

  if (
    path ===
      'profile/photo/update' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        profilePhotoUpdate(
          req,
          res
        )
    );
  }

  if (
    path ===
      'seller/apply' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        sellerApply(
          req,
          res
        )
    );
  }

  if (
    path ===
      'products' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        productCreate(
          req,
          res
        )
    );
  }

  if (
    path ===
      'orders' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        orderCreate(
          req,
          res
        )
    );
  }

  if (
    path ===
      'orders/done' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        orderDone(
          req,
          res
        )
    );
  }

  if (
    resource === 'rooms' &&
    id &&
    segments[2] ===
      'messages' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        messageCreate(
          req,
          res
        )
    );
  }

  if (
    resource === 'rooms' &&
    id &&
    segments[2] ===
      'call' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        sellerCall(
          req,
          res
        )
    );
  }

  if (
    path ===
      'admin/dashboard' &&
    method === 'GET'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () =>
            dashboard(
              req,
              res
            )
        )
    );
  }

  if (
    path ===
      'admin/settings' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () =>
            settings(
              req,
              res
            )
        )
    );
  }

  const LISTABLE = [
    'orders',
    'payments',
    'products',
    'rooms',
    'sellers',
    'users'
  ];

  const STATUSABLE = [
    'orders',
    'payments',
    'products',
    'rooms',
    'sellers'
  ];

  if (
    resource === 'admin' &&
    segments[1] ===
      'list' &&
    LISTABLE.includes(
      segments[2]
    ) &&
    method === 'GET'
  ) {
    const type =
      segments[2];

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () =>
            list(type)(
              req,
              res
            )
        )
    );
  }

  if (
    resource === 'admin' &&
    segments[1] ===
      'status' &&
    STATUSABLE.includes(
      segments[2]
    ) &&
    method === 'PATCH'
  ) {
    const type =
      segments[2];

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () =>
            status(type)(
              req,
              res
            )
        )
    );
  }

  if (
    resource === 'admin' &&
    segments[1] ===
      'users' &&
    id &&
    method === 'PATCH'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () =>
            updateUser(
              req,
              res
            )
        )
    );
  }

  if (
    LISTABLE.includes(
      resource
    ) &&
    method === 'GET'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        list(resource)(
          req,
          res
        )
    );
  }

  if (
    STATUSABLE.includes(
      resource
    ) &&
    method === 'PATCH'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        status(resource)(
          req,
          res
        )
    );
  }

  return bad(
    req,
    res
  );
}

export default asyncHandler(
  router
);
