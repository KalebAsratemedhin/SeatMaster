<?php

namespace App\Application\UseCases;

use App\Domain\Repositories\UserRepositoryInterface;
use App\Domain\Entities\User;

class UserService {
    public function __construct(private UserRepositoryInterface $userRepository) {}

    public function registerUser(string $name, string $email, string $password): User {
        $user = new User([ 'name' => $name, 'email' => $email, 'password' => password_hash($password, PASSWORD_BCRYPT) ]);
        $this->userRepository->save($user);
        return $user;
    }

    public function getAll(): array{
        $users = $this->userRepository->findAll();
        return $users;
    }

    public function loginUser(string $email, string $password): ?User {
        $user = $this->userRepository->findByEmail($email);
        return ($user && password_verify($password, $user->password)) ? $user : null;
    }
}
