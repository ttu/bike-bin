-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================

-- Anyone can view public profile fields
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- saved_locations
-- ============================================================

CREATE POLICY "saved_locations_select_own"
  ON saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_locations_insert_own"
  ON saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_locations_update_own"
  ON saved_locations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_locations_delete_own"
  ON saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- items
-- ============================================================

-- Public items visible to all
CREATE POLICY "items_select_public"
  ON items FOR SELECT
  USING (
    visibility = 'all'
    OR owner_id = auth.uid()
    OR (
      visibility = 'groups'
      AND EXISTS (
        SELECT 1 FROM item_groups ig
        JOIN group_members gm ON gm.group_id = ig.group_id
        WHERE ig.item_id = items.id AND gm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "items_insert_own"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their items (but not while loaned or reserved by others)
CREATE POLICY "items_update_own"
  ON items FOR UPDATE
  USING (
    auth.uid() = owner_id
    AND status NOT IN ('loaned', 'reserved')
  )
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "items_delete_own"
  ON items FOR DELETE
  USING (
    auth.uid() = owner_id
    AND status NOT IN ('loaned', 'reserved')
  );

-- ============================================================
-- item_photos
-- ============================================================

CREATE POLICY "item_photos_select_via_item"
  ON item_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          items.visibility = 'all'
          OR items.owner_id = auth.uid()
          OR (
            items.visibility = 'groups'
            AND EXISTS (
              SELECT 1 FROM item_groups ig
              JOIN group_members gm ON gm.group_id = ig.group_id
              WHERE ig.item_id = items.id AND gm.user_id = auth.uid()
            )
          )
        )
    )
  );

CREATE POLICY "item_photos_insert_own"
  ON item_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "item_photos_update_own"
  ON item_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "item_photos_delete_own"
  ON item_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = auth.uid()
    )
  );

-- ============================================================
-- bikes
-- ============================================================

CREATE POLICY "bikes_select_own"
  ON bikes FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "bikes_insert_own"
  ON bikes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "bikes_update_own"
  ON bikes FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "bikes_delete_own"
  ON bikes FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- groups
-- ============================================================

-- Public groups visible to all; private groups visible to members
CREATE POLICY "groups_select"
  ON groups FOR SELECT
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()
    )
  );

-- Any authenticated user can create a group
CREATE POLICY "groups_insert_authenticated"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only group admins can update the group
CREATE POLICY "groups_update_admin"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

-- Only group admins can delete the group
CREATE POLICY "groups_delete_admin"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

-- ============================================================
-- group_members
-- ============================================================

-- Members of a group can see member list; public group members visible to all
CREATE POLICY "group_members_select"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id AND groups.is_public = true
    )
    OR EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
    )
  );

-- Users can insert themselves (join); admins can add others
CREATE POLICY "group_members_insert"
  ON group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_members.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

-- Only admins can update member roles
CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm_admin
      WHERE gm_admin.group_id = group_members.group_id
        AND gm_admin.user_id = auth.uid()
        AND gm_admin.role = 'admin'
    )
  );

-- Users can remove themselves; admins can remove others
CREATE POLICY "group_members_delete"
  ON group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm_admin
      WHERE gm_admin.group_id = group_members.group_id
        AND gm_admin.user_id = auth.uid()
        AND gm_admin.role = 'admin'
    )
  );

-- ============================================================
-- item_groups
-- ============================================================

-- Item owner or group member can see item_groups entries
CREATE POLICY "item_groups_select"
  ON item_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_groups.item_id AND items.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = item_groups.group_id AND group_members.user_id = auth.uid()
    )
  );

-- Only item owners can assign items to groups
CREATE POLICY "item_groups_insert_owner"
  ON item_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_groups.item_id AND items.owner_id = auth.uid()
    )
  );

-- Only item owners can remove items from groups
CREATE POLICY "item_groups_delete_owner"
  ON item_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_groups.item_id AND items.owner_id = auth.uid()
    )
  );

-- ============================================================
-- borrow_requests
-- ============================================================

-- Requester or item owner can see requests
CREATE POLICY "borrow_requests_select"
  ON borrow_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  );

-- Authenticated users can create requests (for items they don't own)
CREATE POLICY "borrow_requests_insert"
  ON borrow_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND NOT EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  );

-- Item owner can accept/reject; requester can cancel
CREATE POLICY "borrow_requests_update"
  ON borrow_requests FOR UPDATE
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  );

-- ============================================================
-- conversations
-- ============================================================

-- Only participants can see conversations
CREATE POLICY "conversations_select"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Authenticated users can create conversations
CREATE POLICY "conversations_insert_authenticated"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- conversation_participants
-- ============================================================

CREATE POLICY "conversation_participants_select"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_insert_authenticated"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- messages
-- ============================================================

-- Only conversation participants can read messages
CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Only conversation participants can send messages
CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- ============================================================
-- ratings
-- ============================================================

-- Ratings are public
CREATE POLICY "ratings_select_public"
  ON ratings FOR SELECT
  USING (true);

-- Authenticated users can create ratings
CREATE POLICY "ratings_insert_authenticated"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Users can update their own ratings within the editable window
CREATE POLICY "ratings_update_own"
  ON ratings FOR UPDATE
  USING (
    auth.uid() = from_user_id
    AND (editable_until IS NULL OR editable_until > now())
  )
  WITH CHECK (auth.uid() = from_user_id);

-- Users can delete their own ratings
CREATE POLICY "ratings_delete_own"
  ON ratings FOR DELETE
  USING (auth.uid() = from_user_id);

-- ============================================================
-- notifications
-- ============================================================

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- support_requests
-- ============================================================

-- Unauthenticated or authenticated users can submit support requests
CREATE POLICY "support_requests_insert"
  ON support_requests FOR INSERT
  WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- Authenticated users can view their own support requests
CREATE POLICY "support_requests_select_own"
  ON support_requests FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- reports
-- ============================================================

-- Authenticated users can submit reports
CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);
