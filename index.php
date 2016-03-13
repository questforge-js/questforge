<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
	<head>
		<title>Mendel's Flame</title>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="Content-Style-Type" content="text/css">
		<meta http-equiv="Content-Script-Type" content="text/javascript">
		<link rel="stylesheet" href="style.css" type="text/css" media="screen">
		<script src="scripts/QuestForge.js" type="text/javascript"></script>
<?php
	
	$scripts = array ();
	
	$dir = dirname(__FILE__);
	
	if ($d = opendir($dir.'/scripts'))
	{
		while ($filename = readdir($d))
		{
			if ($filename != 'QuestForge.js' && preg_match('/^[^.].*\.js$/', $filename))
			{
				$scripts[] = $filename;
			}
		}
		
		closedir($d);
	}
	
	natsort($scripts);
	
	foreach ($scripts as $script)
	{
		echo '		<script src="scripts/'.htmlspecialchars($script).'" type="text/javascript"></script>
';
	}
	
?>
		<script src="game.js" type="text/javascript"></script>
	</head>
	<body>
		<script type="text/javascript">
			QuestForge.add(document.body, {
				view: {
					autoview: true
				}
			});
		</script>
	</body>
</html>
