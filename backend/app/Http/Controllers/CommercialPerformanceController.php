<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\User;
use App\Services\PerformanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommercialPerformanceController extends Controller
{
    /** Rôles qui portent un portefeuille de prospects (AGENT_ROLES côté Next). */
    private const ROLES_COMMERCIAUX = ['SALES', 'TEAM_LEAD'];

    /** Phase d'un statut ouvert ; les anciens slugs suivent STATUS_SLUG_MAP (lib/safecheck.ts). */
    private const PHASES_PAR_STATUT = [
        'opportunite' => 1,
        'nouveau' => 1,
        'a-contacter' => 1,
        'lead' => 2,
        'contacte' => 2,
        'reponse' => 2,
        'pipeline' => 3,
        'qualifie' => 3,
        'en-attente' => 3,
    ];

    public function __invoke(Request $request, PerformanceService $service): JsonResponse
    {
        $organizationId = (string) $request->query('organizationId', '');
        if ($organizationId === '') {
            return response()->json(['message' => 'organizationId requis.'], 400);
        }

        $commerciaux = User::query()
            ->where('organizationId', $organizationId)
            ->whereIn('role', self::ROLES_COMMERCIAUX)
            ->orderBy('name')
            ->get(['id', 'name', 'photoUrl']);

        // User n'a pas de relation `prospects` : on rattache les portefeuilles par ownerId.
        $portefeuilles = Prospect::query()
            ->where('organizationId', $organizationId)
            ->whereIn('ownerId', $commerciaux->modelKeys())
            ->with('status')
            ->get(['id', 'ownerId', 'statusId'])
            ->each(fn (Prospect $prospect) => $prospect->setAttribute('phase', $this->phase($prospect->status)))
            ->groupBy('ownerId');

        $commerciaux->each(
            fn (User $commercial) => $commercial->setRelation('prospects', $portefeuilles->get($commercial->id, collect())),
        );

        $scores = $service->calculerScores($commerciaux);

        return response()->json([
            'data' => $commerciaux->map(function (User $commercial) use ($scores) {
                $score = $scores[$commercial->id];
                // Clé 0 : prospects sans phase (rejetés), exclus du score.
                $phases = $commercial->prospects->countBy(fn (Prospect $prospect) => (int) $prospect->phase);

                return [
                    'id' => $commercial->id,
                    'nom' => $commercial->name,
                    'photoUrl' => $commercial->photoUrl,
                    'score' => $score['score'],
                    'couleur' => $score['couleur'],
                    'details' => [
                        'performance' => $score['performance'],
                        'efficience' => $score['efficience'],
                        'volume' => $score['volume'],
                        'prospects' => $commercial->prospects->count() - $phases->get(0, 0),
                        'rejetes' => $phases->get(0, 0),
                        'phases' => [
                            'opportunite' => $phases->get(1, 0),
                            'lead' => $phases->get(2, 0),
                            'pipeline' => $phases->get(3, 0),
                            'finalise' => $phases->get(4, 0),
                        ],
                    ],
                ];
            })->values(),
        ]);
    }

    /** Opportunité = 1, Lead = 2, Pipeline = 3, Finalisé = 4 ; un prospect rejeté n'a pas de phase. */
    private function phase(?ProspectStatus $status): ?int
    {
        if (! $status || $status->isLost) {
            return null;
        }
        if ($status->isConverted) {
            return PerformanceService::PHASE_SIGNATAIRE;
        }

        return self::PHASES_PAR_STATUT[$status->slug] ?? 1;
    }
}
