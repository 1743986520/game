// 游戏变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const shieldElement = document.getElementById('shield');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const pauseBtn = document.getElementById('pauseBtn');
const bossHealthBar = document.querySelector('.boss-health-bar');
const bossHealthFill = document.querySelector('.boss-health-fill');

// 设置画布大小 - 根据窗口调整
function setupCanvas() {
    const maxWidth = Math.min(800, window.innerWidth - 20);
    const maxHeight = Math.min(600, window.innerHeight - 150);

    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // 调整玩家位置
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
}

// 图片资源
const images = {
    player: new Image(),
    enemy: new Image(),
    enemyShip: new Image(),
    meteor: new Image(),
    bullet: new Image(),
    bomb: new Image(),
    boss: new Image()
};

// 设置图片源
images.player.src = '001.png';    // 玩家飞船
images.enemy.src = '002.png';     // 敌人(战舰)
images.enemyShip.src = '004.png'; // 敌方飞船
images.meteor.src = '003.png';    // 陨石
images.bullet.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSIxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIyIiB5PSIwIiB3aWR0aD0iNCIgaGVpZ2h0PSIxNiIgZmlsbD0iI2U3NGMzYyIvPjxyZWN0IHg9IjAiIHk9IjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmNjMDAiLz48L3N2Zz4='; // 子弹SVG
images.bomb.src = '005.png';      // 炸弹
images.boss.src = 'boss.png';     // Boss

// 游戏状态
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 5;
let level = 1;
let shield = 0;
let gameOver = false;
let lastShotTime = 0;
let lastEnemyShotTime = 0;
let imagesLoaded = 0;
let totalImages = Object.keys(images).length;
let bossDefeatedCount = 0;

// 玩家飞船
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 60,
    height: 80,
    speed: 8,
    health: 100,
    isMovingLeft: false,
    isMovingRight: false,
    isMovingUp: false,
    isMovingDown: false,
    shootDelay: 200,
    damage: 10
};

// 游戏对象数组
let bullets = [];
let enemyBullets = [];
let enemies = [];
let enemyShips = [];
let meteors = [];
let explosions = [];
let bombs = [];
let bosses = [];

// 检查所有图片是否加载完成
function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        startButton.disabled = false;
        startButton.textContent = "开始游戏";
    }
}

// 设置图片加载回调
Object.values(images).forEach(img => {
    img.onload = checkAllImagesLoaded;
    img.onerror = () => {
        console.error('图片加载失败');
        checkAllImagesLoaded();
    };
});

// 初始化游戏
function initGame() {
    if (imagesLoaded < totalImages) return;

    setupCanvas();

    score = 0;
    lives = 5;
    level = 1;
    shield = 0;
    gameOver = false;
    gamePaused = false;
    bossDefeatedCount = 0;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    enemyShips = [];
    meteors = [];
    explosions = [];
    bombs = [];
    bosses = [];

    scoreElement.textContent = score;
    livesElement.textContent = lives;
    levelElement.textContent = level;
    shieldElement.textContent = shield;

    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
    player.health = 100;

    bossHealthBar.style.display = 'none';

    gameRunning = true;
    startScreen.style.display = 'none';

    // 重置技能冷却
    if (window.resetSkillCooldowns) {
        window.resetSkillCooldowns();
    }

    requestAnimationFrame(gameLoop);
}

// 游戏主循环
function gameLoop(timestamp) {
    if (!gameRunning || gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制星空背景
    drawStars();

    autoShoot(timestamp);
    updatePlayer();
    updateBullets();
    updateEnemyBullets();
    updateEnemies();
    updateEnemyShips(timestamp);
    updateMeteors();
    updateExplosions();
    updateBombs();
    updateBosses(timestamp);
    checkCollisions();
    spawnEnemies();
    spawnEnemyShips();
    spawnMeteors();
    checkBossSpawn();

    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawEnemyShips();
    drawMeteors();
    drawExplosions();
    drawBombs();
    drawBosses();
    drawShield();

    requestAnimationFrame(gameLoop);
}

// 绘制星空背景
function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 简单的星空效果
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
}

