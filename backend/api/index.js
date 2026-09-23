import { asyncHandler } from '../src/utils/errors.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function setHealthResponse(res) {
  res.status(200).json({ ok: true, service: 'johan-marketplace-backend', time: new Date().toISOString() });
}

function getPath(req) {
  const rawPath = req.query?.path;
  if (Array.isArray(rawPath)) return rawPath.join('/');
  if (typeof rawPath === 'string') return rawPath;
  return '';
}

function getSegments(req) {
  const path = getPath(req);
  return path.split('/').map(segment => segment.trim()).filter(Boolean);
}

function setQueryId(req, id) {
  if (!id) return;
  req.query = { ...(req.query || {}), id };
}

async function getControllers() { return import('../src/controllers/index.js'); }
async function getAuthMiddleware() { return import('../src/middleware/auth.js'); }
async function getAdminMiddleware() { return import('../src/middleware/admin.js'); }
async function getSellerMiddleware() { return import('../src/middleware/seller.js'); }
async function getAdminActions() { return import('../src/services/adminActions.js'); }

async function router(req, res) {
  setCors(res);
  const method = req.method?.toUpperCase();
  if (method === 'OPTIONS') return res.status(204).end();

  const path = getPath(req);
  if (path === 'health' && method === 'GET') return setHealthResponse(res);

  const segments = getSegments(req);
  const resource = segments[0];

  const {
    me, profilePhotoSignature, profilePhotoUpdate, profileNickname,
    productPhotoSignature, sellerApply, productCreate, productUpdate,
    productDelete, orderCreate, orderDone, messageCreate, sellerCall,
    dashboard, list, status, settings, updateUser, bad
  } = await getControllers();

  const { requireAuth } = await getAuthMiddleware();
  const { requireAdmin } = await getAdminMiddleware();
  const { requireSeller } = await getSellerMiddleware();
  const { deleteRoom, deleteProduct, deletePayment, cancelOrder } = await getAdminActions();

  if (path === 'me' && method === 'GET') return requireAuth(req, res, () => me(req, res));
  if (path === 'profile/nickname' && method === 'PATCH') return requireAuth(req, res, () => profileNickname(req, res));
  if (path === 'profile/photo/signature' && method === 'POST') return requireAuth(req, res, () => profilePhotoSignature(req, res));
  if (path === 'profile/photo/update' && method === 'POST') return requireAuth(req, res, () => profilePhotoUpdate(req, res));
  if (path === 'products/images/signature' && method === 'POST') return requireAuth(req, res, () => requireSeller(req, res, () => productPhotoSignature(req, res)));
  if (path === 'seller/apply' && method === 'POST') return requireAuth(req, res, () => sellerApply(req, res));
  if (path === 'products' && method === 'POST') return requireAuth(req, res, () => requireSeller(req, res, () => productCreate(req, res)));
  if (resource === 'products' && segments[1] && method === 'PATCH') {
    setQueryId(req, segments[1]);
    return requireAuth(req, res, () => requireSeller(req, res, () => productUpdate(req, res)));
  }
  if (resource === 'products' && segments[1] && method === 'DELETE') {
    setQueryId(req, segments[1]);
    return requireAuth(req, res, () => requireSeller(req, res, () => productDelete(req, res)));
  }
  if (path === 'orders' && method === 'POST') return requireAuth(req, res, () => orderCreate(req, res));
  if (path === 'orders/done' && method === 'POST') return requireAuth(req, res, () => orderDone(req, res));
  if (resource === 'rooms' && segments[1] && segments[2] === 'messages' && method === 'POST') {
    setQueryId(req, segments[1]);
    return requireAuth(req, res, () => messageCreate(req, res));
  }
  if (resource === 'rooms' && segments[1] && (segments[2] === 'call' || segments[2] === 'call-seller') && method === 'POST') {
    setQueryId(req, segments[1]);
    return requireAuth(req, res, () => sellerCall(req, res));
  }
  if (path === 'admin/dashboard' && method === 'GET') return requireAuth(req, res, () => requireAdmin(req, res, () => dashboard(req, res)));
  if (path === 'admin/settings' && (method === 'POST' || method === 'PATCH')) return requireAuth(req, res, () => requireAdmin(req, res, () => settings(req, res)));

  const LISTABLE = ['orders', 'payments', 'products', 'rooms', 'sellers', 'users'];
  const STATUSABLE = ['orders', 'payments', 'products', 'rooms', 'sellers'];

  if (resource === 'admin' && segments[1] === 'list' && LISTABLE.includes(segments[2]) && method === 'GET') return requireAuth(req, res, () => requireAdmin(req, res, () => list(segments[2])(req, res)));
  if (resource === 'admin' && LISTABLE.includes(segments[1]) && !segments[2] && method === 'GET') return requireAuth(req, res, () => requireAdmin(req, res, () => list(segments[1])(req, res)));
  
  if (resource === 'admin' && segments[1] === 'status' && STATUSABLE.includes(segments[2]) && method === 'PATCH') {
    const statusId = segments[3] || req.query?.id;
    setQueryId(req, statusId);
    return requireAuth(req, res, () => requireAdmin(req, res, () => status(segments[2])(req, res)));
  }
  
  if (resource === 'admin' && segments[1] === 'users' && segments[2] && method === 'PATCH') {
    setQueryId(req, segments[2]);
    return requireAuth(req, res, () => requireAdmin(req, res, () => updateUser(req, res)));
  }

  if (resource === 'admin' && segments[1] === 'rooms' && segments[2] && method === 'DELETE') {
    setQueryId(req, segments[2]);
    return requireAuth(req, res, () => requireAdmin(req, res, async () => {
      const result = await deleteRoom(segments[2]);
      return res.status(200).json(result);
    }));
  }
  if (resource === 'admin' && segments[1] === 'products' && segments[2] && method === 'DELETE') {
    setQueryId(req, segments[2]);
    return requireAuth(req, res, () => requireAdmin(req, res, async () => {
      const result = await deleteProduct(segments[2]);
      return res.status(200).json(result);
    }));
  }
  if (resource === 'admin' && segments[1] === 'payments' && segments[2] && method === 'DELETE') {
    setQueryId(req, segments[2]);
    return requireAuth(req, res, () => requireAdmin(req, res, async () => {
      const result = await deletePayment(segments[2]);
      return res.status(200).json(result);
    }));
  }
  if (resource === 'admin' && segments[1] === 'orders' && segments[2] && method === 'DELETE') {
    setQueryId(req, segments[2]);
    return requireAuth(req, res, () => requireAdmin(req, res, async () => {
      const result = await cancelOrder(segments[2]);
      return res.status(200).json(result);
    }));
  }

  if (LISTABLE.includes(resource) && method === 'GET') return requireAuth(req, res, () => list(resource)(req, res));
  if (STATUSABLE.includes(resource) && method === 'PATCH') {
    setQueryId(req, segments[1] || req.query?.id);
    return requireAuth(req, res, () => status(resource)(req, res));
  }

  return bad(req, res);
}

export default asyncHandler(router);
