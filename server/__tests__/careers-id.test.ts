import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock the supabase client before importing routes
vi.mock("../db", () => {
  const mockSingle = vi.fn();
  const mockEqActive = vi.fn(() => ({ single: mockSingle }));
  const mockEqId = vi.fn(() => ({ eq: mockEqActive }));
  const mockSelect = vi.fn(() => ({ eq: mockEqId }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return {
    supabase: { from: mockFrom },
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

// Helper to get the deeply-nested mock for `.single()`
function getSingleMock() {
  const fromMock = supabase.from as ReturnType<typeof vi.fn>;
  const selectMock = fromMock.mock.results[0]?.value?.select as ReturnType<typeof vi.fn>;
  const eqIdMock = selectMock?.mock.results[0]?.value?.eq as ReturnType<typeof vi.fn>;
  const eqActiveMock = eqIdMock?.mock.results[0]?.value?.eq as ReturnType<typeof vi.fn>;
  return eqActiveMock?.mock.results[0]?.value?.single as ReturnType<typeof vi.fn>;
}

async function buildApp() {
  const app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  return app;
}

describe("GET /api/careers/:id", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it("returns 200 with the full career object for an active career", async () => {
    const mockCareer = {
      id: "abc-123",
      title: "Software Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description: "Build great things.",
      requirements: "3+ years experience.",
      isActive: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    // Set up the mock chain: supabase.from().select().eq().eq().single()
    const singleMock = vi.fn().mockResolvedValue({ data: mockCareer, error: null });
    const eqActiveMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqActiveMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: selectMock });

    const res = await request(app).get("/api/careers/abc-123");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockCareer);
  });

  it("returns 404 when the career is inactive (supabase returns no row)", async () => {
    // Supabase returns an error when .single() finds no matching row
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });
    const eqActiveMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqActiveMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: selectMock });

    const res = await request(app).get("/api/careers/inactive-id");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Career not found" });
  });

  it("returns 404 when the career ID does not exist", async () => {
    // Supabase returns an error when the row doesn't exist at all
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });
    const eqActiveMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqActiveMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: selectMock });

    const res = await request(app).get("/api/careers/nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Career not found" });
  });
});
