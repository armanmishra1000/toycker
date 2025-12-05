import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20251205153000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "exclusive_showcase_entry" (
        "id" text not null,
        "product_id" text not null,
        "video_url" text not null,
        "video_key" text not null,
        "poster_url" text null,
        "sort_order" integer not null default 0,
        "is_active" boolean not null default true,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "exclusive_showcase_entry_pkey" primary key ("id")
      );
    `)

    this.addSql(`
      create unique index if not exists "UQ_exclusive_showcase_product_id"
      on "exclusive_showcase_entry" ("product_id") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_exclusive_showcase_product_id"
      on "exclusive_showcase_entry" ("product_id") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_exclusive_showcase_sort_order"
      on "exclusive_showcase_entry" ("sort_order") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_exclusive_showcase_is_active"
      on "exclusive_showcase_entry" ("is_active") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_exclusive_showcase_product_active"
      on "exclusive_showcase_entry" ("product_id", "is_active") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_exclusive_showcase_deleted_at"
      on "exclusive_showcase_entry" ("deleted_at") where deleted_at is null;
    `)
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "exclusive_showcase_entry" cascade;')
  }
}
