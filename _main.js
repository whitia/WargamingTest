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
		this.opacity = 1;
		this.walk = 1;
		this.direction = 0;
		this.vx = this.vy = 0;
		this.completed = false;
		this.isMoving = false;
		this.isAttack = false;
		this.phase = "Move";

		// 固有の移動範囲
		this.moveScope = [
			new Scope("Move"), new Scope("Move"), new Scope("Move"),
			new Scope("Move"), new Scope("Move"), new Scope("Move"),
			new Scope("Move"), new Scope("Move"), new Scope("Move")
		];

		// 固有の攻撃範囲
		this.attackScope = [
			new Scope("Attack"), new Scope("Attack"), new Scope("Attack"),
			new Scope("Attack"), new Scope("Attack"), new Scope("Attack"),
			new Scope("Attack"), new Scope("Attack"), new Scope("Attack")
		];

		fieldScene.addChild(this);
	},
	onenterframe: function() {
		if (!(this.phase == "Action")) {
			this.frame = this.direction * 3 + this.walk;
			if (!(game.frame % 5)) {
				this.walk++;
				this.walk %= 3;
			}
		}
	},
	setMoveField: function() {
		fieldScene.removeChild(this);

		for (var i = 0; i < this.moveScope.length; i++) {
			// 対象を中心とした９方向の絶対座標
			var x = this.x + around[i][0];
			var y = this.y + around[i][1];

			var isEnemy = true;
			for (var j = 0; j < enemy.length; j++) {
				if (x == enemy[j].x && y == enemy[j].y) {
					isEnemy = false;
				}
			}

			// 移動可能なら移動範囲を設定
			if (0 <= x && x < baseMap.width				// X軸の画面内判定
					&& 0 <= y && y < baseMap.height		// Y軸の画面内判定
					&& !baseMap.hitTest(x, y)			// マップとの衝突判定
					&& isEnemy) {						// 敵との衝突判定
				this.moveScope[i].x = x;
				this.moveScope[i].y = y;

				fieldScene.addChild(this.moveScope[i]);
			}
		}

		fieldScene.addChild(this);
	},
	delMoveField: function() {
		for (var i = 0; i < this.moveScope.length; i++) {
			this.moveScope[i].moveTo(-64, -64);
			fieldScene.removeChild(this.moveScope[i]);
		}
	},
	setAttackField: function() {
		for (var i = 0; i < enemy.length; i++) {
			fieldScene.removeChild(enemy[i]);
		}

		for (var i = 1; i < this.attackScope.length; i = i + 2) {
			// 対象を中心とした４方向の絶対座標
			var x = this.x + around[i][0];
			var y = this.y + around[i][1];

			this.attackScope[i].x = x;
			this.attackScope[i].y = y;

			fieldScene.addChild(this.attackScope[i]);
		}

		for (var i = 0; i < enemy.length; i++) {
			fieldScene.addChild(enemy[i]);
		}
	},
	delAttackField: function() {
		for (var i = 1; i < this.attackScope.length; i = i + 2) {
			this.attackScope[i].moveTo(-64, -64);
			fieldScene.removeChild(this.attackScope[i]);
		}
	},
	finalize: function() {
		this.walk = 1;
		this.delMoveField();
		this.delAttackField();
		this.completed = false;
		this.isAttack = false;
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
		this.vx = this.vy = 0;
		this.completed = false;
		this.isMoving = false;
		this.isAttack = false;
		this.phase = "Wait";
		// HP：8～11
		this.hp = Math.floor(8 + Math.random() * 11);

		// 固有の移動範囲
		this.moveScope = [
			new Scope("Move"), new Scope("Move"), new Scope("Move"),
			new Scope("Move"), new Scope("Move"), new Scope("Move"),
			new Scope("Move"), new Scope("Move"), new Scope("Move")
		];

		fieldScene.addChild(this);
	},
	onenterframe: function() {
		this.frame = this.direction * 3 + this.walk;

		if (!(game.frame % 5)) {
			this.walk++;
			this.walk %= 3;
		}
	},
	setMoveField: function() {
		fieldScene.removeChild(this);

		for (var i = 0; i < around.length; i++) {
			// 対象を中心とした９方向の絶対座標
			var x = this.x + around[i][0];
			var y = this.y + around[i][1];

			// 敵との接触判定
			var isEnemy = true;
			for (var j = 0; j < enemy.length; j++) {
				if (x == enemy[j].x && y == enemy[j].y) {
					// 自分は例外
					if (!(this.x == enemy[j].x && this.y == enemy[j].y)) {
						isEnemy = false;
					}
				}
			}

			// 移動可能なら移動範囲を設定
			if (0 <= x && x < baseMap.width				// X軸の画面内判定
					&& 0 <= y && y < baseMap.height		// Y軸の画面内判定
					&& !baseMap.hitTest(x, y)			// マップとの衝突判定
					&& (x != player.x || y != player.y)	// プレイヤーとの衝突判定
					&& isEnemy) {						// 敵との衝突判定
				this.moveScope[i].x = x;
				this.moveScope[i].y = y;

				fieldScene.addChild(this.moveScope[i]);
			}
		}

		fieldScene.addChild(this);
	},
	delMoveField: function() {
		for (var i = 0; i < this.moveScope.length; i++) {
			this.moveScope[i].moveTo(-64, -64);
			fieldScene.removeChild(this.moveScope[i]);
		}
	},
	beAround: function(vx, vy) {
		var result = false;

		for (var i = 1; i < around.length; i = i + 2) {
			// 対象を中心とした４方向の絶対座標
			var x = this.x + vx + around[i][0];
			var y = this.y + vy + around[i][1];

			if (x == player.x && y == player.y) {
				result = true;
			}
		}

		return result;
	},
	finalize: function() {
		this.delMoveField();
		this.completed = false;
		this.isAttack = false;
	}
});

