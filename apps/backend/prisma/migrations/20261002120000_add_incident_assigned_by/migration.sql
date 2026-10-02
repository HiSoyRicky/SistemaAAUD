ALTER TABLE "bd_incidents"
ADD COLUMN "assigned_by" INTEGER;

CREATE INDEX "bd_incidents_assigned_by_idx"
ON "bd_incidents" ("assigned_by");

ALTER TABLE "bd_incidents"
ADD CONSTRAINT "fk_bd_incidents_assigned_by_users"
FOREIGN KEY ("assigned_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE NO ACTION;