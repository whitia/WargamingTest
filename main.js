/**
 * whitia
 */

enchant();

// 定数
var PIECE  = 32;
var SQUARE = 32;
var AROUND = {
	TOP:    { X:  0, Y:-32 },
	LEFT:   { X:-32, Y:  0 },
	RIGHT:  { X: 32, Y:  0 },
	BOTTOM: { X:  0, Y: 32 }
};

// 共通変数
var SET_TIME     = Date.now();

var PLAYERS      = new Group();
var ENEMIES      = new Group();
var MOVE_SCOPE   = new Array();
var ATTACK_SCOPE = new Array();

// 共通メソッド
function SetMoveScope(rx, ry, steps, direction) {
	// 移動歩数が尽きたら終了
	if (steps < 0) return;

	var x = rx + AROUND[direction].X;
	var y = ry + AROUND[direction].Y;

	// 敵との接触判定
	var isEnemy = true;
	for (var i = 0; i < enemy.length; i++) {
		if (x == enemy[i].x && y == enemy[i].y) {
			isEnemy = false;
		}
	}

	// マップ／敵／画面外
	if (baseMap.hitTest(x, y) || !isEnemy
		|| !(0 <= x && x < baseMap.width)
		|| !(0 <= y && y < baseMap.height)) {
		return;
	}

	for (var i = 0; i < MOVE_SCOPE.length; i++) {
		// 既に同じ座標に移動範囲が設定されているか
		if (x == MOVE_SCOPE[i].x && y == MOVE_SCOPE[i].y) {
			// 今回の移動歩数が前回以上か
			if (steps >= moveScopeStep[i]) {
				// 配列から削除
				MOVE_SCOPE.splice(i, 1);
				moveScopeStep.splice(i, 1);
			} else {
				// 何もせず終了
				return;
			}
		}
	}

	// 移動範囲をグループに追加
	MOVE_SCOPE.push(new Scope(x, y, "Move"));
	moveScopeStep.push(steps);
	// ここで移動経路を格納する処理

	// 移動範囲を伸ばす（再帰呼び出し）
	if (direction != "BOTTOM") arguments.callee(x, y, steps - 1, "TOP");
	if (direction != "RIGHT") arguments.callee(x, y, steps - 1, "LEFT");
	if (direction != "LEFT") arguments.callee(x, y, steps - 1, "RIGHT");
	if (direction != "TOP") arguments.callee(x, y, steps - 1, "BOTTOM");
}

function CallSetMoveScope(rx, ry, steps) {
	// 配列を初期化
	MOVE_SCOPE = new Array();
	moveScopeStep = new Array();

	// 現在位置の移動範囲を配列に追加
	MOVE_SCOPE.push(new Scope(rx, ry, "Move"));
	moveScopeStep.push(steps);

	// 移動歩数分の移動範囲を設定する
	SetMoveScope(rx, ry, steps - 1, "TOP");
	SetMoveScope(rx, ry, steps - 1, "LEFT");
	SetMoveScope(rx, ry, steps - 1, "RIGHT");
	SetMoveScope(rx, ry, steps - 1, "BOTTOM");

	// 移動範囲を表示
	scene.removeChild(PLAYERS);
	scene.removeChild(ENEMIES);

	for (var i = 0; i < MOVE_SCOPE.length; i++) {
		scene.addChild(MOVE_SCOPE[i]);
	}

	scene.addChild(PLAYERS);
	scene.addChild(ENEMIES);
}

function DelMoveScope() {
	for (var i = 0; i < MOVE_SCOPE.length; i++) {
		scene.removeChild(MOVE_SCOPE[i]);
	}
}

function SetAttackScope(rx, ry) {
	// 配列を初期化
	ATTACK_SCOPE = new Array();

	// 攻撃範囲を配列に追加
	ATTACK_SCOPE.push(new Scope(rx + AROUND["TOP"].X, ry + AROUND["TOP"].Y, "Attack"));
	ATTACK_SCOPE.push(new Scope(rx + AROUND["LEFT"].X, ry + AROUND["LEFT"].Y, "Attack"));
	ATTACK_SCOPE.push(new Scope(rx + AROUND["RIGHT"].X, ry + AROUND["RIGHT"].Y, "Attack"));
	ATTACK_SCOPE.push(new Scope(rx + AROUND["BOTTOM"].X, ry + AROUND["BOTTOM"].Y, "Attack"));

	// 攻撃範囲を表示
	scene.removeChild(PLAYERS);
	scene.removeChild(ENEMIES);

	for (var i = 0; i < ATTACK_SCOPE.length; i++) {
		scene.addChild(ATTACK_SCOPE[i]);
	}

	scene.addChild(PLAYERS);
	scene.addChild(ENEMIES);
}

