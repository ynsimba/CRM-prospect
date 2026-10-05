<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DataGatewayTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'test-internal-token';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.internal.token' => self::TOKEN]);
        DB::table('organizations')->insert([
            ['id' => '01ORGA00000000000000000000', 'name' => 'Alpha', 'slug' => 'alpha'],
            ['id' => '01ORGB00000000000000000000', 'name' => 'Beta', 'slug' => 'beta'],
        ]);
    }

    private function data(string $model, string $op, array $args = [], ?string $token = self::TOKEN)
    {
        return $this->postJson('/api/data', compact('model', 'op', 'args'), $token === null ? [] : ['X-Internal-Token' => $token]);
    }

    public function test_rejects_missing_or_wrong_token(): void
    {
        $this->data('organization', 'findMany', [], null)->assertStatus(401);
        $this->data('organization', 'findMany', [], 'nope')->assertStatus(401);
    }

    public function test_rejects_everything_when_no_token_is_configured(): void
    {
        config(['services.internal.token' => '']);

        $this->data('organization', 'findMany', [], '')->assertStatus(401);
    }

    public function test_find_many_filters_by_column(): void
    {
        $this->data('organization', 'findMany', ['where' => ['slug' => 'beta']])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Beta');
    }

    public function test_update_without_where_does_not_touch_an_arbitrary_row(): void
    {
        $this->data('organization', 'update', ['where' => [], 'data' => ['name' => 'Hijacked']])
            ->assertStatus(400);

        $this->assertSame(0, DB::table('organizations')->where('name', 'Hijacked')->count());
    }

    public function test_delete_and_update_many_require_a_where(): void
    {
        $this->data('organization', 'delete', ['where' => []])->assertStatus(400);
        $this->data('organization', 'updateMany', ['where' => [], 'data' => ['name' => 'X']])->assertStatus(400);

        $this->assertSame(2, DB::table('organizations')->count());
    }

    public function test_update_of_missing_record_returns_p2025(): void
    {
        $this->data('organization', 'update', ['where' => ['id' => 'missing'], 'data' => ['name' => 'X']])
            ->assertStatus(404)
            ->assertJsonPath('code', 'P2025');
    }

    public function test_invalid_column_names_are_rejected(): void
    {
        $this->data('organization', 'findMany', ['where' => ['slug`) OR 1=1 --' => 'x']])->assertStatus(400);
        $this->data('organization', 'findMany', ['where' => ['slug`x' => ['contains' => 'a']]])->assertStatus(400);
    }

    public function test_unique_violation_maps_to_p2002(): void
    {
        $this->data('organization', 'create', ['data' => ['name' => 'Dup', 'slug' => 'alpha']])
            ->assertStatus(409)
            ->assertJsonPath('code', 'P2002');
    }

    public function test_create_preserves_empty_string_body(): void
    {
        DB::table('users')->insert([
            'id' => '01USER00000000000000000001',
            'organizationId' => '01ORGA00000000000000000000',
            'name' => 'Agent',
            'email' => 'agent@example.com',
            'passwordHash' => 'x',
            'role' => 'SALES',
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        $this->data('userNote', 'create', [
            'data' => [
                'organizationId' => '01ORGA00000000000000000000',
                'ownerId' => '01USER00000000000000000001',
                'title' => 'Sans titre',
                'body' => '',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.body', '');

        $this->assertSame('', DB::table('user_notes')->value('body'));
    }

    public function test_unexpected_errors_do_not_leak_sql_outside_debug(): void
    {
        config(['app.debug' => false]);

        $this->data('organization', 'create', ['data' => ['name' => null, 'slug' => 'gamma']])
            ->assertStatus(500)
            ->assertJsonPath('message', 'Erreur base de données.');
    }

    public function test_group_by_supports_max_aggregates(): void
    {
        DB::table('organizations')->where('slug', 'beta')->update(['createdAt' => '2026-09-01 10:00:00']);
        DB::table('organizations')->where('slug', 'alpha')->update(['createdAt' => '2026-08-01 10:00:00']);

        $this->data('organization', 'groupBy', ['by' => ['currency'], '_max' => ['createdAt' => true]])
            ->assertOk()
            ->assertJsonPath('data.0._max.createdAt', '2026-09-01T10:00:00.000Z');
    }
}
