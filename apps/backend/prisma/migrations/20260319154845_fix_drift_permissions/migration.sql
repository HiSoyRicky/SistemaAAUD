-- AlterTable
ALTER TABLE "bd_incidents" ALTER COLUMN "ticket_number" DROP DEFAULT;
DROP SEQUENCE "bd_incidents_ticket_number_seq";

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id_permission" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id_permission","id_role")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_id_permission_fkey" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
