<?php

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\UserRepositoryInterface;
use App\Domain\Entities\User;

class EloquentUserRepository implements UserRepositoryInterface {

    public function findAll(): array {
        return User::all()->toArray();
    }

    public function findByEmail(string $email): ?User {
        return User::where('email', $email)->first();
    }

    public function findById(string $id): ?User {
        return User::find($id);
    }

    public function save(User $user): void {
        $user->save();
    }
}
