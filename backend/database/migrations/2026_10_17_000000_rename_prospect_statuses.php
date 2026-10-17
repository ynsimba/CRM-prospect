<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Nouveaux libellés des étapes de prospection ; les slugs restent les clés internes.
    private const NAMES = [
        'opportunite' => ['Opportunité', 'Premier contact'],
        'lead' => ['Lead', 'Échanges'],
        'pipeline' => ['Pipeline', 'Décideurs'],
        'finalise' => ['Finalisé', 'Contrat'],
        'rejete' => ['Rejeté', 'Clôturé'],
    ];

    public function up(): void
    {
        foreach (self::NAMES as $slug => [$old, $new]) {
            DB::table('prospect_statuses')->where('slug', $slug)->where('name', $old)->update(['name' => $new]);
        }
    }

    public function down(): void
    {
        foreach (self::NAMES as $slug => [$old, $new]) {
            DB::table('prospect_statuses')->where('slug', $slug)->where('name', $new)->update(['name' => $old]);
        }
    }
};
