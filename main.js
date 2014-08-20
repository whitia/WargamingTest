/**
 * whitia
 */

enchant();

/**
 * ９方向の相対座標と対応するプレイヤーの向き
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

        this.image = game.assets['img/chara5.png'];
        this.x = x * 32;
        this.y = y * 32;
        this.walk = 1;
        this.direction = 0;
        this.completed = false;
        this.isMoving = false;
        this.isAttack = false;

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

        game.rootScene.addChild(this);
    },
    onenterframe: function() {
        if (!this.isAttack) {
            this.frame = this.direction * 9 + this.walk;
            if (!(game.frame % 4)) {
                this.walk++;
                this.walk %= 3;
            }
        } else {
            this.walk = 1;
        }
    },
    setMoveField: function() {
        game.rootScene.removeChild(this);

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
                this.moveScope[i].x = this.x + around[i][0];
                this.moveScope[i].y = this.y + around[i][1];
        
                game.rootScene.addChild(this.moveScope[i]);
            }
        }

        game.rootScene.addChild(this);
        this.completed = true;
    },
    delMoveField: function() {
        for (var i = 0; i < this.moveScope.length; i++) {
            this.moveScope[i].moveTo(-64, -64);
            game.rootScene.removeChild(this.moveScope[i]);
        }
    },
    setAttackField: function() {
        for (var i = 0; i < enemy.length; i++) {
            game.rootScene.removeChild(enemy[i]);
        }

        for (var i = 1; i < this.attackScope.length; i = i + 2) {
            // 対象を中心とした４方向の絶対座標
            var x = this.x + around[i][0];
            var y = this.y + around[i][1];

            this.attackScope[i].x = this.x + around[i][0];
            this.attackScope[i].y = this.y + around[i][1];
        
            game.rootScene.addChild(this.attackScope[i]);
        }

        for (var i = 0; i < enemy.length; i++) {
            game.rootScene.addChild(enemy[i]);
        }
    },
    delAttackField: function() {
        for (var i = 1; i < this.attackScope.length; i = i + 2) {
            this.attackScope[i].moveTo(-64, -64);
            game.rootScene.removeChild(this.attackScope[i]);
        }
    },
    move: function(vx, vy, direction) {
        this.tl.then(function() {
            this.isMoving = true;
            this.direction = direction;
        });

        // 進む先の座標を取得
        var x = this.x + (vx ? vx / Math.abs(vx) * 32 : 0);
        var y = this.y + (vy ? vy / Math.abs(vy) * 32 : 0);

        // 移動可能か
        for (var i = 0; i < this.moveScope.length; i++) {
            if (x == this.moveScope[i].x && y == this.moveScope[i].y) {
                this.tl.moveBy(vx, vy, 8);
            }
        }

        this.tl.then(function() {
            this.isMoving = false;
        })
    },
    attack: function(index) {
        for (var i = 0; i < enemy.length; i++) {
            if (this.attackScope[index].x == enemy[i].x
                    && this.attackScope[index].y == enemy[i].y) {
                // プレイヤーのエフェクト
                this.tl.delay(0)
                    .then(function() {
                        game.assets['sound/slash.wav'].volume = 0.3;
                        game.assets['sound/slash.wav'].play();
                    })
                    .then(function() {
                        this.frame = this.direction * 9 + 6;
                    })
                    .delay(3)
                    .then(function() {
                        this.frame = this.direction * 9 + 7;
                    })
                    .delay(3)
                    .then(function() {
                        this.frame = this.direction * 9 + 8;
                    })
                    .then(function() {
                        this.delAttackField();
                        player.completed = false;
                        player.isAttack = false;
                        game.hasTurned = "Enemy";
                    });

                // 敵のエフェクト
                enemy[i].hp -= 10;
                damage = new Label('10');
                damage.color = '#fff';
                damage.moveTo(enemy[i].x + 8, enemy[i].y);
                game.rootScene.addChild(damage);
                damage.tl.delay(10)
                    .then(function() {
                        game.rootScene.removeChild(damage);
                    });
                // if (enemy[i].hp <= 0) {
                //     enemy[i].moveTo(-64, -64);
                //     game.rootScene.removeChild(enemy[i]);
                // }
            }
        }
    }
});

var Enemy = Class.create(Sprite, {
    initialize: function(x, y) {
        Sprite.call(this, 32, 32);

        this.image = game.assets['img/chara6.png'];
        this.x = x * 32;
        this.y = y * 32;
        this.walk = 1;
        this.direction = 0;
        this.completed = false;
        this.isMoving = false;
        this.isAttack = false;
        // HP：8～11
        this.hp = Math.floor(8 + Math.random() * 11);

        // 固有の移動範囲
        this.moveScope = [
            new Scope("Move"), new Scope("Move"), new Scope("Move"),
            new Scope("Move"), new Scope("Move"), new Scope("Move"),
            new Scope("Move"), new Scope("Move"), new Scope("Move")
        ];

        game.rootScene.addChild(this);
    },
    onenterframe: function() {
        this.frame = this.direction * 3 + this.walk;

        if (!(game.frame % 4)) {
            this.walk++;
            this.walk %= 3;
        }
    },
    setMoveField: function() {
        game.rootScene.removeChild(this);

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
                this.moveScope[i].x = this.x + around[i][0];
                this.moveScope[i].y = this.y + around[i][1];
        
                game.rootScene.addChild(this.moveScope[i]);
            }
        }

        game.rootScene.addChild(this);
        this.completed = true;
    },
    delMoveField: function() {
        for (var i = 0; i < this.moveScope.length; i++) {
            this.moveScope[i].moveTo(-64, -64);
            game.rootScene.removeChild(this.moveScope[i]);
        }
    },
    move: function(relX, relY, direction) {
        this.tl.then(function() {
            this.isMoving = true;
            this.direction = direction;
        });

        // 進む先の絶対座標を取得
        var absX = this.x + (relX ? relX / Math.abs(relX) * 32 : 0);
        var absY = this.y + (relY ? relY / Math.abs(relY) * 32 : 0);

        // 移動可能か
        for (var i = 0; i < this.moveScope.length; i++) {
            if (absX == this.moveScope[i].x && absY == this.moveScope[i].y) {
                this.tl.moveBy(relX, 0, 8).moveBy(0, relY, 8);
            }
        }

        this.tl.then(function() {
            this.isAttack = true;
            this.isMoving = false;
        });
    },
    attack: function() {
        for (var i = 1; i < around.length; i = i + 2) {
            // 対象を中心とした４方向の絶対座標
            var x = this.x + around[i][0];
            var y = this.y + around[i][1];

            if (x == player.x && y == player.y) {
                // 効果音
                game.assets['sound/attack.wav'].volume = 0.3;
                game.assets['sound/attack.wav'].play();

                this.delMoveField();
                this.completed = false;
                this.isAttack = false;
                game.hasTurned = "Player";
            }
        }
    },
    beAround: function(vx, vy) {
        // プレイヤーとの接触判定
        var result = false;
        for (var j = 1; j < around.length; j = j + 2) {
            // 対象を中心とした４方向の絶対座標
            var x = this.x + vx + around[j][0];
            var y = this.y + vy + around[j][1];

            if (x == player.x && y == player.y) {
                result = true;
            }
        }
        return result;
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
    game.preload('img/chara5.png', 'img/chara6.png', 'img/map1.png', 'sound/slash.wav', 'sound/attack.wav');
    game.keybind(88, 'x');
    game.keybind(90, 'z');
    game.hasTurned = "Player";

    game.onload = function() {
        // マップ
        baseMap = new Map(16, 16);
        baseMap.image = game.assets['img/map1.png'];
        baseMap.loadData([
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,101,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,101,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,101,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,101,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,101,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,101,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 99,100, 84, 84, 84, 84, 84, 84],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,115,116,116,116,116,116,116,116],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [ 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
            [ 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33],
            [ 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33],
            [ 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33]
        ]);
        baseMap.collisionData = [
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
            [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0],
            [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0],
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
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
            [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1]
        ];
        game.rootScene.addChild(baseMap);

        foregroundMap = new Map(16, 16);
        foregroundMap.image = game.assets['img/map1.png'];
        foregroundMap.loadData([
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, 60, 61, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, 76, 77, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ 60, 61, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 60, 61, -1, -1],
            [ 76, 77, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 76, 77, 28, 28],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ 28, 28, 28, 28, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],  
            [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
        ]);
        game.rootScene.addChild(foregroundMap);

        // 敵
        enemy = [
            // new Enemy(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)),
            // new Enemy(2, 3),
            // new Enemy(6, 1),
            // new Enemy(8, 7),
            // new Enemy(1, 6),
            new Enemy(5, 4)
        ];

        // プレイヤー
        player = new Player(5, 2);

        // キャプション
        caption1 = new Label("方向キー：移動・選択");
        caption1.color = '#fff';
        caption1.font = "'ＭＳ ゴシック'";
        caption1.moveTo(0, 0);
        game.rootScene.addChild(caption1);
        caption2 = new Label("Zキー：決定");
        caption2.color = '#fff';
        caption2.font = "'ＭＳ ゴシック'";
        caption2.moveTo(0, 10);
        game.rootScene.addChild(caption2);
        caption2 = new Label("Xキー：キャンセル");
        caption2.color = '#fff';
        caption2.font = "'ＭＳ ゴシック'";
        caption2.moveTo(0, 20);
        game.rootScene.addChild(caption2);

        // フレーム毎のイベント処理
        game.addEventListener('enterframe', function() {
            if (this.hasTurned == "Player") {
                player.opacity = 1;
                for (var i = 0; i < enemy.length; i++) {
                    enemy[i].opacity = 0.3;
                }

                // 移動範囲の設定
                if (!player.completed) {
                    player.setMoveField();
                } else {
                    // 移動フェーズ
                    if (!player.isMoving && !player.isAttack && !player.isTurnend) {
                        if (this.input.down) {
                            player.move(0, 32, 0);
                        } else if (this.input.left) {
                            player.move(-32, 0, 1);
                        } else if (this.input.right) {
                            player.move(32, 0, 2);
                        } else if (this.input.up) {
                            player.move(0, -32, 3);
                        } else if (this.input.z) {
                            player.delMoveField();
                            player.setAttackField();
                            player.isAttack = true;
                        } else if (this.input.x) {
                            player.delMoveField();
                            player.completed = false;
                            player.isAttack = false;
                            this.hasTurned = "Enemy";
                        }
                    }

                    // 攻撃フェーズ
                    if (!player.isMoving && player.isAttack) {
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
                            player.direction = 1;
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
                            player.direction = 3;
                            player.frame = player.direction * 9 + player.walk;
                        } else if (this.input.z) {
                            for (var i = 1; i < player.attackScope.length; i = i + 2) {
                                if (player.attackScope[i].opacity == 0.5) {
                                    player.attackScope[1].opacity = 0.3;
                                    player.attackScope[3].opacity = 0.3;
                                    player.attackScope[5].opacity = 0.3;
                                    player.attackScope[7].opacity = 0.3;
                                    player.attack(i);
                                }
                            }
                        } else if (this.input.x) {
                            player.attackScope[1].opacity = 0.3;
                            player.attackScope[3].opacity = 0.3;
                            player.attackScope[5].opacity = 0.3;
                            player.attackScope[7].opacity = 0.3;
                            player.delAttackField();
                            player.setMoveField();
                            player.isAttack = false;
                        }
                    }
                }
            } else if (this.hasTurned == "Enemy") {
                player.opacity = 0.3;
                for (var i = 0; i < enemy.length; i++) {
                    enemy[i].opacity = 1;

                    // 移動範囲の設定
                    if (!enemy[i].completed) {
                        enemy[i].setMoveField();
                    } else {
                        // 移動フェーズ
                        if (!enemy[i].isMoving && !enemy[i].isAttack) {
                            vx = vy = 0;
                            // X軸
                            if (enemy[i].x < player.x) {
                                vx = 32;
                            } else if (enemy[i].x > player.x) {
                                vx = -32
                            }
                            // Y軸
                            if (enemy[i].y < player.y && !enemy[i].beAround(vx, vy)) {
                                vy = 32;
                            } else if (enemy[i].y > player.y && !enemy[i].beAround(vx, vy)) {
                                vy = -32;
                            }
                            enemy[i].move(vx, vy, 0);
                        }

                        // 攻撃フェーズ
                        if (!enemy[i].isMoving && enemy[i].isAttack) {
                            if (enemy[i].beAround(0, 0)) {
                                enemy[i].attack();
                            } else {
                                enemy[i].delMoveField();
                                enemy[i].completed = false;
                                enemy[i].isAttack = false;
                                game.hasTurned = "Player";
                            }
                        }
                    }
                }
            }
        });
    }
    game.start();
}