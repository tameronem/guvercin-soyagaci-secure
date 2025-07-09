<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// POST verilerini al
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['action'])) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

switch ($data['action']) {
    case 'create_session':
        // Giriş yaparken session oluştur
        if (isset($data['user_id']) && isset($data['user_email'])) {
            $_SESSION['user_id'] = $data['user_id'];
            $_SESSION['user_email'] = $data['user_email'];
            $_SESSION['user_name'] = $data['user_name'] ?? 'Kullanıcı';
            
            echo json_encode([
                'success' => true,
                'message' => 'Session created',
                'session_id' => session_id()
            ]);
        } else {
            echo json_encode(['error' => 'Missing user data']);
        }
        break;
        
    case 'check_session':
        // Session kontrolü
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                'success' => true,
                'logged_in' => true,
                'user_id' => $_SESSION['user_id'],
                'user_email' => $_SESSION['user_email'],
                'user_name' => $_SESSION['user_name']
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'logged_in' => false
            ]);
        }
        break;
        
    case 'destroy_session':
        // Çıkış yaparken session sil
        session_destroy();
        echo json_encode([
            'success' => true,
            'message' => 'Session destroyed'
        ]);
        break;
        
    default:
        echo json_encode(['error' => 'Unknown action']);
        break;
}
?>