// 自动射击
function autoShoot(timestamp) {
    if (timestamp - lastShotTime > player.shootDelay) {
        shoot();
        lastShotTime = timestamp;
    }
}

// 更新玩家位置
function updatePlayer() {
    if (player.isMovingLeft && player.x > player.width / 2) {
        player.x -= player.speed;
    }
    if (player.isMovingRight && player.x < canvas.width - player.width / 2) {
        player.x += player.speed;
    }
    if (player.isMovingUp && player.y > player.height / 2) {
        player.y -= player.speed;
    }
    if (player.isMovingDown && player.y < canvas.height - player.height / 2) {
        player.y += player.speed;
    }
}

// 更新子弹位置
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

// 更新敌人子弹位置
function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

// 更新敌人位置
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        enemies[i].x += Math.sin(enemies[i].y / 50) * 1;

        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
}

// 更新敌方飞船位置和射击
function updateEnemyShips(timestamp) {
    for (let i = enemyShips.length - 1; i >= 0; i--) {
        enemyShips[i].y += enemyShips[i].speed;
        enemyShips[i].x += Math.sin(enemyShips[i].y / 50) * 1.5;

        // 敌方飞船射击
        if (timestamp - enemyShips[i].lastShot > enemyShips[i].shootDelay) {
            enemyShoot(enemyShips[i]);
            enemyShips[i].lastShot = timestamp;
        }

        if (enemyShips[i].y > canvas.height) {
            enemyShips.splice(i, 1);
        }
    }
}

// 更新陨石位置
function updateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
        meteors[i].y += meteors[i].speed;
        meteors[i].rotation += meteors[i].rotationSpeed;

        if (meteors[i].y > canvas.height) {
            meteors.splice(i, 1);
        }
    }
}

