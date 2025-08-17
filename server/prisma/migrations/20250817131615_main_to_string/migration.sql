-- Cast enum -> varchar preservando i dati
ALTER TABLE "Category"
  ALTER COLUMN "main" TYPE VARCHAR(32) USING "main"::text;

ALTER TABLE "Transaction"
  ALTER COLUMN "main" TYPE VARCHAR(32) USING "main"::text;

-- (Opzionale) pulizia: elimina il tipo enum se non più referenziato
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MainCategory') THEN
    DROP TYPE "MainCategory";
  END IF;
END$$;
