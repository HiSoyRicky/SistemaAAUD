INSERT INTO "permissions" ("module", "action")
VALUES
  ('inventory', 'update_location'),
  ('inventory', 'update_department'),
  ('inventory', 'update_assignee')
ON CONFLICT ("module", "action") DO NOTHING;

DELETE FROM "role_permissions" AS role_permission
USING "permissions" AS permission, "roles" AS role
WHERE role_permission."id_permission" = permission."id"
  AND role_permission."id_role" = role."id"
  AND permission."module" = 'inventory'
  AND permission."action" = 'update'
  AND (
    LOWER(role."name") LIKE '%tecnico%'
    OR LOWER(role."name") LIKE '%técnico%'
  );
