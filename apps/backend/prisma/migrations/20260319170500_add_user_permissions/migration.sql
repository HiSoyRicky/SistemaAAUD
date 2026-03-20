-- CreateTable
CREATE TABLE "user_permissions" (
    "id_user" INTEGER NOT NULL,
    "id_permission" INTEGER NOT NULL,
    "allow" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id_user","id_permission")
);

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_id_permission_fkey" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
