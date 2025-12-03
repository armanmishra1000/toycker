import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251203120116 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_multi_collection" ("id" text not null, "product_id" text not null, "collection_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_multi_collection_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_multi_collection_product_id" ON "product_multi_collection" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_multi_collection_collection_id" ON "product_multi_collection" ("collection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_multi_collection_deleted_at" ON "product_multi_collection" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_multi_collection_unique_pair" ON "product_multi_collection" ("product_id", "collection_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_multi_collection" cascade;`);
  }

}
