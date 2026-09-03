BEGIN;

INSERT INTO "inventory_asset_types" ("code", "name", "description", "updated_at") VALUES
  ('TECHNOLOGY', 'Tecnología', 'Activos con extensión técnica de dispositivos', CURRENT_TIMESTAMP),
  ('VEHICLE', 'Vehículo', 'Activos clasificados como equipo de transporte', CURRENT_TIMESTAMP),
  ('PROPERTY', 'Propiedad', 'Terrenos y propiedades inmobiliarias', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "inventory_asset_extensions" ("code", "name", "description", "updated_at") VALUES
  ('DEVICES', 'Dispositivos', 'Extensión técnica para equipos tecnológicos', CURRENT_TIMESTAMP),
  ('VEHICLES', 'Vehículos', 'Extensión técnica para vehículos', CURRENT_TIMESTAMP),
  ('PROPERTIES', 'Propiedades', 'Extensión técnica para terrenos y propiedades', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

WITH root AS (
  SELECT "id"
  FROM "inventory_asset_classifications"
  WHERE "source" = 'Contraloria General de la Republica'
    AND "source_version" = '2008-2017'
    AND "code_new" = '1204'
)
INSERT INTO "inventory_asset_classifications" (
  "code_new", "description", "parent_id", "level", "is_assignable", "source", "source_version", "updated_at"
)
SELECT '1204', 'Propiedades, planta y equipo', NULL, 1, false,
  'Contraloria General de la Republica', '2008-2017', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM root);

WITH root AS (
  SELECT "id"
  FROM "inventory_asset_classifications"
  WHERE "source" = 'Contraloria General de la Republica'
    AND "source_version" = '2008-2017'
    AND "code_new" = '1204'
)
INSERT INTO "inventory_asset_classifications" (
  "code_new", "description", "parent_id", "level", "is_assignable", "source", "source_version", "updated_at"
)
SELECT '120401', 'Terrenos', root."id", 2, false,
  'Contraloria General de la Republica', '2008-2017', CURRENT_TIMESTAMP
FROM root
WHERE NOT EXISTS (
  SELECT 1 FROM "inventory_asset_classifications"
  WHERE "source" = 'Contraloria General de la Republica'
    AND "source_version" = '2008-2017'
    AND "code_new" = '120401'
);

WITH root AS (
  SELECT "id"
  FROM "inventory_asset_classifications"
  WHERE "source" = 'Contraloria General de la Republica'
    AND "source_version" = '2008-2017'
    AND "code_new" = '1204'
)
INSERT INTO "inventory_asset_classifications" (
  "code_new", "description", "parent_id", "level", "is_assignable", "source", "source_version", "updated_at"
)
SELECT '120403', 'Maquinaria, equipos y otros', root."id", 2, false,
  'Contraloria General de la Republica', '2008-2017', CURRENT_TIMESTAMP
FROM root
WHERE NOT EXISTS (
  SELECT 1 FROM "inventory_asset_classifications"
  WHERE "source" = 'Contraloria General de la Republica'
    AND "source_version" = '2008-2017'
    AND "code_new" = '120403'
);

WITH parents AS (
  SELECT "code_new", "id"
  FROM "inventory_asset_classifications"
  WHERE "source" = 'Contraloria General de la Republica'
    AND "source_version" = '2008-2017'
    AND "code_new" IN ('120401', '120403')
)
INSERT INTO "inventory_asset_classifications" (
  "code_new", "description", "parent_id", "level", "is_assignable", "source", "source_version", "updated_at"
)
SELECT values."code_new", values."description", parents."id", 3, true,
  'Contraloria General de la Republica', '2008-2017', CURRENT_TIMESTAMP
FROM (VALUES
  ('120401', 'Terrenos'),
  ('12040101', 'Urbanizados'),
  ('12040102', 'No urbanizados'),
  ('12040302', 'Maquinaria y equipo de transporte'),
  ('12040303', 'Maquinaria y equipo de uso médico'),
  ('12040304', 'Maquinaria y equipo para comunicaciones'),
  ('12040320', 'Equipo informático'),
  ('12040321', 'Herramientas'),
  ('12040322', 'Mobiliario y enseres')
) AS values("code_new", "description")
JOIN parents ON parents."code_new" = CASE
  WHEN values."code_new" LIKE '120401%' THEN '120401'
  ELSE '120403'
END
WHERE values."code_new" NOT IN ('120401')
  AND NOT EXISTS (
    SELECT 1 FROM "inventory_asset_classifications" existing
    WHERE existing."source" = 'Contraloria General de la Republica'
      AND existing."source_version" = '2008-2017'
      AND existing."code_new" = values."code_new"
  );

INSERT INTO "inventory_asset_classification_mappings" (
  "classification_id", "legacy_code", "legacy_description", "source", "source_version"
)
SELECT classification."id", mapping."legacy_code", mapping."legacy_description",
  'Contraloria General de la Republica', '2008-2017'
FROM (VALUES
  ('12040101', '23101', 'Urbanizados'),
  ('12040102', '23104', 'No urbanizados'),
  ('12040102', '23102', 'Agrícolas'),
  ('12040102', '23103', 'Para extracción y explotación'),
  ('12040102', '23199', 'Otros'),
  ('12040302', '23301', 'Aéreo'),
  ('12040302', '23302', 'Marítimo'),
  ('12040302', '23303', 'Terrestre'),
  ('12040302', '23304', 'Ferroviario'),
  ('12040303', '23502', 'Equipo médico'),
  ('12040303', '23508', 'Maquinaria médica'),
  ('12040304', '23503', 'Equipo de comunicaciones'),
  ('12040304', '23509', 'Maquinaria de comunicaciones'),
  ('12040320', '23501', 'Equipo informático'),
  ('12040321', '23518', 'Herramientas'),
  ('12040322', '23601', 'Muebles y enseres de oficina'),
  ('12040322', '23602', 'Muebles y enseres de uso residencial'),
  ('12040322', '23603', 'Aparatos e implementos'),
  ('12040322', '23604', 'Muebles y enseres diversos'),
  ('12040322', '23605', 'Muebles y enseres de uso escolar'),
  ('12040322', '23606', 'Muebles y útiles de juegos de azar')
) AS mapping("code_new", "legacy_code", "legacy_description")
JOIN "inventory_asset_classifications" classification
  ON classification."code_new" = mapping."code_new"
 AND classification."source" = 'Contraloria General de la Republica'
 AND classification."source_version" = '2008-2017'
ON CONFLICT ("source", "source_version", "legacy_code", "classification_id") DO NOTHING;

INSERT INTO "inventory_asset_classification_rules" (
  "classification_id", "asset_type_id", "extension_id", "updated_at"
)
SELECT classification."id", asset_type."id", extension."id", CURRENT_TIMESTAMP
FROM (VALUES
  ('12040101', 'PROPERTY', 'PROPERTIES'),
  ('12040102', 'PROPERTY', 'PROPERTIES'),
  ('12040302', 'VEHICLE', 'VEHICLES'),
  ('12040320', 'TECHNOLOGY', 'DEVICES')
) AS rule("code_new", "asset_type_code", "extension_code")
JOIN "inventory_asset_classifications" classification
  ON classification."code_new" = rule."code_new"
 AND classification."source" = 'Contraloria General de la Republica'
 AND classification."source_version" = '2008-2017'
JOIN "inventory_asset_types" asset_type
  ON asset_type."code" = rule."asset_type_code"
JOIN "inventory_asset_extensions" extension
  ON extension."code" = rule."extension_code"
ON CONFLICT ("classification_id", "asset_type_id", "extension_id") DO NOTHING;

COMMIT;