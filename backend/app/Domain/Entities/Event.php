<?php

namespace App\Domain\Entities;

use Illuminate\Database\Eloquent\Model;

class Event extends Model {
    protected $table = 'events';
    protected $fillable = ['title', 'description', 'date', 'price', 'creatorId'];
}
