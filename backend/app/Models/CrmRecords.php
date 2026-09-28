<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends CrmModel
{
    protected $table = 'organizations';

    public function users()
    {
        return $this->hasMany(User::class, 'organizationId');
    }

    public function prospects()
    {
        return $this->hasMany(Prospect::class, 'organizationId');
    }

    public function companies()
    {
        return $this->hasMany(Company::class, 'organizationId');
    }

    public function teams()
    {
        return $this->hasMany(Team::class, 'organizationId');
    }
}

class Team extends CrmModel
{
    protected $table = 'teams';

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organizationId');
    }

    public function members()
    {
        return $this->hasMany(User::class, 'teamId');
    }
}

class User extends CrmModel
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            Activity::query()->where('userId', $user->id)->delete();
            Task::query()->where('ownerId', $user->id)->delete();
        });
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organizationId');
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'teamId');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisorId');
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class, 'zoneId');
    }
}

class Zone extends CrmModel
{
    protected $table = 'zones';

    public function team()
    {
        return $this->belongsTo(Team::class, 'teamId');
    }
}

class ProspectAssignment extends CrmStaticModel
{
    protected $table = 'prospect_assignments';

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospectId');
    }

    public function fromUser()
    {
        return $this->belongsTo(User::class, 'fromUserId');
    }

    public function toUser()
    {
        return $this->belongsTo(User::class, 'toUserId');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actorId');
    }
}

class AssignmentRule extends CrmStaticModel
{
    protected $table = 'assignment_rules';
}

class ProspectStatus extends CrmStaticModel
{
    protected $table = 'prospect_statuses';
}

class ProspectSource extends CrmStaticModel
{
    protected $table = 'prospect_sources';
}

class Tag extends CrmStaticModel
{
    protected $table = 'tags';
}

class Company extends CrmModel
{
    protected $table = 'companies';

    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId');
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class, 'companyId');
    }

    public function prospects()
    {
        return $this->hasMany(Prospect::class, 'companyId');
    }
}

class Contact extends CrmModel
{
    protected $table = 'contacts';

    public function company()
    {
        return $this->belongsTo(Company::class, 'companyId');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId');
    }

    public function prospects()
    {
        return $this->hasMany(Prospect::class, 'contactId');
    }
}

class Prospect extends CrmModel
{
    protected $table = 'prospects';

    public function company()
    {
        return $this->belongsTo(Company::class, 'companyId');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class, 'contactId');
    }

    public function status()
    {
        return $this->belongsTo(ProspectStatus::class, 'statusId');
    }

    public function source()
    {
        return $this->belongsTo(ProspectSource::class, 'sourceId');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId');
    }

    public function tags()
    {
        return $this->hasMany(ProspectTag::class, 'prospectId');
    }

    public function activities()
    {
        return $this->hasMany(Activity::class, 'prospectId');
    }

    public function opportunities()
    {
        return $this->hasMany(Opportunity::class, 'prospectId');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'prospectId');
    }

    public function statusHistory()
    {
        return $this->hasMany(ProspectStatusHistory::class, 'prospectId');
    }
}

class ProspectTag extends Model
{
    protected $table = 'prospect_tags';

    protected $guarded = [];

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = 'prospectId';

    public function tag()
    {
        return $this->belongsTo(Tag::class, 'tagId');
    }

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospectId');
    }
}

class ProspectStatusHistory extends CrmStaticModel
{
    protected $table = 'prospect_status_histories';

    public function actor()
    {
        return $this->belongsTo(User::class, 'actorId');
    }

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospectId');
    }

    public function status()
    {
        return $this->belongsTo(ProspectStatus::class, 'statusId');
    }
}

class Pipeline extends CrmModel
{
    protected $table = 'pipelines';

    public function stages()
    {
        return $this->hasMany(PipelineStage::class, 'pipelineId');
    }
}

class PipelineStage extends CrmStaticModel
{
    protected $table = 'pipeline_stages';

    public function pipeline()
    {
        return $this->belongsTo(Pipeline::class, 'pipelineId');
    }
}

class Opportunity extends CrmModel
{
    protected $table = 'opportunities';

    public function company()
    {
        return $this->belongsTo(Company::class, 'companyId');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class, 'contactId');
    }

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospectId');
    }

    public function pipeline()
    {
        return $this->belongsTo(Pipeline::class, 'pipelineId');
    }

    public function stage()
    {
        return $this->belongsTo(PipelineStage::class, 'stageId');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId');
    }

    public function activities()
    {
        return $this->hasMany(Activity::class, 'opportunityId');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'opportunityId');
    }
}

class Activity extends CrmCreatedModel
{
    protected $table = 'activities';

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospectId');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'companyId');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class, 'contactId');
    }

    public function opportunity()
    {
        return $this->belongsTo(Opportunity::class, 'opportunityId');
    }
}

class Task extends CrmModel
{
    protected $table = 'tasks';

    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assignedById');
    }

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospectId');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'companyId');
    }

    public function opportunity()
    {
        return $this->belongsTo(Opportunity::class, 'opportunityId');
    }
}

class UserNote extends CrmModel
{
    protected $table = 'user_notes';

    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId');
    }
}

class Notification extends CrmCreatedModel
{
    protected $table = 'notifications';

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}

class Goal extends CrmStaticModel
{
    protected $table = 'goals';

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
    public function team()
    {
        return $this->belongsTo(Team::class, 'teamId');
    }
}

class AuditLog extends CrmCreatedModel
{
    protected $table = 'audit_logs';

    public function actor()
    {
        return $this->belongsTo(User::class, 'actorId');
    }
}

class Plan extends CrmStaticModel
{
    protected $table = 'plans';
}

class Subscription extends CrmModel
{
    protected $table = 'subscriptions';

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'planId');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organizationId');
    }
}
