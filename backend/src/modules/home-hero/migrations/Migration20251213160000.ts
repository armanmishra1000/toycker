import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20251213160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "home_hero_banner" (
        "id" text not null,
        "image_url" text not null,
        "image_key" text not null,
        "alt_text" text null,
        "sort_order" integer not null default 0,
        "is_visible" boolean not null default true,
        "starts_at" timestamptz null,
        "ends_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "home_hero_banner_pkey" primary key ("id")
      );
    `)

    this.addSql(`
      create index if not exists "IDX_home_hero_banner_sort_order"
      on "home_hero_banner" ("sort_order") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_home_hero_banner_is_visible"
      on "home_hero_banner" ("is_visible") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_home_hero_banner_starts_at"
      on "home_hero_banner" ("starts_at") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_home_hero_banner_ends_at"
      on "home_hero_banner" ("ends_at") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_home_hero_banner_visibility_window"
      on "home_hero_banner" ("is_visible", "starts_at", "ends_at") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_home_hero_banner_deleted_at"
      on "home_hero_banner" ("deleted_at") where deleted_at is null;
    `)
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "home_hero_banner" cascade;')
  }
}
