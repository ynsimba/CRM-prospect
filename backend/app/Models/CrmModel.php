<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

abstract class CrmModel extends Model
{
    use HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';
}

abstract class CrmCreatedModel extends CrmModel
{
    public const UPDATED_AT = null;
}

abstract class CrmStaticModel extends Model
{
    use HasUlids;

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $guarded = [];
}
