function Game() {
    this.map = [];
    this.player = null;
    this.enemies = [];
    this.inventory = []; // массис для хранения
}

Game.prototype.init = function() {
    this.generateMap();
    this.placeObjects();
    var self = this;
    document.addEventListener('keydown', function(event) {
        self.handleKey(event);
    });
    this.render();
};

Game.prototype.generateMap = function() {
    // заполнение карты стенами
    for (var y = 0; y < 24; y++) {
        this.map[y] = [];
        for (var x = 0; x < 40; x++) {
            this.map[y][x] = { type: 'wall', object: null };
        }
    }

    // Генерация комнат
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

    // Генерация доп проходов
    this.generateCorridors();
};

Game.prototype.generateCorridors = function() {
    // Генерация 3–5 горизонтальных проходов
    var horizontalCount = Math.floor(Math.random() * 3) + 3;
    for (var i = 0; i < horizontalCount; i++) {
        var y = Math.floor(Math.random() * 24);
        for (var x = 0; x < 40; x++) {
            if (this.map[y][x].object === null) {
                this.map[y][x].type = 'floor';
            }
        }
    }

    // Генерация 3–5 вертикальных проходов
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
    // перемешивание массив
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

    //  враги
    for (var i = 0; i < 10; i++) {
        var pos = emptyCells.pop();
        var enemy = { x: pos.x, y: pos.y, health: 100, attack: 10 };
        this.enemies.push(enemy);
        this.map[pos.y][pos.x].object = 'enemy';
    }
    // мечи
    for (var i = 0; i < 2; i++) {
        var pos = emptyCells.pop();
        this.map[pos.y][pos.x].object = 'sword';
    }
    // хилки
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
    var field = document.querySelector('.field');
    field.innerHTML = '';
    for (var y = 0; y < 24; y++) {
        for (var x = 0; x < 40; x++) {
            var tile = document.createElement('div');
            tile.className = 'tile';
            if (this.map[y][x].type === 'wall') {
                tile.classList.add('tileW');
            } else if (this.map[y][x].object === 'player') {
                tile.classList.add('tileP');
                var health = document.createElement('div');
                health.className = 'health';
                health.style.width = (this.player.health / this.player.maxHealth * 100) + '%';
                tile.appendChild(health);
            } else if (this.map[y][x].object === 'enemy') {
                tile.classList.add('tileE');
                var enemy = null;
                for (var i = 0; i < this.enemies.length; i++) {
                    if (this.enemies[i].x === x && this.enemies[i].y === y) {
                        enemy = this.enemies[i];
                        break;
                    }
                }
                if (enemy) {
                    var health = document.createElement('div');
                    health.className = 'health';
                    health.style.width = (enemy.health / 100 * 100) + '%';
                    tile.appendChild(health);
                }
            } else if (this.map[y][x].object === 'sword') {
                tile.classList.add('tileSW');
            } else if (this.map[y][x].object === 'health') {
                tile.classList.add('tileHP');
            }
            tile.style.left = (x * 50) + 'px';
            tile.style.top = (y * 50) + 'px';
            field.appendChild(tile);
        }
    }
    this.renderInventory();
};

Game.prototype.renderInventory = function() {
    var slots = document.querySelectorAll('.inventory-slot');
    for (var i = 0; i < slots.length; i++) {
        slots[i].innerHTML = '';
        if (this.inventory[i]) {
            var item = document.createElement('div');
            item.className = 'tile';
            if (this.inventory[i] === 'sword') {
                item.classList.add('tileSW');
            } else if (this.inventory[i] === 'health') {
                item.classList.add('tileHP');
            }
            item.style.width = '48px';
            item.style.height = '48px';
            slots[i].appendChild(item);
        }
    }
};

