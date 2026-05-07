-- CreateEnum
CREATE TYPE "OrgUserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ItemPreset" AS ENUM ('MODEL', 'CONTAINER', 'PACKAGE');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'OUT_ON_JOB', 'IN_REPAIR', 'RETIRED');

-- CreateEnum
CREATE TYPE "CrewType" AS ENUM ('IN_HOUSE', 'FREELANCE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'WRAPPED', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OWNED', 'RENTED', 'SUBSTITUTED', 'CONFLICTED');

-- CreateEnum
CREATE TYPE "CrewSource" AS ENUM ('IN_HOUSE', 'FREELANCE');

-- CreateEnum
CREATE TYPE "CrewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'WRAPPED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrgUserRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_tiers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "tier_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget_min" DECIMAL(65,30),
    "budget_max" DECIMAL(65,30),
    "color" TEXT NOT NULL DEFAULT '#888888',

    CONSTRAINT "budget_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_default_discounts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "discount_pct" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "tier_default_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "primary_group_id" TEXT,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "shorthand" TEXT,
    "size" TEXT,
    "narrative_description" TEXT,
    "purchase_cost" DECIMAL(65,30),
    "replacement_cost" DECIMAL(65,30),
    "standard_day_rate" DECIMAL(65,30),
    "manufacturer" TEXT,
    "country_of_manufacture" TEXT,
    "track_running_hours" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "line_mute_default" BOOLEAN NOT NULL DEFAULT false,
    "note_mute_default" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "preset" "ItemPreset" NOT NULL DEFAULT 'MODEL',
    "tracked_by_serial" BOOLEAN NOT NULL DEFAULT false,
    "is_unit_container" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_additional_groups" (
    "item_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,

    CONSTRAINT "item_additional_groups_pkey" PRIMARY KEY ("item_id","group_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#888888',

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_tags" (
    "item_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "item_tags_pkey" PRIMARY KEY ("item_id","tag_id")
);

-- CreateTable
CREATE TABLE "item_units" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "serial_number" TEXT,
    "barcode" TEXT,
    "condition" TEXT,
    "running_hours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_stock" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity_owned" INTEGER NOT NULL DEFAULT 0,
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gear_tier_rates" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "day_rate" DECIMAL(65,30),
    "discount_pct" DECIMAL(65,30),

    CONSTRAINT "gear_tier_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "minimum_tier_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "type" "CrewType" NOT NULL DEFAULT 'FREELANCE',
    "standard_day_rate" DECIMAL(65,30),
    "overtime_rate" DECIMAL(65,30),
    "union_status" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crew_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_member_roles" (
    "crew_member_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "rate_override" DECIMAL(65,30),

    CONSTRAINT "crew_member_roles_pkey" PRIMARY KEY ("crew_member_id","role_id")
);

-- CreateTable
CREATE TABLE "role_tier_rates" (
    "role_id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "day_rate" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "role_tier_rates_pkey" PRIMARY KEY ("role_id","tier_id")
);

-- CreateTable
CREATE TABLE "crew_member_tier_rates" (
    "crew_member_id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "day_rate" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "crew_member_tier_rates_pkey" PRIMARY KEY ("crew_member_id","tier_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "default_tier_id" TEXT,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "billing_address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_id" TEXT,
    "tier_id" TEXT,
    "name" TEXT NOT NULL,
    "job_number" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" DATE,
    "end_date" DATE,
    "shoot_days" INTEGER,
    "location" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_line_items" (
    "id" SERIAL NOT NULL,
    "job_id" TEXT NOT NULL,
    "item_id" TEXT,
    "display_name" TEXT NOT NULL,
    "quantity_requested" INTEGER NOT NULL,
    "day_rate" DECIMAL(65,30),
    "days" INTEGER NOT NULL DEFAULT 1,
    "replacement_cost" DECIMAL(65,30),
    "line_muted" BOOLEAN NOT NULL DEFAULT false,
    "note_muted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_line_item_sources" (
    "id" TEXT NOT NULL,
    "line_item_id" INTEGER NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "vendor_id" TEXT,
    "vendor_cost_per_day" DECIMAL(65,30),
    "vendor_total_cost" DECIMAL(65,30),
    "conflict_job_id" TEXT,
    "notes" TEXT,

    CONSTRAINT "job_line_item_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_crew" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "crew_member_id" TEXT,
    "role_id" TEXT NOT NULL,
    "source_type" "CrewSource" NOT NULL DEFAULT 'IN_HOUSE',
    "start_date" DATE,
    "end_date" DATE,
    "agreed_rate" DECIMAL(65,30),
    "status" "CrewStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "job_crew_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_organization_id_user_id_key" ON "organization_users"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_tiers_organization_id_tier_number_key" ON "budget_tiers"("organization_id", "tier_number");

-- CreateIndex
CREATE UNIQUE INDEX "tier_default_discounts_organization_id_tier_id_key" ON "tier_default_discounts"("organization_id", "tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organization_id_name_key" ON "tags"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "item_units_barcode_key" ON "item_units"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "item_stock_item_id_key" ON "item_stock"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "gear_tier_rates_item_id_tier_id_key" ON "gear_tier_rates"("item_id", "tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organization_id_name_key" ON "roles"("organization_id", "name");

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_tiers" ADD CONSTRAINT "budget_tiers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_default_discounts" ADD CONSTRAINT "tier_default_discounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_default_discounts" ADD CONSTRAINT "tier_default_discounts_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "budget_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_primary_group_id_fkey" FOREIGN KEY ("primary_group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_additional_groups" ADD CONSTRAINT "item_additional_groups_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_additional_groups" ADD CONSTRAINT "item_additional_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_units" ADD CONSTRAINT "item_units_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_stock" ADD CONSTRAINT "item_stock_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_tier_rates" ADD CONSTRAINT "gear_tier_rates_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_tier_rates" ADD CONSTRAINT "gear_tier_rates_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "budget_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_members" ADD CONSTRAINT "crew_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_members" ADD CONSTRAINT "crew_members_minimum_tier_id_fkey" FOREIGN KEY ("minimum_tier_id") REFERENCES "budget_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_member_roles" ADD CONSTRAINT "crew_member_roles_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "crew_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_member_roles" ADD CONSTRAINT "crew_member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_tier_rates" ADD CONSTRAINT "role_tier_rates_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_tier_rates" ADD CONSTRAINT "role_tier_rates_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "budget_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_member_tier_rates" ADD CONSTRAINT "crew_member_tier_rates_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "crew_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_member_tier_rates" ADD CONSTRAINT "crew_member_tier_rates_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "budget_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_default_tier_id_fkey" FOREIGN KEY ("default_tier_id") REFERENCES "budget_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "budget_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_line_items" ADD CONSTRAINT "job_line_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_line_items" ADD CONSTRAINT "job_line_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_line_item_sources" ADD CONSTRAINT "job_line_item_sources_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "job_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_line_item_sources" ADD CONSTRAINT "job_line_item_sources_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_crew" ADD CONSTRAINT "job_crew_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_crew" ADD CONSTRAINT "job_crew_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "crew_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_crew" ADD CONSTRAINT "job_crew_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
