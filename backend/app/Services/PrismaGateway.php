<?php

namespace App\Services;

use App\Models\ProspectTag;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class PrismaGateway
{
    private const OPS = ['contains', 'equals', 'in', 'notIn', 'not', 'lt', 'lte', 'gt', 'gte', 'mode', 'startsWith', 'endsWith'];

    private const DATES = [
        'createdAt', 'updatedAt', 'lastLoginAt', 'firstContactAt', 'lastActionAt', 'nextContactAt',
        'lastContactAt', 'convertedAt', 'occurredAt', 'dueAt', 'expectedCloseAt', 'readAt', 'currentPeriodEnd',
        'lastSeenAt', 'hiredAt',
    ];

    private const BOOLS = [
        'isActive', 'isConverted', 'isLost', 'isWon', 'isDefault', 'marketingConsent',
    ];

    private const INTS = [
        'sortOrder', 'probability', 'score', 'amount', 'year', 'month', 'durationMin', 'maxUsers',
        'maxProspects', 'maxPipelines', 'prospectsTarget', 'meetingsTarget', 'opportunitiesTarget', 'revenueTarget',
        'callsTarget', 'proposalsTarget', 'conversionsTarget',
    ];

    private const JSON = ['before', 'after'];

    /** @var array<string, class-string<Model>> */
    private const MODELS = [
        'user' => \App\Models\User::class,
        'organization' => \App\Models\Organization::class,
        'team' => \App\Models\Team::class,
        'prospectStatus' => \App\Models\ProspectStatus::class,
        'prospectSource' => \App\Models\ProspectSource::class,
        'tag' => \App\Models\Tag::class,
        'company' => \App\Models\Company::class,
        'contact' => \App\Models\Contact::class,
        'prospect' => \App\Models\Prospect::class,
        'prospectTag' => \App\Models\ProspectTag::class,
        'prospectStatusHistory' => \App\Models\ProspectStatusHistory::class,
        'pipeline' => \App\Models\Pipeline::class,
        'pipelineStage' => \App\Models\PipelineStage::class,
        'opportunity' => \App\Models\Opportunity::class,
        'activity' => \App\Models\Activity::class,
        'task' => \App\Models\Task::class,
        'userNote' => \App\Models\UserNote::class,
        'notification' => \App\Models\Notification::class,
        'goal' => \App\Models\Goal::class,
        'auditLog' => \App\Models\AuditLog::class,
        'plan' => \App\Models\Plan::class,
        'subscription' => \App\Models\Subscription::class,
        'zone' => \App\Models\Zone::class,
        'prospectAssignment' => \App\Models\ProspectAssignment::class,
        'assignmentRule' => \App\Models\AssignmentRule::class,
    ];

    /** @var array<string, array<string, string>> */
    private const RELATIONS = [
        'user' => ['team' => 'team', 'organization' => 'organization', 'supervisor' => 'user', 'zone' => 'zone'],
        'zone' => ['team' => 'team'],
        'prospectAssignment' => ['prospect' => 'prospect', 'fromUser' => 'user', 'toUser' => 'user', 'actor' => 'user'],
        'organization' => ['users' => 'user', 'prospects' => 'prospect', 'companies' => 'company', 'teams' => 'team'],
        'team' => ['members' => 'user', 'organization' => 'organization'],
        'company' => ['owner' => 'user', 'contacts' => 'contact', 'prospects' => 'prospect'],
        'contact' => ['company' => 'company', 'owner' => 'user', 'prospects' => 'prospect'],
        'prospect' => [
            'company' => 'company', 'contact' => 'contact', 'status' => 'prospectStatus', 'source' => 'prospectSource',
            'owner' => 'user', 'tags' => 'prospectTag', 'activities' => 'activity', 'opportunities' => 'opportunity',
            'tasks' => 'task', 'statusHistory' => 'prospectStatusHistory',
        ],
        'prospectTag' => ['tag' => 'tag', 'prospect' => 'prospect'],
        'prospectStatusHistory' => ['actor' => 'user', 'prospect' => 'prospect', 'status' => 'prospectStatus'],
        'pipeline' => ['stages' => 'pipelineStage'],
        'pipelineStage' => ['pipeline' => 'pipeline'],
        'opportunity' => [
            'company' => 'company', 'contact' => 'contact', 'prospect' => 'prospect', 'pipeline' => 'pipeline',
            'stage' => 'pipelineStage', 'owner' => 'user', 'activities' => 'activity', 'tasks' => 'task',
        ],
        'activity' => [
            'user' => 'user', 'prospect' => 'prospect', 'company' => 'company', 'contact' => 'contact', 'opportunity' => 'opportunity',
        ],
        'task' => [
            'owner' => 'user', 'assignedBy' => 'user', 'prospect' => 'prospect', 'company' => 'company', 'opportunity' => 'opportunity',
        ],
        'userNote' => ['owner' => 'user'],
        'notification' => ['user' => 'user'],
        'goal' => ['user' => 'user', 'team' => 'team'],
        'auditLog' => ['actor' => 'user'],
        'subscription' => ['plan' => 'plan', 'organization' => 'organization'],
    ];

    /** @var array<string, list<string>> */
    private const ENUMS = [
        'priority' => ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        'task.status' => ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
        'opportunity.status' => ['OPEN', 'WON', 'LOST'],
    ];

    public function run(string $model, string $op, array $args): mixed
    {
        if (! isset(self::MODELS[$model])) {
            throw new \InvalidArgumentException("Modèle inconnu: {$model}");
        }

        try {
            return match ($op) {
                'findMany' => $this->findMany($model, $args),
                'findFirst' => $this->findFirst($model, $args),
                'create' => DB::transaction(fn () => $this->create($model, $args)),
                'update' => DB::transaction(fn () => $this->update($model, $args)),
                'updateMany' => DB::transaction(fn () => $this->updateMany($model, $args)),
                'delete' => DB::transaction(fn () => $this->delete($model, $args)),
                'count' => $this->count($model, $args),
                'groupBy' => $this->groupBy($model, $args),
                'upsert' => DB::transaction(fn () => $this->upsert($model, $args)),
                default => throw new \InvalidArgumentException("Opération inconnue: {$op}"),
            };
        } catch (UniqueConstraintViolationException $e) {
            throw new UniqueConstraintException('Contrainte unique', 0, $e);
        }
    }

    private function findMany(string $model, array $args): array
    {
        $query = $this->newQuery($model);
        $this->applyWhere($query, $args['where'] ?? [], $model);
        $this->applyOrders($query, $model, $args['orderBy'] ?? null);
        $spec = $args['include'] ?? $args['select'] ?? null;
        $paths = $this->eagerPaths($model, is_array($spec) ? $spec : null);
        if ($paths) {
            $query->with($paths);
        }
        if (isset($args['take'])) {
            $query->limit((int) $args['take']);
        }
        if (isset($args['skip'])) {
            $query->offset((int) $args['skip']);
        }
        $mode = isset($args['select']) ? 'select' : 'include';

        return $query->get()->map(fn (Model $row) => $this->present($row, $model, $spec, $mode))->all();
    }

    private function findFirst(string $model, array $args): ?array
    {
        $args['take'] = 1;
        $rows = $this->findMany($model, $args);

        return $rows[0] ?? null;
    }

    private function create(string $model, array $args): array
    {
        $data = $args['data'] ?? [];
        $nested = [];
        foreach ($data as $key => $value) {
            if (is_array($value) && isset($value['create']) && $this->isRelationName($model, (string) $key)) {
                $nested[$key] = $value['create'];
                unset($data[$key]);
            }
        }
        $row = $this->classFor($model)::query()->create($this->normalizeWrite($data));
        if (isset($nested['tags']) && is_array($nested['tags'])) {
            foreach ($nested['tags'] as $tag) {
                ProspectTag::query()->create([
                    'prospectId' => $row->getKey(),
                    'tagId' => $tag['tagId'],
                ]);
            }
        }
        $row->refresh();

        return $this->present($row, $model, $args['include'] ?? $args['select'] ?? null, isset($args['select']) ? 'select' : 'include');
    }

    private function update(string $model, array $args): array
    {
        $row = $this->requireOne($model, $args['where'] ?? []);
        $row->fill($this->normalizeWrite($args['data'] ?? []));
        $row->save();
        $row->refresh();
        $spec = $args['include'] ?? $args['select'] ?? null;
        $paths = $this->eagerPaths($model, is_array($spec) ? $spec : null);
        if ($paths) {
            $row->load($paths);
        }

        return $this->present($row, $model, $spec, isset($args['select']) ? 'select' : 'include');
    }

    private function updateMany(string $model, array $args): array
    {
        if (($args['where'] ?? []) === []) {
            throw new \InvalidArgumentException('where requis pour updateMany.');
        }
        $query = $this->newQuery($model);
        $this->applyWhere($query, $args['where'] ?? [], $model);
        $count = $query->update($this->normalizeWrite($args['data'] ?? []));

        return ['count' => $count];
    }

    private function delete(string $model, array $args): ?array
    {
        $row = $this->requireOne($model, $args['where'] ?? []);
        $presented = $this->present($row, $model, null, 'include');
        $row->delete();

        return $presented;
    }

    private function count(string $model, array $args): int
    {
        $query = $this->newQuery($model);
        $this->applyWhere($query, $args['where'] ?? [], $model);

        return $query->count();
    }

    private function groupBy(string $model, array $args): array
    {
        $by = array_values(array_filter(
            (array) ($args['by'] ?? []),
            fn ($column) => is_string($column) && $this->isColumnName($column)
        ));
        $query = $this->newQuery($model);
        $this->applyWhere($query, $args['where'] ?? [], $model);
        $query->select($by);
        $sums = [];
        if (! empty($args['_count'])) {
            $query->selectRaw('COUNT(*) as aggregate_count');
        }
        if (! empty($args['_sum']) && is_array($args['_sum'])) {
            foreach ($args['_sum'] as $column => $enabled) {
                if (! $enabled || ! preg_match('/^[A-Za-z0-9_]+$/', (string) $column)) {
                    continue;
                }
                $sums[] = $column;
                $query->selectRaw("SUM(`{$column}`) as aggregate_sum_{$column}");
            }
        }
        $maxes = [];
        if (! empty($args['_max']) && is_array($args['_max'])) {
            foreach ($args['_max'] as $column => $enabled) {
                if (! $enabled || ! $this->isColumnName((string) $column)) {
                    continue;
                }
                $maxes[] = $column;
                $query->selectRaw("MAX(`{$column}`) as aggregate_max_{$column}");
            }
        }
        if ($by) {
            $query->groupBy($by);
        }
        $rows = [];
        foreach ($query->get() as $row) {
            $item = [];
            foreach ($by as $column) {
                $item[$column] = $row->getAttribute($column);
            }
            if (! empty($args['_count'])) {
                $item['_count'] = ['_all' => (int) $row->getAttribute('aggregate_count')];
            }
            if ($sums) {
                $item['_sum'] = [];
                foreach ($sums as $column) {
                    $value = $row->getAttribute('aggregate_sum_'.$column);
                    $item['_sum'][$column] = $value === null ? null : (int) $value;
                }
            }
            if ($maxes) {
                $item['_max'] = [];
                foreach ($maxes as $column) {
                    $item['_max'][$column] = $this->normalizeOut($column, $row->getAttribute('aggregate_max_'.$column));
                }
            }
            $rows[] = $item;
        }

        return $rows;
    }

    private function upsert(string $model, array $args): array
    {
        $where = $args['where'] ?? [];
        $compound = reset($where);
        if (! is_array($compound)) {
            throw new \InvalidArgumentException('where upsert invalide');
        }
        $existing = $this->newQuery($model)->where($this->normalizeWrite($compound))->first();
        if ($existing) {
            $existing->fill($this->normalizeWrite($args['update'] ?? []));
            $existing->save();
            $existing->refresh();

            return $this->present($existing, $model, null, 'include');
        }

        return $this->create($model, ['data' => $args['create'] ?? []]);
    }

    private function requireOne(string $model, array $where): Model
    {
        // An empty where (e.g. `{ id: undefined }` dropped by JSON) would otherwise hit an arbitrary row.
        if ($where === []) {
            throw new \InvalidArgumentException('where requis pour update/delete.');
        }
        $query = $this->newQuery($model);
        $this->applyWhere($query, $where, $model);
        $row = $query->first();
        if (! $row) {
            throw new RecordNotFoundException('Enregistrement introuvable.');
        }

        return $row;
    }

    private function newQuery(string $model): Builder
    {
        return $this->classFor($model)::query();
    }

    /** @return class-string<Model> */
    private function classFor(string $model): string
    {
        return self::MODELS[$model];
    }

    private function applyWhere(Builder $query, array $where, string $model): void
    {
        foreach ($where as $key => $value) {
            if ($key === 'OR' && is_array($value)) {
                $query->where(function (Builder $outer) use ($value, $model) {
                    foreach (array_values($value) as $i => $clause) {
                        if (! is_array($clause)) {
                            continue;
                        }
                        $method = $i === 0 ? 'where' : 'orWhere';
                        $outer->{$method}(function (Builder $sub) use ($clause, $model) {
                            $this->applyWhere($sub, $clause, $model);
                        });
                    }
                });
                continue;
            }
            if ($key === 'AND' && is_array($value)) {
                foreach ($value as $clause) {
                    if (is_array($clause)) {
                        $this->applyWhere($query, $clause, $model);
                    }
                }
                continue;
            }
            if ($key === 'NOT' && is_array($value)) {
                $query->whereNot(function (Builder $sub) use ($value, $model) {
                    $this->applyWhere($sub, $value, $model);
                });
                continue;
            }
            if (is_array($value)) {
                if ($this->isRelationFilter($model, (string) $key, $value)) {
                    $this->applyRelation($query, $model, (string) $key, $value);
                } else {
                    $this->applyColumn($query, (string) $key, $value);
                }
                continue;
            }
            if (! $this->isColumnName((string) $key)) {
                throw new \InvalidArgumentException('Colonne invalide.');
            }
            if ($value === null) {
                $query->whereNull($key);
            } else {
                $query->where($key, $this->normalizeScalar($key, $value));
            }
        }
    }

    private function isRelationFilter(string $model, string $key, array $value): bool
    {
        if (! $this->isRelationName($model, $key)) {
            return false;
        }
        if (isset($value['some']) || isset($value['none']) || isset($value['every'])) {
            return true;
        }
        foreach (array_keys($value) as $child) {
            if (in_array($child, self::OPS, true)) {
                return false;
            }
        }

        return true;
    }

    private function isColumnName(string $column): bool
    {
        return preg_match('/^[A-Za-z0-9_]+$/', $column) === 1;
    }

    private function isRelationName(string $model, string $key): bool
    {
        return isset(self::RELATIONS[$model][$key]);
    }

    private function relationChild(string $model, string $key): string
    {
        return self::RELATIONS[$model][$key];
    }

    private function applyRelation(Builder $query, string $model, string $key, array $value): void
    {
        $child = $this->relationChild($model, $key);
        if (isset($value['some']) && is_array($value['some'])) {
            $query->whereHas($key, function (Builder $sub) use ($value, $child) {
                $this->applyWhere($sub, $value['some'], $child);
            });

            return;
        }
        if (isset($value['none']) && is_array($value['none'])) {
            $query->whereDoesntHave($key, function (Builder $sub) use ($value, $child) {
                $this->applyWhere($sub, $value['none'], $child);
            });

            return;
        }
        $query->whereHas($key, function (Builder $sub) use ($value, $child) {
            $this->applyWhere($sub, $value, $child);
        });
    }

    private function applyColumn(Builder $query, string $column, array $filter): void
    {
        // Throw rather than skip: silently dropping a filter widens the result set.
        if (! $this->isColumnName($column)) {
            throw new \InvalidArgumentException('Colonne invalide.');
        }
        if (array_key_exists('equals', $filter)) {
            $filter['equals'] === null
                ? $query->whereNull($column)
                : $query->where($column, $this->normalizeScalar($column, $filter['equals']));
        }
        if (isset($filter['contains'])) {
            $escaped = addcslashes((string) $filter['contains'], '%_\\');
            $query->where($column, 'like', '%'.$escaped.'%');
        }
        if (isset($filter['startsWith'])) {
            $escaped = addcslashes((string) $filter['startsWith'], '%_\\');
            $query->where($column, 'like', $escaped.'%');
        }
        if (array_key_exists('in', $filter) && is_array($filter['in'])) {
            $values = array_map(fn ($item) => $this->normalizeScalar($column, $item), $filter['in']);
            $values === [] ? $query->whereRaw('0 = 1') : $query->whereIn($column, $values);
        }
        if (array_key_exists('notIn', $filter) && is_array($filter['notIn'])) {
            $query->whereNotIn($column, $filter['notIn']);
        }
        if (array_key_exists('not', $filter)) {
            $filter['not'] === null
                ? $query->whereNotNull($column)
                : $query->where($column, '!=', $this->normalizeScalar($column, $filter['not']));
        }
        foreach (['lt' => '<', 'lte' => '<=', 'gt' => '>', 'gte' => '>='] as $op => $sql) {
            if (array_key_exists($op, $filter)) {
                $query->where($column, $sql, $this->normalizeScalar($column, $filter[$op]));
            }
        }
    }

    private function applyOrders(Builder $query, string $model, mixed $orderBy): void
    {
        foreach ($this->normalizeOrders($orderBy) as $order) {
            foreach ($order as $key => $dir) {
                if (! preg_match('/^[A-Za-z0-9_]+$/', (string) $key)) {
                    continue;
                }
                if (is_array($dir)) {
                    $column = array_key_first($dir);
                    $direction = strtolower((string) $dir[$column]) === 'desc' ? 'desc' : 'asc';
                    if (! is_string($column) || ! $this->isRelationName($model, (string) $key)) {
                        continue;
                    }
                    $child = $this->relationChild($model, (string) $key);
                    $related = new ($this->classFor($child));
                    $parent = new ($this->classFor($model));
                    $query->orderBy(
                        $related->newQuery()->select($column)->whereColumn(
                            $related->getTable().'.id',
                            $parent->getTable().'.'.$key.'Id'
                        ),
                        $direction
                    );
                    continue;
                }
                $direction = strtolower((string) $dir) === 'desc' ? 'desc' : 'asc';
                $enum = $this->enumList($model, (string) $key);
                if ($enum) {
                    $list = implode(',', array_map(fn ($value) => "'".$value."'", $enum));
                    $query->orderByRaw("FIELD(`{$key}`, {$list}) {$direction}");
                } else {
                    $query->orderBy($key, $direction);
                }
            }
        }
    }

    /** @return list<array<string, mixed>> */
    private function normalizeOrders(mixed $orderBy): array
    {
        if (! is_array($orderBy) || $orderBy === []) {
            return [];
        }

        return array_is_list($orderBy) ? $orderBy : [$orderBy];
    }

    /** @return list<string> */
    private function eagerPaths(string $model, ?array $spec): array
    {
        if (! $spec) {
            return [];
        }
        $paths = [];
        foreach ($spec as $key => $value) {
            if ($key === '_count' || ! $this->isRelationName($model, (string) $key)) {
                continue;
            }
            $paths[] = (string) $key;
            $child = $this->relationChild($model, (string) $key);
            $childSpec = null;
            if (is_array($value)) {
                $childSpec = $value['select'] ?? $value['include'] ?? null;
            }
            if (is_array($childSpec)) {
                foreach ($this->eagerPaths($child, $childSpec) as $sub) {
                    $paths[] = $key.'.'.$sub;
                }
            }
        }

        return $paths;
    }

    private function present(Model $model, string $modelKey, mixed $spec, string $mode): array
    {
        $attrs = $model->getAttributes();
        $out = [];
        $relationSpec = [];
        if ($mode === 'select' && is_array($spec)) {
            foreach ($spec as $key => $value) {
                if ($key === '_count') {
                    continue;
                }
                if ($this->isRelationName($modelKey, (string) $key)) {
                    $relationSpec[$key] = $value;
                    continue;
                }
                if ($value === true) {
                    $out[$key] = $this->normalizeOut((string) $key, $attrs[$key] ?? null);
                }
            }
        } else {
            foreach ($attrs as $key => $value) {
                if (str_ends_with((string) $key, '_count')) {
                    continue;
                }
                $out[$key] = $this->normalizeOut((string) $key, $value);
            }
            if (is_array($spec)) {
                foreach ($spec as $key => $value) {
                    if ($key === '_count' || ! $this->isRelationName($modelKey, (string) $key)) {
                        continue;
                    }
                    $relationSpec[$key] = $value;
                }
            }
        }
        foreach ($relationSpec as $key => $value) {
            $child = $this->relationChild($modelKey, (string) $key);
            $related = $model->relationLoaded($key) ? $model->getRelation($key) : $model->{$key};
            $out[$key] = $this->presentRelated($related, $child, $value);
        }
        if (is_array($spec) && isset($spec['_count']['select']) && is_array($spec['_count']['select'])) {
            $counts = [];
            foreach ($spec['_count']['select'] as $rel => $enabled) {
                if ($enabled && $this->isRelationName($modelKey, (string) $rel)) {
                    $counts[$rel] = (int) $model->{$rel}()->count();
                }
            }
            $out['_count'] = $counts;
        }

        return $out;
    }

    private function presentRelated(mixed $related, string $childKey, mixed $spec): mixed
    {
        if ($related === null) {
            return null;
        }
        if ($related instanceof Collection) {
            if (is_array($spec) && isset($spec['orderBy'])) {
                $related = $this->sortCollection($related, $spec['orderBy'], $childKey);
            }
            if (is_array($spec) && isset($spec['take'])) {
                $related = $related->take((int) $spec['take'])->values();
            }

            return $related->map(fn (Model $item) => $this->presentNode($item, $childKey, $spec))->all();
        }
        if ($related instanceof Model) {
            return $this->presentNode($related, $childKey, $spec);
        }

        return null;
    }

    private function presentNode(Model $model, string $modelKey, mixed $spec): array
    {
        if ($spec === true || $spec === null || ! is_array($spec)) {
            return $this->present($model, $modelKey, null, 'include');
        }
        if (isset($spec['select'])) {
            return $this->present($model, $modelKey, $spec['select'], 'select');
        }
        if (isset($spec['include'])) {
            return $this->present($model, $modelKey, $spec['include'], 'include');
        }

        return $this->present($model, $modelKey, null, 'include');
    }

    private function sortCollection(Collection $items, mixed $orderBy, string $model): Collection
    {
        $orders = $this->normalizeOrders($orderBy);

        return $items->sort(function (Model $a, Model $b) use ($orders, $model) {
            foreach ($orders as $order) {
                foreach ($order as $key => $dir) {
                    if (is_array($dir)) {
                        continue;
                    }
                    $cmp = $this->compareValues($model, (string) $key, $a->getAttribute($key), $b->getAttribute($key));
                    if ($cmp !== 0) {
                        return strtolower((string) $dir) === 'desc' ? -$cmp : $cmp;
                    }
                }
            }

            return 0;
        })->values();
    }

    private function compareValues(string $model, string $key, mixed $left, mixed $right): int
    {
        if ($left === null && $right === null) {
            return 0;
        }
        if ($left === null) {
            return 1;
        }
        if ($right === null) {
            return -1;
        }
        $enum = $this->enumList($model, $key);
        if ($enum) {
            return array_search($left, $enum, true) <=> array_search($right, $enum, true);
        }
        if (in_array($key, self::DATES, true)) {
            return Carbon::parse($left)->getTimestamp() <=> Carbon::parse($right)->getTimestamp();
        }
        if (is_numeric($left) && is_numeric($right)) {
            return $left <=> $right;
        }

        return strcmp((string) $left, (string) $right);
    }

    /** @return list<string>|null */
    private function enumList(string $model, string $column): ?array
    {
        if ($column === 'priority') {
            return self::ENUMS['priority'];
        }
        $key = $model.'.'.$column;

        return self::ENUMS[$key] ?? null;
    }

    private function normalizeScalar(string $column, mixed $value): mixed
    {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T/', $value)) {
            return Carbon::parse($value)->utc()->format('Y-m-d H:i:s');
        }

        return $value;
    }

    /** @param  array<string, mixed>  $data */
    private function normalizeWrite(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            if (! is_string($key)) {
                continue;
            }
            if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T/', $value)) {
                $out[$key] = Carbon::parse($value)->utc()->format('Y-m-d H:i:s');
                continue;
            }
            $out[$key] = $value;
        }

        return $out;
    }

    private function normalizeOut(string $key, mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface || (is_string($value) && in_array($key, self::DATES, true) && $value !== '')) {
            return Carbon::parse($value)->utc()->format('Y-m-d\TH:i:s.000\Z');
        }
        if (in_array($key, self::BOOLS, true)) {
            return (bool) $value;
        }
        if (in_array($key, self::INTS, true) && $value !== null && $value !== '') {
            return (int) $value;
        }
        if (in_array($key, self::JSON, true) && is_string($value)) {
            $decoded = json_decode($value, true);

            return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
        }

        return $value;
    }
}
