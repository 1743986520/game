// 虚拟摇杆控制
const joystickBase = document.getElementById('joystickBase');
const joystickHandle = document.getElementById('joystickHandle');
const joystickArea = document.getElementById('joystickArea');

let joystickActive = false;
let joystickCenterX = 0;
let joystickCenterY = 0;
let joystickRadius = 0;

// 初始化摇杆
function initJoystick() {
    const rect = joystickBase.getBoundingClientRect();
    joystickCenterX = rect.left + rect.width / 2;
    joystickCenterY = rect.top + rect.height / 2;
    joystickRadius = rect.width / 2 - 25;
    
    joystickHandle.style.transform = 'translate(0, 0)';
}

// 摇杆触摸开始
joystickArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
});

// 摇杆触摸移动
joystickArea.addEventListener('touchmove', (e) => {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
});

// 摇杆触摸结束
joystickArea.addEventListener('touchend', (e) => {
    joystickActive = false;
    resetJoystick();
});

joystickArea.addEventListener('touchcancel', (e) => {
    joystickActive = false;
    resetJoystick();
});

// 鼠标控制（用于测试）
joystickArea.addEventListener('mousedown', (e) => {
    joystickActive = true;
    updateJoystick(e.clientX, e.clientY);
});

document.addEventListener('mousemove', (e) => {
    if (!joystickActive) return;
    updateJoystick(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => {
    if (joystickActive) {
        joystickActive = false;
        resetJoystick();
    }
});

// 更新摇杆位置
function updateJoystick(x, y) {
    const dx = x - joystickCenterX;
    const dy = y - joystickCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > joystickRadius) {
        const angle = Math.atan2(dy, dx);
        x = joystickCenterX + Math.cos(angle) * joystickRadius;
        y = joystickCenterY + Math.sin(angle) * joystickRadius;
    }
    
    const handleX = x - joystickCenterX;
    const handleY = y - joystickCenterY;
    
    joystickHandle.style.transform = `translate(${handleX}px, ${handleY}px)`;
    
    // 更新玩家移动方向 - 调整灵敏度阈值从0.3改为0.5
    const normalizedX = (x - joystickCenterX) / joystickRadius;
    const normalizedY = (y - joystickCenterY) / joystickRadius;
    
    player.isMovingLeft = normalizedX < -9.0;
    player.isMovingRight = normalizedX > 9.0;
    player.isMovingUp = normalizedY < -9.0;
    player.isMovingDown = normalizedY > 9.0;
}

// 重置摇杆位置
function resetJoystick() {
    joystickHandle.style.transform = 'translate(0, 0)';
    player.isMovingLeft = false;
    player.isMovingRight = false;
    player.isMovingUp = false;
    player.isMovingDown = false;
}

// 初始化摇杆
window.addEventListener('load', initJoystick);
window.addEventListener('resize', initJoystick);