// 更新爆炸效果
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].radius += 0.8;
        explosions[i].alpha -= 0.03;

        if (explosions[i].alpha <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// 更新炸弹位置
function updateBombs() {
    for (let i = bombs.length - 1; i >= 0; i--) {
        // 炸弹追踪逻辑
        if (bombs[i].target && bombs[i].target.health > 0) {
            // 简单追踪逻辑：向目标移动
            const dx = bombs[i].target.x + bombs[i].target.width/2 - bombs[i].x;
            const dy = bombs[i].target.y + bombs[i].target.height/2 - bombs[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                bombs[i].x += (dx / dist) * bombs[i].speed;
                bombs[i].y += (dy / dist) * bombs[i].speed;
            } else {
                // 到达目标，造成伤害
                if (bombs[i].target.health) {
                    bombs[i].target.health -= bombs[i].damage;
                    
                    // 创建爆炸效果
                    explosions.push({
                        x: bombs[i].x,
                        y: bombs[i].y,
                        radius: 20,
                        alpha: 1
                    });
                    
                    // 检查目标是否被摧毁
                    if (bombs[i].target.health <= 0) {
                        score += 15 * level;
                        scoreElement.textContent = score;
                        
                        explosions.push({
                            x: bombs[i].target.x + bombs[i].target.width / 2,
                            y: bombs[i].target.y + bombs[i].target.height / 2,
                            radius: 25,
                            alpha: 1
                        });
                        
                        // 从相应数组中移除目标
                        if (bombs[i].target.type === 'enemy') {
                            const index = enemies.findIndex(e => e === bombs[i].target);
                            if (index !== -1) enemies.splice(index, 1);
                        } else if (bombs[i].target.type === 'enemyShip') {
                            const index = enemyShips.findIndex(e => e === bombs[i].target);
                            if (index !== -1) enemyShips.splice(index, 1);
                        } else if (bombs[i].target.type === 'boss') {
                            const index = bosses.findIndex(b => b === bombs[i].target);
                            if (index !== -1) {
                                bosses.splice(index, 1);
                                bossDefeatedCount++;
                                bossHealthBar.style.display = 'none';
                                
                                // 玩家数值提升
                                player.damage *= 1.3;
                                player.health *= 1.3;
                            }
                        }
                    }
                }
                
                bombs.splice(i, 1);
                continue;
            }
        } else {
            // 没有目标，直线移动
            bombs[i].y -= bombs[i].speed;
        }
        
        // 移除超出屏幕的炸弹
        if (bombs[i].y < 0) {
            bombs.splice(i, 1);
        }
    }
}

// 更新Boss位置和射击
function updateBosses(timestamp) {
    for (let i = bosses.length - 1; i >= 0; i--) {
        // Boss移动模式
        bosses[i].x += bosses[i].speedX;
        if (bosses[i].x <= 0 || bosses[i].x >= canvas.width - bosses[i].width) {
            bosses[i].speedX *= -1;
        }
        
        // Boss射击
        if (timestamp - bosses[i].lastShot > bosses[i].shootDelay) {
            bossShoot(bosses[i]);
            bosses[i].lastShot = timestamp;
        }
        
        // 更新Boss血条
        if (bosses.length > 0) {
            const healthPercent = (bosses[0].health / bosses[0].maxHealth) * 100;
            bossHealthFill.style.width = `${healthPercent}%`;
        }
    }
}

// 检查碰撞
function checkCollisions() {
    // 子弹与敌人碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                enemies[j].health -= bullets[i].damage;
                
                if (enemies[j].health <= 0) {
                    explosions.push({
                        x: enemies[j].x + enemies[j].width / 2,
                        y: enemies[j].y + enemies[j].height / 2,
                        radius: 15,
                        alpha: 1
                    });

                    score += 10 * level;
                    scoreElement.textContent = score;

                    enemies.splice(j, 1);
                }
                
                bullets.splice(i, 1);
                break;
            }
        }
        
        // 子弹与敌方飞船碰撞
        for (let j = enemyShips.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemyShips[j])) {
                enemyShips[j].health -= bullets[i].damage;
                
                if (enemyShips[j].health <= 0) {
                    explosions.push({
                        x: enemyShips[j].x + enemyShips[j].width / 2,
                        y: enemyShips[j].y + enemyShips[j].height / 2,
                        radius: 15,
                        alpha: 1
                    });

                    score += 12 * level;
                    scoreElement.textContent = score;

                    enemyShips.splice(j, 1);
                }
                
                bullets.splice(i, 1);
                break;
            }
        }
        
        // 子弹与陨石碰撞
        for (let j = meteors.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], meteors[j])) {
                meteors[j].health -= bullets[i].damage;
                
                if (meteors[j].health <= 0) {
                    explosions.push({
                        x: meteors[j].x + meteors[j].width / 2,
                        y: meteors[j].y + meteors[j].height / 2,
                        radius: 20,
                        alpha: 1
                    });

                    score += 8 * level;
                    scoreElement.textContent = score;

                    meteors.splice(j, 1);
                }
                
                bullets.splice(i, 1);
                break;
            }
        }
        
        // 子弹与Boss碰撞
        for (let j = bosses.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], bosses[j])) {
                bosses[j].health -= bullets[i].damage;
                
                // 更新Boss血条
                const healthPercent = (bosses[j].health / bosses[j].maxHealth) * 100;
                bossHealthFill.style.width = `${healthPercent}%`;
                
                if (bosses[j].health <= 0) {
                    explosions.push({
                        x: bosses[j].x + bosses[j].width / 2,
                        y: bosses[j].y + bosses[j].height / 2,
                        radius: 40,
                        alpha: 1
                    });

                    score += 100 * level;
                    scoreElement.textContent = score;
                    
                    bossDefeatedCount++;
                    bosses.splice(j, 1);
                    bossHealthBar.style.display = 'none';
                    
                    // 玩家数值提升
                    player.damage *= 1.3;
                    player.health *= 1.3;
                }
                
                bullets.splice(i, 1);
                break;
            }
        }
    }
    
    // 敌人子弹与玩家碰撞
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (checkCollision(enemyBullets[i], player)) {
            if (shield > 0) {
                shield -= enemyBullets[i].damage;
                if (shield < 0) shield = 0;
                shieldElement.textContent = shield;
            } else {
                player.health -= enemyBullets[i].damage;
                
                explosions.push({
                    x: player.x,
                    y: player.y,
                    radius: 20,
                    alpha: 1
                });
                
                if (player.health <= 0) {
                    lives--;
                    livesElement.textContent = lives;
                    player.health = 100;
                    
                    if (lives <= 0) {
                        endGame();
                    }
                }
            }
            
            enemyBullets.splice(i, 1);
        }
    }

    // 玩家与敌人碰撞
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (checkLooseCollision(player, enemies[i], 0.6)) {
            if (shield > 0) {
                shield -= 10;
                if (shield < 0) shield = 0;
                shieldElement.textContent = shield;
            } else {
                player.health -= 10;
                
                explosions.push({
                    x: player.x,
                    y: player.y,
                    radius: 20,
                    alpha: 1
                });
                
                if (player.health <= 0) {
                    lives--;
                    livesElement.textContent = lives;
                    player.health = 100;
                }
            }
            
            // 敌人被撞毁
            explosions.push({
                x: enemies[i].x + enemies[i].width / 2,
                y: enemies[i].y + enemies[i].height / 2,
                radius: 15,
                alpha: 1
            });
            
            score += 10;
            scoreElement.textContent = score;
            enemies.splice(i, 1);

            if (lives <= 0) {
                endGame();
            }
        }
    }
    
    // 玩家与敌方飞船碰撞
    for (let i = enemyShips.length - 1; i >= 0; i--) {
        if (checkLooseCollision(player, enemyShips[i], 0.6)) {
            if (shield > 0) {
                shield -= 20;
                if (shield < 0) shield = 0;
                shieldElement.textContent = shield;
            } else {
                player.health -= 20;
                
                explosions.push({
                    x: player.x,
                    y: player.y,
                    radius: 20,
                    alpha: 1
                });
                
                if (player.health <= 0) {
                    lives--;
                    livesElement.textContent = lives;
                    player.health = 100;
                }
            }
            
            // 敌方飞船被撞毁
            explosions.push({
                x: enemyShips[i].x + enemyShips[i].width / 2,
                y: enemyShips[i].y + enemyShips[i].height / 2,
                radius: 15,
                alpha: 1
            });
            
            score += 12;
            scoreElement.textContent = score;
            enemyShips.splice(i, 1);

            if (lives <= 0) {
                endGame();
            }
        }
    }

    // 玩家与陨石碰撞
    for (let i = meteors.length - 1; i >= 0; i--) {
        if (checkLooseCollision(player, meteors[i], 0.5)) {
            if (shield > 0) {
                shield -= 10;
                if (shield < 0) shield = 0;
                shieldElement.textContent = shield;
            } else {
                player.health -= 10;
                
                explosions.push({
                    x: player.x,
                    y: player.y,
                    radius: 20,
                    alpha: 1
                });
                
                if (player.health <= 0) {
                    lives--;
                    livesElement.textContent = lives;
                    player.health = 100;
                }
            }
            
            // 陨石被撞毁
            explosions.push({
                x: meteors[i].x + meteors[i].width / 2,
                y: meteors[i].y + meteors[i].height / 2,
                radius: 20,
                alpha: 1
            });
            
            score += 8;
            scoreElement.textContent = score;
            meteors.splice(i, 1);

            if (lives <= 0) {
                endGame();
            }
        }
    }
    
    // 玩家与Boss碰撞 - Boss不可被撞击
    for (let i = bosses.length - 1; i >= 0; i--) {
        if (checkLooseCollision(player, bosses[i], 0.7)) {
            if (shield > 0) {
                shield = 0;
                shieldElement.textContent = shield;
            } else {
                player.health = 0;
                
                explosions.push({
                    x: player.x,
                    y: player.y,
                    radius: 25,
                    alpha: 1
                });
                
                lives--;
                livesElement.textContent = lives;
                player.health = 100;
            }
            
            explosions.push({
                x: bosses[i].x + bosses[i].width / 2,
                y: bosses[i].y + bosses[i].height / 2,
                radius: 25,
                alpha: 1
            });

            if (lives <= 0) {
                endGame();
            }
        }
    }
}

