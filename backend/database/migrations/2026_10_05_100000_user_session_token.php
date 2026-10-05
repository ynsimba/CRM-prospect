<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Jeton de session unique : un seul appareil/navigateur connecté à la fois.
            $table->string('sessionToken', 64)->nullable()->after('lastSeenAt');
            $table->index('sessionToken');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['sessionToken']);
            $table->dropColumn('sessionToken');
        });
    }
};
