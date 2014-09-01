/**
 * whitia
 */

enchant();

/**
 * ９方向の相対座標と対応する向き
 * [x, y, direction]
 * direction = 0:down, 1:left, 2:right, 3:up, -1:none
 */
var around = [
	[-32, -32, -1], [  0, -32,  3], [ 32, -32, -1],
	[-32,   0,  1], [  0,   0, -1], [ 32,   0,  2],
	[-32,  32, -1], [  0,  32,  0], [ 32,  32, -1]
];

var Player = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, 32, 32);

		this.image = game.assets["img/chara5.png"];
		this.x = x * 32;
		this.y = y * 32;
		this.walk = 1;
		this.direction = 0;
		this.steps = 3;
		this.start = false;
		this.vx = this.vy = 0;
		this.isMoving = false;
		this.isAttack = false;
		this.phase = "Move";
		this.moveScope = new Array();
		this.attackScope = new Array();
		scene.addChild(this);
	},
	onenterframe: function() {
		this.frame = this.direction * 3 + this.walk;

		if (!(game.frame % 5)) {
			this.walk++;
			this.walk %= 3;
		}
	},
	setScope: function(rx, ry, direction, steps) {
		// 移動歩数が尽きたら終了
		if (steps < 0) return;

		var x = rx + around[direction][0];
		var y = ry + around[direction][1];

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

		for (var i = 0; i < this.moveScope.length; i++) {
			// 既に同じ座標に移動範囲が設定されているか
			if (x == this.moveScope[i][0].x && y == this.moveScope[i][0].y) {
				// 今回の移動範囲が前回以上か
				if (steps >= this.moveScope[i][1]) {
					// 配列から削除
					this.moveScope.splice(i, 1);
				} else {
					// 何もせず終了
					return;
				}
			}
		}

		// 配列の末尾に移動範囲を追加
		this.moveScope[this.moveScope.length] = [new Scope(x, y, "Move"), steps];

		// 移動範囲を伸ばす
		if (direction != 7) this.setScope(x, y, 1, steps - 1);
		if (direction != 5) this.setScope(x, y, 3, steps - 1);
		if (direction != 3) this.setScope(x, y, 5, steps - 1);
		if (direction != 1) this.setScope(x, y, 7, steps - 1);
	},
	setMoveScope: function() {
		// 配列を初期化
		this.moveScope.length = 0;

		// 中心位置のみ移動範囲を設定する
		this.moveScope[this.moveScope.length] = [new Scope(this.x, this.y, "Move"), this.steps];

		// 移動歩数分の移動範囲を設定する（暫定コード）
		this.setScope(this.x, this.y, 1, this.steps - 1);
		this.setScope(this.x, this.y, 3, this.steps - 1);
		this.setScope(this.x, this.y, 5, this.steps - 1);
		this.setScope(this.x, this.y, 7, this.steps - 1);

		// 移動範囲を表示
		scene.removeChild(player);
		for (var i = 0; i < enemy.length; i++) {
			scene.removeChild(enemy[i]);
		}
		for (var i = 0; i < this.moveScope.length; i++) {
			scene.addChild(this.moveScope[i][0]);
		}
		scene.addChild(player);
		for (var i = 0; i < enemy.length; i++) {
			scene.addChild(enemy[i]);
		}
	},
	delMoveScope: function() {
		for (var i = 0; i < this.moveScope.length; i++) {
			scene.removeChild(this.moveScope[i][0]);
		}
	},
	setAttackScope: function() {
		// 配列を初期化
		this.attackScope.length = 0;

		for (var i = 1; i < around.length; i = i + 2) {
			// 対象を中心とした４方向の絶対座標
			var x = this.x + around[i][0];
			var y = this.y + around[i][1];

			// 配列の末尾に攻撃範囲を追加
			this.attackScope[this.attackScope.length] = new Scope(x, y, "Attack");
		}

		// 攻撃範囲を表示
		for (var i = 0; i < enemy.length; i++) {
			scene.removeChild(enemy[i]);
		}
		for (var i = 0; i < this.attackScope.length; i++) {
			scene.addChild(this.attackScope[i]);
		}
		for (var i = 0; i < enemy.length; i++) {
			scene.addChild(enemy[i]);
		}
	},
	delAttackScope: function() {
		for (var i = 0; i < this.attackScope.length; i++) {
			scene.removeChild(this.attackScope[i]);
		}
	},
	finalize: function() {
		this.start = false;
		this.isAttack = false;
		this.delMoveScope();
		this.delAttackScope();
		this.moveScope.length = 0;
		this.phase = "Move";
		enemy[0].phase = "Move";
		game.phase = "Enemy";
	}
});

