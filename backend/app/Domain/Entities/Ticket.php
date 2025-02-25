<?php

namespace App\Domain\Entities;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model {
    protected $table = 'tickets';
    protected $fillable = ['eventId', 'buyerId'];
}
