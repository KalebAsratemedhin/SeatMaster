<?php

use App\Interfaces\Http\Controllers\UserController;
use App\Infrastructure\Persistence\EloquentUserRepository;
use App\Application\UseCases\UserService;


require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/Infrastructure/Database/connection.php';

$router = new AltoRouter();

$router->map('GET', '/', function(){
    $controller = new UserController(new UserService(new EloquentUserRepository()));
    echo $controller->getAll();

});

$router->map('POST', '/register', function() {
    $controller = new UserController(new UserService(new EloquentUserRepository()));
    echo $controller->register($_POST['name'], $_POST['email'], $_POST['password']);
});

$router->map('POST', '/login', function() {
    $controller = new UserController(new UserService(new EloquentUserRepository()));
    echo $controller->login($_POST['email'], $_POST['password']);
});

$match = $router->match();
if ($match) {
    call_user_func_array($match['target'], $match['params']);
} else {
    header($_SERVER["SERVER_PROTOCOL"] . ' 404 Not Found');
}