// 碰撞检测函数
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function checkLooseCollision(obj1, obj2, factor = 0.7) {
    const width1 = obj1.width * factor;
    const height1 = obj1.height * factor;
    const width2 = obj2.width * factor;
    const height2 = obj2.height * factor;

    return obj1.x < obj2.x + width2 &&
           obj1.x + width1 > obj2.x &&
           obj1.y < obj2.y + height2 &&
           obj1.y + height1 > obj2.y;
}

// 生成敌人
function spawnEnemies() {
    if (Math.random() < 0.008 * level) {
        const size = 50 + Math.random() * 20;
        enemies.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 1 + Math.random() * level * 0.4,
            health: 10,
            type: 'enemy'
        });
    }
}

// 生成敌方飞船
function spawnEnemyShips() {
    if (Math.random() < 0.005 * level) {
        const size = 45 + Math.random() * 15;
        enemyShips.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 1.2 + Math.random() * level * 0.3,
            health: 10,
            shootDelay: 850,
            lastShot: 0,
            type: 'enemyShip'
        });
    }
}

// 生成陨石
function spawnMeteors() {
    if (Math.random() < 0.006 * level) {
        const size = 40 + Math.random() * 30;
        meteors.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 1.5 + Math.random() * level * 0.3,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.04,
            health: 20,
            type: 'meteor'
        });
    }
}

