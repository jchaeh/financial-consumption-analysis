<?php
// backend/api/auth.php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$raw    = file_get_contents('php://input');
$data   = json_decode($raw, true) ?? [];
$conn   = get_db();

// 1. 아이디 중복 확인 (GET)
if ($method === 'GET' && $action === 'check_id') {
    $userId = $_GET['userId'] ?? '';
    if (!$userId) send_json(['error' => '아이디를 입력하세요.'], 400);
    $sql = "SELECT COUNT(*) AS CNT FROM MEMBER WHERE USER_ID = :v_id";
    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ':v_id', $userId);
    oci_execute($stid);
    $row = oci_fetch_assoc($stid);

    if ($row && $row['CNT'] > 0) {
        send_json(['available' => false, 'message' => '이미 사용 중인 아이디입니다.']);
    } else {
        send_json(['available' => true, 'message' => '사용 가능한 아이디입니다.']);
    }
}

// 2. 회원가입 (POST)
if ($method === 'POST' && $action === 'register') {
    $userId   = $data['userId']   ?? null;
    $userPw   = $data['userPw']   ?? null;
    $userName = $data['userName'] ?? null;
    $gender   = $data['gender']   ?? 'F';
    $age      = intval($data['age'] ?? 25);

    if (!$userId || !$userPw || !$userName) {
        send_json(['error' => '필수 정보 누락'], 400);
    }

    $ageGroup = age_to_group($age);

    $sql = "INSERT INTO MEMBER (USER_ID, USER_PW, USER_NAME, GENDER, AGE_GROUP)
            VALUES (:v_id, :v_pw, :v_nm, :v_gen, :v_ag)";
    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ':v_id',   $userId);
    oci_bind_by_name($stid, ':v_pw',   $userPw);
    oci_bind_by_name($stid, ':v_nm',   $userName);
    oci_bind_by_name($stid, ':v_gen',  $gender);
    oci_bind_by_name($stid, ':v_ag',   $ageGroup);

    if (@oci_execute($stid)) {
        oci_commit($conn);
        send_json(['message' => '회원가입 성공', 'userId' => $userId]);
    } else {
        $e = oci_error($stid);
        send_json(['error' => '회원가입 실패', 'detail' => $e['message']], 500);
    }
}

// 3. 로그인 (POST)
if ($method === 'POST' && $action === 'login') {
    $userId = $data['userId'] ?? null;
    $userPw = $data['userPw'] ?? null;

    if (!$userId || !$userPw) send_json(['error' => '정보 입력 필요'], 400);

    $sql = "SELECT * FROM MEMBER WHERE USER_ID = :v_id AND USER_PW = :v_pw";
    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ':v_id', $userId);
    oci_bind_by_name($stid, ':v_pw', $userPw);
    oci_execute($stid);

    $row = oci_fetch_assoc($stid);
    if ($row) {
        send_json([
            'userId'   => $row['USER_ID'],
            'userName' => $row['USER_NAME'],
            'gender'   => $row['GENDER'],
            'ageGroup' => $row['AGE_GROUP']
        ]);
    } else {
        send_json(['error' => '로그인 실패: 아이디/비번 확인'], 401);
    }
}
?>