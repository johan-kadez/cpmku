import { ok, created } from '../utils/response.js';
import { currentUser } from '../services/auth.js';
import { applySeller } from '../services/sellers.js';
import { createProduct } from '../services/products.js';
import { createOrder, doneOrder } from '../services/orders.js';
import { sendMessage, callSeller } from '../services/rooms.js';
import * as A from '../services/admin.js';
import { HttpError } from '../utils/errors.js';
export const me = async (req, res) => ok(res, { user: await currentUser(req.user) });
export const sellerApply = async (req, res) => created(res, await applySeller(req.user.uid, req.user.email, req.body));
export const productCreate = async (req, res) => created(res, await createProduct(req.user.uid, req.seller, req.body));
export const orderCreate = async (req, res) => created(res, await createOrder(req.user.uid, req.body.productId));
export const orderDone = async (req, res) => ok(res, await doneOrder(req.query.id, req.user.uid));
export const messageCreate = async (req, res) => ok(res, await sendMessage(
  req.query.id,
  { ...req.user, isAdmin: req.userRole === 'admin' },
  req.body?.body
));
export const sellerCall = async (req, res) => ok(res, await callSeller(req.query.id));
export const dashboard = async (req, res) => ok(res, await A.dashboard());
export const list = type => async (req, res) => ok(res, await A.listCollection(type));
export const status = type => async (req, res) => ok(res, await A.setStatus(type, req.query.id, req.body?.status));
export const settings = async (req, res) => ok(res, await A.saveSettings(req.body));
export const banUser = async (req, res) => ok(res, await A.setBan(req.query.id, req.body?.banned));
export const health = async (req, res) => ok(res, { ok: true, service: 'johan-marketplace-backend', time: new Date().toISOString() });
export const bad = () => { throw new HttpError(404, 'Endpoint tidak ditemukan.');
 };
