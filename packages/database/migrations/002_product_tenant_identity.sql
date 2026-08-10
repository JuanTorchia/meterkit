ALTER TABLE products ADD COLUMN IF NOT EXISTS uid uuid;

UPDATE products SET uid = gen_random_uuid() WHERE uid IS NULL;

ALTER TABLE products ALTER COLUMN uid SET DEFAULT gen_random_uuid();
ALTER TABLE products ALTER COLUMN uid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_uid_idx ON products (uid);
CREATE UNIQUE INDEX IF NOT EXISTS products_owner_slug_idx
  ON products (owner_wallet, id);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS product_uid uuid;

UPDATE payments payment
SET product_uid = product.uid
FROM products product
WHERE payment.product_uid IS NULL AND payment.product_id = product.id;

ALTER TABLE payments ALTER COLUMN product_uid SET NOT NULL;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_product_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_product_uid_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_product_uid_fkey
  FOREIGN KEY (product_uid) REFERENCES products(uid);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (uid);

CREATE INDEX IF NOT EXISTS payments_product_uid_settled_idx
  ON payments (product_uid, settled_at DESC);
