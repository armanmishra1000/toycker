import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20251211093000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "reward_transaction" (
        "id" text not null,
        "customer_id" text not null,
        "order_id" text null,
        "cart_id" text null,
        "points" integer not null,
        "type" text not null,
        "is_confirmed" boolean not null default false,
        "description" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "reward_transaction_pkey" primary key ("id")
      );
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_customer"
      on "reward_transaction" ("customer_id") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_order"
      on "reward_transaction" ("order_id") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_cart"
      on "reward_transaction" ("cart_id") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_type"
      on "reward_transaction" ("type") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_confirmed"
      on "reward_transaction" ("is_confirmed") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_customer_confirmed"
      on "reward_transaction" ("customer_id", "is_confirmed") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_customer_type"
      on "reward_transaction" ("customer_id", "type") where deleted_at is null;
    `)

    this.addSql(`
      create index if not exists "IDX_reward_tx_deleted_at"
      on "reward_transaction" ("deleted_at") where deleted_at is null;
    `)

    this.addSql(`
      create table if not exists "reward_setting" (
        "id" text not null,
        "earn_rate_bps" integer not null default 500,
        "updated_by" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "reward_setting_pkey" primary key ("id")
      );
    `)

    this.addSql(`
      create index if not exists "IDX_reward_setting_deleted_at"
      on "reward_setting" ("deleted_at") where deleted_at is null;
    `)
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "reward_transaction" cascade;')
    this.addSql('drop table if exists "reward_setting" cascade;')
  }
}