function DelAttackScope() {
	for (var i = 0; i < ATTACK_SCOPE.length; i++) {
		scene.removeChild(ATTACK_SCOPE[i]);
	}
	cursor.x = cursor.y = -32;
	scene.removeChild(cursor);
}

function ScoutingSearch() {
	for (var i = 0; i < MOVE_SCOPE.length; i++) {
		for (var direction in AROUND) {
			// 移動範囲＋攻撃範囲
			var x = MOVE_SCOPE[i].x + AROUND[direction].X;
			var y = MOVE_SCOPE[i].y + AROUND[direction].Y;
			if (x == player.x && y == player.y) {
				return { X:MOVE_SCOPE[i].x, Y:MOVE_SCOPE[i].y };
			}
		}
	}
	return null;
}

function SetBattleScene() {
	// 戦闘シーン
	battleScene = new Scene();
	battleScene.backgroundColor = "rgba(0, 0, 0, 0.7)";

	// 戦闘シーン背景
	battleBG = new Sprite(320, 120);
	battleBG.moveTo(0, 100);
	battleBG.image = game.assets["img/battleBG.png"];
	battleScene.addChild(battleBG);

	// プレイヤーアバター
	playerAvatar = new Avatar("1:1:1:2002:2110:2211");
	playerAvatar.left();
	playerAvatar.moveTo(210, 130);
	battleScene.addChild(playerAvatar);

	// プレイヤーライフバー
	playerLifeBar = new Bar(210, 110);
	playerLifeBar.image = game.assets["img/bar.png"];
	playerLifeBar.maxvalue = 80;
	playerLifeBar.value = playerLifeBar.maxvalue;
	battleScene.addChild(playerLifeBar);

	// 敵アバター
	enemyAvatar = new Sprite(48, 48);
	enemyAvatar.moveTo(50, 135);
	enemyAvatar.image = game.assets["img/mon_192.gif"];
	battleScene.addChild(enemyAvatar);

	// 敵ライフバー
	enemyLifeBar = new Bar(40, 110);
	enemyLifeBar.image = game.assets["img/bar.png"];
	enemyLifeBar.maxvalue = 80;
	enemyLifeBar.value = enemyLifeBar.maxvalue;
	battleScene.addChild(enemyLifeBar);

	// 攻撃エフェクト（斬撃）
	slash = new Sprite(120, 120);
	slash.image = game.assets["img/effect00.png"];
	slash.x = enemyAvatar.x - 30;
	slash.y = enemyAvatar.y - 40;
	slash.frame = [0, 1, 2, 3, 4, 5, 6, 7, 8, null];

	// 攻撃エフェクト（毒液）
	venom = new Sprite(120, 120);
	venom.image = game.assets["img/effect01.png"];
	venom.x = playerAvatar.x - 30;
	venom.y = playerAvatar.y - 40;
	venom.frame = [0, 1, 2, 3, 4, 5, 6, 7, 8, null];
}

