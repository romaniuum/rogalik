function Game() {
    this.map = [];
    this.player = null;
    this.enemies = [];
    this.inventory = [];
}

Game.prototype.init = function() {
    this.generateMap();
    this.placeObjects();
    var self = this;
    $(document).keydown(function(event) {
        self.handleKey(event);
    });
    this.render();
};

Game.prototype.generateMap = function() {
    for (var y = 0; y < 24; y++) {
        this.map[y] = [];
        for (var x = 0; x < 40; x++) {
            this.map[y][x] = { type: 'wall', object: null };
        }
    }

    var roomCount = Math.floor(Math.random() * 6) + 5;
    var rooms = [];
    var attempts = 0;

    while (rooms.length < roomCount && attempts < 100) {
        var width = Math.floor(Math.random() * 6) + 3;
        var height = Math.floor(Math.random() * 6) + 3;
        var x = Math.floor(Math.random() * (40 - width + 1));
        var y = Math.floor(Math.random() * (24 - height + 1));
        var newRoom = { x: x, y: y, width: width, height: height };
        var intersects = false;

        for (var j = 0; j < rooms.length; j++) {
            var room = rooms[j];
            if (newRoom.x < room.x + room.width &&
                newRoom.x + newRoom.width > room.x &&
                newRoom.y < room.y + room.height &&
                newRoom.y + newRoom.height > room.y) {
                intersects = true;
                break;
            }
        }

        if (!intersects) {
            for (var ry = y; ry < y + height; ry++) {
                for (var rx = x; rx < x + width; rx++) {
                    this.map[ry][rx].type = 'floor';
                }
            }
            rooms.push(newRoom);
            if (rooms.length > 1) {
                var randomIndex = Math.floor(Math.random() * (rooms.length - 1));
                var prevRoom = rooms[randomIndex];
                var cx1 = Math.floor(newRoom.x + newRoom.width / 2);
                var cy1 = Math.floor(newRoom.y + newRoom.height / 2);
                var cx2 = Math.floor(prevRoom.x + prevRoom.width / 2);
                var cy2 = Math.floor(prevRoom.y + prevRoom.height / 2);

                for (var px = Math.min(cx1, cx2); px <= Math.max(cx1, cx2); px++) {
                    this.map[cy1][px].type = 'floor';
                }
                for (var py = Math.min(cy1, cy2); py <= Math.max(cy1, cy2); py++) {
                    this.map[py][cx2].type = 'floor';
                }
            }
        }
        attempts++;
    }

    this.generateCorridors();
};

Game.prototype.generateCorridors = function() {
    var horizontalCount = Math.floor(Math.random() * 3) + 3;
    for (var i = 0; i < horizontalCount; i++) {
        var y = Math.floor(Math.random() * 24);
        for (var x = 0; x < 40; x++) {
            if (this.map[y][x].object === null) {
                this.map[y][x].type = 'floor';
            }
        }
    }

    var verticalCount = Math.floor(Math.random() * 3) + 3;
    for (var i = 0; i < verticalCount; i++) {
        var x = Math.floor(Math.random() * 40);
        for (var y = 0; y < 24; y++) {
            if (this.map[y][x].object === null) {
                this.map[y][x].type = 'floor';
            }
        }
    }
};

Game.prototype.placeObjects = function() {
    var emptyCells = this.getEmptyCells();
    emptyCells.sort(function() { return Math.random() - 0.5; });

    var playerPos = emptyCells.pop();
    this.player = {
        x: playerPos.x,
        y: playerPos.y,
        health: 100,
        maxHealth: 100,
        attack: 10
    };
    this.map[playerPos.y][playerPos.x].object = 'player';

    for (var i = 0; i < 10; i++) {
        var pos = emptyCells.pop();
        var enemy = { x: pos.x, y: pos.y, health: 100, attack: 10 };
        this.enemies.push(enemy);
        this.map[pos.y][pos.x].object = 'enemy';
    }

    for (var i = 0; i < 2; i++) {
        var pos = emptyCells.pop();
        this.map[pos.y][pos.x].object = 'sword';
    }

    for (var i = 0; i < 10; i++) {
        var pos = emptyCells.pop();
        this.map[pos.y][pos.x].object = 'health';
    }
};

Game.prototype.getEmptyCells = function() {
    var cells = [];
    for (var y = 0; y < 24; y++) {
        for (var x = 0; x < 40; x++) {
            if (this.map[y][x].type === 'floor' && this.map[y][x].object === null) {
                cells.push({ x: x, y: y });
            }
        }
    }
    return cells;
};

Game.prototype.render = function() {
    var $field = $('.field');
    $field.empty();

    for (var y = 0; y < 24; y++) {
        for (var x = 0; x < 40; x++) {
            var $tile = $('<div>').addClass('tile');
            if (this.map[y][x].type === 'wall') {
                $tile.addClass('tileW');
            } else if (this.map[y][x].object === 'player') {
                $tile.addClass('tileP');
                var $health = $('<div>').addClass('health').css('width', (this.player.health / this.player.maxHealth * 100) + '%');
                $tile.append($health);
            } else if (this.map[y][x].object === 'enemy') {
                $tile.addClass('tileE');
                var enemy = null;
                for (var i = 0; i < this.enemies.length; i++) {
                    if (this.enemies[i].x === x && this.enemies[i].y === y) {
                        enemy = this.enemies[i];
                        break;
                    }
                }
                if (enemy) {
                    var $health = $('<div>').addClass('health').css('width', (enemy.health / 100 * 100) + '%');
                    $tile.append($health);
                }
            } else if (this.map[y][x].object === 'sword') {
                $tile.addClass('tileSW');
            } else if (this.map[y][x].object === 'health') {
                $tile.addClass('tileHP');
            }
            $tile.css({
                left: (x * 50) + 'px',
                top: (y * 50) + 'px'
            });
            $field.append($tile);
        }
    }
    this.renderInventory();
};

Game.prototype.renderInventory = function() {
    var $slots = $('.inventory-slot');
    $slots.each(function(i) {
        $(this).empty();
        if (this.inventory[i]) {
            var $item = $('<div>').addClass('tile');
            if (this.inventory[i] === 'sword') {
                $item.addClass('tileSW');
            } else if (this.inventory[i] === 'health') {
                $item.addClass('tileHP');
            }
            $(this).append($item);
        }
    }.bind(this));
};

Game.prototype.handleKey = function(event) {
    var move = { x: 0, y: 0 };

    if (event.key === 'ArrowUp') {
        move.y = -1;
    } else if (event.key === 'ArrowDown') {
        move.y = 1;
    } else if (event.key === 'ArrowLeft') {
        move.x = -1;
    } else if (event.key === 'ArrowRight') {
        move.x = 1;
    }

    if (move.x !== 0 || move.y !== 0) {
        var newX = this.player.x + move.x;
        var newY = this.player.y + move.y;
        if (this.map[newY] && this.map[newY][newX] && this.map[newY][newX].type !== 'wall') {
            this.map[this.player.y][this.player.x].object = null;
            this.player.x = newX;
            this.player.y = newY;
            this.map[this.player.y][this.player.x].object = 'player';
            this.render();
        }
    }
};
