-- ============================================================
-- Borrow: add picked_up status (first of two migrations for the three-step lifecycle)
-- ============================================================
ALTER TYPE borrow_request_status ADD VALUE IF NOT EXISTS 'picked_up' AFTER 'accepted';