// クラス
var Player = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, PIECE, PIECE);

		this.image = game.assets["img/chara5.png"];
		this.x = x * SQUARE;
		this.y = y * SQUARE;
		this.walk = 1;
		this.direction = 0;
		this.steps = 3;
		this.start = false;
		this.vx = this.vy = 0;
		this.isMoving = false;
		this.isAttack = false;
		this.phase = "Move";

		PLAYERS.addChild(this);
		scene.addChild(PLAYERS);
	},
	onenterframe: function() {
		this.frame = this.direction * 3 + this.walk;

		if (!(game.frame % 5)) {
			this.walk++;
			this.walk %= 3;
		}
	},
	phaseStart: function() {
		if (Date.now() > SET_TIME && Date.now() < SET_TIME + 500) {
			phaseTitleBG.opacity = 1;
			phaseTitleBG.backgroundColor = "#009";
			scene.addChild(phaseTitleBG);
			phaseTitle.opacity = 1;
			phaseTitle.moveTo(70, 160);
			phaseTitle.setText("PLAYER PHASE");
			scene.addChild(phaseTitle);
		} else if (Date.now() > SET_TIME + 500 && Date.now() < SET_TIME + 1000) {
			phaseTitleBG.opacity -= 0.05;
			phaseTitle.opacity -= 0.05;
		} else if (Date.now() > SET_TIME + 1000) {
			scene.removeChild(phaseTitleBG);
			scene.removeChild(phaseTitle);
			CallSetMoveScope(this.x, this.y, this.steps);
			this.start = true;
		}
	},
	phaseEnd: function() {
		DelMoveScope();
		DelAttackScope();
		this.start = false;
		this.isMoving = false;
		this.isAttack = false;
		this.phase = "Move";
		enemy[0].phase = "Move";
		game.phase = "Enemy";

		SET_TIME = Date.now();
	}
});

var Enemy = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, PIECE, PIECE);

		this.image = game.assets["img/chara6.png"];
		this.x = x * SQUARE;
		this.y = y * SQUARE;
		this.walk = 1;
		this.direction = 0;
		this.steps = 3;
		this.start = false;
		this.vx = this.vy = 0;
		this.isMoving = false;
		this.isAttack = false;
		this.phase = "Wait";

		ENEMIES.addChild(this);
		scene.addChild(ENEMIES);
	},
	onenterframe: function() {
		this.frame = this.direction * 3 + this.walk;

		if (!(game.frame % 5)) {
			this.walk++;
			this.walk %= 3;
		}
	},
	phaseStart: function() {
		if (Date.now() > SET_TIME && Date.now() < SET_TIME + 500) {
			phaseTitleBG.opacity = 1;
			phaseTitleBG.backgroundColor = "#900";
			scene.addChild(phaseTitleBG);
			phaseTitle.opacity = 1;
			phaseTitle.moveTo(80, 160);
			phaseTitle.setText("ENEMY PHASE");
			scene.addChild(phaseTitle);
		} else if (Date.now() > SET_TIME + 500 && Date.now() < SET_TIME + 1000) {
			phaseTitleBG.opacity -= 0.05;
			phaseTitle.opacity -= 0.05;
		} else if (Date.now() > SET_TIME + 1000) {
			scene.removeChild(phaseTitleBG);
			scene.removeChild(phaseTitle);
			CallSetMoveScope(this.x, this.y, this.steps);
			this.start = true;
		}
	},
	phaseEnd: function(index) {
		DelMoveScope();
		this.start = false;
		this.isAttack = false;

		// まだ行動していない敵がいるか
		if (enemy.length != index + 1) {
			enemy[index + 1].phase = "Move";
		} else {
			game.phase = "Player";
		}

		SET_TIME = Date.now();
	}
});

var Cursor = Class.create(Sprite, {
	initialize: function() {
		Sprite.call(this, PIECE, PIECE);

		this.image = game.assets["img/cur001.png"];
	},
	onenterframe: function() {
		if (!(game.frame % 10)) {
			if (this.frame) {
				this.frame = 0;
			} else {
				this.frame = 1;
			}
		}
	},
	setCursor: function(direction) {
		this.x = player.x + AROUND[direction].X;
		this.y = player.y + AROUND[direction].Y;
	}
});

var Scope = Class.create(Entity, {
	initialize: function(x, y, type) {
		Entity.call(this);

		this.width = SQUARE;
		this.height = SQUARE;
		this.x = x;
		this.y = y;
		this.opacity = 0.3;
		switch (type) {
			case "Move":
				this.backgroundColor = "#00f";
				break;
			case "Attack":
				this.backgroundColor = "#f00";
				break;
		}
	}
});

