import {
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
} from "../src/controllers/index.js";

import { requireAuth } from "../src/middleware/auth.js";
import { requireAdmin } from "../src/middleware/admin.js";
import { asyncHandler } from "../src/utils/errors.js";

const LISTABLE = [
  "orders",
  "payments",
  "products",
  "rooms",
  "sellers",
  "users"
];

const STATUSABLE = [
  "orders",
  "payments",
  "products",
  "rooms",
  "sellers"
];

function getPath(req) {
  const url = req.url || "";

  const questionIndex = url.indexOf("?");

  const pathname =
    questionIndex === -1
      ? url
      : url.slice(0, questionIndex);

  const apiIndex = pathname.indexOf("/api/");

  if (apiIndex !== -1) {
    return pathname.slice(apiIndex + 5);
  }

  if (pathname === "/api") {
    return "";
  }

  return pathname.replace(/^\/+/, "");
}

function getSegments(req) {
  return getPath(req)
    .split("/")
    .filter(Boolean);
}

async function router(req, res) {
  const segments = getSegments(req);

  const resource = segments[0] || "";
  const action = segments[1] || "";
  const id = segments[2] || "";

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (resource === "health") {
    return health(req, res);
  }

  if (!resource) {
    return health(req, res);
  }

  if (
    resource === "me" &&
    req.method === "GET"
  ) {
    return requireAuth(
      req,
      res,
      () => me(req, res)
    );
  }

  if (
    resource === "profile-photo" &&
    action === "signature" &&
    req.method === "GET"
  ) {
    return requireAuth(
      req,
      res,
      () => profilePhotoSignature(req, res)
    );
  }

  if (
    resource === "profile-photo" &&
    req.method === "POST"
  ) {
    return requireAuth(
      req,
      res,
      () => profilePhotoUpdate(req, res)
    );
  }

  if (
    resource === "seller" &&
    action === "apply" &&
    req.method === "POST"
  ) {
    return requireAuth(
      req,
      res,
      () => sellerApply(req, res)
    );
  }

  if (
    resource === "products" &&
    req.method === "POST" &&
    !action
  ) {
    return requireAuth(
      req,
      res,
      () => productCreate(req, res)
    );
  }

  if (
    resource === "orders" &&
    req.method === "POST" &&
    !action
  ) {
    return requireAuth(
      req,
      res,
      () => orderCreate(req, res)
    );
  }

  if (
    resource === "orders" &&
    action === "done" &&
    req.method === "POST"
  ) {
    return requireAuth(
      req,
      res,
      () => orderDone(req, res)
    );
  }

  if (
    resource === "rooms" &&
    action === "message" &&
    req.method === "POST"
  ) {
    return requireAuth(
      req,
      res,
      () => messageCreate(req, res)
    );
  }

  if (
    resource === "rooms" &&
    action === "call" &&
    req.method === "POST"
  ) {
    return requireAuth(
      req,
      res,
      () => sellerCall(req, res)
    );
  }

  if (
    resource === "admin" &&
    action === "dashboard" &&
    req.method === "GET"
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () => dashboard(req, res)
        )
    );
  }

  if (
    resource === "admin" &&
    action === "settings" &&
    req.method === "POST"
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () => settings(req, res)
        )
    );
  }

  if (
    resource === "admin" &&
    LISTABLE.includes(action) &&
    req.method === "GET"
  ) {
    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () => list(action)(req, res)
        )
    );
  }

  if (
    resource === "admin" &&
    action === "users" &&
    id &&
    req.method === "PATCH"
  ) {
    req.query.id = id;

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () => updateUser(req, res)
        )
    );
  }

  if (
    resource === "admin" &&
    STATUSABLE.includes(action) &&
    id &&
    req.method === "PATCH"
  ) {
    req.query.id = id;

    return requireAuth(
      req,
      res,
      () =>
        requireAdmin(
          req,
          res,
          () => status(action)(req, res)
        )
    );
  }

  if (
    LISTABLE.includes(resource) &&
    req.method === "GET"
  ) {
    return requireAuth(
      req,
      res,
      () => list(resource)(req, res)
    );
  }

  if (
    STATUSABLE.includes(resource) &&
    action &&
    req.method === "PATCH"
  ) {
    req.query.id = action;

    return requireAuth(
      req,
      res,
      () => status(resource)(req, res)
    );
  }
  return bad();
}

export default asyncHandler(router);
```
