INSERT INTO "permissions" ("module", "action")
VALUES ('incidents', 'assign')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id_role", "id_permission")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE LOWER(r."name") LIKE '%consultor%'
  AND p."module" = 'incidents'
  AND p."action" = 'assign'
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permissions" existing
    WHERE existing."id_role" = r."id"
      AND existing."id_permission" = p."id"
  );
