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
 * Build a mock Supabase query chain for job_applications.
 *
 * The route does:
 *   supabase.from("job_applications").select("*, careers(title)")
 *     [.eq(...)]* [.order(...)]
 *
 * We need a chainable mock where every method returns `this`-like object
 * until the final awaited call resolves with { data, error }.
 */
function buildQueryChain(resolvedValue: { data: any; error: any }) {
  // The chain object — every method returns itself so calls can be chained
  const chain: any = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
  };

  // Each method returns the same chain object
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  // order() is the last call before await — it must return a thenable
  chain.order.mockResolvedValue(resolvedValue);

  return chain;
}

describe("GET /api/admin/applications", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it("no params: returns all applications sorted by created_at desc", async () => {
    const mockApplications = [
      {
        id: "app-2",
        job_id: "job-1",
        name: "Bob",
        status: "reviewed",
        experience: "3 years",
        created_at: "2024-02-01T00:00:00.000Z",
        careers: { title: "Engineer" },
      },
      {
        id: "app-1",
        job_id: "job-1",
        name: "Alice",
        status: "pending",
        experience: "1 year",
        created_at: "2024-01-01T00:00:00.000Z",
        careers: { title: "Engineer" },
      },
    ];

    const chain = buildQueryChain({ data: mockApplications, error: null });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const res = await request(app).get("/api/admin/applications");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockApplications);

    // Verify the query was built correctly: no eq() filters, order by created_at desc
    expect(chain.select).toHaveBeenCalledWith("*, careers(title)");
    expect(chain.eq).not.toHaveBeenCalled();
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("status=reviewed: filters applications by status", async () => {
    const mockApplications = [
      {
        id: "app-2",
        job_id: "job-1",
        name: "Bob",
        status: "reviewed",
        experience: "3 years",
        created_at: "2024-02-01T00:00:00.000Z",
        careers: { title: "Engineer" },
      },
    ];

    const chain = buildQueryChain({ data: mockApplications, error: null });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const res = await request(app).get("/api/admin/applications?status=reviewed");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockApplications);

    // Verify status filter was applied
    expect(chain.eq).toHaveBeenCalledWith("status", "reviewed");
    // Default sort still applied
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("sortBy=experience&sortOrder=asc: sorts by experience ascending", async () => {
    const mockApplications = [
      {
        id: "app-1",
        job_id: "job-1",
        name: "Alice",
        status: "pending",
        experience: "1 year",
        created_at: "2024-01-01T00:00:00.000Z",
        careers: { title: "Engineer" },
      },
      {
        id: "app-2",
        job_id: "job-1",
        name: "Bob",
        status: "reviewed",
        experience: "3 years",
        created_at: "2024-02-01T00:00:00.000Z",
        careers: { title: "Engineer" },
      },
    ];

    const chain = buildQueryChain({ data: mockApplications, error: null });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const res = await request(app).get(
      "/api/admin/applications?sortBy=experience&sortOrder=asc"
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockApplications);

    // Verify sort column and direction
    expect(chain.order).toHaveBeenCalledWith("experience", { ascending: true });
    // No status filter applied
    expect(chain.eq).not.toHaveBeenCalled();
  });

  it("invalid status value: returns 400", async () => {
    // The route validates status before touching Supabase, so no mock needed
    const res = await request(app).get("/api/admin/applications?status=invalid");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    // Should not have called supabase at all for this request
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
