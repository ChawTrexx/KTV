<?php
// ==========================================
// CONFIGURATION
// ==========================================
define('BOT_TOKEN', '6634953218:AAEOaozrPHqv2Xs7uJ7L-xcStHKqee0fi1Q');
define('CHAT_ID', '-1001966599723'); // Custom Channel/Group ID jahan post bhejni hai

// Shortlink Supabase Config
define('LINK_SUPABASE_URL', 'https://trdluuhqduebfipnyxlm.supabase.co');
define('LINK_SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZGx1dWhxZHVlYmZpcG55eGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzgyMTUsImV4cCI6MjA5NTAxNDIxNX0.43O4uPz6Jej4-9JAtuOEt7hD7W6lPN1Z0aE6ieHfBF4');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Helper for CURL Requests
function makeCurlRequest($url, $method = 'GET', $headers = [], $data = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($data) ? json_encode($data) : $data);
    }

    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// Short Link Generator & Supabase Saver
function generateShortLink($teraLink) {
    $shareLink = "https://teen18.vercel.app/Q.html?=" . urlencode($teraLink);
    
    $headers = [
        "Authorization: Bearer " . LINK_SUPABASE_KEY,
        "apikey: " . LINK_SUPABASE_KEY,
        "Content-Type: application/json"
    ];

    // Check Duplicate
    $checkUrl = LINK_SUPABASE_URL . "/rest/v1/links?long_url=eq." . urlencode($shareLink) . "&select=*";
    $existing = makeCurlRequest($checkUrl, 'GET', $headers);

    if (!empty($existing) && isset($existing[0]['short_code'])) {
        $code = $existing[0]['short_code'];
    } else {
        // Generate Unique Code
        $code = substr(md5(uniqid(rand(), true)), 0, 6);
        $insertUrl = LINK_SUPABASE_URL . "/rest/v1/links";
        
        $insertData = [
            'long_url' => $shareLink,
            'short_code' => $code
        ];

        makeCurlRequest($insertUrl, 'POST', array_merge($headers, ["Prefer: return=minimal"]), $insertData);
    }

    return "https://short-terabox-link.vercel.app/r.html?c=" . $code;
}

// Send Photo with Inline Button
function sendTelegramPhoto($targetChatId, $photoFileId, $shortUrl) {
    $url = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendPhoto";
    
    $postData = [
        'chat_id' => $targetChatId,
        'photo' => $photoFileId,
        'caption' => "🎬 Watch this video for FREE!\n\n▶️ Tap the button below to play instantly",
        'reply_markup' => json_encode([
            'inline_keyboard' => [
                [
                    ['text' => '👉 Play Online Free 👅💦', 'url' => $shortUrl]
                ]
            ]
        ])
    ];

    return makeCurlRequest($url, 'POST', ['Content-Type: application/json'], $postData);
}

// ==========================================
// BOT WEBHOOK MAIN LOGIC
// ==========================================

$content = file_get_contents("php://input");
$update = json_decode($content, true);

if (isset($update['message'])) {
    $message = $update['message'];
    $userChatId = $message['chat']['id'];
    
    // Caption (agar photo ke saath link hai) ya Normal Text
    $text = $message['caption'] ?? $message['text'] ?? '';

    // Regex to Extract TeraBox Link
    $pattern = '/https?:\/\/(www\.)?(terabox|1024tera|freeterabox|teraboxapp|4funbox|mirrobox)\.[a-z]+\/s\/[a-zA-Z0-9_-]+/i';
    
    // Check if message has PHOTO + LINK
    if (isset($message['photo']) && preg_match($pattern, $text, $matches)) {
        
        $teraLink = $matches[0];
        
        // Highest Quality Photo ki File ID lein
        $photos = $message['photo'];
        $photoFileId = end($photos)['file_id'];

        // 1. Generate Short Link via Supabase
        $shortUrl = generateShortLink($teraLink);

        // 2. Post to Channel/Group
        sendTelegramPhoto(CHAT_ID, $photoFileId, $shortUrl);

        // 3. User ko confirm message bhejen
        makeCurlRequest("https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage", 'POST', ['Content-Type: application/json'], [
            'chat_id' => $userChatId,
            'text' => "✅ **Post Short Link ke sath Channel me bhej di gayi hai!**",
            'parse_mode' => 'Markdown'
        ]);

    } elseif ($text == "/start") {
        makeCurlRequest("https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage", 'POST', ['Content-Type: application/json'], [
            'chat_id' => $userChatId,
            'text' => "👋 Hi! Mujhe **Image + TeraBox Link** (Caption me) forward ya send karein.\n\nMain auto Short Link bana kar post kar dunga!"
        ]);
    } else {
        // Agar Photo miss ho gayi ya Link nahi mila
        if (!isset($message['photo'])) {
            $msg = "❌ Kripya Image ke sath Caption me TeraBox Link bhejen.";
        } else {
            $msg = "❌ Caption me koi valid TeraBox Link nahi mila.";
        }
        
        makeCurlRequest("https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage", 'POST', ['Content-Type: application/json'], [
            'chat_id' => $userChatId,
            'text' => $msg
        ]);
    }
}
?>

