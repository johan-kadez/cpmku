import {
  asyncHandler
} from '../src/utils/errors.js';

const PUBLIC_ORIGINS = [
  'https://cpmku.shop',
  'https://www.cpmku.shop'
];

function setCors(req, res) {
  const origin =
    req.headers?.origin;

  if (
    origin &&
    PUBLIC_ORIGINS.includes(origin)
  ) {
    res.setHeader(
      'Access-Control-Allow-Origin',
      origin
    );
  } else {
    res.setHeader(
      'Access-Control-Allow-Origin',
      PUBLIC_ORIGINS[0]
    );
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,DELETE,OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );

  res.setHeader(
    'Vary',
    'Origin'
  );
}

function setHealthResponse(res) {
  return res.status(200).json({
    ok: true,
    service:
      'johan-marketplace-backend',
    time:
      new Date().toISOString()
  });
}

function normalizePath(value) {
  if (
    Array.isArray(value)
  ) {
    return value
      .join('/')
      .replace(/^\/+|\/+$/g, '');
  }

  if (
    typeof value === 'string'
  ) {
    return value
      .replace(/^\/+|\/+$/g, '');
  }

  return '';
}

function getPath(req) {
  const queryPath =
    req.query?.path;

  const normalizedQueryPath =
    normalizePath(queryPath);

  if (
    normalizedQueryPath
  ) {
    return normalizedQueryPath;
  }

  const url =
    req.url || '';

  const pathname =
    url.split('?')[0];

  let normalizedPath =
    pathname
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

  if (
    normalizedPath.startsWith(
      'api/index/'
    )
  ) {
    normalizedPath =
      normalizedPath.slice(
        'api/index/'.length
      );
  } else if (
    normalizedPath ===
      'api/index'
  ) {
    normalizedPath = '';
  } else if (
    normalizedPath.startsWith(
      'api/'
    )
  ) {
    normalizedPath =
      normalizedPath.slice(
        'api/'.length
      );
  }

  return normalizedPath;
}

function getSegments(req) {
  return getPath(req)
    .split('/')
    .map(
      segment =>
        segment.trim()
    )
    .filter(Boolean);
}

function setQueryId(
  req,
  id
) {
  if (!id) {
    return;
  }

  req.query = {
    ...(req.query || {}),
    id
  };
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

async function getSellerMiddleware() {
  return import(
    '../src/middleware/seller.js'
  );
}

async function getAdminActions() {
  return import(
    '../src/services/adminActions.js'
  );
}

async function router(
  req,
  res
) {
  setCors(
    req,
    res
  );

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
    profileRegister,
    profilePhotoSignature,
    profilePhotoUpdate,
    profileNickname,
    productPhotoSignature,
    sellerApply,
    productCreate,
    productUpdate,
    productDelete,
    orderCreate,
    orderDone,
    messageCreate,
    sellerCall,
    dashboard,
    list,
    status,
    settings,
    updateUser,
    passwordResetRequest,
    passwordResetVerify,
    passwordResetConfirm,
    bad
  } = await getControllers();

  const {
    requireAuth
  } = await getAuthMiddleware();

  const {
    requireAdmin
  } = await getAdminMiddleware();

  const {
    requireSeller
  } = await getSellerMiddleware();

  if (
    path ===
      'auth/password-reset/request' &&
    method === 'POST'
  ) {
    return passwordResetRequest(
      req,
      res
    );
  }

  if (
    path ===
      'auth/password-reset/verify' &&
    method === 'POST'
  ) {
    return passwordResetVerify(
      req,
      res
    );
  }

  if (
    path ===
      'auth/password-reset/confirm' &&
    method === 'POST'
  ) {
    return passwordResetConfirm(
      req,
      res
    );
  }

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
      'profile/register' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        profileRegister(
          req,
          res
        )
    );
  }

  if (
    path ===
      'profile/nickname' &&
    method === 'PATCH'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        profileNickname(
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
      'products/images/signature' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireSeller(
          req,
          res,
          () =>
            productPhotoSignature(
              req,
              res
            )
        )
    );
  }

  if (
    (
      path ===
        'seller/apply' ||
      path ===
        'sellers/apply'
    ) &&
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
    path === 'products' &&
    method === 'POST'
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireSeller(
          req,
          res,
          () =>
            productCreate(
              req,
              res
            )
        )
    );
  }

  if (
    resource === 'products' &&
    id &&
    method === 'PATCH'
  ) {
    setQueryId(
      req,
      id
    );

    return requireAuth(
      req,
      res,
      () =>
        requireSeller(
          req,
          res,
          () =>
            productUpdate(
              req,
              res
            )
        )
    );
  }

  if (
    resource === 'products' &&
    id &&
    method === 'DELETE'
  ) {
    setQueryId(
      req,
      id
    );

    return requireAuth(
      req,
      res,
      () =>
        requireSeller(
          req,
          res,
          () =>
            productDelete(
              req,
              res
            )
        )
    );
  }

  if (
    path === 'orders' &&
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
    setQueryId(
      req,
      id
    );

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
    (
      segments[2] ===
        'call' ||
      segments[2] ===
        'call-seller'
    ) &&
    method === 'POST'
  ) {
    setQueryId(
      req,
      id
    );

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
    (
      method === 'POST' ||
      method === 'PATCH'
    )
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
    LISTABLE.includes(
      segments[1]
    ) &&
    !segments[2] &&
    method === 'GET'
  ) {
    const type =
      segments[1];

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
      'rooms' &&
    id &&
    method === 'DELETE'
  ) {
    const {
      deleteRoom
    } = await getAdminActions();

    setQueryId(
      req,
      id
    );

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          async () => {
            const result =
              await deleteRoom(
                id
              );

            return res
              .status(200)
              .json(result);
          }
        )
    );
  }

  if (
    resource === 'admin' &&
    segments[1] ===
      'products' &&
    id &&
    method === 'DELETE'
  ) {
    const {
      deleteProduct
    } = await getAdminActions();

    setQueryId(
      req,
      id
    );

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          async () => {
            const result =
              await deleteProduct(
                id
              );

            return res
              .status(200)
              .json(result);
          }
        )
    );
  }

  if (
    resource === 'admin' &&
    segments[1] ===
      'orders' &&
    id &&
    method === 'DELETE'
  ) {
    const {
      cancelOrder
    } = await getAdminActions();

    setQueryId(
      req,
      id
    );

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          async () => {
            const result =
              await cancelOrder(
                id
              );

            return res
              .status(200)
              .json(result);
          }
        )
    );
  }

  if (
    resource === 'admin' &&
    segments[1] ===
      'payments' &&
    id &&
    method === 'DELETE'
  ) {
    const {
      deletePayment
    } = await getAdminActions();

    setQueryId(
      req,
      id
    );

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          async () => {
            const result =
              await deletePayment(
                id
              );

            return res
              .status(200)
              .json(result);
          }
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

    const statusId =
      segments[3] ||
      req.query?.id;

    setQueryId(
      req,
      statusId
    );

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
    segments[2] &&
    method === 'PATCH'
  ) {
    setQueryId(
      req,
      segments[2]
    );

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
    setQueryId(
      req,
      id ||
        req.query?.id
    );

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
