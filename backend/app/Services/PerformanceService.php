<?php

namespace App\Services;

class PerformanceService
{
    /** Points attribués à un prospect selon sa phase (1 à 4). */
    public const VALEURS_PHASE = [1 => 5, 2 => 15, 3 => 30, 4 => 50];

    public const PHASE_SIGNATAIRE = 4;

    private const VALEUR_MAX = 50;

    private const POIDS_PERFORMANCE = 70;

    private const POIDS_EFFICIENCE = 20;

    private const POIDS_VOLUME = 10;

    /**
     * Score de chaque commercial : performance (70 %) + efficience (20 %) + volume (10 %).
     *
     * Chaque commercial expose `id` et `prospects`, chaque prospect expose `phase`.
     * Un prospect dont la phase n'est pas comprise entre 1 et 4 est ignoré.
     *
     * @param  iterable<mixed>  $commerciaux
     * @return array<int|string, array{performance: float, efficience: float, volume: float, score: float, couleur: string}>
     */
    public function calculerScores($commerciaux): array
    {
        $portefeuilles = [];
        foreach ($commerciaux as $commercial) {
            $valeurs = [];
            $signataires = 0;
            foreach (data_get($commercial, 'prospects') ?? [] as $prospect) {
                $phase = data_get($prospect, 'phase');
                if (! is_numeric($phase) || ! isset(self::VALEURS_PHASE[(int) $phase])) {
                    continue;
                }
                $valeurs[] = self::VALEURS_PHASE[(int) $phase];
                if ((int) $phase === self::PHASE_SIGNATAIRE) {
                    $signataires++;
                }
            }
            $portefeuilles[data_get($commercial, 'id')] = ['valeurs' => $valeurs, 'signataires' => $signataires];
        }

        // Les maxima se mesurent sur l'ensemble des commerciaux reçus.
        $maxSignataires = 0;
        $maxProspects = 0;
        foreach ($portefeuilles as $portefeuille) {
            $maxSignataires = max($maxSignataires, $portefeuille['signataires']);
            $maxProspects = max($maxProspects, count($portefeuille['valeurs']));
        }

        $scores = [];
        foreach ($portefeuilles as $id => $portefeuille) {
            $total = count($portefeuille['valeurs']);
            $moyenne = $total > 0 ? array_sum($portefeuille['valeurs']) / $total : 0;

            $performance = $moyenne / self::VALEUR_MAX * self::POIDS_PERFORMANCE;
            $efficience = $maxSignataires > 0 ? $portefeuille['signataires'] / $maxSignataires * self::POIDS_EFFICIENCE : 0;
            $volume = $maxProspects > 0 ? $total / $maxProspects * self::POIDS_VOLUME : 0;
            $score = round($performance + $efficience + $volume, 1);

            $scores[$id] = [
                'performance' => round($performance, 2),
                'efficience' => round($efficience, 2),
                'volume' => round($volume, 2),
                'score' => $score,
                'couleur' => $this->couleur($score),
            ];
        }

        return $scores;
    }

    public function couleur(float $score): string
    {
        if ($score < 25) {
            return 'rouge';
        }

        return $score < 50 ? 'orange' : 'vert';
    }
}