// 检查Boss生成条件
function checkBossSpawn() {
    if (bosses.length === 0 && score >= 2000 + (bossDefeatedCount * 2500)) {
        spawnBoss();
    }
}

// 生成Boss
function spawnBoss() {
    const baseHealth = 500;
    const baseSpeed = 1.5;
    const healthMultiplier = Math.pow(1.45, bossDefeatedCount);
    
    bosses.push({
        x: canvas.width / 2 - 60,
        y: 50,
        width: 120,
        height: 80,
        speedX: baseSpeed,
        health: baseHealth * healthMultiplier,
        maxHealth: baseHealth * healthMultiplier,
        shootDelay: 890,
        lastShot: 0,
        type: 'boss'
    });
    
    // 显示Boss血条
    bossHealthBar.style.display = 'block';
    bossHealthFill.style.width = '100%';
}

// 敌方飞船射击
function enemyShoot(enemy) {
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 4,
        y: enemy.y + enemy.height,
        width: 8,
        height: 16,
        speed: 5,
        damage: 15
    });
}

// Boss射击
function bossShoot(boss) {
    // 伞形发射4颗子弹
    const angles = [Math.PI/6, Math.PI/4, 3*Math.PI/4, 5*Math.PI/6];
    
    angles.forEach(angle => {
        enemyBullets.push({
            x: boss.x + boss.width / 2 - 4,
            y: boss.y + boss.height,
            width: 8,
            height: 16,
            speed: 6,
            damage: 20,
            angle: angle,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4
        });
    });
}

// 玩家射击
function shoot() {
    bullets.push({
        x: player.x + player.width / 2 - 4,
        y: player.y,
        width: 8,
        height: 16,
        speed: 10,
        damage: player.damage
    });
}

// 绘制玩家
function drawPlayer() {
    if (images.player.complete) {
        ctx.drawImage(images.player, player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    } else {
        ctx.fillStyle = '#1e90ff';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - player.height/2);
        ctx.lineTo(player.x - player.width/2, player.y + player.height/2);
        ctx.lineTo(player.x + player.width/2, player.y + player.height/2);
        ctx.closePath();
        ctx.fill();
    }
}

