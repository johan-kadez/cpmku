import {
  dashboard,
  listCollection,
  setStatus,
  updateUser,
  saveSettings
} from "../src/services/admin.js";

import { requireAuth } from "../src/middleware/auth.js";
import { requireAdmin } from "../src/middleware/admin.js";

function getSegments(req) {
  const url = req.url || "/";

  const pathname = url.split("?")[0];

  const marker = "/api/admin";

  const index = pathname.indexOf(marker);

  if (index === -1) {
    return [];
  }

  return pathname
    .slice(index + marker.length)
    .split("/")
    .filter(Boolean);
}

function setCors(req, res) {
  const origin = req.headers.origin;

  if (origin === "https://cpmku.vercel.app") {
    res.setHeader(
      "Access-Control-Allow-Origin",
      origin
    );
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, OPTIONS"
  );

  res.setHeader(
    "Vary",
    "Origin"
  );
}

async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await requireAuth(req, res, () => {});
    await requireAdmin(req, res, () => {});

    const segments = getSegments(req);

    const resource = segments[0] || "";
    const id = segments[1] || "";

    if (
      resource === "dashboard" &&
      !id &&
      req.method === "GET"
    ) {
      return res.status(200).json(
        await dashboard()
      );
    }

    if (resource === "settings" && !id) {
      if (req.method === "GET") {
        return res.status(200).json(
          await listCollection("settings")
        );
      }

      if (req.method === "PATCH") {
        return res.status(200).json(
          await saveSettings(req.body || {})
        );
      }

      return res.status(405).json({
        error: "Method not allowed."
      });
    }

    if (
      resource === "users" &&
      id
    ) {
      if (req.method !== "PATCH") {
        return res.status(405).json({
          error: "Method not allowed."
        });
      }

      return res.status(200).json(
        await updateUser(
          id,
          req.body || {}
        )
      );
    }

    const statusResources = [
      "sellers",
      "products",
      "orders",
      "payments",
      "rooms"
    ];

    if (statusResources.includes(resource)) {
      if (
        !id &&
        req.method === "GET"
      ) {
        return res.status(200).json(
          await listCollection(resource)
        );
      }

      if (
        id &&
        req.method === "PATCH"
      ) {
        return res.status(200).json(
          await setStatus(
            resource,
            id,
            req.body?.status
          )
        );
      }
    }

    return res.status(404).json({
      error: "Endpoint tidak ditemukan."
    });
  } catch (error) {
    console.error(
      "ADMIN API ERROR:",
      error
    );

    const status =
      Number.isInteger(error?.statusCode)
        ? error.statusCode
        : Number.isInteger(error?.status)
          ? error.status
          : 500;

    return res.status(status).json({
      error:
        error?.message ||
        "Internal server error."
    });
  }
}

export default handler;
