<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
assert_same_origin();
$action = $_GET['action'] ?? 'health';

try {
    switch ($action) {
        case 'health':
            require_method('GET'); db(); ok(['service'=>'residim-api','status'=>'ok','time'=>gmdate('c')]);

        case 'session':
            require_method('GET'); $uid=current_user_id(false); if(!$uid) ok(['authenticated'=>false]); ok(['authenticated'=>true,'user'=>user_payload($uid)]);

        case 'request_otp':
            require_method('POST'); $in=json_input(); $phone=normalize_phone((string)($in['phone']??'')); $pdo=db();
            $cut=gmdate('Y-m-d H:i:s',time()-600); $s=$pdo->prepare('SELECT COUNT(*) FROM otp_codes WHERE phone=? AND created_at>?');$s->execute([$phone,$cut]); if((int)$s->fetchColumn()>=5) fail('rate_limited','درخواست کد برای این شماره موقتاً محدود شده است. چند دقیقه بعد دوباره تلاش کنید.',429);
            $code=(string)random_int(100000,999999);$hash=password_hash($code,PASSWORD_DEFAULT);$expires=gmdate('Y-m-d H:i:s',time()+(int)residim_config()['otp_ttl']);
            $pdo->prepare('INSERT INTO otp_codes(phone,code_hash,expires_at,attempts) VALUES(?,?,?,0)')->execute([$phone,$hash,$expires]);
            $extra=send_sms_otp($phone,$code); ok(['sent'=>true,'expires_in'=>(int)residim_config()['otp_ttl']]+$extra);

        case 'verify_otp':
            require_method('POST'); $in=json_input();$phone=normalize_phone((string)($in['phone']??''));$code=preg_replace('/\D/','',(string)($in['code']??''));if(strlen($code)!==6)fail('invalid_code','کد باید ۶ رقم باشد.',422);
            $pdo=db();$s=$pdo->prepare('SELECT * FROM otp_codes WHERE phone=? ORDER BY id DESC LIMIT 1');$s->execute([$phone]);$otp=$s->fetch();
            if(!$otp||strtotime($otp['expires_at'])<time())fail('expired_code','کد منقضی شده است. کد تازه بگیرید.',422);
            if((int)$otp['attempts']>=(int)residim_config()['otp_max_attempts'])fail('too_many_attempts','تعداد تلاش ناموفق زیاد شده است. کد تازه بگیرید.',429);
            if(!password_verify($code,$otp['code_hash'])){$pdo->prepare('UPDATE otp_codes SET attempts=attempts+1 WHERE id=?')->execute([$otp['id']]);fail('invalid_code','کد واردشده درست نیست.',422);}
            $pdo->beginTransaction();
            try{$u=$pdo->prepare('SELECT id FROM users WHERE phone=?');$u->execute([$phone]);$uid=$u->fetchColumn();if(!$uid){$pdo->prepare("INSERT INTO users(phone,display_name) VALUES(?,?)")->execute([$phone,'خانواده']);$uid=(int)$pdo->lastInsertId();}$pdo->prepare('DELETE FROM otp_codes WHERE phone=?')->execute([$phone]);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}
            boot_session();session_regenerate_id(true);$_SESSION['user_id']=(int)$uid;unset($_SESSION['group_id']);ok(['authenticated'=>true,'user'=>user_payload((int)$uid)]);

        case 'logout':
            require_method('POST');boot_session();$_SESSION=[];if(ini_get('session.use_cookies')){$p=session_get_cookie_params();setcookie(session_name(),'',time()-42000,$p['path'],$p['domain']??'',(bool)$p['secure'],(bool)$p['httponly']);}session_destroy();ok(['logged_out'=>true]);

        case 'bootstrap':
            require_method('GET');$uid=current_user_id();ok(bootstrap_payload($uid));

        case 'create_group':
            require_method('POST');$uid=current_user_id();$in=json_input();$name=trim((string)($in['name']??''));$value=(int)($in['trip_value']??0);$start=(string)($in['start_date']??date('Y-m-d'));
            if(mb_strlen($name)<2||mb_strlen($name)>120)fail('invalid_group_name','نام هم‌سرویس باید بین ۲ تا ۱۲۰ نویسه باشد.',422);if($value<1000||$value>100000000)fail('invalid_trip_value','ارزش نوبت معتبر نیست.',422);if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$start))fail('invalid_start_date','تاریخ شروع معتبر نیست.',422);
            $pdo=db();$pdo->beginTransaction();try{$code=random_code(6);$pdo->prepare('INSERT INTO groups_tbl(name,invite_code,trip_value,created_by) VALUES(?,?,?,?)')->execute([$name,$code,$value,$uid]);$gid=(int)$pdo->lastInsertId();$pdo->prepare("INSERT INTO memberships(group_id,user_id,role,start_date,active) VALUES(?,?,?,?,1)")->execute([$gid,$uid,'owner',$start]);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}$_SESSION['group_id']=$gid;seed_week($gid,$uid);ok(['group_id'=>$gid,'invite_code'=>$code]);

        case 'join_group':
            require_method('POST');$uid=current_user_id();$in=json_input();$code=strtoupper(trim((string)($in['invite_code']??'')));$start=(string)($in['start_date']??date('Y-m-d'));$pdo=db();$s=$pdo->prepare('SELECT id FROM groups_tbl WHERE invite_code=?');$s->execute([$code]);$gid=$s->fetchColumn();if(!$gid)fail('invite_not_found','کد دعوت معتبر نیست.',404);
            try{$pdo->prepare("INSERT INTO memberships(group_id,user_id,role,start_date,active) VALUES(?,?,?,?,1)")->execute([(int)$gid,$uid,'member',$start]);}catch(PDOException $e){if(!str_contains($e->getMessage(),'UNIQUE'))throw $e;}
            $_SESSION['group_id']=(int)$gid;ok(['group_id'=>(int)$gid]);

        case 'select_group':
            require_method('POST');$uid=current_user_id();$in=json_input();$gid=(int)($in['group_id']??0);group_membership($gid,$uid);$_SESSION['group_id']=$gid;ok(['group_id'=>$gid]);

        case 'trip_action':
            require_method('POST');$uid=current_user_id();$in=json_input();$tripId=(int)($in['trip_id']??0);$do=(string)($in['action']??'');$pdo=db();
            $tq=$pdo->prepare('SELECT t.*,g.trip_value FROM trips t JOIN groups_tbl g ON g.id=t.group_id WHERE t.id=?');$tq->execute([$tripId]);$trip=$tq->fetch();if(!$trip)fail('trip_not_found','نوبت پیدا نشد.',404);group_membership((int)$trip['group_id'],$uid);
            $mine=((int)$trip['assigned_user_id']===$uid);

            if($do==='ready'){
                if(!$mine)fail('not_assigned','این نوبت به شما تخصیص ندارد.',403);if($trip['status']==='completed')fail('already_completed','این سفر قبلاً تکمیل شده است.',409);
                $pdo->prepare("UPDATE trips SET status='confirmed' WHERE id=?")->execute([$tripId]);ok(['status'=>'confirmed']);
            }

            if($do==='cant'){
                if(!$mine)fail('not_assigned','این نوبت به شما تخصیص ندارد.',403);if($trip['status']==='completed')fail('already_completed','این سفر قبلاً تکمیل شده است.',409);
                $pdo->beginTransaction();try{$pdo->prepare("UPDATE trips SET status='replacement_needed' WHERE id=?")->execute([$tripId]);$pdo->prepare("INSERT INTO swap_requests(trip_id,requested_by,original_assignee,status) VALUES(?,?,?,'open')")->execute([$tripId,$uid,$uid]);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}ok(['status'=>'replacement_needed']);
            }

            if($do==='accept_swap'){
                if($mine)fail('already_assigned','این نوبت از قبل به شما تخصیص دارد.',409);$pdo->beginTransaction();
                try{$lock=$pdo->prepare("SELECT * FROM trips WHERE id=?");$lock->execute([$tripId]);$fresh=$lock->fetch();if(!$fresh||$fresh['status']!=='replacement_needed'){$pdo->rollBack();fail('swap_closed','جایگزین این نوبت قبلاً مشخص شده است.',409);}group_membership((int)$fresh['group_id'],$uid);$pdo->prepare("UPDATE trips SET assigned_user_id=?,status='confirmed' WHERE id=? AND status='replacement_needed'")->execute([$uid,$tripId]);$pdo->prepare("UPDATE swap_requests SET status='accepted',accepted_by=?,accepted_at=? WHERE trip_id=? AND status='open'")->execute([$uid,now_sql(),$tripId]);$pdo->commit();}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}ok(['status'=>'confirmed']);
            }

            if($do==='start'){
                if(!$mine)fail('not_assigned','این نوبت به شما تخصیص ندارد.',403);if($trip['status']==='completed')fail('already_completed','این سفر قبلاً تکمیل شده است.',409);$pdo->beginTransaction();
                try{$pdo->prepare("UPDATE trips SET status='started',started_at=? WHERE id=?")->execute([now_sql(),$tripId]);$loc=is_array($in['location']??null)?$in['location']:[];$pdo->prepare('INSERT INTO trip_events(trip_id,group_id,user_id,type,lat,lng,accuracy) VALUES(?,?,?,?,?,?,?)')->execute([$tripId,$trip['group_id'],$uid,'start',$loc['lat']??null,$loc['lng']??null,$loc['accuracy']??null]);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}ok(['status'=>'started']);
            }

            if($do==='done'){
                if(!$mine)fail('not_assigned','این نوبت به شما تخصیص ندارد.',403);$pdo->beginTransaction();
                try{
                    $fresh=$pdo->prepare('SELECT * FROM trips WHERE id=?');$fresh->execute([$tripId]);$f=$fresh->fetch();if(!$f){$pdo->rollBack();fail('trip_not_found','نوبت پیدا نشد.',404);}
                    if($f['status']!=='completed'){
                        $pdo->prepare("UPDATE trips SET status='completed',actual_user_id=?,completed_at=? WHERE id=?")->execute([$uid,now_sql(),$tripId]);
                        $m=$pdo->prepare('SELECT user_id FROM memberships WHERE group_id=? AND active=1 AND start_date<=?');$m->execute([$f['group_id'],$f['service_date']]);$users=array_map('intval',array_column($m->fetchAll(),'user_id'));$count=count($users);
                        if($count>0){
                            $value=(int)$trip['trip_value'];$share=(int)round($value/$count);$mysql=$pdo->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql';
                            foreach($users as $memberId){$label='سهم استفاده · '.($f['direction']==='return'?'برگشت':'رفت');$stmt=$pdo->prepare($mysql?'INSERT IGNORE INTO ledger_entries(group_id,trip_id,user_id,amount,kind,label) VALUES(?,?,?,?,?,?)':'INSERT OR IGNORE INTO ledger_entries(group_id,trip_id,user_id,amount,kind,label) VALUES(?,?,?,?,?,?)');$stmt->execute([$f['group_id'],$tripId,$memberId,-$share,'usage',$label]);}
                            $label='اعتبار انجام سفر · '.($f['direction']==='return'?'برگشت':'رفت');$stmt=$pdo->prepare($mysql?'INSERT IGNORE INTO ledger_entries(group_id,trip_id,user_id,amount,kind,label) VALUES(?,?,?,?,?,?)':'INSERT OR IGNORE INTO ledger_entries(group_id,trip_id,user_id,amount,kind,label) VALUES(?,?,?,?,?,?)');$stmt->execute([$f['group_id'],$tripId,$uid,$value,'service',$label]);
                        }
                    }
                    $pdo->commit();
                }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
                ok(['status'=>'completed']);
            }
            fail('invalid_action','عملیات نوبت معتبر نیست.',422);

        case 'location_event':
            require_method('POST');$uid=current_user_id();$in=json_input();$gid=selected_group_id($uid);if(!$gid)fail('group_required','ابتدا وارد یک هم‌سرویس شوید.',422);$loc=is_array($in['location']??null)?$in['location']:[];if(!isset($loc['lat'],$loc['lng']))fail('location_required','موقعیت معتبر دریافت نشد.',422);$type=substr((string)($in['type']??'manual'),0,40);db()->prepare('INSERT INTO trip_events(group_id,user_id,type,lat,lng,accuracy) VALUES(?,?,?,?,?,?)')->execute([$gid,$uid,$type,$loc['lat'],$loc['lng'],$loc['accuracy']??null]);ok(['saved'=>true]);

        default: fail('not_found','مسیر API پیدا نشد.',404);
    }
} catch (PDOException $e) {
    error_log('Residim DB error: ' . $e->getMessage()); fail('database_error','خطای موقت پایگاه داده. دوباره تلاش کنید.',500);
} catch (Throwable $e) {
    error_log('Residim error: ' . $e->getMessage()); fail('server_error','خطای موقت سرور. دوباره تلاش کنید.',500);
}