// 绘制子弹
function drawBullets() {
    ctx.fillStyle = '#ffcc00';
    for (const bullet of bullets) {
        if (images.bullet.complete) {
            ctx.drawImage(images.bullet, bullet.x, bullet.y, bullet.width, bullet.height);
        } else {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
}

// 绘制敌人子弹
function drawEnemyBullets() {
    ctx.fillStyle = '#ff3333';
    for (const bullet of enemyBullets) {
        if (bullet.angle) {
            // 有角度的子弹（Boss发射的）
            ctx.save();
            ctx.translate(bullet.x + bullet.width/2, bullet.y + bullet.height/2);
            ctx.rotate(bullet.angle);
            ctx.fillRect(-bullet.width/2, -bullet.height/2, bullet.width, bullet.height);
            ctx.restore();
        } else {
            // 普通子弹
            if (images.bullet.complete) {
                ctx.drawImage(images.bullet, bullet.x, bullet.y, bullet.width, bullet.height);
            } else {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        }
    }
}

// 绘制敌人
function drawEnemies() {
    for (const enemy of enemies) {
        if (images.enemy.complete) {
            ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }
}

// 绘制敌方飞船
function drawEnemyShips() {
    for (const enemy of enemyShips) {
        if (images.enemyShip.complete) {
            ctx.drawImage(images.enemyShip, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = '#ff5500';
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
            ctx.lineTo(enemy.x, enemy.y + enemy.height);
            ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// 绘制陨石
function drawMeteors() {
    for (const meteor of meteors) {
        ctx.save();
        ctx.translate(meteor.x + meteor.width/2, meteor.y + meteor.height/2);
        ctx.rotate(meteor.rotation);
        
        if (images.meteor.complete) {
            ctx.drawImage(images.meteor, -meteor.width/2, -meteor.height/2, meteor.width, meteor.height);
        } else {
            ctx.fillStyle = '#888888';
            ctx.beginPath();
            ctx.arc(0, 0, meteor.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 绘制爆炸效果
function drawExplosions() {
    for (const explosion of explosions) {
        ctx.globalAlpha = explosion.alpha;
        ctx.fillStyle = `hsl(${Math.random() * 30 + 20}, 100%, 60%)`;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// 绘制炸弹
function drawBombs() {
    for (const bomb of bombs) {
        if (images.bomb.complete) {
            ctx.drawImage(images.bomb, bomb.x - bomb.width/2, bomb.y - bomb.height/2, bomb.width, bomb.height);
        } else {
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.arc(bomb.x, bomb.y, bomb.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 绘制Boss
function drawBosses() {
    for (const boss of bosses) {
        if (images.boss.complete) {
            ctx.drawImage(images.boss, boss.x, boss.y, boss.width, boss.height);
        } else {
            ctx.fillStyle = '#9900ff';
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        }
    }
}

// 绘制护盾
function drawShield() {
    if (shield > 0) {
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.5 + 0.5 * Math.sin(Date.now() / 200)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width/2 + 10, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 游戏结束
function endGame() {
    gameRunning = false;
    gameOver = true;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`最终分数: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.fillStyle = '#00ff88';
    ctx.font = '20px Arial';
    ctx.fillText('点击屏幕重新开始', canvas.width / 2, canvas.height / 2 + 70);
}

// 重新开始游戏
function restartGame() {
    if (gameOver) {
        initGame();
    }
}

// 事件监听
startButton.addEventListener('click', initGame);
canvas.addEventListener('click', restartGame);
pauseBtn.addEventListener('click', () => {
    gamePaused = !gamePaused;
    if (!gamePaused && gameRunning) {
        requestAnimationFrame(gameLoop);
    }
});

// 窗口大小调整
window.addEventListener('resize', () => {
    if (gameRunning) {
        setupCanvas();
    }
});

// 初始化
setupCanvas();
startButton.disabled = true;
startButton.textContent = "加载中...";