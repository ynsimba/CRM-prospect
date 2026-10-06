<?php

namespace Tests\Unit;

use App\Services\PerformanceService;
use PHPUnit\Framework\TestCase;

class PerformanceServiceTest extends TestCase
{
    private function commercial(int|string $id, array $phases): array
    {
        return ['id' => $id, 'prospects' => array_map(fn ($phase) => ['phase' => $phase], $phases)];
    }

    public function test_combines_performance_efficience_and_volume(): void
    {
        $scores = (new PerformanceService)->calculerScores([
            $this->commercial('a', [4, 4, 3]),
            $this->commercial('b', [1, 2, 3, 4]),
        ]);

        // a : moyenne 130/3 → 60,67 ; 2 signataires sur 2 max → 20 ; 3 prospects sur 4 max → 7,5.
        $this->assertSame(
            ['performance' => 60.67, 'efficience' => 20.0, 'volume' => 7.5, 'score' => 88.2, 'couleur' => 'vert'],
            $scores['a'],
        );
        // b : moyenne 100/4 → 35 ; 1 signataire sur 2 max → 10 ; 4 prospects sur 4 max → 10.
        $this->assertSame(
            ['performance' => 35.0, 'efficience' => 10.0, 'volume' => 10.0, 'score' => 55.0, 'couleur' => 'vert'],
            $scores['b'],
        );
    }

    public function test_commercial_without_prospects_scores_zero(): void
    {
        $scores = (new PerformanceService)->calculerScores([
            $this->commercial(1, []),
            $this->commercial(2, [2]),
        ]);

        $this->assertSame(
            ['performance' => 0.0, 'efficience' => 0.0, 'volume' => 0.0, 'score' => 0.0, 'couleur' => 'rouge'],
            $scores[1],
        );
    }

    public function test_no_signataire_anywhere_leaves_efficience_at_zero(): void
    {
        $scores = (new PerformanceService)->calculerScores([
            $this->commercial(1, [3, 3]),
            $this->commercial(2, [1]),
        ]);

        $this->assertSame(0.0, $scores[1]['efficience']);
        $this->assertSame(52.0, $scores[1]['score']);
        $this->assertSame(12.0, $scores[2]['score']);
    }

    public function test_no_commercial_or_no_prospect_at_all_does_not_divide_by_zero(): void
    {
        $service = new PerformanceService;

        $this->assertSame([], $service->calculerScores([]));
        $this->assertSame(0.0, $service->calculerScores([$this->commercial(1, [])])[1]['score']);
    }

    public function test_prospects_outside_phases_1_to_4_are_ignored(): void
    {
        $scores = (new PerformanceService)->calculerScores([
            $this->commercial(1, [4, null, 0, 5]),
            $this->commercial(2, [4, 4]),
        ]);

        // Un seul prospect compté : moyenne 50 → 70 ; 1 signataire sur 2 → 10 ; 1 prospect sur 2 → 5.
        $this->assertSame(85.0, $scores[1]['score']);
    }

    public function test_accepts_objects_as_well_as_arrays(): void
    {
        $commercial = (object) ['id' => 7, 'prospects' => collect([(object) ['phase' => 4]])];

        $this->assertSame(100.0, (new PerformanceService)->calculerScores(collect([$commercial]))[7]['score']);
    }

    public function test_couleur_thresholds(): void
    {
        $service = new PerformanceService;

        $this->assertSame('rouge', $service->couleur(0));
        $this->assertSame('rouge', $service->couleur(24.9));
        $this->assertSame('orange', $service->couleur(25));
        $this->assertSame('orange', $service->couleur(49.9));
        $this->assertSame('vert', $service->couleur(50));
        $this->assertSame('vert', $service->couleur(100));
    }
}
