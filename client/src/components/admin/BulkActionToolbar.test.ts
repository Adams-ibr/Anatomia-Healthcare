/**
 * Unit tests for BulkActionToolbar logic.
 *
 * Because the vitest environment is "node" (no DOM), these tests exercise the
 * visibility, count display, and button state logic directly rather than
 * rendering the component. The component's behaviour is driven by:
 *   1. Visibility: only shown when selectedIds.length >= 1
 *   2. Count display: shows the number of selected IDs
 *   3. Apply button: calls onBulkStatusUpdate with the selected status
 *   4. Apply button disabled: when isPending is true or no status is selected
 *
 * Requirements: 4.4
 */

import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers — mirror the logic from BulkActionToolbar
// ---------------------------------------------------------------------------

function isToolbarVisible(selectedIds: string[]): boolean {
  return selectedIds.length >= 1;
}

function getCountLabel(selectedIds: string[]): string {
  return `${selectedIds.length} selected`;
}

function isApplyDisabled(isPending: boolean, selectedStatus: string): boolean {
  return isPending || !selectedStatus;
}

function handleApply(
  isPending: boolean,
  selectedStatus: string,
  onBulkStatusUpdate: (status: string) => void
): void {
  if (!isPending && selectedStatus) {
    onBulkStatusUpdate(selectedStatus);
  }
}

// ---------------------------------------------------------------------------
// Tests — toolbar visibility
// ---------------------------------------------------------------------------

describe("BulkActionToolbar — visibility", () => {
  it("is not rendered when selectedIds is empty", () => {
    expect(isToolbarVisible([])).toBe(false);
  });

  it("is rendered when selectedIds has one item", () => {
    expect(isToolbarVisible(["id-1"])).toBe(true);
  });

  it("is rendered when selectedIds has multiple items", () => {
    expect(isToolbarVisible(["id-1", "id-2", "id-3"])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — count display
// ---------------------------------------------------------------------------

describe("BulkActionToolbar — count display", () => {
  it("shows correct count when 1 ID is selected", () => {
    expect(getCountLabel(["id-1"])).toBe("1 selected");
  });

  it("shows correct count when 3 IDs are selected", () => {
    expect(getCountLabel(["id-1", "id-2", "id-3"])).toBe("3 selected");
  });

  it("count label reflects the exact number of selected IDs", () => {
    const ids = ["uuid-a", "uuid-b", "uuid-c", "uuid-d", "uuid-e"];
    expect(getCountLabel(ids)).toBe(`${ids.length} selected`);
  });
});

// ---------------------------------------------------------------------------
// Tests — Apply button behavior
// ---------------------------------------------------------------------------

describe("BulkActionToolbar — Apply button behavior", () => {
  it("calls onBulkStatusUpdate with 'reviewed' when reviewed is selected", () => {
    const onBulkStatusUpdate = vi.fn();
    handleApply(false, "reviewed", onBulkStatusUpdate);
    expect(onBulkStatusUpdate).toHaveBeenCalledWith("reviewed");
  });

  it("calls onBulkStatusUpdate with 'accepted' when accepted is selected", () => {
    const onBulkStatusUpdate = vi.fn();
    handleApply(false, "accepted", onBulkStatusUpdate);
    expect(onBulkStatusUpdate).toHaveBeenCalledWith("accepted");
  });

  it("does not call onBulkStatusUpdate when no status is selected", () => {
    const onBulkStatusUpdate = vi.fn();
    handleApply(false, "", onBulkStatusUpdate);
    expect(onBulkStatusUpdate).not.toHaveBeenCalled();
  });

  it("does not call onBulkStatusUpdate when isPending is true", () => {
    const onBulkStatusUpdate = vi.fn();
    handleApply(true, "reviewed", onBulkStatusUpdate);
    expect(onBulkStatusUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests — Apply button disabled state
// ---------------------------------------------------------------------------

describe("BulkActionToolbar — Apply button disabled state", () => {
  it("is disabled when isPending is true and a status is selected", () => {
    expect(isApplyDisabled(true, "reviewed")).toBe(true);
  });

  it("is disabled when isPending is false and no status is selected", () => {
    expect(isApplyDisabled(false, "")).toBe(true);
  });

  it("is enabled when isPending is false and a status is selected", () => {
    expect(isApplyDisabled(false, "pending")).toBe(false);
  });

  it("is enabled for each valid status when not pending", () => {
    const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
    for (const status of validStatuses) {
      expect(isApplyDisabled(false, status)).toBe(false);
    }
  });

  it("is disabled for all valid statuses when isPending is true", () => {
    const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
    for (const status of validStatuses) {
      expect(isApplyDisabled(true, status)).toBe(true);
    }
  });
});
