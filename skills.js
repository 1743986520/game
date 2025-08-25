// 技能系统
const aBtn = document.getElementById('aBtn');
const bBtn = document.getElementById('bBtn');

let aCooldown = 0;
let bCooldown = 0;
let aCooldownOverlay = null;
let bCooldownOverlay = null;

// 初始化技能按钮
function initSkills() {
    // 创建冷却覆盖层
    aCooldownOverlay = document.createElement('div');
    aCooldownOverlay.className = 'cooldownOverlay';
    aCooldownOverlay.style.height = '0%';
    aBtn.appendChild(aCooldownOverlay);
    
    bCooldownOverlay = document.createElement('div');
    bCooldownOverlay.className = 'cooldownOverlay';
    bCooldownOverlay.style.height = '0%';
    bBtn.appendChild(bCooldownOverlay);
    
    // 添加触摸/点击事件
    aBtn.addEventListener('touchstart', useASkill, {passive: true});
    aBtn.addEventListener('mousedown', useASkill);
    
    bBtn.addEventListener('touchstart', useBSkill, {passive: true});
    bBtn.addEventListener('mousedown', useBSkill);
    
    // 开始冷却计时
    setInterval(updateCooldowns, 100);
}

// 使用A技能 - 发射10枚追踪炸弹
function useASkill() {
    if (aCooldown > 0 || !gameRunning || gamePaused) return;
    
    // 找到血量最高的敌人
    let highestHealth = 0;
    let target = null;
    
    // 检查所有敌人类型
    for (const enemy of [...enemies, ...enemyShips, ...bosses]) {
        if (enemy.health > highestHealth) {
            highestHealth = enemy.health;
            target = enemy;
        }
    }
    
    // 发射10枚炸弹
    for (let i = 0; i < 10; i++) {
        bombs.push({
            x: player.x + (Math.random() - 0.5) * 20,
            y: player.y,
            width: 15,
            height: 15,
            speed: 3,
            damage: 10,
            target: target
        });
    }
    
    // 设置冷却时间
    aCooldown = 30; // 30秒
    
    // 播放声音效果（如果有）
    // playSound('bomb');
}

// 使用B技能 - 生成护盾
function useBSkill() {
    if (bCooldown > 0 || !gameRunning || gamePaused) return;
    
    // 生成60点护盾
    shield = 60;
    shieldElement.textContent = shield;
    
    // 设置冷却时间
    bCooldown = 60; // 60秒
    
    // 播放声音效果（如果有）
    // playSound('shield');
}

// 更新技能冷却
function updateCooldowns() {
    if (aCooldown > 0) {
        aCooldown -= 0.1;
        if (aCooldown < 0) aCooldown = 0;
        aCooldownOverlay.style.height = `${(aCooldown / 30) * 100}%`;
    }
    
    if (bCooldown > 0) {
        bCooldown -= 0.1;
        if (bCooldown < 0) bCooldown = 0;
        bCooldownOverlay.style.height = `${(bCooldown / 60) * 100}%`;
    }
}

// 重置技能冷却
function resetSkillCooldowns() {
    aCooldown = 0;
    bCooldown = 0;
    aCooldownOverlay.style.height = '0%';
    bCooldownOverlay.style.height = '0%';
}

// 初始化技能系统
window.addEventListener('load', initSkills);

// 暴露给全局作用域
window.resetSkillCooldowns = resetSkillCooldowns;