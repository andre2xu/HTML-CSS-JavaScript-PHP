const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const healthbar = document.getElementById('healthbar');
const ammo_counter = document.getElementById('ammo');
const in_game_clock = document.getElementById('clock');
const in_game_wave_counter = document.getElementById('wave-counter');

const results_display = document.getElementById('results-display');
const player_results = document.getElementById('results');

window.addEventListener('DOMContentLoaded', () => {
    // --- PLAYER ---
    let Player = {
        hp: 100,
        ammo: 30,
        invincibility: false,
        color: 'red',
        size: 10,
        speed: 3,
        positionX: (canvas.width - 10) / 2,
        positionY: (canvas.height - 10) / 2
    }

    ctx.fillStyle = Player.color;
    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size); // this spawns the player in the centre

    /* 
    (game mechanics - clock & heads up display (HUD))

    The time metrics below are used for the in-game clock to measure the duration of the player's playtime. They will be passed to Flask once the game ends - this is indicated by the 'game_over' variable.

    The timeout delay for the clock's setInterval loop is set to 5500ms because that is when the first wave of enemies spawn so it only makes sense to start the clock then - the math behind it can be found in the 'startNewWave' function below (add the invocation delay of 1000ms with the spawning delay of 4500ms).

    The purpose of the second setInterval loop is to continuously refresh the HUD so that the player is up to date with their in-game status (i.e. their health and ammo count).

    */

    let elapsedSec = 0;
    let elapsedMin = 0;
    let elapsedHr = 0;
    let game_over = false;

    setTimeout(() => {
        setInterval(() => {
            if (!game_over) {
                elapsedSec += 1;
    
                if (elapsedSec == 60) {
                    elapsedMin += 1;
                    elapsedSec = 0;
                }
                
                if (elapsedMin == 60) {
                    elapsedHr += 1;
                    elapsedMin = 0;
                }
                in_game_clock.innerText = `${String(elapsedHr).padStart(2, '0')}:${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}`;
            }
    
            Player.invincibility = false;
        }, 1000)
    }, 5500)

    setInterval(() => {
        if (typeof Player.hp == 'undefined') {
            healthbar.innerText = `XXX`;
            ammo_counter.innerText = `XXX`;
        } else {
            healthbar.innerText = `${Player.hp}/100`;
            ammo_counter.innerText = `${Player.ammo}/30`;
        }
    })



    /*
    (enemy spawning & wave mechanics)

    Both the wave and horde counts are incremented inside of the 'Hostile_Regular_Square' (HRS) class after ALL the enemies in the wave have been killed.

    The numbers inside of the 'possible_horde_counts' list represent the different amounts of enemies that could potentially spawn after wave 3. Math.random() is used to select one possibility which is then passed to the 'spawnWave' function to be used in a for loop to generate a random amount of class instances (i.e. enemies).

    The invincibility duration is assigned to enemies after wave 7. It is used in a setInterval loop within the HRS class to delay the time it takes to set the enemy's invincibility property to false again; enemies by default receive invincibility after they get hit, but without this delay, that property gets automatically shut off.

    All the lists in the 'probabilities' section follow the same principle: "adding more of something makes that thing more likely to be picked by Math.random()", and of course when you have more of one thing, then the other things in the list are less likely to be chosen. The lists get bigger as the waves increase because more of their respective items are pushed to them - see the 'spawnWave' function.

    The two coordinate lists are given objects (dictionaries) containing an enemy or bullet's id and its x and y coordinates. These objects are compared with one another in the class instances to see if their coordinates match, this match determines a 'hit'; of course the subsequent effects of a bullet hit are self-explanatory.

    */

    let wave_count = 1;
    let horde_count = 1;
    let possible_horde_counts = [4, 5, 6];
    let enemy_invincibility_duration = 0; // this is applied to enemies in wave 8
    let kill_count = 0;

    // probabilities
    let enemy_options = ['HRS'];
    let chances_of_receiving_health = [true, false];
    let chances_of_receiving_ammo = [true, false];

    // coordinates
    let enemy_coordinates = [];
    let bullet_coordinates = [];


    // --- ENEMIES ---
    class Hostile_Regular_Square {
        constructor(entity_number, hp, dmg, invincibility, color, size, speed, spawnPosX, spawnPosY) {
            this.id = entity_number;
            this.hp = hp;
            this.dmg = dmg;
            this.invincibility = invincibility;
            this.color = color;
            this.size = size;
            this.speed = speed;
            this.posX = spawnPosX;
            this.posY = spawnPosY;
        }

        drawEnemy() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.posX, this.posY, this.size, this.size);

            enemy_coordinates.push({id: this.id, size: this.size, currentPosX: this.posX, currentPosY: this.posY});

            this.moveEnemy();
        }

        moveEnemy() {
            // this index is used for updating the enemy's coordinate object everytime they move (see the series of if statements below)
            let enemy_index = enemy_coordinates.findIndex((enemy => enemy.id == this.id));

            bullet_coordinates.forEach((bullet) => {
                // this check ensures that enemies don't take damage if their invincibility property is set to true
                if (!this.invincibility) {
                    // the condition inside of this if statement checks to see if the bullet touched any of the enemy's four sides
                    if ((bullet.currentPosX >= (this.posX - bullet.size) && bullet.currentPosX <= (this.posX + this.size)) && (bullet.currentPosY >= (this.posY - bullet.size) && bullet.currentPosY <= (this.posY + this.size))) {
                        let bullet_index = bullet_coordinates.findIndex((bullet_that_landed => bullet_that_landed.id == bullet.id));
                        this.hp -= bullet.dmg;
                        this.invincibility = true;
                        bullet_coordinates.splice(bullet_index, 1); // removes the coordinate object of the bullet that hit the enemy

                        if (this.hp == 0) {
                            kill_count++;
                            if (this.color == 'purple') {
                                let isGivenToPlayer = chances_of_receiving_health[Math.floor(Math.random() * chances_of_receiving_health.length)];

                                if (isGivenToPlayer) {
                                    Player.hp += 25;
                                }
                                if (Player.hp > 100) {
                                    Player.hp = 100; // this ensures that the player's hp doesn't exceed their maximum threshold after receiving the health drop
                                }
                            } else if (this.color == 'orange') {
                                let isGivenToPlayer = chances_of_receiving_ammo[Math.floor(Math.random() * chances_of_receiving_ammo.length)];

                                if (isGivenToPlayer) {
                                    Player.ammo += 10;
                                }
                                if (Player.ammo > 30) {
                                    Player.ammo = 30; // this ensures that the player's ammo doesn't exceed their maximum threshold after receiving the ammo drop
                                }
                            } else if (this.color == 'green') {
                                let isGivenToPlayer = chances_of_receiving_health[Math.floor(Math.random() * chances_of_receiving_health.length)];

                                if (isGivenToPlayer) {
                                    Player.hp += 10;
                                }
                                if (Player.hp > 100) {
                                    Player.hp = 100;
                                }
                            } else if (this.color == 'blue') {
                                let isGivenToPlayer = chances_of_receiving_ammo[Math.floor(Math.random() * chances_of_receiving_ammo.length)];

                                if (isGivenToPlayer) {
                                    Player.ammo += 3;
                                }
                                if (Player.ammo > 30) {
                                    Player.ammo = 30;
                                }
                            }
                            this.deleteEnemy(enemy_index);
                        }
                    }
                }

                setInterval(() => {
                    this.invincibility = false;
                }, enemy_invincibility_duration)
            })


            // the enemy tracks/follows the player using these x and y values
            this.targetPosX = Player.positionX;
            this.targetPosY = Player.positionY;

            ctx.clearRect(this.posX, this.posY, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY + 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY + 1, this.size, this.size);

            /*
            To save you time, the only if statement worth checking is the first. The others are just slight modifications of each other to move the enemy in a certain direction.
            */

            // touching player
            if (this.targetPosX == this.posX && this.targetPosY == this.posY) {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());

                // this check ensures that the player doesn't take any damage while they're still invincible
                if (!Player.invincibility) {
                    Player.hp -= this.dmg;
                    Player.invincibility = true;
                }
                
                if (Player.hp <= 0) {
                    game_over = true;
                    results_display.style.display = 'flex'; // makes the game over screen appear

                    // the following is just a minor grammar fix for the game over message
                    let wave_word;

                    if (wave_count - 1 == 1) {
                        wave_word = "wave";
                    } else {
                        wave_word = "waves";
                    }

                    player_results.innerText = `You survived ${wave_count - 1} ${wave_word} in ${elapsedHr} hours ${elapsedMin} minutes and ${elapsedSec} seconds.`;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    delete Player.hp;
                    delete Player.invincibility;
                    delete Player.color;
                    delete Player.size;
                    delete Player.speed;
                    delete Player.ammo;
                    delete Player.positionX;
                    delete Player.positionY;

                    upload_player_results(); // calls the function that uploads the player's stats to Flask
                }
            }
            // player is in front
            if (this.targetPosX == this.posX && this.targetPosY > this.posY) {
                ctx.fillStyle = this.color;
                this.posY += this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            } 
            // player is behind
            if (this.targetPosX == this.posX && this.targetPosY < this.posY) {
                ctx.fillStyle = this.color;
                this.posY -= this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            }
            // player moved left
            if (this.targetPosX < this.posX && this.targetPosY == this.posY) {
                ctx.fillStyle = this.color;
                this.posX -= this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            }
            // player moved right
            if (this.targetPosX > this.posX && this.targetPosY == this.posY) {
                ctx.fillStyle = this.color;
                this.posX += this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            }


            // scenarios where player moves diagonally...
            if (this.targetPosX > this.posX && this.targetPosY > this.posY) {
                ctx.fillStyle = this.color;
                this.posX += this.speed;
                this.posY += this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            }

            if (this.targetPosX > this.posX && this.targetPosY < this.posY) {
                ctx.fillStyle = this.color;
                this.posX += this.speed;
                this.posY -= this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            }

            if (this.targetPosX < this.posX && this.targetPosY > this.posY) {
                ctx.fillStyle = this.color;
                this.posX -= this.speed;
                this.posY += this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            }

            if (this.targetPosX < this.posX && this.targetPosY < this.posY) {
                ctx.fillStyle = this.color;
                this.posX -= this.speed;
                this.posY -= this.speed;
                ctx.fillRect(this.posX, this.posY, this.size, this.size);

                enemy_coordinates[enemy_index].currentPosX = this.posX;
                enemy_coordinates[enemy_index].currentPosY = this.posY;
                requestAnimationFrame(() => this.moveEnemy());
            }

        }

        deleteEnemy(enemy_to_delete) {
            ctx.clearRect(this.posX, this.posY, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY + 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY + 1, this.size, this.size);

            delete this.id;
            delete this.hp;
            delete this.dmg;
            delete this.invincibility;
            delete this.color;
            delete this.size;
            delete this.speed;
            delete this.posX;
            delete this.posY;

            enemy_coordinates.splice(enemy_to_delete, 1); // removes a dead enemy's coordinate object

            if (enemy_coordinates.length == 0) {
                wave_count += 1;

                // the enemy count for the new wave is determined below
                if (wave_count <= 3) {
                    horde_count += 1;
                } else if (wave_count >= 4 && wave_count <= 6) {
                    let random_index = Math.floor(Math.random() * possible_horde_counts.length);
                    horde_count = possible_horde_counts[random_index];
                } else if (wave_count >= 7 && wave_count <= 9) {
                    possible_horde_counts.push(7, 8, 9);
                    let random_index = Math.floor(Math.random() * possible_horde_counts.length);
                    horde_count = possible_horde_counts[random_index];
                } else if (wave_count >= 10) {
                    possible_horde_counts.push(10, 11, 12);
                    let random_index = Math.floor(Math.random() * possible_horde_counts.length);
                    horde_count = possible_horde_counts[random_index];
                }

                // there is a short delay before the start of a new wave to give the player a breather
                setTimeout(() => {
                    startNewWave()
                }, 1000)
            }
        }
    }

    class Hostile_Light_Armored_Square extends Hostile_Regular_Square {}

    class Hostile_Heavy_Armored_Square extends Hostile_Regular_Square {}

    class Hostile_Giant_Square extends Hostile_Regular_Square {}

    function spawnWave(enemy_count, wave) {
        if (wave == 3) {
            enemy_options.push('HRS', 'HLAS');
        }
        if (wave == 4) {
            enemy_options.push('HRS', 'HRS', 'HLAS');
            chances_of_receiving_ammo.push(true);
        }
        if (wave == 5) {
            enemy_options.push('HLAS', 'HHAS');
            chances_of_receiving_health.push(true);
        }
        if (wave == 7) {
            enemy_options.push('HHAS', 'HGS');
        }
        if (wave == 8) {
            enemy_invincibility_duration = 2000; // milliseconds
            chances_of_receiving_ammo.push(true, false, false);
            possible_horde_counts.push(7, 8, 9);
        }
        if (wave == 9) {
            enemy_options.push('HLAS', 'HLAS', 'HHAS');
            chances_of_receiving_health.push(true, false, false);
        }
        if (wave == 10) {
            enemy_options.push('HHAS', 'HHAS');
            possible_horde_counts.push(11, 12);
        }
        if (wave == 11) {
            enemy_options.push('HGS', 'HGS');
            chances_of_receiving_ammo.push(true, true, false, false);
            chances_of_receiving_health.push(true, true, false, false);
        }

        // this decides where the new enemy will spawn
        let spawnpoint_options = ['top', 'down', 'left', 'right'];

        for (let entity_number = 0; entity_number < enemy_count; entity_number++) {
            enemy_to_spawn = enemy_options[Math.floor(Math.random() * enemy_options.length)];
            spawn_location_direction = Math.floor(Math.random() * spawnpoint_options.length);

            if (spawn_location_direction == 0) {
                let spawnX = Math.floor(Math.random() * canvas.width); // random x coordinate at the top
                let spawnY = -10
                choose_enemy(entity_number, spawnX, spawnY)
            } else if (spawn_location_direction == 1) {
                let spawnX = Math.floor(Math.random() * canvas.width); // random x coordinate at the bottom
                let spawnY = canvas.height + 10
                choose_enemy(entity_number, spawnX, spawnY)
            } else if (spawn_location_direction == 2) {
                let spawnX = - 10
                let spawnY = Math.floor(Math.random() * canvas.height); // random y coordinate on the left
                choose_enemy(entity_number, spawnX, spawnY)
            } else if (spawn_location_direction == 3) {
                let spawnX = canvas.width + 10
                let spawnY = Math.floor(Math.random() * canvas.height); // random y coordinate on the right
                choose_enemy(entity_number, spawnX, spawnY)
            }
        }

        function choose_enemy(entity_number, spawnX, spawnY) {
            switch (enemy_to_spawn) {
                case 'HRS':
                    let new_HRS = new Hostile_Regular_Square(entity_number, 50, 10, false, 'blue', Player.size, 1, spawnX, spawnY);
                    new_HRS.drawEnemy();
                    break;
                case 'HLAS':
                    let new_HLAS = new Hostile_Light_Armored_Square(entity_number, 100, 20, false, 'green', Player.size + 1, 0.5, spawnX, spawnY);
                    new_HLAS.drawEnemy();
                    break;
                case 'HHAS':
                    let new_HHAS = new Hostile_Heavy_Armored_Square(entity_number, 150, 20, false, 'orange', Player.size + 1, 0.5, spawnX, spawnY);
                    new_HHAS.drawEnemy();
                    break;
                case 'HGS':
                    let new_HGS = new Hostile_Giant_Square(entity_number, 250, 50, false, 'purple', Player.size + 3, 0.5, spawnX, spawnY);
                    new_HGS.drawEnemy();
            }
        }
    }

    function startNewWave() {
        let countdown = 3;

        let wave_countdown = setInterval(() => {
            in_game_wave_counter.innerText = `Wave starting in ${countdown}`;
            if (countdown == 1) {
                clearInterval(wave_countdown);
            }
            countdown--;
        }, 1000)

        // this delay spawns the enemies 500ms after the countdown
        setTimeout(() => {
            in_game_wave_counter.innerText = `Wave ${wave_count}`;
            spawnWave(horde_count, wave_count)
        }, 4500)
    }
    setTimeout(() => {
        startNewWave()
    }, 1000)



    // --- PLAYER MOVEMENT & SHOOTING ---

    /*
    (key mapping & movement/shooting)

    The three non-class objects below track which key(s) the user is currently holding down. The first two track the four movement keys, with the second object being in charge of the second key which allows diagonal movement to occur. The boolean values are set in the event listeners below.

    How the multi-key system for movement works is that everytime the player presses one of the four movement keys, the 'primaryKey' boolean value for it is set to true and, at the same time, its 'secondaryKey' boolean value is also set to true. This is so that when the player presses another key (the new key will be the new primary), while still holding down the one they previously pressed, their old key would STILL be active as a secondary but NOT as a primary which results in diagonal movement!

    */

    let primaryKey = {
        w: false,
        s: false,
        a: false,
        d: false
    }

    let secondaryKey = {
        w: false,
        s: false,
        a: false,
        d: false
    }


    class Bullet {
        constructor(posX, posY, bullet_number) {
            this.id = bullet_number;
            this.dmg = 50;
            this.color = 'red';
            this.size = 2;
            this.speed = 2;
            this.posX = posX;
            this.posY = posY;
        }

        drawBullet(direction) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.posX, this.posY, this.size, this.size);

            bullet_coordinates.push({id: this.id, dmg: this.dmg, size: this.size, currentPosX: this.posX, currentPosY: this.posY});

            // the 'shooting' section below determines the direction
            if (direction == 'up') {
                this.moveBulletUp();
            } else if (direction == 'down') {
                this.moveBulletDown();
            } else if (direction == 'left') {
                this.moveBulletLeft();
            } else if (direction == 'right') {
                this.moveBulletRight();
            }
        }

        moveBulletUp() {
            let bullet_index = bullet_coordinates.findIndex((bullet => bullet.id == this.id));
            bullet_coordinates[bullet_index].currentPosX = this.posX;
            bullet_coordinates[bullet_index].currentPosY = this.posY;

            // as long as the bullet is moving, these loops will continuously check if the bullet has hit an enemy or not
            enemy_coordinates.forEach((enemy) => {
                if ((this.posX >= (enemy.currentPosX - this.size) && this.posX <= (enemy.currentPosX + enemy.size)) && (this.posY >= (enemy.currentPosY - this.size) && this.posY <= (enemy.currentPosY + enemy.size))) {
                    this.deleteBullet();
                }
            })


            ctx.fillStyle = this.color;
            ctx.clearRect(this.posX, this.posY, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY + 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY + 1, this.size, this.size); // these extra clearRects remove unwanted leftover colours that randomly appear from the previous position of the bullet
            this.posY -= this.speed;
            ctx.fillRect(this.posX, this.posY, this.size, this.size);

            // these if statements check if the bullet has reached the end of the canvas. If so, the bullet will be deleted
            if (this.posY > 0) {
                requestAnimationFrame(() => this.moveBulletUp());
            } else {
                ctx.clearRect(this.posX, this.posY, this.size, this.size);
                this.deleteBullet();
            }
        }

        moveBulletDown() {
            let bullet_index = bullet_coordinates.findIndex((bullet => bullet.id == this.id));
            bullet_coordinates[bullet_index].currentPosX = this.posX;
            bullet_coordinates[bullet_index].currentPosY = this.posY;

            enemy_coordinates.forEach((enemy) => {
                if ((this.posX >= (enemy.currentPosX - this.size) && this.posX <= (enemy.currentPosX + enemy.size)) && (this.posY >= (enemy.currentPosY - this.size) && this.posY <= (enemy.currentPosY + enemy.size))) {
                    this.deleteBullet();
                }
            })


            ctx.fillStyle = this.color;
            ctx.clearRect(this.posX, this.posY, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY - 1, this.size, this.size);
            this.posY += this.speed;
            ctx.fillRect(this.posX, this.posY, this.size, this.size);

            if (this.posY < canvas.height - this.size) {
                requestAnimationFrame(() => this.moveBulletDown());
            } else {
                ctx.clearRect(this.posX, this.posY, this.size, this.size);
                this.deleteBullet();
            }
        }

        moveBulletLeft() {
            let bullet_index = bullet_coordinates.findIndex((bullet => bullet.id == this.id));
            bullet_coordinates[bullet_index].currentPosX = this.posX;
            bullet_coordinates[bullet_index].currentPosY = this.posY;

            enemy_coordinates.forEach((enemy) => {
                if ((this.posX >= (enemy.currentPosX - this.size) && this.posX <= (enemy.currentPosX + enemy.size)) && (this.posY >= (enemy.currentPosY - this.size) && this.posY <= (enemy.currentPosY + enemy.size))) {
                    this.deleteBullet();
                }
            })


            ctx.fillStyle = this.color;
            ctx.clearRect(this.posX, this.posY, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY + 1, this.size, this.size);
            this.posX -= this.speed;
            ctx.fillRect(this.posX, this.posY, this.size, this.size);

            if (this.posX > 0) {
                requestAnimationFrame(() => this.moveBulletLeft());
            } else {
                ctx.clearRect(this.posX, this.posY, this.size, this.size);
                this.deleteBullet();
            }
        }

        moveBulletRight() {
            let bullet_index = bullet_coordinates.findIndex((bullet => bullet.id == this.id));
            bullet_coordinates[bullet_index].currentPosX = this.posX;
            bullet_coordinates[bullet_index].currentPosY = this.posY;

            enemy_coordinates.forEach((enemy) => {
                if ((this.posX >= (enemy.currentPosX - this.size) && this.posX <= (enemy.currentPosX + enemy.size)) && (this.posY >= (enemy.currentPosY - this.size) && this.posY <= (enemy.currentPosY + enemy.size))) {
                    this.deleteBullet();
                }
            })


            ctx.fillStyle = this.color;
            ctx.clearRect(this.posX, this.posY, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY + 1, this.size, this.size);
            this.posX += this.speed;
            ctx.fillRect(this.posX, this.posY, this.size, this.size);

            if (this.posX < canvas.width - this.size) {
                requestAnimationFrame(() => this.moveBulletRight());
            } else {
                ctx.clearRect(this.posX, this.posY, this.size, this.size);
                this.deleteBullet();
            }
        }

        deleteBullet() {
            ctx.clearRect(this.posX, this.posY, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX - 1, this.posY + 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY - 1, this.size, this.size);
            ctx.clearRect(this.posX + 1, this.posY + 1, this.size, this.size);

            delete this.id;
            delete this.dmg;
            delete this.color;
            delete this.size;
            delete this.speed;
            delete this.posX;
            delete this.posY;
        }
    }

    let shootingKey = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    }

    document.onkeydown = (key) => {
        switch (key.key) {
            case 'w':
                primaryKey.w = true;
                primaryKey.s = false;
                primaryKey.a = false;
                primaryKey.d = false;
                break;
            case 's':
                primaryKey.w = false;
                primaryKey.s = true;
                primaryKey.a = false;
                primaryKey.d = false;
                break;
            case 'a':
                primaryKey.w = false;
                primaryKey.s = false;
                primaryKey.a = true;
                primaryKey.d = false;
                break;
            case 'd':
                primaryKey.w = false;
                primaryKey.s = false;
                primaryKey.a = false;
                primaryKey.d = true;
        }

        switch (key.key) {
            case 'ArrowUp':
                shootingKey.ArrowUp = true;
                shootingKey.ArrowDown = false;
                shootingKey.ArrowLeft = false;
                shootingKey.ArrowRight = false;
                break;
            case 'ArrowDown':
                shootingKey.ArrowUp = false;
                shootingKey.ArrowDown = true;
                shootingKey.ArrowLeft = false;
                shootingKey.ArrowRight = false;
                break;
            case 'ArrowLeft':
                shootingKey.ArrowUp = false;
                shootingKey.ArrowDown = false;
                shootingKey.ArrowLeft = true;
                shootingKey.ArrowRight = false;
                break;
            case 'ArrowRight':
                shootingKey.ArrowUp = false;
                shootingKey.ArrowDown = false;
                shootingKey.ArrowLeft = false;
                shootingKey.ArrowRight = true;
        }

        // movement
        if (primaryKey.w) {
            secondaryKey.w = true;

            // move up
            if (!secondaryKey.a && !secondaryKey.d) {
                if (Player.positionY > 0) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size); // these extra clearRects remove unwanted leftover colours that randomly appear from the previous position of the player
                    
                    ctx.fillStyle = Player.color;
                    Player.positionY -= Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                }
            }

            /*
            The 'else' portion of the following if statements allow the player to continue moving along the border even after they've reached the edge of the canvas. Without it, their character would become stationary once it reaches the wall - this could help them survive longer.
            */

            // move up left
            if (secondaryKey.a && !secondaryKey.d) {
                if (Player.positionY > 0 && Player.positionX > 0) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX -= Player.speed;
                    Player.positionY -= Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX > 0) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX -= Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    } else if (Player.positionY > 0) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionY -= Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }

            // move up right
            if (!secondaryKey.a && secondaryKey.d) {
                if (Player.positionY > 0 && Player.positionX < canvas.width - Player.size) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX += Player.speed;
                    Player.positionY -= Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX < canvas.width - Player.size) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX += Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    } else if (Player.positionY > 0) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionY -= Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }
        }

        if (primaryKey.s) {
            secondaryKey.s = true;

            // move down
            if (!secondaryKey.a && !secondaryKey.d) {
                if (Player.positionY < canvas.height - Player.size) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionY += Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                }
            }

            // move down left
            if (secondaryKey.a && !secondaryKey.d) {
                if (Player.positionY < canvas.height - Player.size && Player.positionX > 0) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX -= Player.speed;
                    Player.positionY += Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX > 0) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX -= Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    } else if (Player.positionY < canvas.height - Player.size) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionY += Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }

            // move down right
            if (!secondaryKey.a && secondaryKey.d) {
                if (Player.positionY < canvas.height - Player.size && Player.positionX < canvas.width - Player.size) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX += Player.speed;
                    Player.positionY += Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX < canvas.width - Player.size) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX += Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    } else if (Player.positionY < canvas.height - Player.size) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionY += Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }
        }

        if (primaryKey.a) {
            secondaryKey.a = true;

            // move left
            if (!secondaryKey.w && !secondaryKey.s) {
                if (Player.positionX > 0) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX -= Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                }
            }

            // move left up
            if (secondaryKey.w && !secondaryKey.s) {
                if (Player.positionX > 0 && Player.positionY > 0) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX -= Player.speed;
                    Player.positionY -= Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX > 0) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX -= Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }

            // move left down
            if (!secondaryKey.w && secondaryKey.s) {
                if (Player.positionX > 0 && Player.positionY < canvas.height - Player.size) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX -= Player.speed;
                    Player.positionY += Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX > 0) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX -= Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }
        }

        if (primaryKey.d) {
            secondaryKey.d = true;

            // move right
            if (!secondaryKey.w && !secondaryKey.s) {
                if (Player.positionX < canvas.width - Player.size) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX += Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                }
            }

            // move right up
            if (secondaryKey.w && !secondaryKey.s) {
                if (Player.positionX < canvas.width - Player.size && Player.positionY > 0) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX += Player.speed;
                    Player.positionY -= Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX < canvas.width - Player.size) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY + 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX += Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }

            // move right down
            if (!secondaryKey.w && secondaryKey.s) {
                if (Player.positionX < canvas.width - Player.size && Player.positionY < canvas.height - Player.size) {
                    ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                    ctx.clearRect(Player.positionX - 1, Player.positionY + 1, Player.size, Player.size);
                    
                    ctx.fillStyle = Player.color;
                    Player.positionX += Player.speed;
                    Player.positionY += Player.speed;
                    ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                } else {
                    if (Player.positionX < canvas.width - Player.size) {
                        ctx.clearRect(Player.positionX, Player.positionY, Player.size, Player.size);
                        ctx.clearRect(Player.positionX - 1, Player.positionY - 1, Player.size, Player.size);
                        ctx.clearRect(Player.positionX + 1, Player.positionY - 1, Player.size, Player.size);
                        
                        ctx.fillStyle = Player.color;
                        Player.positionX += Player.speed;
                        ctx.fillRect(Player.positionX, Player.positionY, Player.size, Player.size);
                    }
                }
            }
        }

        // shooting
        if (shootingKey.ArrowUp) {
            if (Player.ammo != 0) {
                let new_bullet = new Bullet(Player.positionX, Player.positionY - 4, Player.ammo);
                new_bullet.drawBullet('up');
                Player.ammo -= 1;
                shootingKey.ArrowUp = false;
            }
        } else if (shootingKey.ArrowDown) {
            if (Player.ammo != 0) {
                let new_bullet = new Bullet(Player.positionX, Player.positionY + (Player.size + 4), Player.ammo);
                new_bullet.drawBullet('down');
                Player.ammo -= 1;
                shootingKey.ArrowDown = false;
            }
        } else if (shootingKey.ArrowLeft) {
            if (Player.ammo != 0) {
                let new_bullet = new Bullet(Player.positionX - 4, Player.positionY, Player.ammo);
                new_bullet.drawBullet('left');
                Player.ammo -= 1;
                shootingKey.ArrowLeft = false;
            }
        } else if (shootingKey.ArrowRight) {
            if (Player.ammo != 0) {
                let new_bullet = new Bullet(Player.positionX + (Player.size + 4), Player.positionY, Player.ammo);
                new_bullet.drawBullet('right');
                Player.ammo -= 1;
                shootingKey.ArrowRight = false;
            }
        }


        // resets movement keys upon removal of finger
        document.onkeyup = (key) => {
            primaryKey[key.key] = false;
            secondaryKey[key.key] = false;
        }
    }


    function upload_player_results() {
        let xhr = new XMLHttpRequest;

        xhr.open('POST', '/leaderboard');
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify({'kills': kill_count, 'waves': wave_count - 1, 'hrs': elapsedHr, 'mins': elapsedMin, 'secs': elapsedSec}));
    }
})