var Enemy = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, 32, 32);

		this.image = game.assets["img/chara6.png"];
		this.x = x * 32;
		this.y = y * 32;
		this.walk = 1;
		this.direction = 0;
		this.steps = 3;
		this.start = false;
		this.vx = this.vy = 0;
		this.isMoving = false;
		this.isAttack = false;
		this.phase = "Wait";
		this.moveScope = new Array();
		this.attackScope = new Array();
		this.distance = 1024;
		scene.addChild(this);
	},
	onenterframe: function() {
		this.frame = this.direction * 3 + this.walk;

		if (!(game.frame % 5)) {
			this.walk++;
			this.walk %= 3;
		}
	},
	setScope: function(rx, ry, direction, steps) {
		// 移動歩数が尽きたら終了
		if (steps - 1 < 0) return;

		var x = rx + around[direction][0];
		var y = ry + around[direction][1];

		// 敵との接触判定
		var isEnemy = true;
		for (var i = 0; i < enemy.length; i++) {
			if (x == enemy[i].x && y == enemy[i].y) {
				isEnemy = false;
			}
		}

		// マップ／プレイヤー／敵／画面外
		if (baseMap.hitTest(x, y) || !isEnemy
			|| (x == player.x && y == player.y)
			|| !(0 <= x && x < baseMap.width)
			|| !(0 <= y && y < baseMap.height)) {
			return;
		}

		for (var i = 0; i < this.moveScope.length; i++) {
			// 既に同じ座標に移動範囲が設定されているか
			if (x == this.moveScope[i][0].x && y == this.moveScope[i][0].y) {
				// 今回の移動範囲が前回以上か
				if (steps >= this.moveScope[i][1]) {
					// 配列から削除
					this.moveScope.splice(i, 1);
				} else {
					// 何もせず終了
					return;
				}
			}
		}

		// 配列の末尾に移動範囲を追加
		this.moveScope[this.moveScope.length] = new Scope(x, y, "Move");

		// 移動範囲を伸ばす
		if (direction != 7) this.setScope(x, y, 1, steps - 1);
		if (direction != 5) this.setScope(x, y, 3, steps - 1);
		if (direction != 3) this.setScope(x, y, 5, steps - 1);
		if (direction != 1) this.setScope(x, y, 7, steps - 1);
	},
	setMoveScope: function() {
		// 配列を初期化
		this.moveScope.length = 0;

		// 中心位置のみ移動範囲を設定する
		this.moveScope[this.moveScope.length] = [new Scope(this.x, this.y, "Move"), this.steps];

		// 移動歩数分の移動範囲を設定する（暫定コード）
		this.setScope(this.x, this.y, 1, this.steps - 1);
		this.setScope(this.x, this.y, 3, this.steps - 1);
		this.setScope(this.x, this.y, 5, this.steps - 1);
		this.setScope(this.x, this.y, 7, this.steps - 1);

		// 移動範囲を表示
		scene.removeChild(player);
		for (var i = 0; i < enemy.length; i++) {
			scene.removeChild(enemy[i]);
		}
		for (var i = 0; i < this.moveScope.length; i++) {
			scene.addChild(this.moveScope[i][0]);
		}
		scene.addChild(player);
		for (var i = 0; i < enemy.length; i++) {
			scene.addChild(enemy[i]);
		}
	},
	delMoveScope: function() {
		for (var i = 0; i < this.moveScope.length; i++) {
			scene.removeChild(this.moveScope[i]);
		}
	},
	setAttackScope: function() {
		// 配列を初期化
		this.attackScope.length = 0;

		for (var i = 1; i < around.length; i = i + 2) {
			// 対象を中心とした４方向の絶対座標
			var x = this.x + around[i][0];
			var y = this.y + around[i][1];

			// 配列の末尾に攻撃範囲を追加
			this.attackScope[this.attackScope.length] = new Scope(x, y, "Attack");
		}

		// 移動範囲を表示
		scene.removeChild(player);
		for (var i = 0; i < enemy.length; i++) {
			scene.removeChild(enemy[i]);
		}
		for (var i = 0; i < this.moveScope.length; i++) {
			scene.addChild(this.moveScope[i][0]);
		}
		scene.addChild(player);
		for (var i = 0; i < enemy.length; i++) {
			scene.addChild(enemy[i]);
		}
	},
	delAttackScope: function() {
		for (var i = 0; i < this.attackScope.length; i++) {
			scene.removeChild(this.attackScope[i]);
		}
	}
});

