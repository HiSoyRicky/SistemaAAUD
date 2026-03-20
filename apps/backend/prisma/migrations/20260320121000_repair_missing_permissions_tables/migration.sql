-- Repair migration for environments where RBAC migrations were marked as applied
-- but SQL objects were not actually created.

CREATE TABLE IF NOT EXISTS "permissions" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "module" TEXT;
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "action" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "permissions_module_action_key"
ON "permissions"("module", "action");

CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id_permission" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id_permission", "id_role")
);

ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "id_permission" INTEGER;
ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "id_role" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'role_permissions_id_permission_fkey'
  ) THEN
    ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_id_permission_fkey"
    FOREIGN KEY ("id_permission")
    REFERENCES "permissions"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'role_permissions_id_role_fkey'
  ) THEN
    ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_id_role_fkey"
    FOREIGN KEY ("id_role")
    REFERENCES "roles"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id_user" INTEGER NOT NULL,
    "id_permission" INTEGER NOT NULL,
    "allow" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id_user", "id_permission")
);

ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "id_user" INTEGER;
ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "id_permission" INTEGER;
ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "allow" BOOLEAN DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_permissions_id_user_fkey'
  ) THEN
    ALTER TABLE "user_permissions"
    ADD CONSTRAINT "user_permissions_id_user_fkey"
    FOREIGN KEY ("id_user")
    REFERENCES "users"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_permissions_id_permission_fkey'
  ) THEN
    ALTER TABLE "user_permissions"
    ADD CONSTRAINT "user_permissions_id_permission_fkey"
    FOREIGN KEY ("id_permission")
    REFERENCES "permissions"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;
