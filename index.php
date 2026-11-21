<?php
session_start();
$cfg = require __DIR__.'/config.php';
$db = new PDO("mysql:host={$cfg['host']};dbname={$cfg['name']};charset=utf8mb4",$cfg['user'],$cfg['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);

const CATS=['camiseta'=>'Camisetas','sudadera'=>'Sudaderas','pantalon'=>'Pantalones','chaqueta'=>'Chaquetas','calzado'=>'Calzado'];
const COLORS=['negro'=>'#1e1e24','blanco'=>'#fafafa','gris'=>'#9a9aa5','beige'=>'#d9c7a7','denim'=>'#5b7ba6','marron'=>'#7a5338','rosa'=>'#ffa3da','lila'=>'#ab6cc4','verde'=>'#90d870','azul'=>'#3d63d6','rojo'=>'#d6403d','amarillo'=>'#f2d13b'];
const NEUTRAL=['negro','blanco','gris','beige','denim','marron'];
const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const HARMONY=[['rosa','lila'],['lila','verde'],['rosa','verde'],['azul','amarillo']];
const SHOP=[
 ['pantalon','beige','Pantalón cargo oversize beige: base del look coreano, combina con todo.'],
 ['pantalon','negro','Pantalón ancho negro de pernera recta, estilo "wide fit".'],
 ['pantalon','denim','Vaquero baggy lavado claro.'],
 ['sudadera','gris','Sudadera oversize gris jaspeado, hombros caídos.'],
 ['sudadera','lila','Sudadera lila pastel: pieza de color que juega con tu paleta.'],
 ['camiseta','blanco','Camiseta blanca oversize de algodón grueso.'],
 ['camiseta','negro','Camiseta negra boxy-fit larga.'],
 ['chaqueta','negro','Bomber o chaqueta varsity negra.'],
 ['chaqueta','beige','Trench corto o chaqueta workwear beige.'],
 ['calzado','blanco','Zapatillas blancas chunky.'],
 ['calzado','negro','Zapatillas negras minimalistas o loafers.'],
 ['camiseta','verde','Camiseta verde lima: toque de color como acento.'],
];

function h($s){return htmlspecialchars((string)$s,ENT_QUOTES,'UTF-8');}
function go($v){header("Location: ?v=$v");exit;}
function csrf(){return $_SESSION['t']??($_SESSION['t']=bin2hex(random_bytes(16)));}

if(isset($_POST['login'])){ if(hash_equals($cfg['app_password'],$_POST['pw']??'')){$_SESSION['ok']=1;} go('semana'); }
if(isset($_GET['salir'])){session_destroy();header('Location: ./');exit;}
$logged=!empty($_SESSION['ok']);

function allItems($db){$r=[];foreach($db->query("SELECT * FROM items ORDER BY id DESC") as $i)$r[$i['id']]=$i;return $r;}
function score($set){
  $cols=array_column($set,'color'); $non=array_unique(array_diff($cols,NEUTRAL)); $s=0;
  if(count($non)==0)$s+=3; elseif(count($non)==1)$s+=2;
  elseif(count($non)==2){sort($non);foreach(HARMONY as $p){sort($p);if($p==array_values($non))$s+=1;}}
  else $s-=2;
  $by=[];foreach($set as $i)$by[$i['category']]=$i['color'];
  $top=$by['sudadera']??$by['camiseta']??null; $bot=$by['pantalon']??null;
  if($top&&$bot){ if($top==$bot&&$top!='negro')$s-=2; else $s+=1; }
  return $s+mt_rand(0,10)/10;
}
function genOutfit($items,$avoid=[]){
  $g=[];foreach($items as $i)$g[$i['category']][]=$i;
  if(empty($g['pantalon'])||(empty($g['camiseta'])&&empty($g['sudadera'])))return null;
  $best=null;$bs=-99;
  for($n=0;$n<150;$n++){
    $set=[];
    $tops=array_merge($g['camiseta']??[],$g['sudadera']??[]);
    $set[]=$tops[array_rand($tops)]; $set[]=$g['pantalon'][array_rand($g['pantalon'])];
    if(!empty($g['calzado']))$set[]=$g['calzado'][array_rand($g['calzado'])];
    if(!empty($g['chaqueta'])&&mt_rand(0,2)==0)$set[]=$g['chaqueta'][array_rand($g['chaqueta'])];
    $ids=implode(',',array_column($set,'id')); if(in_array($ids,$avoid))continue;
    $sc=score($set); if($sc>$bs){$bs=$sc;$best=$ids;}
  }
  return $best;
}
function genWeek($db){
  $items=allItems($db);$used=[];
  foreach(range(0,6) as $d){$o=genOutfit($items,$used); if(!$o)return false; $used[]=$o;
    $db->prepare("REPLACE INTO week_plan(day,item_ids) VALUES(?,?)")->execute([$d,$o]);}
  return true;
}
$err='';
if($logged&&$_SERVER['REQUEST_METHOD']==='POST'&&!isset($_POST['login'])){
  if(!hash_equals(csrf(),$_POST['t']??''))die('Sesión caducada');
  $a=$_POST['a']??'';
  if($a=='add'&&isset($_FILES['foto'])&&$_FILES['foto']['error']===0&&$_FILES['foto']['size']<8e6){
    $info=@getimagesize($_FILES['foto']['tmp_name']);
    $ext=[IMAGETYPE_JPEG=>'jpg',IMAGETYPE_PNG=>'png',IMAGETYPE_WEBP=>'webp'][$info[2]??0]??null;
    if($ext&&isset(CATS[$_POST['cat']])&&isset(COLORS[$_POST['color']])){
      $f=bin2hex(random_bytes(8)).".$ext"; move_uploaded_file($_FILES['foto']['tmp_name'],__DIR__."/uploads/$f");
      $db->prepare("INSERT INTO items(category,color,name,photo) VALUES(?,?,?,?)")->execute([$_POST['cat'],$_POST['color'],mb_substr(trim($_POST['name']),0,80),$f]);
    }
    go('armario');
  }
  if($a=='del'){ $s=$db->prepare("SELECT photo FROM items WHERE id=?");$s->execute([$_POST['id']]);
    if($r=$s->fetch()){@unlink(__DIR__."/uploads/".$r['photo']);$db->prepare("DELETE FROM items WHERE id=?")->execute([$_POST['id']]);} go('armario'); }
  if($a=='semana'){ genWeek($db)||($_SESSION['e']='Necesitas al menos 1 pantalón y 1 camiseta o sudadera.'); go('semana'); }
  if($a=='dia'){ $o=genOutfit(allItems($db)); if($o)$db->prepare("REPLACE INTO week_plan(day,item_ids) VALUES(?,?)")->execute([(int)$_POST['d'],$o]); go('semana'); }
  if($a=='swap'){ $items=allItems($db); $d=(int)$_POST['d']; $old=(int)$_POST['i'];
    $s=$db->prepare("SELECT item_ids FROM week_plan WHERE day=?");$s->execute([$d]);
    if(($r=$s->fetch())&&isset($items[$old])){ $ids=explode(',',$r['item_ids']);
      $alt=array_filter($items,fn($i)=>$i['category']==$items[$old]['category']&&!in_array($i['id'],$ids));
      if($alt){$new=$alt[array_rand($alt)]['id'];$ids[array_search($old,$ids)]=$new;
        $db->prepare("UPDATE week_plan SET item_ids=? WHERE day=?")->execute([implode(',',$ids),$d]);}
    } go('semana'); }
  if($a=='fav'){ $db->prepare("INSERT INTO favorites(name,item_ids) VALUES(?,?)")->execute([mb_substr(trim($_POST['name'])?:'Mi outfit',0,80),$_POST['ids']]); go('favoritos'); }
  if($a=='delfav'){ $db->prepare("DELETE FROM favorites WHERE id=?")->execute([$_POST['id']]); go('favoritos'); }
  if($a=='usefav'){ $db->prepare("REPLACE INTO week_plan(day,item_ids) VALUES(?,?)")->execute([(int)$_POST['d'],$_POST['ids']]); go('semana'); }
}
$v=$_GET['v']??'semana'; $items=$logged?allItems($db):[];
function post($a,$f,$label,$cls=''){return '<form method="post" class="inl"><input type="hidden" name="t" value="'.csrf().'"><input type="hidden" name="a" value="'.$a.'">'.$f.'<button class="'.$cls.'">'.$label.'</button></form>';}
function outfit($ids,$items,$d=null){
  $o='<div class="fit">';
  foreach(explode(',',$ids) as $id){ if(!isset($items[$id]))continue; $i=$items[$id];
    $o.='<figure><img src="uploads/'.h($i['photo']).'" alt="'.h($i['name']).'" loading="lazy"><figcaption>'.h($i['name']?:CATS[$i['category']]);
    if($d!==null)$o.=post('swap','<input type="hidden" name="d" value="'.$d.'"><input type="hidden" name="i" value="'.$i['id'].'">','Cambiar','tiny');
    $o.='</figcaption></figure>'; }
  return $o.'</div>';
}
?><!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Outfit Live</title><link rel="icon" href="favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--rosa:#ffa3da;--lila:#ab6cc4;--lima:#90d870;--tinta:#2a1636;--fondo:#fff4fb;--card:#fff}
@media(prefers-color-scheme:dark){:root{--tinta:#fbeefa;--fondo:#1d1024;--card:#2b1936}}
*{box-sizing:border-box}body{margin:0;font:16px/1.5 'Bricolage Grotesque',system-ui,sans-serif;background:var(--fondo);color:var(--tinta)}
header{display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--lila);color:#fff;flex-wrap:wrap}
header img{width:44px;height:44px;border-radius:12px}header b{font-size:1.5rem;font-weight:800;letter-spacing:-.02em}
header b i{font-style:normal;color:var(--lima)}
nav{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}nav a{color:#fff;text-decoration:none;padding:8px 14px;border-radius:99px}
nav a.on{background:var(--rosa);color:#2a1636;font-weight:600}nav a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--lima);outline-offset:2px}
main{max-width:1000px;margin:0 auto;padding:20px}h1{font-size:2rem;margin:.2em 0 .6em;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:var(--card);border-radius:22px;padding:16px;border:2px solid var(--rosa)}.card h3{margin:0 0 10px}
.fit{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.fit figure{margin:0;font-size:.8rem}
.fit img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block}
button{font:inherit;cursor:pointer;border:0;border-radius:99px;padding:9px 16px;background:var(--lila);color:#fff;font-weight:600}
button.ok{background:var(--lima);color:#2a1636}button.tiny{padding:1px 9px;font-size:.75rem;background:var(--rosa);color:#2a1636;margin-left:4px}
.inl{display:inline}.acts{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
form.add{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:24px;background:var(--card);padding:16px;border-radius:22px;border:2px dashed var(--lila)}
input,select{font:inherit;padding:9px;border-radius:12px;border:2px solid var(--rosa);background:var(--card);color:var(--tinta);width:100%}
.dot{display:inline-block;width:12px;height:12px;border-radius:50%;border:1px solid #0003;vertical-align:middle}
.empty{padding:30px;text-align:center;background:var(--card);border-radius:22px}.err{background:var(--rosa);color:#2a1636;padding:10px 14px;border-radius:14px}
.login{max-width:340px;margin:12vh auto;text-align:center}.login img{width:190px;border-radius:40px}
</style></head><body>
<?php if(!$logged): ?>
<main class="login"><img src="logo.png" alt="Outfit Live">
<form method="post"><input type="password" name="pw" placeholder="Contraseña" required autofocus><p><button name="login" value="1">Entrar</button></p></form></main>
<?php else: ?>
<header><img src="logo.png" alt=""><b>Outfit <i>Live</i></b>
<nav><?php foreach(['semana'=>'Semana','armario'=>'Mi armario','favoritos'=>'Favoritos','comprar'=>'Qué comprar'] as $k=>$l) echo '<a href="?v='.$k.'" class="'.($v==$k?'on':'').'">'.$l.'</a>'; ?><a href="?salir=1">Salir</a></nav></header>
<main>
<?php if(!empty($_SESSION['e'])){echo '<p class="err">'.h($_SESSION['e']).'</p>';unset($_SESSION['e']);}
if($v=='armario'): ?>
<h1>Mi armario</h1>
<form class="add" method="post" enctype="multipart/form-data"><input type="hidden" name="t" value="<?=csrf()?>"><input type="hidden" name="a" value="add">
<input type="file" name="foto" accept="image/*" required>
<select name="cat" aria-label="Tipo"><?php foreach(CATS as $k=>$l)echo "<option value=$k>$l</option>";?></select>
<select name="color" aria-label="Color"><?php foreach(COLORS as $k=>$c)echo "<option value=$k>".ucfirst($k)."</option>";?></select>
<input name="name" placeholder="Nombre (ej. Hoodie oversize)" maxlength="80"><button class="ok">Añadir prenda</button></form>
<?php if(!$items)echo '<p class="empty">Aún no hay prendas. Sube la primera foto de tu ropa.</p>';
foreach(CATS as $k=>$l){ $set=array_filter($items,fn($i)=>$i['category']==$k); if(!$set)continue; echo "<h2>$l</h2><div class='grid'>";
 foreach($set as $i){ echo '<div class="card"><div class="fit" style="grid-template-columns:1fr"><figure><img src="uploads/'.h($i['photo']).'" alt=""></figure></div><p><span class="dot" style="background:'.COLORS[$i['color']].'"></span> '.h($i['name']?:ucfirst($i['color'])).'</p>'.post('del','<input type="hidden" name="id" value="'.$i['id'].'">','Eliminar').'</div>'; }
 echo '</div>'; }
elseif($v=='favoritos'): ?>
<h1>Outfits guardados</h1><div class="grid">
<?php $fv=$db->query("SELECT * FROM favorites ORDER BY id DESC")->fetchAll(); if(!$fv)echo '<p class="empty">Guarda con ♥ los outfits que te gusten desde la semana.</p>';
foreach($fv as $f){ echo '<div class="card"><h3>'.h($f['name']).'</h3>'.outfit($f['item_ids'],$items).'<div class="acts">'.
 '<form method="post" class="inl"><input type="hidden" name="t" value="'.csrf().'"><input type="hidden" name="a" value="usefav"><input type="hidden" name="ids" value="'.h($f['item_ids']).'"><select name="d" style="width:auto">';
 foreach(DAYS as $n=>$dn)echo "<option value=$n>$dn</option>"; echo '</select> <button class="ok">Poner en el día</button></form>'.post('delfav','<input type="hidden" name="id" value="'.$f['id'].'">','Quitar').'</div></div>'; } ?>
</div>
<?php elseif($v=='comprar'): ?>
<h1>Qué comprar</h1><p>Huecos en tu armario para un estilo oversize coreano:</p><div class="grid">
<?php $n=0; foreach(SHOP as [$c,$col,$t]){ $have=array_filter($items,fn($i)=>$i['category']==$c&&$i['color']==$col); if($have||$n>=6)continue; $n++;
 echo '<div class="card"><h3><span class="dot" style="background:'.COLORS[$col].'"></span> '.CATS[$c].' · '.ucfirst($col).'</h3><p>'.h($t).'</p></div>'; }
if(!$n)echo '<p class="empty">Tu armario cubre todas las ideas base. ¡Bien!</p>'; ?></div>
<?php else: ?>
<h1>Tu semana</h1><?= post('semana','','Generar semana nueva','ok') ?>
<?php $wk=[];foreach($db->query("SELECT * FROM week_plan") as $r)$wk[$r['day']]=$r['item_ids'];
if(!$wk)echo '<p class="empty">Todavía no hay semana. Sube tu ropa y pulsa «Generar semana nueva».</p>'; ?>
<div class="grid" style="margin-top:16px">
<?php foreach(DAYS as $d=>$dn){ if(!isset($wk[$d]))continue; echo '<div class="card"><h3>'.$dn.'</h3>'.outfit($wk[$d],$items,$d).'<div class="acts">'.
 post('dia','<input type="hidden" name="d" value="'.$d.'">','Otro outfit').
 '<form method="post" class="inl"><input type="hidden" name="t" value="'.csrf().'"><input type="hidden" name="a" value="fav"><input type="hidden" name="ids" value="'.h($wk[$d]).'"><input name="name" placeholder="Nombre" style="width:110px"> <button class="ok">♥ Guardar</button></form></div></div>'; } ?>
</div>
<?php endif; ?>
</main><?php endif; ?></body></html>
