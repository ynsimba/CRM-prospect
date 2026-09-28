<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('currency', 8)->default('CDF');
            $table->string('timezone')->default('Africa/Kinshasa');
            $table->string('locale', 16)->default('fr-CD');
            $table->string('dateFormat', 32)->default('dd/MM/yyyy');
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('logoUrl')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->integer('maxUsers');
            $table->integer('maxProspects');
            $table->integer('maxPipelines');
        });

        Schema::create('teams', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->string('name');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->unique(['organizationId', 'name']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('teamId', 26)->nullable();
            $table->string('email');
            $table->string('passwordHash');
            $table->string('name');
            $table->string('civility', 16)->nullable();
            $table->string('phone')->nullable();
            $table->string('role', 32);
            $table->boolean('isActive')->default(true);
            $table->timestamp('lastLoginAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->unique(['organizationId', 'email']);
            $table->index('email');
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('teamId')->references('id')->on('teams')->nullOnDelete();
        });

        Schema::create('prospect_statuses', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->string('name');
            $table->string('slug');
            $table->integer('sortOrder')->default(0);
            $table->boolean('isConverted')->default(false);
            $table->boolean('isLost')->default(false);
            $table->unique(['organizationId', 'slug']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('prospect_sources', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->string('name');
            $table->string('slug');
            $table->unique(['organizationId', 'slug']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('tags', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->string('name');
            $table->unique(['organizationId', 'name']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('ownerId', 26)->nullable();
            $table->string('name');
            $table->string('industry')->nullable();
            $table->string('website')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('size')->nullable();
            $table->string('displayCode')->nullable();
            $table->string('status', 32)->default('active');
            $table->text('notes')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->index('name');
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('ownerId')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('companyId', 26)->nullable();
            $table->char('ownerId', 26)->nullable();
            $table->string('firstName');
            $table->string('lastName');
            $table->string('civility', 16)->nullable();
            $table->string('jobTitle')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('status', 32)->default('active');
            $table->string('category', 32)->nullable();
            $table->string('displayCode')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->index('email');
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('companyId')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('ownerId')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('prospects', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('companyId', 26)->nullable();
            $table->char('contactId', 26)->nullable();
            $table->char('ownerId', 26)->nullable();
            $table->char('statusId', 26);
            $table->char('sourceId', 26)->nullable();
            $table->string('firstName');
            $table->string('lastName');
            $table->string('jobTitle')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('website')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('industry')->nullable();
            $table->string('companySize')->nullable();
            $table->string('language', 16)->nullable();
            $table->string('category', 32)->nullable();
            $table->string('priority', 16)->default('NORMAL');
            $table->integer('score')->default(0);
            $table->text('notes')->nullable();
            $table->text('statusComment')->nullable();
            $table->string('displayCode')->nullable();
            $table->timestamp('firstContactAt')->nullable();
            $table->timestamp('lastActionAt')->nullable();
            $table->timestamp('nextContactAt')->nullable();
            $table->timestamp('lastContactAt')->nullable();
            $table->boolean('marketingConsent')->default(false);
            $table->timestamp('convertedAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->index(['organizationId', 'createdAt']);
            $table->index('email');
            $table->index('phone');
            $table->index('nextContactAt');
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('companyId')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('contactId')->references('id')->on('contacts')->nullOnDelete();
            $table->foreign('ownerId')->references('id')->on('users')->nullOnDelete();
            $table->foreign('statusId')->references('id')->on('prospect_statuses')->restrictOnDelete();
            $table->foreign('sourceId')->references('id')->on('prospect_sources')->nullOnDelete();
        });

        Schema::create('prospect_status_histories', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('prospectId', 26);
            $table->char('statusId', 26);
            $table->char('actorId', 26)->nullable();
            $table->string('statusName');
            $table->string('statusSlug');
            $table->text('comment')->nullable();
            $table->string('displayCode')->nullable();
            $table->timestamp('occurredAt')->useCurrent();
            $table->index(['organizationId', 'occurredAt']);
            $table->index(['prospectId', 'occurredAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('prospectId')->references('id')->on('prospects')->cascadeOnDelete();
            $table->foreign('statusId')->references('id')->on('prospect_statuses')->restrictOnDelete();
            $table->foreign('actorId')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('prospect_tags', function (Blueprint $table) {
            $table->char('prospectId', 26);
            $table->char('tagId', 26);
            $table->primary(['prospectId', 'tagId']);
            $table->foreign('prospectId')->references('id')->on('prospects')->cascadeOnDelete();
            $table->foreign('tagId')->references('id')->on('tags')->cascadeOnDelete();
        });

        Schema::create('pipelines', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->string('name');
            $table->boolean('isDefault')->default(false);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->unique(['organizationId', 'name']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('pipelineId', 26);
            $table->string('name');
            $table->integer('sortOrder')->default(0);
            $table->integer('probability')->default(0);
            $table->boolean('isWon')->default(false);
            $table->boolean('isLost')->default(false);
            $table->index(['pipelineId', 'sortOrder']);
            $table->foreign('pipelineId')->references('id')->on('pipelines')->cascadeOnDelete();
        });

        Schema::create('opportunities', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('companyId', 26)->nullable();
            $table->char('contactId', 26)->nullable();
            $table->char('prospectId', 26)->nullable();
            $table->char('pipelineId', 26);
            $table->char('stageId', 26);
            $table->char('ownerId', 26)->nullable();
            $table->string('name');
            $table->integer('amount')->default(0);
            $table->string('currency', 8)->default('CDF');
            $table->integer('probability')->default(0);
            $table->timestamp('expectedCloseAt')->nullable();
            $table->string('status', 16)->default('OPEN');
            $table->string('source')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->index(['organizationId', 'status']);
            $table->index(['pipelineId', 'stageId']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('companyId')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('contactId')->references('id')->on('contacts')->nullOnDelete();
            $table->foreign('prospectId')->references('id')->on('prospects')->nullOnDelete();
            $table->foreign('pipelineId')->references('id')->on('pipelines')->restrictOnDelete();
            $table->foreign('stageId')->references('id')->on('pipeline_stages')->restrictOnDelete();
            $table->foreign('ownerId')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('activities', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('userId', 26);
            $table->char('prospectId', 26)->nullable();
            $table->char('companyId', 26)->nullable();
            $table->char('contactId', 26)->nullable();
            $table->char('opportunityId', 26)->nullable();
            $table->string('type', 16)->default('NOTE');
            $table->timestamp('occurredAt')->useCurrent();
            $table->integer('durationMin')->nullable();
            $table->string('outcome')->nullable();
            $table->text('comment')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->index(['organizationId', 'occurredAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('userId')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('prospectId')->references('id')->on('prospects')->nullOnDelete();
            $table->foreign('companyId')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('contactId')->references('id')->on('contacts')->nullOnDelete();
            $table->foreign('opportunityId')->references('id')->on('opportunities')->nullOnDelete();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('ownerId', 26);
            $table->char('assignedById', 26)->nullable();
            $table->char('prospectId', 26)->nullable();
            $table->char('companyId', 26)->nullable();
            $table->char('opportunityId', 26)->nullable();
            $table->string('title');
            $table->string('displayCode')->nullable();
            $table->text('description')->nullable();
            $table->text('directorNote')->nullable();
            $table->text('ownerNote')->nullable();
            $table->string('priority', 16)->default('NORMAL');
            $table->string('status', 16)->default('TODO');
            $table->timestamp('dueAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->index(['organizationId', 'status']);
            $table->index(['ownerId', 'dueAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('ownerId')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('assignedById')->references('id')->on('users')->nullOnDelete();
            $table->foreign('prospectId')->references('id')->on('prospects')->nullOnDelete();
            $table->foreign('companyId')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('opportunityId')->references('id')->on('opportunities')->nullOnDelete();
        });

        Schema::create('user_notes', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('ownerId', 26);
            $table->string('title');
            $table->text('body');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->index(['ownerId', 'updatedAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('ownerId')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('userId', 26);
            $table->string('title');
            $table->text('body');
            $table->string('kind', 32)->default('info');
            $table->timestamp('readAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->index(['userId', 'readAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('goals', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('userId', 26)->nullable();
            $table->integer('year');
            $table->integer('month');
            $table->integer('prospectsTarget')->default(0);
            $table->integer('meetingsTarget')->default(0);
            $table->integer('opportunitiesTarget')->default(0);
            $table->integer('revenueTarget')->default(0);
            $table->unique(['organizationId', 'userId', 'year', 'month'], 'goals_period_unique');
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('actorId', 26)->nullable();
            $table->string('action');
            $table->string('entity');
            $table->string('entityId')->nullable();
            $table->string('summary');
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->index(['organizationId', 'createdAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('actorId')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26)->unique();
            $table->char('planId', 26);
            $table->string('status', 16)->default('TRIALING');
            $table->timestamp('currentPeriodEnd')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('planId')->references('id')->on('plans')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        foreach ([
            'subscriptions', 'audit_logs', 'goals', 'notifications', 'user_notes', 'tasks', 'activities',
            'opportunities', 'pipeline_stages', 'pipelines', 'prospect_tags', 'prospect_status_histories',
            'prospects', 'contacts', 'companies', 'tags', 'prospect_sources', 'prospect_statuses',
            'users', 'teams', 'plans', 'organizations',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
