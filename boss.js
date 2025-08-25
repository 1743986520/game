// Boss系统
let bossDefeatedCount = 0;

// 更新Boss子弹位置（覆盖原有的updateEnemyBullets）
const originalUpdateEnemyBullets = updateEnemyBullets;
updateEnemyBullets = function() {
    originalUpdateEnemyBullets();
    
    // 更新Boss发射的有角度子弹
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (enemyBullets[i].angle) {
            enemyBullets[i].x += enemyBullets[i].vx;
            enemyBullets[i].y += enemyBullets[i].vy;
            
            // 移除超出屏幕的子弹
            if (enemyBullets[i].y > canvas.height || 
                enemyBullets[i].x < 0 || 
                enemyBullets[i].x > canvas.width) {
                enemyBullets.splice(i, 1);
            }
        }
    }
};

// 扩展checkCollisions以处理Boss子弹
const originalCheckCollisions = checkCollisions;
checkCollisions = function() {
    originalCheckCollisions();
    
    // Boss子弹与玩家碰撞
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (enemyBullets[i].angle && checkCollision(enemyBullets[i], player)) {
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
};