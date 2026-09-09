-- CreateTable
CREATE TABLE "incident_notification_recipients" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "incident_notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incident_notification_recipients_email_key" ON "incident_notification_recipients"("email");

-- Migra los destinatarios que antes estaban fijos en el código para no cambiar
-- el comportamiento actual hasta que un administrador los edite desde la UI.
INSERT INTO "incident_notification_recipients" ("email")
VALUES
    ('abethancourt@aaud.gob.pa'),
    ('lchanis@aaud.gob.pa'),
    ('gmedina@aaud.gob.pa'),
    ('aramos@aaud.gob.pa'),
    ('hhunt@aaud.gob.pa')
ON CONFLICT ("email") DO NOTHING;

-- Nuevo módulo de permisos para administrar los destinatarios sin tocar código
INSERT INTO "permissions" ("module", "action")
VALUES
    ('notification_settings', 'read'),
    ('notification_settings', 'create'),
    ('notification_settings', 'delete')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id_role", "id_permission")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE LOWER(r."name") LIKE '%admin%'
  AND p."module" = 'notification_settings'
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permissions" existing
    WHERE existing."id_role" = r."id"
      AND existing."id_permission" = p."id"
  );
