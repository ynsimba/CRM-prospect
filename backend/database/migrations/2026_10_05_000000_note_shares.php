<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_shares', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organizationId', 26);
            $table->char('noteId', 26);
            $table->char('sharedById', 26);
            $table->char('sharedWithId', 26);
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['noteId', 'sharedWithId']);
            $table->index(['sharedWithId', 'createdAt']);
            $table->foreign('organizationId')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('noteId')->references('id')->on('user_notes')->cascadeOnDelete();
            $table->foreign('sharedById')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('sharedWithId')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_shares');
    }
};