Game.prototype.handleKey = function(event) {
    var dx = 0, dy = 0;
    if (event.code === 'KeyW') {
        dy = -1;
    } else if (event.code === 'KeyS') {
        dy = 1;
    } else if (event.code === 'KeyA') {
        dx = -1;
    } else if (event.code === 'KeyD') {
        dx = 1;
    } else if (event.key === ' ') {
        var directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var i = 0; i < directions.length; i++) {
            var ex = this.player.x + directions[i][0];
            var ey = this.player.y + directions[i][1];
            if (ex >= 0 && ex < 40 && ey >= 0 && ey < 24 && this.map[ey][ex].object === 'enemy') {
                var enemy = null;
                for (var j = 0; j < this.enemies.length; j++) {
                    if (this.enemies[j].x === ex && this.enemies[j].y === ey) {
                        enemy = this.enemies[j];
                        break;
                    }
                }
                if (enemy) {
                    enemy.health -= this.player.attack;
                    if (enemy.health <= 0) {
                        this.map[ey][ex].object = null;
                        for (var k = 0; k < this.enemies.length; k++) {
                            if (this.enemies[k] === enemy) {
                                this.enemies.splice(k, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
        this.enemyTurn();
        this.render();

        if (this.enemies.length === 0) {
            alert('Поздравляем! Вы победили всех врагов!');
            location.reload();
        }
        return;
    } else if (event.code === 'Digit1' && this.inventory[0]) {
        this.useItem(0);
    } else if (event.code === 'Digit2' && this.inventory[1]) {
        this.useItem(1);
    } else if (event.code === 'Digit3' && this.inventory[2]) {
        this.useItem(2);
    } else if (event.code === 'Digit4' && this.inventory[3]) {
        this.useItem(3);
    } else if (event.code === 'Digit5' && this.inventory[4]) {
        this.useItem(4);
    }
    var newX = this.player.x + dx;
    var newY = this.player.y + dy;
    if (newX >= 0 && newX < 40 && newY >= 0 && newY < 24 &&
        this.map[newY][newX].type === 'floor' &&
        (this.map[newY][newX].object === null ||
         this.map[newY][newX].object === 'sword' ||
         this.map[newY][newX].object === 'health')) {
        this.map[this.player.y][this.player.x].object = null;
        this.player.x = newX;
        this.player.y = newY;
        if (this.map[newY][newX].object === 'sword' || this.map[newY][newX].object === 'health') {
            if (this.inventory.length < 5) {
                this.inventory.push(this.map[newY][newX].object);
                this.map[newY][newX].object = null;
            }
        }
        this.map[newY][newX].object = 'player';
        this.enemyTurn();
        this.render();
    }
};

Game.prototype.useItem = function(index) {
    var item = this.inventory[index];
    if (item === 'sword') {
        this.player.attack += 25;
    } else if (item === 'health') {
        this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
    }
    this.inventory.splice(index, 1);
    this.render();
};

Game.prototype.enemyTurn = function() {
    for (var i = 0; i < this.enemies.length; i++) {
        var enemy = this.enemies[i];
        var directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        var adjacent = false;
        for (var j = 0; j < directions.length; j++) {
            var ex = enemy.x + directions[j][0];
            var ey = enemy.y + directions[j][1];
            if (ex === this.player.x && ey === this.player.y) {
                adjacent = true;
                break;
            }
        }
        if (adjacent) {
            this.player.health -= enemy.attack;
            if (this.player.health <= 0) {
                alert('Игра окончена!');
                location.reload();
            }
        } else {
            var dir = directions[Math.floor(Math.random() * 4)];
            var newX = enemy.x + dir[0];
            var newY = enemy.y + dir[1];
            if (newX >= 0 && newX < 40 && newY >= 0 && newY < 24 &&
                this.map[newY][newX].type === 'floor' &&
                this.map[newY][newX].object === null) {
                this.map[enemy.y][enemy.x].object = null;
                enemy.x = newX;
                enemy.y = newY;
                this.map[newY][newX].object = 'enemy';
            }
        }
    }
    if (this.enemies.length === 0) {
        alert('Поздравляем! Вы победили всех врагов!');
        location.reload();
    }
};