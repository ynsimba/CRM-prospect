<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\Plan;
use App\Models\ProspectSource;
use App\Models\ProspectStatus;
use App\Models\Subscription;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Plan::query()->updateOrCreate(
            ['code' => 'starter'],
            ['name' => 'Starter', 'maxUsers' => 2, 'maxProspects' => 1000, 'maxPipelines' => 1],
        );
        $business = Plan::query()->updateOrCreate(
            ['code' => 'business'],
            ['name' => 'Business', 'maxUsers' => 10, 'maxProspects' => 10000, 'maxPipelines' => 5],
        );
        Plan::query()->updateOrCreate(
            ['code' => 'enterprise'],
            ['name' => 'Enterprise', 'maxUsers' => 0, 'maxProspects' => 0, 'maxPipelines' => 0],
        );

        $organization = Organization::query()->updateOrCreate(
            ['slug' => 'prospect-demo'],
            [
                'name' => 'Prospect CRM Demo',
                'currency' => 'CDF',
                'timezone' => 'Africa/Kinshasa',
                'locale' => 'fr-CD',
                'phone' => '+243 810 000 001',
                'website' => 'https://prospect.cd',
            ],
        );

        Subscription::query()->updateOrCreate(
            ['organizationId' => $organization->id],
            ['planId' => $business->id, 'status' => 'TRIALING'],
        );

        $this->defaults($organization->id);

        $staff = [
            ['email' => 'a.kalala@safecheck-rdc.com', 'name' => 'Amina Kalala', 'civility' => 'Mme', 'role' => 'OWNER', 'password' => 'admin123'],
            ['email' => 'f.balumene@safecheck-rdc.com', 'name' => 'Françis BALUMENE', 'civility' => 'Mr', 'role' => 'MANAGER', 'password' => 'manager123'],
            ['email' => 'n.engani@safecheck-rdc.com', 'name' => 'Neisse ENGANI', 'civility' => 'Mme', 'role' => 'SALES', 'password' => 'jean123'],
            ['email' => 'n.kandolo@safecheck-rdc.com', 'name' => 'Naomie KANDOLO', 'civility' => 'Mme', 'role' => 'SALES', 'password' => 'marie123'],
            ['email' => 'super@prospect.cd', 'name' => 'Super Admin', 'civility' => null, 'role' => 'SUPER_ADMIN', 'password' => 'super123'],
        ];
        foreach ($staff as $user) {
            User::query()->updateOrCreate(
                ['organizationId' => $organization->id, 'email' => $user['email']],
                [
                    'name' => $user['name'],
                    'civility' => $user['civility'] ?? null,
                    'role' => $user['role'],
                    'passwordHash' => Hash::make($user['password']),
                    'isActive' => true,
                ],
            );
        }

    }

    private function defaults(string $organizationId): void
    {
        $statuses = [
            ['name' => 'Opportunité', 'slug' => 'opportunite', 'sortOrder' => 0, 'isConverted' => false, 'isLost' => false],
            ['name' => 'Lead', 'slug' => 'lead', 'sortOrder' => 1, 'isConverted' => false, 'isLost' => false],
            ['name' => 'Pipeline', 'slug' => 'pipeline', 'sortOrder' => 2, 'isConverted' => false, 'isLost' => false],
            ['name' => 'Rejeté', 'slug' => 'rejete', 'sortOrder' => 3, 'isConverted' => false, 'isLost' => true],
            ['name' => 'Finalisé', 'slug' => 'finalise', 'sortOrder' => 4, 'isConverted' => true, 'isLost' => false],
        ];
        foreach ($statuses as $status) {
            ProspectStatus::query()->updateOrCreate(
                ['organizationId' => $organizationId, 'slug' => $status['slug']],
                $status,
            );
        }

        $sources = [
            ['name' => 'Site web', 'slug' => 'site'],
            ['name' => 'Facebook', 'slug' => 'facebook'],
            ['name' => 'Instagram', 'slug' => 'instagram'],
            ['name' => 'WhatsApp', 'slug' => 'whatsapp'],
            ['name' => 'LinkedIn', 'slug' => 'linkedin'],
            ['name' => 'Email', 'slug' => 'email'],
            ['name' => 'Téléphone', 'slug' => 'telephone'],
            ['name' => 'Prospection terrain', 'slug' => 'terrain'],
            ['name' => 'Recommandation', 'slug' => 'recommandation'],
            ['name' => 'Salon / événement', 'slug' => 'salon'],
            ['name' => 'Publicité', 'slug' => 'publicite'],
            ['name' => 'Import CSV', 'slug' => 'import'],
            ['name' => 'Autre', 'slug' => 'autre'],
        ];
        foreach ($sources as $source) {
            ProspectSource::query()->updateOrCreate(
                ['organizationId' => $organizationId, 'slug' => $source['slug']],
                $source,
            );
        }

        foreach (['VIP', 'Hot Lead', 'Urgent', 'B2B', 'À relancer', 'Gros budget'] as $name) {
            Tag::query()->updateOrCreate(
                ['organizationId' => $organizationId, 'name' => $name],
                ['name' => $name],
            );
        }

        $pipeline = Pipeline::query()->updateOrCreate(
            ['organizationId' => $organizationId, 'name' => 'Pipeline commercial'],
            ['isDefault' => true],
        );
        $stages = [
            ['name' => 'Nouveau', 'probability' => 10, 'sortOrder' => 0, 'isWon' => false, 'isLost' => false],
            ['name' => 'À contacter', 'probability' => 15, 'sortOrder' => 1, 'isWon' => false, 'isLost' => false],
            ['name' => 'Contacté', 'probability' => 20, 'sortOrder' => 2, 'isWon' => false, 'isLost' => false],
            ['name' => 'Qualifié', 'probability' => 40, 'sortOrder' => 3, 'isWon' => false, 'isLost' => false],
            ['name' => 'Rendez-vous', 'probability' => 55, 'sortOrder' => 4, 'isWon' => false, 'isLost' => false],
            ['name' => 'Proposition envoyée', 'probability' => 70, 'sortOrder' => 5, 'isWon' => false, 'isLost' => false],
            ['name' => 'Négociation', 'probability' => 80, 'sortOrder' => 6, 'isWon' => false, 'isLost' => false],
            ['name' => 'Gagné', 'probability' => 100, 'sortOrder' => 7, 'isWon' => true, 'isLost' => false],
            ['name' => 'Perdu', 'probability' => 0, 'sortOrder' => 8, 'isWon' => false, 'isLost' => true],
        ];
        foreach ($stages as $stage) {
            PipelineStage::query()->updateOrCreate(
                ['pipelineId' => $pipeline->id, 'name' => $stage['name']],
                $stage,
            );
        }
    }
}
