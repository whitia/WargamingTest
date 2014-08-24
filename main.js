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
            this.frame = this.direction * 9 + this.walk;
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
            if (0 <= x && x < baseMap.width             // X軸の画面内判定
                    && 0 <= y && y < baseMap.height     // Y軸の画面内判定
                    && !baseMap.hitTest(x, y)           // マップとの衝突判定
                    && isEnemy) {                       // 敵との衝突判定
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
    attackScene: function() {
        fieldScene.addChild(attackPhaseBack);
        fieldScene.addChild(attackPhaseField);

        enemyAvatar = new Sprite(48, 48);
        enemyAvatar.moveTo(40, 105);
        enemyAvatar.image = game.assets["img/mon_192.gif"];
        fieldScene.addChild(enemyAvatar);

        playerAvatar = new Avatar("1:1:4:2002:21011:2211");
        playerAvatar.left();
        playerAvatar.moveTo(210, 100);
        fieldScene.addChild(playerAvatar);

        // game.assets["sound/slash.wav"].volume = 0.3;
        // game.assets["sound/slash.wav"].play();
        playerAvatar.action = "attack";

        // this.phaseEnd();
    },
    phaseEnd: function() {
        this.opacity = 0.3;
        this.walk = 1;
        this.delMoveField();
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
        this.opacity = 0.3;
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
            if (0 <= x && x < baseMap.width             // X軸の画面内判定
                    && 0 <= y && y < baseMap.height     // Y軸の画面内判定
                    && !baseMap.hitTest(x, y)           // マップとの衝突判定
                    && (x != player.x || y != player.y) // プレイヤーとの衝突判定
                    && isEnemy) {                       // 敵との衝突判定
                this.moveScope[i].x = x;
                this.moveScope[i].y = y;
        
                fieldScene.addChild(this.moveScope[i]);
            }
        }

        fieldScene.addChild(this);
        this.completed = true;
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
    phaseEnd: function() {
        this.opacity = 0.3;
        this.delMoveField();
        this.completed = false;
        game.phase = "Player";
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
    game = new Game(320, 320);  // グローバル変数として宣言
    game.fps = 30;
    game.preload("img/chara5.png", "img/chara6.png", "img/map1.png", "sound/slash.wav", "sound/attack.wav", "img/japan_map001.png", "img/mon_192.gif");
    game.keybind(88, 'x');
    game.keybind(90, 'z');
    game.phase = "Player";

    game.onload = function() {
        fieldScene = new Scene();
        game.replaceScene(fieldScene);

        attackPhaseBack = new Entity();
        attackPhaseBack.width = 320;
        attackPhaseBack.height = 320;
        attackPhaseBack.opacity = 0.7;
        attackPhaseBack.backgroundColor = "#000";

        attackPhaseField = new Entity();
        attackPhaseField.width = 320;
        attackPhaseField.height = 70;
        attackPhaseField.opacity = 0.7;
        attackPhaseField.moveTo(0, 90);
        attackPhaseField.backgroundColor = "#9c0";

        // マップ
        baseMap = new Map(16, 16);
        baseMap.image = game.assets["img/map1.png"];
        baseMap.loadData([
            [ 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33],
            [ 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33],
            [ 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33],
            [ 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [ 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84],
            [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
            [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
            [116,116,116,116,116,116,116,116,116,116,116,116,116,100,100,100,100,116,116,116],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100,100,101,  1,  1,  1]
        ]);
        baseMap.collisionData = [
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0],
            [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
        ];
        fieldScene.addChild(baseMap);

        foregroundMap = new Map(32, 32);
        foregroundMap.image = game.assets["img/japan_map001.png"];
        foregroundMap.loadData([
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ 20, 21, -1, -1, -1, -1, -1, -1, -1, -1],
            [ 31, 32, -1, -1, -1, -1, -1, 14, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
        ]);
        fieldScene.addChild(foregroundMap);

        // 敵
        enemy = [
            // new Enemy(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)),
            // new Enemy(2, 3),
            // new Enemy(6, 1),
            // new Enemy(8, 7),
            // new Enemy(1, 6),
            new Enemy(5, 6)
        ];

        // プレイヤー
        player = new Player(5, 4);

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

        // フレーム毎のイベント処理
        game.addEventListener("enterframe", function() {
            if (this.phase == "Player") {
                player.opacity = 1;

                // ターン開始時
                if (!player.completed) {
                    // if (this.frame / 30 > 1) {
                        player.setMoveField();
                        player.completed = true;
                    // }
                } else {
                    // 移動フェーズ
                    if (player.phase == "Move") {
                        if (player.isMoving) {
                            player.moveBy(player.vx, player.vy);
                            if ((player.vx && (player.x % 32) == 0) || (player.vy && (player.y % 32) == 0)) {
                                player.isMoving = false;
                            }
                        } else {
                            player.vx = player.vy = 0;
                            if (this.input.down) {
                                player.direction = 0;
                                player.vy = 4;
                            } else if (this.input.left) {
                                player.direction = 3;
                                player.vx = -4;
                            } else if (this.input.right) {
                                player.direction = 2;
                                player.vx = 4;
                            } else if (this.input.up) {
                                player.direction = 1;
                                player.vy = -4;
                            } else if (this.input.z) {
                                player.delMoveField();
                                player.setAttackField();
                                player.phase = "Attack";
                            } else if (this.input.x) {
                                player.phaseEnd();
                            }
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
                        if (player.isAttack) {
                        } else {
                            if (this.input.down) {
                                player.attackScope[1].opacity = 0.3;
                                player.attackScope[3].opacity = 0.3;
                                player.attackScope[5].opacity = 0.3;
                                player.attackScope[7].opacity = 0.5;
                                player.direction = 0;
                                player.frame = player.direction * 9 + player.walk;
                            } else if (this.input.left) {
                                player.attackScope[1].opacity = 0.3;
                                player.attackScope[3].opacity = 0.5;
                                player.attackScope[5].opacity = 0.3;
                                player.attackScope[7].opacity = 0.3;
                                player.direction = 3;
                                player.frame = player.direction * 9 + player.walk;
                            } else if (this.input.right) {
                                player.attackScope[1].opacity = 0.3;
                                player.attackScope[3].opacity = 0.3;
                                player.attackScope[5].opacity = 0.5;
                                player.attackScope[7].opacity = 0.3;
                                player.direction = 2;
                                player.frame = player.direction * 9 + player.walk;
                            } else if (this.input.up) {
                                player.attackScope[1].opacity = 0.5;
                                player.attackScope[3].opacity = 0.3;
                                player.attackScope[5].opacity = 0.3;
                                player.attackScope[7].opacity = 0.3;
                                player.direction = 1;
                                player.frame = player.direction * 9 + player.walk;
                            } else if (this.input.z) {
                                for (var i = 1; i < player.attackScope.length; i = i + 2) {
                                    for (var j = 0; j < enemy.length; j++) {
                                        if (player.attackScope[i].opacity == 0.5
                                                && player.attackScope[i].x == enemy[j].x
                                                && player.attackScope[i].y == enemy[j].y) {
                                            player.attackScope[1].opacity = 0.3;
                                            player.attackScope[3].opacity = 0.3;
                                            player.attackScope[5].opacity = 0.3;
                                            player.attackScope[7].opacity = 0.3;
                                            player.attackScene();
                                            player.isAttack = true;
                                        }
                                    }
                                }
                            } else if (this.input.x) {
                                player.attackScope[1].opacity = 0.3;
                                player.attackScope[3].opacity = 0.3;
                                player.attackScope[5].opacity = 0.3;
                                player.attackScope[7].opacity = 0.3;
                                player.delAttackField();
                                player.setMoveField();
                                player.phase = "Move";
                            }
                        }
                    }
                }
            } else if (this.phase == "Enemy") {
                for (i = 0; i < enemy.length; i++) {
                    if (enemy[i].phase != "Wait") {
                        enemy[i].opacity = 1;

                        // 移動範囲の設定
                        if (!enemy[i].completed) {
                            enemy[i].setMoveField();
                        } else {
                            // 移動フェーズ
                            if (enemy[i].phase == "Move") {
                                if (enemy[i].beAround(0, 0)) {
                                    enemy[i].isMoving = false;
                                    enemy[i].phase = "Attack";
                                } else {
                                    if (enemy[i].isMoving) {
                                        // X軸
                                        if (enemy[i].vx) {
                                            enemy[i].moveBy(enemy[i].vx, 0);
                                            if ((enemy[i].vx && (enemy[i].x % 32) == 0)) {
                                                enemy[i].vx = 0;
                                            }
                                        // Y軸
                                        } else if (enemy[i].vy) {
                                            enemy[i].moveBy(0, enemy[i].vy);
                                            if ((enemy[i].vy && (enemy[i].y % 32) == 0)) {
                                                enemy[i].vy = 0;
                                            }
                                        }
                                        if (enemy[i].vx == 0 && enemy[i].vy == 0) {
                                            enemy[i].isMoving = false;
                                            enemy[i].phase = "Attack";
                                        }
                                    } else {
                                        // X軸
                                        if (enemy[i].x > player.x) {
                                            enemy[i].vx = -4;
                                        } else if (enemy[i].x < player.x) {
                                            enemy[i].vx = 4;
                                        }
                                        // Y軸
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
                                        }
                                    }
                                }
                            // 攻撃フェーズ
                            } else if (enemy[i].phase == "Attack") {
                                if (enemy[i].beAround(0, 0)) {
                                    game.assets["sound/attack.wav"].volume = 0.3;
                                    game.assets["sound/attack.wav"].play();
                                }
                                enemy[i].phase = "Wait";
                                if (enemy.length != i + 1) {
                                    enemy[i].opacity = 0.3;
                                    enemy[i].delMoveField();
                                    enemy[i].completed = false;
                                    enemy[i + 1].phase = "Move";
                                } else {
                                    enemy[i].phaseEnd();
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