var Scope = Class.create(Entity, {
	initialize: function(type) {
		Entity.call(this);

		this.width = 32;
		this.height = 32;
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
	game = new Game(320, 320);	// グローバル変数として宣言
	game.fps = 30;
	game.preload("img/chara5.png", "img/chara6.png", "img/map1.png", "sound/slash.wav", "sound/attack.wav", "img/mon_192.gif");
	game.keybind(88, 'x');
	game.keybind(90, 'z');
	game.phase = "Player";

	game.onload = function() {
		fieldScene = new Scene();
		game.replaceScene(fieldScene);

		// 攻撃モーション中の背景（全体）
		isAttackBase = new Entity();
		isAttackBase.width = 320;
		isAttackBase.height = 320;
		isAttackBase.opacity = 0.7;
		isAttackBase.backgroundColor = "#000";

		// 攻撃モーション中の背景（帯）
		isAttackBelt = new Entity();
		isAttackBelt.width = 320;
		isAttackBelt.height = 70;
		isAttackBelt.opacity = 0.7;
		isAttackBelt.moveTo(0, 90);
		isAttackBelt.backgroundColor = "#9c0";

		// マップ
		baseMap = new Map(16, 16);
		baseMap.image = game.assets["img/map1.png"];
		baseMap.loadData([
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[ 49, 49, 49, 49, 49, 49, 49, 49,330,330,330,330,330,330, 49, 49, 49, 49, 49, 49],
			[ 79, 79, 79, 79, 79, 79, 79, 79,186,187,187,187,187,188, 79, 79, 79, 79, 79, 79],
			[120,120,120,120,120,120,120,120,186,187,187,187,187,188,120,120,120,120,120,120],
			[120,120,120,120,120,120,120,120,186,187,187,187,187,188,120,120,120,120,120,120],
			[120,120,120,120,120,120,120,120,186,187,187,187,187,188,120,120,120,120,120,120],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330],
			[330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330,330]
		]);
		baseMap.collisionData = [
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
			[  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
			[  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
		];
		fieldScene.addChild(baseMap);

		foregroundMap = new Map(16, 16);
		foregroundMap.image = game.assets["img/map1.png"];
		foregroundMap.loadData([
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,356,357,358,359],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,386,387,388,389],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,416,417,418,419],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,446,447,448,449],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,476,477,478,479],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[358,359, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[388,389, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[418,419, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[448,449, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[478,479, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
		]);
		fieldScene.addChild(foregroundMap);

		// プレイヤー
		player = new Player(5, 4);

		// 敵
		enemy = [
			new Enemy(5, 6)
		];

		// キャプション
		notes1 = new Label("方向キー：移動・選択");
		notes1.color = "#fff";
		notes1.font = "ＭＳ ゴシック";
		notes1.moveTo(0, 0);
		fieldScene.addChild(notes1);

		notes2 = new Label("Zキー：決定");
		notes2.color = "#fff";
		notes2.font = "ＭＳ ゴシック";
		notes2.moveTo(0, 10);
		fieldScene.addChild(notes2);

		notes3 = new Label("Xキー：キャンセル");
		notes3.color = "#fff";
		notes3.font = "ＭＳ ゴシック";
		notes3.moveTo(0, 20);
		fieldScene.addChild(notes3);

		// プレイヤーアバター
		playerAvatar = new Avatar("1:1:1:2002:2110:2211");
		playerAvatar.left();
		playerAvatar.moveTo(180, 100);

		// 敵アバター
		enemyAvatar = new Sprite(48, 48);
		enemyAvatar.moveTo(80, 105);
		enemyAvatar.image = game.assets["img/mon_192.gif"];

		// フレーム毎のイベント処理
		game.addEventListener("enterframe", function() {
			// プレイヤーフェーズ
			if (this.phase == "Player") {
				// フェーズ開始時
				if (!player.completed) {
					player.setMoveField();
					player.completed = true;
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
								player.delMoveField();
								player.setAttackField();
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
									if (x == player.moveScope[i].x && y == player.moveScope[i].y) {
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
								fieldScene.removeChild(isAttackBase);
								fieldScene.removeChild(isAttackBelt);
								fieldScene.removeChild(enemyAvatar);
								fieldScene.removeChild(playerAvatar);
								// 攻撃フェーズ終了
								player.finalize();
							}
						} else {
							// 方向キー入力待ち
							if (this.input.down) {
								player.attackScope[1].opacity = 0.3;
								player.attackScope[3].opacity = 0.3;
								player.attackScope[5].opacity = 0.3;
								player.attackScope[7].opacity = 0.5;
								player.direction = 0;
								player.frame = player.direction * 3 + player.walk;
							} else if (this.input.left) {
								player.attackScope[1].opacity = 0.3;
								player.attackScope[3].opacity = 0.5;
								player.attackScope[5].opacity = 0.3;
								player.attackScope[7].opacity = 0.3;
								player.direction = 1;
								player.frame = player.direction * 3 + player.walk;
							} else if (this.input.right) {
								player.attackScope[1].opacity = 0.3;
								player.attackScope[3].opacity = 0.3;
								player.attackScope[5].opacity = 0.5;
								player.attackScope[7].opacity = 0.3;
								player.direction = 2;
								player.frame = player.direction * 3 + player.walk;
							} else if (this.input.up) {
								player.attackScope[1].opacity = 0.5;
								player.attackScope[3].opacity = 0.3;
								player.attackScope[5].opacity = 0.3;
								player.attackScope[7].opacity = 0.3;
								player.direction = 3;
								player.frame = player.direction * 3 + player.walk;
							// Zキー入力待ち
							} else if (this.input.z) {
								for (var i = 1; i < player.attackScope.length; i = i + 2) {
									for (var j = 0; j < enemy.length; j++) {
										if (player.attackScope[i].opacity == 0.5				// 攻撃方向を選択しているか
												&& player.attackScope[i].x == enemy[j].x		// X座標に敵がいるか
												&& player.attackScope[i].y == enemy[j].y) {		// Y座標に敵がいるか
											// 攻撃範囲の表示をリセット
											player.attackScope[1].opacity = 0.3;
											player.attackScope[3].opacity = 0.3;
											player.attackScope[5].opacity = 0.3;
											player.attackScope[7].opacity = 0.3;
											// 攻撃モーション準備
											fieldScene.addChild(isAttackBase);
											fieldScene.addChild(isAttackBelt);
											fieldScene.addChild(enemyAvatar);
											fieldScene.addChild(playerAvatar);
											// 現在のフレームを取得
											this.vFrame = this.frame;
											player.isAttack = true;
										}
									}
								}
							// Xキー入力待ち
							} else if (this.input.x) {
								// 攻撃範囲の表示をリセット
								player.attackScope[1].opacity = 0.3;
								player.attackScope[3].opacity = 0.3;
								player.attackScope[5].opacity = 0.3;
								player.attackScope[7].opacity = 0.3;
								// 攻撃フェーズ終了
								player.delAttackField();
								player.setMoveField();
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
						if (!enemy[i].completed) {
							enemy[i].setMoveField();
							enemy[i].completed = true;
						} else {
							// 移動フェーズ
							if (enemy[i].phase == "Move") {
								// 既にプレイヤーと接近していたら攻撃フェーズへ移行
								if (enemy[i].beAround(0, 0)) {
									enemy[i].isMoving = false;
									enemy[i].phase = "Attack";
								} else {
									// 移動モーション中か
									if (enemy[i].isMoving) {
										// X軸方向の移動
										if (enemy[i].vx) {
											enemy[i].moveBy(enemy[i].vx, 0);
											// X軸方向に１マス進んだら移動終了
											if ((enemy[i].vx && !(enemy[i].x % 32))) {
												enemy[i].vx = 0;
											}
										// Y軸方向の移動
										} else if (enemy[i].vy) {
											enemy[i].moveBy(0, enemy[i].vy);
											// Y軸方向に１マス進んだら移動終了
											if ((enemy[i].vy && !(enemy[i].y % 32))) {
												enemy[i].vy = 0;
											}
										}
										// X軸方向・Y軸方向に移動終了したか
										if (!enemy[i].vx && !enemy[i].vy) {
											enemy[i].isMoving = false;
											enemy[i].phase = "Attack";
										}
									} else {
										// X軸方向の移動判定
										if (enemy[i].x > player.x) {
											enemy[i].vx = -4;
										} else if (enemy[i].x < player.x) {
											enemy[i].vx = 4;
										}
										// Y軸方向の移動判定
										if (enemy[i].y > player.y) {
											enemy[i].vy = -4;
										} else if (enemy[i].y < player.y) {
											enemy[i].vy = 4;
										}
										if (enemy[i].vx || enemy[i].vy) {
											// 進む先の座標
											var x = enemy[i].x + (enemy[i].vx ? enemy[i].vx / Math.abs(enemy[i].vx) * 32 : 0);
											var y = enemy[i].y + (enemy[i].vy ? enemy[i].vy / Math.abs(enemy[i].vy) * 32 : 0);
											// 移動可能か
											for (var j = 0; j < enemy[i].moveScope.length; j++) {
												if (x == enemy[i].moveScope[j].x && y == enemy[i].moveScope[j].y) {
													enemy[i].isMoving = true;
												}
											}
											// 移動先が移動不可の場合
											if (!enemy[i].isMoving) {

											}
										}
									}
								}
							// 攻撃フェーズ
							} else if (enemy[i].phase == "Attack") {
								// 攻撃モーション中か
								if (enemy[i].isAttack) {
									// 攻撃モーションに入ってからの経過フレームでエフェクトを順番に実行
									if (this.frame == this.vFrame + 5) {
										game.assets["sound/attack.wav"].volume = 0.3;
										game.assets["sound/attack.wav"].play();
									} else if (this.frame == this.vFrame + 30) {
										fieldScene.removeChild(isAttackBase);
										fieldScene.removeChild(isAttackBelt);
										fieldScene.removeChild(enemyAvatar);
										fieldScene.removeChild(playerAvatar);
										// 行動中の敵を待機状態にする
										enemy[i].phase = "Wait";
										// 行動待ちの敵がいる場合、次の敵を行動可能にする
										if (enemy.length != i + 1) {
											enemy[i].finalize();
											enemy[i + 1].phase = "Move";
										} else {
											// 敵フェーズ終了
											enemy[i].finalize();
											game.phase = "Player";
										}
									}
								} else {
									// 攻撃モーション準備
									fieldScene.addChild(isAttackBase);
									fieldScene.addChild(isAttackBelt);
									fieldScene.addChild(enemyAvatar);
									fieldScene.addChild(playerAvatar);
									// 現在のフレームを取得
									this.vFrame = this.frame;
									enemy[i].isAttack = true;
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
