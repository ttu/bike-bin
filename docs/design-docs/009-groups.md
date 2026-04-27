# Groups

## Overview

Community groups for sharing items with a defined set of users. Groups can be public (searchable, request to join) or private (invite-only). Members have roles: admin or member. Items can be scoped to specific groups via visibility settings, making them visible only to group members.

## Data Model

### groups table

| Column      | Type                 | Description                                  |
| ----------- | -------------------- | -------------------------------------------- |
| id          | uuid (PK)            | GroupId branded type                         |
| name        | text                 | Group name                                   |
| description | text                 | Group description                            |
| is_public   | boolean              | Public (searchable) vs private (invite-only) |
| created_by  | uuid (FK → profiles) | Creator                                      |
| created_at  | timestamptz          | Creation timestamp                           |

### group_members table

| Column    | Type                 | Description    |
| --------- | -------------------- | -------------- |
| id        | uuid (PK)            | Membership ID  |
| group_id  | uuid (FK → groups)   | Group          |
| user_id   | uuid (FK → profiles) | Member         |
| role      | group_role enum      | admin, member  |
| joined_at | timestamptz          | Join timestamp |

### item_groups junction table

| Column   | Type               | Description |
| -------- | ------------------ | ----------- |
| item_id  | uuid (FK → items)  | Item        |
| group_id | uuid (FK → groups) | Group       |

Composite PK. Links items with `visibility = 'groups'` to specific groups.

### Key types

- **GroupFormData** — `name`, `description?`, `isPublic`
- **GroupWithRole** — Group + `memberRole` + `joinedAt`
- **SearchGroupResult** — Group + `memberCount` + `isMember`
- **GroupMemberWithProfile** — GroupMember + profile display name/avatar

## Architecture

```
src/features/groups/
├── hooks/
│   ├── useGroups.ts             # CRUD: list, create, update, delete
│   ├── useGroup.ts              # Single group detail
│   ├── useGroupMembers.ts       # Members list, promote, remove
│   ├── useJoinGroup.ts          # Join/leave group mutations
│   ├── useInviteMember.ts       # Invite user to group
│   ├── useSearchGroups.ts       # Search public groups
│   └── useCreateGroup.ts        # Create group mutation
├── utils/
│   ├── groupPermissions.ts      # Role-based permission guards
│   └── mapGroupRow.ts           # Row → Group mapper
├── types.ts                      # GroupFormData, GroupWithRole, etc.
└── index.ts                      # Public API
```

### Permission guards (groupPermissions.ts)

| Guard                             | Condition          |
| --------------------------------- | ------------------ |
| `canInvite(role)`                 | User is admin      |
| `canRemoveMember(role)`           | User is admin      |
| `canEditGroup(role)`              | User is admin      |
| `canDeleteGroup(role)`            | User is admin      |
| `canPromoteMember(role)`          | User is admin      |
| `canLeaveGroup(role, allMembers)` | Not the last admin |

## Screens & Navigation

| Route                     | Screen       | Purpose                              |
| ------------------------- | ------------ | ------------------------------------ |
| `(tabs)/groups/index.tsx` | Groups List  | User's groups + search public groups |
| `(tabs)/groups/[id].tsx`  | Group Detail | Members, settings, join/leave        |

## Key Flows

### Creating a Group

1. User taps "Create group" → fills form (name, description, public/private)
2. `useCreateGroup` inserts group + adds creator as admin member
3. Group appears in user's groups list

### Joining a Public Group

1. User searches public groups → taps "Request to Join"
2. `useJoinGroup` adds user as member
3. User can now see group-scoped items

### Managing Members (Admin)

- Promote member to admin
- Remove member from group
- Invite new members
- Last admin cannot leave (must promote someone first)

## i18n

Namespace: `groups`

Key areas: `empty.*` (empty state), `search.*` (search groups), `create.*` (create form), `detail.*` (member list, admin actions, join/leave), `edit.*` (edit form), `visibility.*` (item visibility group selector).

## Current Status

- **Implemented:** Full CRUD, public/private groups, role-based permissions, member management, group search, item visibility scoping
- **Working:** All admin actions, join/leave flows, group-scoped item visibility
