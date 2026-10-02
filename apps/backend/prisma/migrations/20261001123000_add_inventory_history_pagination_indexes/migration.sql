CREATE INDEX "activity_logs_history_asset_idx"
ON "activity_logs" ("entity_type", "entity_id", "created_at" DESC, "id" DESC);

CREATE INDEX "activity_logs_history_general_idx"
ON "activity_logs" ("entity_type", "created_at" DESC, "id" DESC);