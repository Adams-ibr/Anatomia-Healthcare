import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock the supabase client before importing routes
vi.mock("../db", () => {
  return {
    supabase: { from: vi.fn() },
    toSnakeCase: (obj: any) => obj,
    db: {},
  };
});

// Mock auth middleware so protected routes don't block
vi.mock("../auth", () => ({
  setupSession: vi.fn(),
  registerAuthRoutes: vi.fn(),
  registerMemberRoutes: vi.fn(),
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  isMemberAuthenticated: (_req: any, _res: any, next: any) => next(),
}));

// Mock sub-route modules
vi.mock("../lms-routes", () => ({ default: express.Router() }));
vi.mock("../payment-routes", () => ({ default: express.Router() }));
vi.mock("../interaction-routes", () => ({ default: express.Router() }));
vi.mock("../gallery-routes", () => ({ default: express.Router() }));

import { supabase } from "../db";
import { registerRoutes } from "../routes";
import { createServer } from "http";

async function buildApp() {
  const app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  return app;
}

/**
 * Build a mock Supabase query chain for the validation query:
 *   supabase.from("job_applications").select("id").in("id", ids)
 *
 * The chain: select() → in() — in() is the last awaited call.
 */
function buildSelectInChain(resolvedValue: { data: any; error: any }) {
  const chain: any = {
    select: vi.fn(),
    in: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.in.mockResolvedValue(resolvedValue);
  return chain;
}

/**
 * Build a mock Supabase query chain for the update query:
 *   supabase.from("job_applications").update({...}).in("id", ids).select()
 *
 * The chain: update() → in() → select() — select() is the last awaited call.
 */
function buildUpdateInSelectChain(resolvedValue: { data: any; error: any }) {
  const chain: any = {
    update: vi.fn(),
    in: vi.fn(),
    select: vi.fn(),
  };
  chain.update.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.select.mockResolvedValue(resolvedValue);
  return chain;
}

describe("PATCH /api/admin/applications/bulk-status", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it("valid IDs and status returns 200 with all records updated", async () => {
    const ids = ["app-1", "app-2"];
    const status = "reviewed";

    const updatedApplications = [
      {
        id: "app-1",
        job_id: "job-1",
        name: "Alice",
        status: "reviewed",
        experience: "1 year",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-03-01T00:00:00.000Z",
      },
      {
        id: "app-2",
        job_id: "job-1",
        name: "Bob",
        status: "reviewed",
        experience: "3 years",
        created_at: "2024-02-01T00:00:00.000Z",
        updated_at: "2024-03-01T00:00:00.000Z",
      },
    ];

    // First call: validation query — from().select("id").in("id", ids)
    const validateChain = buildSelectInChain({
      data: [{ id: "app-1" }, { id: "app-2" }],
      error: null,
    });

    // Second call: update query — from().update({...}).in("id", ids).select()
    const updateChain = buildUpdateInSelectChain({
      data: updatedApplications,
      error: null,
    });

    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(validateChain)
      .mockReturnValueOnce(updateChain);

    const res = await request(app)
      .patch("/api/admin/applications/bulk-status")
      .send({ ids, status });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: updatedApplications, failed: [] });

    // Verify validation query was built correctly
    expect(validateChain.select).toHaveBeenCalledWith("id");
    expect(validateChain.in).toHaveBeenCalledWith("id", ids);

    // Verify update query was built correctly
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "reviewed" })
    );
    expect(updateChain.in).toHaveBeenCalledWith("id", ids);
    expect(updateChain.select).toHaveBeenCalled();
  });

  it("invalid status string returns 400", async () => {
    const res = await request(app)
      .patch("/api/admin/applications/bulk-status")
      .send({ ids: ["app-1"], status: "approved" }); // "approved" is not a valid status

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");

    // Route should reject before touching Supabase
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("one unknown ID returns 400 with invalidIds list and no rows updated", async () => {
    const ids = ["app-known", "app-unknown"];
    const status = "accepted";

    // Validation query only returns the known ID
    const validateChain = buildSelectInChain({
      data: [{ id: "app-known" }],
      error: null,
    });

    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(validateChain);

    const res = await request(app)
      .patch("/api/admin/applications/bulk-status")
      .send({ ids, status });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "Invalid request",
      invalidIds: ["app-unknown"],
    });

    // Supabase should have been called once (validation) but NOT for the update
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});