// メイン
window.onload = function() {
	// ゲーム全体の設定
	game = new Game(SQUARE * 10, SQUARE * 10);
	game.fps = 30;
	game.preload(
		"img/chara5.png",
		"img/chara6.png",
		"img/cur001.png",
		"img/map1.png",
		"sound/slash.wav",
		"sound/venom.ogg",
		"img/mon_192.gif",
		"img/effect00.png",
		"img/effect01.png",
		"img/battleBG.png",
		"img/bar.png",
		"sound/co.wav"
	);
	game.keybind(88, 'x');
	game.keybind(90, 'z');
	game.phase = "Player";

	game.onload = function() {
		scene = game.rootScene;
		SetBattleScene();

		// マップ
		baseMap = new Map(16, 16);
		baseMap.image = game.assets["img/map1.png"];
		baseMap.loadData([
			[112,113, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79, 79],
			[ 79, 80,109,109,109,109,109,109,109,109,109,109,109,109,109,109,109,109,109,109],
			[ 79, 80,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[109,110,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[112,112,112,112,112,112,112,112,112,172,330,330,173,112,112,112,112,112,112,112],
			[ 79, 79, 79, 79, 79, 79, 79, 79, 79,186,187,187,188, 79, 79, 79, 79, 79, 79, 79],
			[ 79, 79, 79, 79, 79, 79, 79, 79, 79,186,187,187,188, 79, 79, 79, 79, 79, 79, 79],
			[  3,  3,  3,  3,  3,  3,  3,  3,  3,186,187,187,188,  3,  3,  3,  3,  3,  3,  3],
			[120,120,120,120,120,120,120,120,120,186,187,187,188,120,120,120,120,120,120,120],
			[120,120,120,120,120,120,120,120,120,330,330,330,330,120,120,120,120,120,120,120],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330]
		]);
		baseMap.collisionData = [
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1],
			[  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
		];
		scene.addChild(baseMap);

		foregroundMap = new Map(16, 16);
		foregroundMap.image = game.assets["img/map1.png"];
		foregroundMap.loadData([
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,386,387,388,389],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,416,417,418,419],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,446,447,448,449],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,476,477,478,479],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[235,235,235,235,235,235,235,235,235,142, -1, -1,143,235,235,235,235,235,235,235],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
		]);
		scene.addChild(foregroundMap);

		// プレイヤー
		player = new Player(5, 3);

		// 敵
		enemy = [new Enemy(5, 6)];

		// カーソル
		cursor = new Cursor();

		// フェーズタイトル
		phaseTitle = new MutableText(0, 0);
		phaseTitleBG = new Entity();
		phaseTitleBG.width = 320;
		phaseTitleBG.height = 12;
		phaseTitleBG.x = 0;
		phaseTitleBG.y = 160;

		// キャプション
		notes1 = new Label("方向キー：移動・選択");
		notes1.color = "#fff";
		notes1.font = "ＭＳ ゴシック";
		notes1.moveTo(0, 0);
		scene.addChild(notes1);

		notes2 = new Label("Zキー：決定");
		notes2.color = "#fff";
		notes2.font = "ＭＳ ゴシック";
		notes2.moveTo(0, 10);
		scene.addChild(notes2);

		notes3 = new Label("Xキー：キャンセル");
		notes3.color = "#fff";
		notes3.font = "ＭＳ ゴシック";
		notes3.moveTo(0, 20);
		scene.addChild(notes3);

		// フレーム毎のイベント処理
		game.addEventListener("enterframe", function() {
			// プレイヤーフェーズ
			if (this.phase == "Player") {
				if (!player.start) {
					player.phaseStart();
				} else {
					// 移動フェーズ
					if (player.phase == "Move") {
						// 移動モーション中か
						if (player.isMoving) {
							// 移動
							player.moveBy(player.vx, player.vy);
							// X軸方向かY軸方向に１マス進んだら移動終了
							if ((player.vx && (player.x % SQUARE) == 0)
								|| (player.vy && (player.y % SQUARE) == 0)) {
								player.isMoving = false;
							}
						} else {
							player.vx = player.vy = 0;
							// 方向キー入力待ち
							if (this.input.down) {
								player.direction = 0;
								player.vy = 4;
							} else if (this.input.left) {
								player.direction = 1;
								player.vx = -4;
							} else if (this.input.right) {
								player.direction = 2;
								player.vx = 4;
							} else if (this.input.up) {
								player.direction = 3;
								player.vy = -4;
							// 移動フェーズ終了
							} else if (this.input.z) {
								DelMoveScope();
								SetAttackScope(player.x, player.y);
								player.phase = "Attack";
							// プレイヤーフェーズ終了
							} else if (this.input.x) {
								player.phaseEnd();
							}

							// 方向キーが入力されたか
							if (player.vx || player.vy) {
								// 進む先の座標
								var x = player.x + (player.vx ? player.vx / Math.abs(player.vx) * SQUARE : 0);
								var y = player.y + (player.vy ? player.vy / Math.abs(player.vy) * SQUARE : 0);
								// 移動可能か
								for (var i = 0; i < MOVE_SCOPE.length; i++) {
									if (x == MOVE_SCOPE[i].x && y == MOVE_SCOPE[i].y) {
										player.isMoving = true;
									}
								}
							}
						}
					// 攻撃フェーズ
					} else if (player.phase == "Attack") {
						// 攻撃モーション中か
						if (player.isAttack) {
							var slashSE = game.assets['sound/slash.wav'];
							if (Date.now() > SET_TIME + 1000 && Date.now() < SET_TIME + 1500) {
								slashSE.play();
								battleScene.addChild(slash);
								enemyLifeBar.value -= 2;
								if (enemyLifeBar.value < 0) {
									this.assets["sound/co.wav"].play();
									battleScene.removeChild(enemyAvatar);
								}
							} else if (Date.now() > SET_TIME + 2000) {
								slash.frame = [0, 1, 2, 3, 4, 5, 6, 7, 8, null];
								battleScene.removeChild(slash);
								this.popScene(battleScene);
								player.phaseEnd();
							}
							if (slashSE.currentTime > 0.5) slashSE.stop();
						} else {
							// 方向キー入力待ち
							if (this.input.down) {
								cursor.setCursor("BOTTOM");
								scene.addChild(cursor);
							} else if (this.input.left) {
								cursor.setCursor("LEFT");
								scene.addChild(cursor);
							} else if (this.input.right) {
								cursor.setCursor("RIGHT");
								scene.addChild(cursor);
							} else if (this.input.up) {
								cursor.setCursor("TOP");
								scene.addChild(cursor);
							// Zキー入力待ち
							} else if (this.input.z) {
								for (var i = 0; i < enemy.length; i++) {
									if (cursor.x == enemy[i].x && cursor.y == enemy[i].y) {
										// 攻撃範囲の表示をリセット
										player.isAttack = true;
										this.pushScene(battleScene);
										SET_TIME = Date.now();
									}
								}
							// Xキー入力待ち
							} else if (this.input.x) {
								// 攻撃範囲の表示をリセット
								scene.removeChild(cursor);
								// 攻撃フェーズ終了
								DelAttackScope();
								CallSetMoveScope(player.x, player.y, player.steps);
								player.phase = "Move";
							}
						}
					}
				}
			// 敵フェーズ
			} else if (this.phase == "Enemy") {
				for (i = 0; i < enemy.length; i++) {
					// 順番に実行
					if (enemy[i].phase != "Wait") {
						// フェーズ開始時
						if (!enemy[i].start) {
							enemy[i].phaseStart();
						} else {
							// 移動フェーズ
							if (enemy[i].phase == "Move") {
								// 移動モーション中か
								if (enemy[i].isMoving) {
								} else {
									if (destination = ScoutingSearch()) {
										enemy[i].moveTo(destination.X, destination.Y);
									enemy[i].isMoving = false;
									enemy[i].phase = "Attack";
									this.pushScene(battleScene);
									SET_TIME = Date.now();
									} else {
										enemy[i].phaseEnd(i);
									}
								}
							// 攻撃フェーズ
							} else if (enemy[i].phase == "Attack") {
								var venomSE = game.assets['sound/venom.ogg'];
								if (Date.now() > SET_TIME + 1000 && Date.now() < SET_TIME + 1500) {
									venomSE.play();
									battleScene.addChild(venom);
									playerLifeBar.value -= 1;
								} else if (Date.now() > SET_TIME + 2000) {
									venom.frame = [0, 1, 2, 3, 4, 5, 6, 7, 8, null];
									battleScene.removeChild(venom);
									this.popScene(battleScene);
									enemy[i].phaseEnd(i);
								}
								if (venomSE.currentTime > 1) venomSE.stop();
							}
						}
					}
				}
			}
		});
	}
	game.start();
}