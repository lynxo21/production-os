UPDATE "items" SET "tracked_by_serial" = true WHERE "id" IN (SELECT DISTINCT "item_id" FROM "item_units");