var Cursor = Class.create(Sprite, {
	initialize: function() {
		Sprite.call(this, 32, 32);

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
	setPoint: function(x, y) {
		this.x = x;
		this.y = y;
	}
});

var Scope = Class.create(Entity, {
	initialize: function(x, y, type) {
		Entity.call(this);

		this.width = 32;
		this.height = 32;
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

window.onload = function() {
	// ゲーム全体の設定
	game = new Game(320, 320);
	game.fps = 30;
	game.preload("img/chara5.png", "img/chara6.png", "img/cur001.png", "img/map1.png", "sound/slash.wav", "sound/attack.wav", "img/mon_192.gif");
	game.keybind(88, 'x');
	game.keybind(90, 'z');
	game.phase = "Player";

	game.onload = function() {
		scene = game.rootScene;

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

		// プレイヤーアバター
		playerAvatar = new Avatar("1:1:1:2002:2110:2211");
		playerAvatar.left();
		playerAvatar.moveTo(180, 100);

		// 敵アバター
		enemyAvatar = new Sprite(48, 48);
		enemyAvatar.moveTo(80, 105);
		enemyAvatar.image = game.assets["img/mon_192.gif"];

		// 攻撃モーション中の背景(全体)
		isAttackBase = new Entity();
		isAttackBase.width = 320;
		isAttackBase.height = 320;
		isAttackBase.opacity = 0.7;
		isAttackBase.backgroundColor = "#000";

		// 攻撃モーション中の背景(帯)
		isAttackBelt = new Entity();
		isAttackBelt.width = 320;
		isAttackBelt.height = 70;
		isAttackBelt.opacity = 0.7;
		isAttackBelt.moveTo(0, 90);
		isAttackBelt.backgroundColor = "#9c0";

		// フレーム毎のイベント処理
		game.addEventListener("enterframe", function() {
			// プレイヤーフェーズ
			if (this.phase == "Player") {
				if (!player.start) {
					player.setMoveScope();
					player.start = true;
				} else {
					// 移動フェーズ
					if (player.phase == "Move") {
						// 移動モーション中か
						if (player.isMoving) {
							// 移動
							player.moveBy(player.vx, player.vy);

							// X軸方向かY軸方向に１マス進んだら移動終了
							if ((player.vx && (player.x % 32) == 0) || (player.vy && (player.y % 32) == 0)) {
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
								player.delMoveScope();
								player.setAttackScope();
								player.phase = "Attack";
							// プレイヤーフェーズ終了
							} else if (this.input.x) {
								player.finalize();
							}

							// 方向キーが入力されたか
							if (player.vx || player.vy) {
								// 進む先の座標
								var x = player.x + (player.vx ? player.vx / Math.abs(player.vx) * 32 : 0);
								var y = player.y + (player.vy ? player.vy / Math.abs(player.vy) * 32 : 0);
								// 移動可能か
								for (var i = 0; i < player.moveScope.length; i++) {
									if (x == player.moveScope[i][0].x && y == player.moveScope[i][0].y) {
										player.isMoving = true;
									}
								}
							}
						}
					// 攻撃フェーズ
					} else if (player.phase == "Attack") {
						// 攻撃モーション中か
						if (player.isAttack) {
							// 攻撃モーションに入ってからの経過フレームでエフェクトを順番に実行
							if (this.vFrame + 5 == this.frame) {
								playerAvatar.action = "attack";
							} else if (this.frame == this.vFrame + 25) {
								game.assets["sound/slash.wav"].volume = 0.3;
								game.assets["sound/slash.wav"].play();
								enemyAvatar.opacity = 0;
							} else if (this.frame == this.vFrame + 30) {
								enemyAvatar.opacity = 1;
								playerAvatar.action = "stop";
							} else if (this.frame == this.vFrame + 40) {
								scene.removeChild(isAttackBase);
								scene.removeChild(isAttackBelt);
								scene.removeChild(enemyAvatar);
								scene.removeChild(playerAvatar);
								// 攻撃フェーズ終了
								player.finalize();
							}
						} else {
							// 方向キー入力待ち
							if (this.input.down) {
								cursor.setPoint(player.x, player.y + 32);
								scene.addChild(cursor);
							} else if (this.input.left) {
								cursor.setPoint(player.x - 32, player.y);
								scene.addChild(cursor);
							} else if (this.input.right) {
								cursor.setPoint(player.x + 32, player.y);
								scene.addChild(cursor);
							} else if (this.input.up) {
								cursor.setPoint(player.x, player.y - 32);
								scene.addChild(cursor);
							// Zキー入力待ち
							} else if (this.input.z) {
								for (var i = 0; i < enemy.length; i++) {
									if (cursor.x == enemy[i].x && cursor.y == enemy[i].y) {
										// 攻撃範囲の表示をリセット
										scene.removeChild(cursor);
										// 攻撃モーション準備
										scene.addChild(isAttackBase);
										scene.addChild(isAttackBelt);
										scene.addChild(enemyAvatar);
										scene.addChild(playerAvatar);
										// 現在のフレームを取得
										this.vFrame = this.frame;
										player.isAttack = true;
									}
								}
							// Xキー入力待ち
							} else if (this.input.x) {
								// 攻撃範囲の表示をリセット
								scene.removeChild(cursor);
								// 攻撃フェーズ終了
								player.delAttackScope();
								player.setMoveScope();
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
							enemy[i].setMoveScope();
							enemy[i].start = true;
						} else {
							// 移動フェーズ
							if (enemy[i].phase == "Move") {
								// 移動モーション中か
								if (enemy[i].isMoving) {
									// 移動
									enemy[i].moveBy(enemy[i].vx, enemy[i].vy);

									if (enemy[i].x == enemy[i].moveScope[tmp].x && enemy[i].y == enemy[i].moveScope[tmp].y) {
										enemy[i].isMoving = false;
										enemy[i].phase = "Attack";
									}
								} else {
									for (var j = 0; j < enemy[i].moveScope.length; j++) {
										if (enemy[i].distance > Math.abs(enemy[i].moveScope[j].x - player.x) + Math.abs(enemy[i].moveScope[j].y - player.y)) {
											enemy[i].distance = Math.abs(enemy[i].moveScope[j].x - player.x) + Math.abs(enemy[i].moveScope[j].y - player.y);
											tmp = j;
										}
									}
									// 移動先座標と現在座標の差
									enemy[i].vx = (enemy[i].moveScope[tmp].x - enemy[i].x);
									enemy[i].vy = (enemy[i].moveScope[tmp].y - enemy[i].y);
									enemy[i].vx = enemy[i].vx ? (enemy[i].vx / Math.abs(enemy[i].vx)) * 4 : 0;
									enemy[i].vy = enemy[i].vy ? (enemy[i].vy / Math.abs(enemy[i].vy)) * 4 : 0;
									enemy[i].isMoving = true;
								}
							// 攻撃フェーズ
							} else if (enemy[i].phase == "Attack") {
								// プレイヤーとの接触判定
								if (BeAround(enemy[i].x, enemy[i].y)) {
									game.assets["sound/attack.wav"].volume = 0.3;
									game.assets["sound/attack.wav"].play();
								}
								enemy[i].delMoveScope();
								enemy[i].start = false;
								enemy[i].isAttack = false;
								// まだ行動していない敵がいるか
								if (enemy.length != i + 1) {
									enemy[i + 1].phase = "Move";
								} else {
									this.phase = "Player";
								}
							}
						}
					}
				}
			}
		});
	}
	game.start();
}

function BeAround(rx, ry) {
	var result = false;

	for (var i = 1; i < around.length; i = i + 2) {
		// 対象を中心とした４方向の絶対座標
		var x = rx + around[i][0];
		var y = ry + around[i][1];

		if (x == player.x && y == player.y) {
			result = true;
		}
	}

	return result;
}
