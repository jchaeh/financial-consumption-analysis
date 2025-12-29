<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function send_json($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_db() {
    $user = 'YOUR_DB_USER';
    $pass = 'YOUR_DB_PASSWORD';


    $tns = "
    (DESCRIPTION=
        (ADDRESS_LIST=
            (ADDRESS=(PROTOCOL=TCP)(HOST=203.249.87.57)(PORT=1521))
        )
        (CONNECT_DATA=
            (SERVICE_NAME=orcl)
        )
    )";

    $conn = @oci_connect($user, $pass, $tns, 'AL32UTF8');

    if (!$conn) {
        $e = oci_error();
        send_json(['error' => 'DB 연결 실패', 'detail' => $e['message']], 500);
    }
    return $conn;
}
?>