<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('teamId', 26)->nullable();
            $table->string('name');
            // Comma-separated words matched against a prospect's city / address, e.g. "Gombe, Kinshasa/Gombe".
            $table->string('matchTerms')->default('');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->unique(['organizationId', 'name']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('teamId')->references('id')->on('teams')->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('matricule', 32)->nullable()->after('name');
            $table->string('jobTitle')->nullable()->after('matricule');
            $table->char('supervisorId', 26)->nullable()->after('teamId');
            $table->char('zoneId', 26)->nullable()->after('supervisorId');
            $table->date('hiredAt')->nullable()->after('jobTitle');
            $table->string('status', 16)->default('ACTIVE')->after('isActive');
            $table->mediumText('photoUrl')->nullable()->after('phone');
            $table->timestamp('lastSeenAt')->nullable()->after('lastLoginAt');
            $table->foreign('supervisorId')->references('id')->on('users')->nullOnDelete();
            $table->foreign('zoneId')->references('id')->on('zones')->nullOnDelete();
        });
        DB::table('users')->where('isActive', false)->update(['status' => 'INACTIVE']);

        Schema::table('tasks', function (Blueprint $table) {
            // CALL, FOLLOW_UP, MEETING, VISIT, REUNION, DEADLINE, TASK — drives the commercial agenda.
            $table->string('type', 16)->default('TASK')->after('title');
        });

        Schema::table('goals', function (Blueprint $table) {
            $table->char('teamId', 26)->nullable()->after('userId');
            $table->integer('callsTarget')->default(0);
            $table->integer('proposalsTarget')->default(0);
            $table->integer('conversionsTarget')->default(0);
            $table->foreign('teamId')->references('id')->on('teams')->cascadeOnDelete();
        });

        // Append-only: who moved which prospect from whom to whom, and why.
        Schema::create('prospect_assignments', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('prospectId', 26);
            $table->char('fromUserId', 26)->nullable();
            $table->char('toUserId', 26)->nullable();
            $table->char('actorId', 26)->nullable();
            $table->string('mode', 16)->default('MANUAL');
            $table->string('reason')->nullable();
            $table->timestamp('occurredAt')->useCurrent();
            $table->index(['organizationId', 'occurredAt']);
            $table->index(['prospectId', 'occurredAt']);
            $table->index(['toUserId', 'occurredAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('prospectId')->references('id')->on('prospects')->cascadeOnDelete();
            $table->foreign('fromUserId')->references('id')->on('users')->nullOnDelete();
            $table->foreign('toUserId')->references('id')->on('users')->nullOnDelete();
            $table->foreign('actorId')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('assignment_rules', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26)->unique();
            // MANUAL, ROUND_ROBIN, LOAD, ZONE
            $table->string('mode', 16)->default('MANUAL');
            $table->char('lastAssignedUserId', 26)->nullable();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('lastAssignedUserId')->references('id')->on('users')->nullOnDelete();
        });

        // The spec's personal pipeline has an "À contacter" step between "Nouveau" and "Contacté".
        foreach (DB::table('pipelines')->pluck('id') as $pipelineId) {
            $stages = DB::table('pipeline_stages')->where('pipelineId', $pipelineId);
            if ((clone $stages)->where('name', 'À contacter')->exists()) {
                continue;
            }
            $nouveau = (clone $stages)->where('name', 'Nouveau')->first();
            if (! $nouveau) {
                continue;
            }
            DB::table('pipeline_stages')->where('pipelineId', $pipelineId)
                ->where('sortOrder', '>', $nouveau->sortOrder)->increment('sortOrder');
            DB::table('pipeline_stages')->insert([
                'id' => (string) \Illuminate\Support\Str::ulid(),
                'pipelineId' => $pipelineId,
                'name' => 'À contacter',
                'sortOrder' => $nouveau->sortOrder + 1,
                'probability' => 15,
                'isWon' => false,
                'isLost' => false,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('pipeline_stages')->where('name', 'À contacter')->delete();
        Schema::dropIfExists('assignment_rules');
        Schema::dropIfExists('prospect_assignments');
        Schema::table('goals', function (Blueprint $table) {
            $table->dropForeign(['teamId']);
            $table->dropColumn(['teamId', 'callsTarget', 'proposalsTarget', 'conversionsTarget']);
        });
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('type');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['supervisorId']);
            $table->dropForeign(['zoneId']);
            $table->dropColumn(['matricule', 'jobTitle', 'supervisorId', 'zoneId', 'hiredAt', 'status', 'photoUrl', 'lastSeenAt']);
        });
        Schema::dropIfExists('zones');
    }
};
