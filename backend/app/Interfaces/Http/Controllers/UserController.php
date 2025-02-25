<?php

namespace App\Interfaces\Http\Controllers;

use App\Application\UseCases\UserService;

class UserController {
    
    public function __construct(private UserService $userService) {}

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['name'], $data['email'], $data['password'])) {
            return $this->jsonResponse(['error' => 'Missing required fields'], 400);
        }

        $user = $this->userService->registerUser($data['name'], $data['email'], $data['password']);

        return $this->jsonResponse(['user' => $user], 201);
    }

    public function getAll() {
        $users = $this->userService->getAll();

        return $this->jsonResponse(['users' => $users], 201);
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['email'], $data['password'])) {
            return $this->jsonResponse(['error' => 'Missing required fields'], 400);
        }

        $user = $this->userService->loginUser($data['email'], $data['password']);

        if (!$user) {
            return $this->jsonResponse(['error' => 'Invalid credentials'], 401);
        }

        return $this->jsonResponse(['user' => $user], 200);
    }

    private function jsonResponse(array $data, int $statusCode = 200): void {
        header('Content-Type: application/json');
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
}
