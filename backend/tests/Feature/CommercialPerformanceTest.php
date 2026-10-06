<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CommercialPerformanceTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'test-internal-token';

    private const ORG_A = '01ORGA00000000000000000000';

    private const ORG_B = '01ORGB00000000000000000000';

    private int $sequence = 0;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.internal.token' => self::TOKEN]);
        DB::table('organizations')->insert([
            ['id' => self::ORG_A, 'name' => 'Alpha', 'slug' => 'alpha'],
            ['id' => self::ORG_B, 'name' => 'Beta', 'slug' => 'beta'],
        ]);
        foreach ([self::ORG_A => 'A', self::ORG_B => 'B'] as $organizationId => $suffix) {
            DB::table('prospect_statuses')->insert([
                ['id' => "opportunite-$suffix", 'organizationId' => $organizationId, 'name' => 'Opportunité', 'slug' => 'opportunite', 'isConverted' => false, 'isLost' => false],
                ['id' => "lead-$suffix", 'organizationId' => $organizationId, 'name' => 'Lead', 'slug' => 'lead', 'isConverted' => false, 'isLost' => false],
                ['id' => "pipeline-$suffix", 'organizationId' => $organizationId, 'name' => 'Pipeline', 'slug' => 'pipeline', 'isConverted' => false, 'isLost' => false],
                ['id' => "rejete-$suffix", 'organizationId' => $organizationId, 'name' => 'Rejeté', 'slug' => 'rejete', 'isConverted' => false, 'isLost' => true],
                ['id' => "finalise-$suffix", 'organizationId' => $organizationId, 'name' => 'Finalisé', 'slug' => 'finalise', 'isConverted' => true, 'isLost' => false],
            ]);
        }
    }

    private function user(string $id, string $name, string $role, string $organizationId = self::ORG_A, ?string $photoUrl = null): void
    {
        DB::table('users')->insert([
            'id' => $id,
            'organizationId' => $organizationId,
            'name' => $name,
            'email' => "$id@example.com",
            'passwordHash' => 'x',
            'role' => $role,
            'photoUrl' => $photoUrl,
        ]);
    }

    private function prospects(string $ownerId, array $statuses, string $organizationId = self::ORG_A): void
    {
        $suffix = $organizationId === self::ORG_A ? 'A' : 'B';
        foreach ($statuses as $status) {
            DB::table('prospects')->insert([
                'id' => 'prospect-'.++$this->sequence,
                'organizationId' => $organizationId,
                'ownerId' => $ownerId,
                'statusId' => "$status-$suffix",
                'firstName' => 'Prospect',
                'lastName' => (string) $this->sequence,
            ]);
        }
    }

    private function performance(?string $organizationId = self::ORG_A, ?string $token = self::TOKEN)
    {
        $query = $organizationId === null ? '' : '?organizationId='.$organizationId;

        return $this->getJson('/api/commerciaux/performance'.$query, $token === null ? [] : ['X-Internal-Token' => $token]);
    }

    public function test_requires_the_internal_token(): void
    {
        $this->performance(self::ORG_A, null)->assertStatus(401);
        $this->performance(self::ORG_A, 'nope')->assertStatus(401);
    }

    public function test_requires_an_organization(): void
    {
        $this->performance(null)->assertStatus(400);
    }

    public function test_returns_each_commercial_with_score_and_couleur(): void
    {
        $this->user('alice', 'Alice', 'SALES', photoUrl: 'data:image/png;base64,AAAA');
        $this->user('bob', 'Bob', 'TEAM_LEAD');
        $this->user('chloe', 'Chloé', 'SALES');
        // Rejeté : ignoré, il ne compte ni dans la moyenne ni dans le volume.
        $this->prospects('alice', ['finalise', 'finalise', 'pipeline', 'rejete']);
        $this->prospects('bob', ['opportunite']);

        $this->performance()
            ->assertOk()
            ->assertExactJson(['data' => [
                // moyenne 130/3 → 60,67 ; 2 signataires sur 2 → 20 ; 3 prospects sur 3 → 10.
                [
                    'id' => 'alice', 'nom' => 'Alice', 'photoUrl' => 'data:image/png;base64,AAAA', 'score' => 90.7, 'couleur' => 'vert',
                    'details' => [
                        'performance' => 60.67, 'efficience' => 20, 'volume' => 10, 'prospects' => 3, 'rejetes' => 1,
                        'phases' => ['opportunite' => 0, 'lead' => 0, 'pipeline' => 1, 'finalise' => 2],
                    ],
                ],
                // moyenne 5 → 7 ; aucun signataire → 0 ; 1 prospect sur 3 → 3,33.
                [
                    'id' => 'bob', 'nom' => 'Bob', 'photoUrl' => null, 'score' => 10.3, 'couleur' => 'rouge',
                    'details' => [
                        'performance' => 7, 'efficience' => 0, 'volume' => 3.33, 'prospects' => 1, 'rejetes' => 0,
                        'phases' => ['opportunite' => 1, 'lead' => 0, 'pipeline' => 0, 'finalise' => 0],
                    ],
                ],
                [
                    'id' => 'chloe', 'nom' => 'Chloé', 'photoUrl' => null, 'score' => 0, 'couleur' => 'rouge',
                    'details' => [
                        'performance' => 0, 'efficience' => 0, 'volume' => 0, 'prospects' => 0, 'rejetes' => 0,
                        'phases' => ['opportunite' => 0, 'lead' => 0, 'pipeline' => 0, 'finalise' => 0],
                    ],
                ],
            ]]);
    }

    public function test_ignores_other_roles_and_other_organizations(): void
    {
        $this->user('alice', 'Alice', 'SALES');
        $this->user('manager', 'Manager', 'MANAGER');
        $this->user('zoe', 'Zoé', 'SALES', self::ORG_B);
        $this->prospects('alice', ['finalise']);
        $this->prospects('manager', ['finalise', 'finalise', 'finalise']);
        $this->prospects('zoe', ['finalise', 'finalise', 'finalise', 'finalise'], self::ORG_B);

        // Les maxima ne viennent que des commerciaux d'Alpha : Alice plafonne à 100.
        $this->performance()
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'alice')
            ->assertJsonPath('data.0.score', 100);
    }

    public function test_organization_without_commercial_returns_an_empty_list(): void
    {
        $this->performance()->assertOk()->assertExactJson(['data' => []]);
    }
}
