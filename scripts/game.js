// ======================== 圈圈叉叉游戏 ========================
class OOXXGame {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = "X";
    this.isGameOver = false;
    this.mode = "hotseat";
    this.socket = null;
    this.isHost = false;
    this.playerRole = "X";
    this.roomId = "";
    this.connectionEstablished = false;
    this.chat = {
      messages: [],
      chatBox: null,
      chatMessages: null,
      chatInput: null,
      sendChatBtn: null,
      charCount: null,
      chatStatusIndicator: null,
      chatConnectionStatus: null
    };
  }

  init() {
    this.render();
    this.bindEvents();
    this.updatePlayerIndicator();
    this.initChat();
  }

  render() {
    const cells = document.querySelectorAll('.cell');
    
    this.board.forEach((cell, index) => {
      cells[index].className = 'cell';
      if (cell === "X") {
        cells[index].classList.add('X');
        cells[index].textContent = 'X';
      } else if (cell === "O") {
        cells[index].classList.add('O');
        cells[index].textContent = 'O';
      } else {
        cells[index].textContent = '';
      }
      
      // 添加或移除點擊事件
      if (!this.isGameOver && 
          (this.mode === "hotseat" || 
           (this.mode === "pve" && this.currentPlayer === "X") ||
           (this.mode === "online" && this.connectionEstablished && this.currentPlayer === this.playerRole))
      ) {
        cells[index].classList.remove("disabled");
        cells[index].addEventListener('click', (e) => this.handlePlayerMove(e, index));
      } else {
        cells[index].classList.add("disabled");
        cells[index].removeEventListener('click', (e) => this.handlePlayerMove(e, index));
      }
    });
    
    const statusEl = document.getElementById("status");
    statusEl.className = "status";
    
    if (this.isGameOver) {
      const winner = this.getWinner();
      if (winner) {
        statusEl.textContent = `玩家 ${winner} 獲勝！`;
        statusEl.classList.add("win");
      } else {
        statusEl.textContent = "平局！";
        statusEl.classList.add("draw");
      }
    } else {
      if (this.mode === "online" && this.connectionEstablished) {
        if (this.currentPlayer === this.playerRole) {
          statusEl.textContent = `您的回合 (玩家 ${this.currentPlayer})`;
        } else {
          statusEl.textContent = `等待對方玩家下棋 (玩家 ${this.currentPlayer})`;
        }
      } else {
        statusEl.textContent = `玩家 ${this.currentPlayer} 回合`;
      }
    }
  }
  
  updatePlayerIndicator() {
    document.querySelectorAll(".player").forEach(playerEl => {
      playerEl.classList.remove("active");
      if (playerEl.textContent.includes(this.currentPlayer)) {
        playerEl.classList.add("active");
      }
      
      // 在線上模式顯示玩家角色
      if (this.mode === "online" && this.connectionEstablished) {
        if (playerEl.classList.contains("X") && this.playerRole === "X") {
          playerEl.textContent = "您 (X)";
        } else if (playerEl.classList.contains("O") && this.playerRole === "O") {
          playerEl.textContent = "您 (O)";
        } else if (playerEl.classList.contains("X") && this.playerRole === "O") {
          playerEl.textContent = "對手 (X)";
        } else if (playerEl.classList.contains("O") && this.playerRole === "X") {
          playerEl.textContent = "對手 (O)";
        }
      } else {
        // 非線上模式恢復默認顯示
        if (playerEl.classList.contains("X")) {
          playerEl.textContent = "玩家 X";
        } else {
          playerEl.textContent = "玩家 O";
        }
      }
    });
  }

  handlePlayerMove(e, index) {
    // 在线模式验证：确保玩家只能在自己的回合操作
    if (this.mode === "online" && this.currentPlayer !== this.playerRole) {
      return;
    }
    
    if (this.board[index] !== null || this.isGameOver) return;
    
    this.board[index] = this.currentPlayer;
    
    if (this.mode === "online" && this.socket && this.socket.readyState === WebSocket.OPEN) {
      // 发送极简指令：位置索引
      this.socket.send(JSON.stringify({
        type: "move",
        pos: index,
        player: this.currentPlayer
      }));
    }
    
    if (this.checkWin(this.currentPlayer)) {
      this.isGameOver = true;
      this.render();
      return;
    }
    
    if (this.checkDraw()) {
      this.isGameOver = true;
      this.render();
      return;
    }
    
    // 切换玩家
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    
    // 如果是单人模式，轮到AI
    if (this.mode === "pve" && this.currentPlayer === "O") {
      this.render();
      this.updatePlayerIndicator();
      setTimeout(() => this.aiMove(), 500);
    } else {
      this.render();
      this.updatePlayerIndicator();
    }
  }

  aiMove() {
    if (this.isGameOver) return;
    
    const winPos = this.findWinOrBlock("O");
    if (winPos !== -1) {
      this.board[winPos] = "O";
      if (this.checkWin("O")) {
        this.isGameOver = true;
      } else if (this.checkDraw()) {
        this.isGameOver = true;
      } else {
        this.currentPlayer = "X";
      }
      this.render();
      this.updatePlayerIndicator();
      return;
    }
    
    const blockPos = this.findWinOrBlock("X");
    if (blockPos !== -1) {
      this.board[blockPos] = "O";
      if (this.checkWin("O")) {
        this.isGameOver = true;
      } else if (this.checkDraw()) {
        this.isGameOver = true;
      } else {
        this.currentPlayer = "X";
      }
      this.render();
      this.updatePlayerIndicator();
      return;
    }
    
    if (this.board[4] === null) {
      this.board[4] = "O";
      if (this.checkWin("O")) {
        this.isGameOver = true;
      } else if (this.checkDraw()) {
        this.isGameOver = true;
      } else {
        this.currentPlayer = "X";
      }
      this.render();
      this.updatePlayerIndicator();
      return;
    }
    
    const corners = [0, 2, 6, 8].filter(i => this.board[i] === null);
    if (corners.length > 0) {
      const corner = corners[Math.floor(Math.random() * corners.length)];
      this.board[corner] = "O";
      if (this.checkWin("O")) {
        this.isGameOver = true;
      } else if (this.checkDraw()) {
        this.isGameOver = true;
      } else {
        this.currentPlayer = "X";
      }
      this.render();
      this.updatePlayerIndicator();
      return;
    }
    
    const edges = [1, 3, 5, 7].filter(i => this.board[i] === null);
    if (edges.length > 0) {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      this.board[edge] = "O";
      if (this.checkWin("O")) {
        this.isGameOver = true;
      } else if (this.checkDraw()) {
        this.isGameOver = true;
      } else {
        this.currentPlayer = "X";
      }
      this.render();
      this.updatePlayerIndicator();
    }
  }

  checkWin(player) {
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    return winPatterns.some(pattern => 
      pattern.every(index => this.board[index] === player)
    );
  }

  checkDraw() {
    return this.board.every(cell => cell !== null);
  }

  findWinOrBlock(player) {
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        this.board[a] === player && 
        this.board[b] === player && 
        this.board[c] === null
      ) return c;
      if (
        this.board[a] === player && 
        this.board[c] === player && 
        this.board[b] === null
      ) return b;
      if (
        this.board[b] === player && 
        this.board[c] === player && 
        this.board[a] === null
      ) return a;
    }
    return -1;
  }

  getWinner() {
    if (this.checkWin("X")) return "X";
    if (this.checkWin("O")) return "O";
    return null;
  }

  reset() {
    this.board = Array(9).fill(null);
    this.isGameOver = false;
    
    // 重置玩家順序，主機永遠是X，客戶端永遠是O
    if (this.mode === "online" && this.connectionEstablished) {
      this.currentPlayer = "X"; // 總是從X開始
      
      // 發送重置指令
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ 
          type: "reset",
          role: this.playerRole
        }));
      }
    } else {
      this.currentPlayer = "X";
    }
    
    this.updatePlayerIndicator();
    this.render();
  }

  switchMode(mode) {
    this.mode = mode;
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.classList.remove("active");
      if (btn.dataset.mode === mode) {
        btn.classList.add("active");
      }
    });
    
    const connectionPanel = document.getElementById("connectionPanel");
    if (mode === "online") {
      connectionPanel.style.display = "block";
      this.chat.show();
      this.resetConnectionUI();
    } else {
      connectionPanel.style.display = "none";
      this.chat.hide();
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      this.connectionEstablished = false;
      this.updateConnectionStatus("未連接", "disconnected");
    }
    
    this.reset();
  }

  resetConnectionUI() {
    document.getElementById("roomId").value = "";
    this.updateConnectionStatus("未連接", "disconnected");
  }

  initWebSocket() {
    document.getElementById("createRoom").addEventListener("click", () => {
      this.createRoom();
    });
    
    document.getElementById("joinRoom").addEventListener("click", () => {
      this.joinRoom();
    });
  }

  createRoom() {
    this.isHost = true;
    this.playerRole = "X";
    this.resetConnectionUI();
    
    // 生成隨機房間號
    this.roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    document.getElementById("roomId").value = this.roomId;
    
    // 連接到 WebSocket 服務器
    const wsServer = "wss://hongyuwei.onrender.com";
    console.log("正在连接到:", wsServer);
    
    this.socket = new WebSocket(wsServer);
    
    this.socket.onopen = () => {
      console.log("WebSocket连接已建立");
      this.socket.send(JSON.stringify({ 
        type: "create", 
        roomId: this.roomId 
      }));
      this.updateConnectionStatus("等待玩家加入房間 " + this.roomId, "connecting");
    };
    
    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleSocketMessage(msg);
    };
    
    this.socket.onclose = () => {
      console.log("WebSocket连接已关闭");
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接關閉", "disconnected");
    };
    
    this.socket.onerror = (err) => {
      console.error("WebSocket錯誤:", err);
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接錯誤", "disconnected");
    };
  }

  joinRoom() {
    this.isHost = false;
    this.playerRole = "O";
    this.roomId = document.getElementById("roomId").value.trim();
    if (!this.roomId) {
      alert("請輸入房間號");
      return;
    }
    
    const wsServer = "wss://hongyuwei.onrender.com";
    console.log("正在连接到:", wsServer);
    
    this.socket = new WebSocket(wsServer);
    
    this.socket.onopen = () => {
      console.log("WebSocket连接已建立");
      this.socket.send(JSON.stringify({ 
        type: "join", 
        roomId: this.roomId 
      }));
      this.updateConnectionStatus("正在加入房間 " + this.roomId, "connecting");
    };
    
    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleSocketMessage(msg);
    };
    
    this.socket.onclose = () => {
      console.log("WebSocket连接已关闭");
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接關閉", "disconnected");
    };
    
    this.socket.onerror = (err) => {
      console.error("WebSocket錯誤:", err);
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接錯誤", "disconnected");
    };
  }

  handleSocketMessage(msg) {
    console.log("收到服务器消息:", msg);
    
    switch (msg.type) {
      case "room_created":
        this.updateConnectionStatus("房間已創建，等待玩家加入", "connecting");
        break;
        
      case "room_joined":
        this.connectionEstablished = true;
        this.updateConnectionStatus("已加入房間，等待開始", "connected");
        this.playerRole = msg.role;
        this.updatePlayerIndicator();
        break;
        
      case "player_joined":
        this.connectionEstablished = true;
        this.updateConnectionStatus("對方玩家已加入", "connected");
        this.render();
        break;
        
      case "move":
        if (msg.pos !== undefined) {
          // 更新棋盘
          this.board[msg.pos] = msg.player;
          
          // 检查游戏状态
          if (this.checkWin(msg.player)) {
            this.isGameOver = true;
          } else if (this.checkDraw()) {
            this.isGameOver = true;
          } else {
            // 切换当前玩家
            this.currentPlayer = msg.player === "X" ? "O" : "X";
          }
          
          this.render();
          this.updatePlayerIndicator();
        }
        break;
        
      case "reset":
        // 重置遊戲狀態
        this.board = Array(9).fill(null);
        this.isGameOver = false;
        
        // 確保主機永遠是X，客戶端永遠是O
        if (this.isHost) {
          this.playerRole = "X";
          this.currentPlayer = "X";
        } else {
          this.playerRole = "O";
          this.currentPlayer = "X"; // 總是從X開始
        }
        
        this.render();
        this.updatePlayerIndicator();
        break;
        
      case "chat":
        this.chat.handleChatMessage(msg.sender, msg.message);
        break;
        
      case "error":
        alert("錯誤: " + msg.message);
        this.connectionEstablished = false;
        this.updateConnectionStatus("連接錯誤", "disconnected");
        break;
    }
  }

  updateConnectionStatus(text, status) {
    console.log("更新连接状态:", text, status);
    document.getElementById("connectionStatus").textContent = text;
    const indicator = document.getElementById("statusIndicator");
    indicator.className = "status-indicator";
    
    if (status === "connecting") {
      indicator.classList.add("connecting");
    } else if (status === "connected") {
      indicator.classList.add("connected");
    }
  }

  bindEvents() {
    document.getElementById("reset").addEventListener("click", () => this.reset());
    
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", () => this.switchMode(btn.dataset.mode));
    });
    
    document.getElementById("backToLobby").addEventListener("click", () => {
      if (this.socket) {
        this.socket.close();
      }
      window.location.href = "index.html";
    });
    
    this.initWebSocket();
  }
  
  // 聊天功能
  initChat() {
    this.chat.messages = [];
    this.chat.chatBox = document.getElementById("chatBox");
    this.chat.chatMessages = document.getElementById("chatMessages");
    this.chat.chatInput = document.getElementById("chatInput");
    this.chat.sendChatBtn = document.getElementById("sendChat");
    this.chat.charCount = document.getElementById("charCount");
    this.chat.chatStatusIndicator = document.getElementById("chatStatusIndicator");
    this.chat.chatConnectionStatus = document.getElementById("chatConnectionStatus");
    
    // 绑定事件
    this.chat.sendChatBtn.addEventListener("click", () => this.sendMessage());
    this.chat.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
    
    // 字符计数
    this.chat.chatInput.addEventListener("input", () => {
      const length = this.chat.chatInput.value.length;
      this.chat.charCount.textContent = `${length}/30`;
      this.chat.charCount.className = "char-count";
      
      if (length > 25) this.chat.charCount.classList.add("warning");
      if (length > 29) this.chat.charCount.classList.add("error");
    });
  }
  
  // 显示聊天框
  showChat() {
    this.chat.chatBox.style.display = "block";
  }
  
  // 隐藏聊天框
  hideChat() {
    this.chat.chatBox.style.display = "none";
  }
  
  // 发送消息
  sendMessage() {
    const message = this.chat.chatInput.value.trim();
    if (!message) return;
    
    if (message.length > 30) {
      alert("消息不能超过30个字符");
      return;
    }
    
    // 添加到本地消息列表
    this.addMessage("你", message, true);
    this.chat.chatInput.value = "";
    this.chat.charCount.textContent = "0/30";
    this.chat.charCount.className = "char-count";
    
    if (this.mode === "online" && this.connectionEstablished) {
      // 发送到游戏服务器
      this.socket.send(JSON.stringify({
        type: "chat",
        sender: this.playerRole,
        message: message
      }));
    } else {
      // 本地模式直接显示
      setTimeout(() => {
        this.addMessage("對手", "已收到消息", false);
      }, 1000);
    }
  }
  
  // 添加消息到聊天框
  addMessage(sender, message, isSelf) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${isSelf ? "self" : "opponent"}`;
    messageEl.textContent = `${sender}: ${message}`;
    this.chat.chatMessages.appendChild(messageEl);
    
    // 自动滚动到底部
    this.chat.chatMessages.scrollTop = this.chat.chatMessages.scrollHeight;
  }
  
  // 处理收到的消息
  handleChatMessage(sender, message) {
    const isSelf = sender === this.playerRole;
    this.addMessage(isSelf ? "你" : "對手", message, isSelf);
  }
}

// ======================== 象棋游戏 ========================
class ChessGame {
  constructor() {
    this.board = []; // 棋盤狀態
    this.currentPlayer = "red"; // 當前玩家
    this.selectedPiece = null; // 選中的棋子
    this.mode = "hotseat"; // 模式
    this.socket = null; // WebSocket連接
    this.isHost = false; // 是否為房主
    this.playerRole = "red"; // 玩家角色
    this.roomId = ""; // 房間ID
    this.connectionEstablished = false; // 是否已連接
    this.chat = {
      messages: [],
      chatBox: null,
      chatMessages: null,
      chatInput: null,
      sendChatBtn: null,
      charCount: null,
      chatStatusIndicator: null,
      chatConnectionStatus: null
    };

    // 棋子類型
    this.pieces = {
      king: { name: "帥", char: "帥", value: 1000 },
      guard: { name: "仕", char: "仕", value: 20 },
      bishop: { name: "相", char: "相", value: 20 },
      knight: { name: "馬", char: "傌", value: 40 },
      rook: { name: "車", char: "俥", value: 90 },
      cannon: { name: "炮", char: "炮", value: 45 },
      pawn: { name: "兵", char: "兵", value: 10 }
    };
  }

  // 初始化遊戲
  init() {
    this.createBoard();
    this.setupPieces();
    this.bindEvents();
    this.initChat();
  }

  // 創建棋盤
  createBoard() {
    const board = document.getElementById("chessBoard");
    board.innerHTML = "";
    
    // 創建10行9列的棋盤
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement("div");
        cell.className = "chess-cell";
        cell.dataset.row = row;
        cell.dataset.col = col;
        board.appendChild(cell);
      }
      
      // 在第5行插入楚河漢界
      if (row === 4) {
        const river = document.createElement("div");
        river.className = "river";
        river.textContent = "楚河　　　　　　　　漢界";
        board.appendChild(river);
      }
    }
    
    // 添加九宮格標記
    this.addPalaceMarks();
  }

  // 添加九宮格標記
  addPalaceMarks() {
    const marks = [
      // 紅方九宮格
      { row: 0, col: 3, type: "top-left" },
      { row: 0, col: 5, type: "top-right" },
      { row: 2, col: 3, type: "bottom-left" },
      { row: 2, col: 5, type: "bottom-right" },
      
      // 黑方九宮格
      { row: 7, col: 3, type: "top-left" },
      { row: 7, col: 5, type: "top-right" },
      { row: 9, col: 3, type: "bottom-left" },
      { row: 9, col: 5, type: "bottom-right" }
    ];
    
    marks.forEach(mark => {
      const cell = document.querySelector(`.chess-cell[data-row="${mark.row}"][data-col="${mark.col}"]`);
      if (cell) {
        const markEl = document.createElement("div");
        markEl.className = `palace-mark ${mark.type}`;
        cell.appendChild(markEl);
      }
    });
  }

  // 設置棋子
  setupPieces() {
    // 初始化棋盤陣列
    this.board = Array(10).fill().map(() => Array(9).fill(null));
    
    // 擺放棋子
    // 紅方
    this.board[0][0] = { type: "rook", player: "red" };
    this.board[0][1] = { type: "knight", player: "red" };
    this.board[0][2] = { type: "bishop", player: "red" };
    this.board[0][3] = { type: "guard", player: "red" };
    this.board[0][4] = { type: "king", player: "red" };
    this.board[0][5] = { type: "guard", player: "red" };
    this.board[0][6] = { type: "bishop", player: "red" };
    this.board[0][7] = { type: "knight", player: "red" };
    this.board[0][8] = { type: "rook", player: "red" };
    this.board[2][1] = { type: "cannon", player: "red" };
    this.board[2][7] = { type: "cannon", player: "red" };
    this.board[3][0] = { type: "pawn", player: "red" };
    this.board[3][2] = { type: "pawn", player: "red" };
    this.board[3][4] = { type: "pawn", player: "red" };
    this.board[3][6] = { type: "pawn", player: "red" };
    this.board[3][8] = { type: "pawn", player: "red" };
    
    // 黑方
    this.board[9][0] = { type: "rook", player: "black" };
    this.board[9][1] = { type: "knight", player: "black" };
    this.board[9][2] = { type: "bishop", player: "black" };
    this.board[9][3] = { type: "guard", player: "black" };
    this.board[9][4] = { type: "king", player: "black" };
    this.board[9][5] = { type: "guard", player: "black" };
    this.board[9][6] = { type: "bishop", player: "black" };
    this.board[9][7] = { type: "knight", player: "black" };
    this.board[9][8] = { type: "rook", player: "black" };
    this.board[7][1] = { type: "cannon", player: "black" };
    this.board[7][7] = { type: "cannon", player: "black" };
    this.board[6][0] = { type: "pawn", player: "black" };
    this.board[6][2] = { type: "pawn", player: "black" };
    this.board[6][4] = { type: "pawn", player: "black" };
    this.board[6][6] = { type: "pawn", player: "black" };
    this.board[6][8] = { type: "pawn", player: "black" };
    
    // 渲染棋子到棋盤
    this.updateBoard();
  }

  // 更新棋盤顯示
  updateBoard() {
    const cells = document.querySelectorAll('.chess-cell');
    cells.forEach(cell => {
      cell.innerHTML = '';
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const piece = this.board[row][col];
      
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `chess-piece ${piece.player}`;
        pieceEl.textContent = this.pieces[piece.type].char;
        pieceEl.dataset.row = row;
        pieceEl.dataset.col = col;
        pieceEl.title = `${piece.player === "red" ? "红方" : "黑方"}${this.pieces[piece.type].name}`;
        cell.appendChild(pieceEl);
      }
      
      // 添加九宮格標記（如果有的話）
      if (cell.querySelector('.palace-mark')) {
        const mark = cell.querySelector('.palace-mark').cloneNode(true);
        cell.appendChild(mark);
      }
      
      // 添加横线
      if (row < 9) {
        const line = document.createElement('div');
        line.className = 'horizontal-line';
        cell.appendChild(line);
      }
      
      // 添加竖线
      if (col < 8) {
        const line = document.createElement('div');
        line.className = 'vertical-line';
        cell.appendChild(line);
      }
    });
  }

  // 事件綁定
  bindEvents() {
    const board = document.getElementById("chessBoard");
    board.addEventListener('click', (e) => {
      const piece = e.target.closest('.chess-piece');
      const cell = e.target.closest('.chess-cell');
      
      if (piece) {
        this.handlePieceClick(piece);
      } else if (cell) {
        this.handleCellClick(cell);
      }
    });
    
    document.getElementById("reset").addEventListener('click', () => {
      this.reset();
    });
    
    document.getElementById("backToLobby").addEventListener("click", () => {
      if (this.socket) {
        this.socket.close();
      }
      window.location.href = "index.html";
    });
    
    // 模式切换事件
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", () => this.switchMode(btn.dataset.mode));
    });
    
    // WebSocket初始化
    this.initWebSocket();
  }

  // 點擊棋子
  handlePieceClick(piece) {
    const row = parseInt(piece.dataset.row);
    const col = parseInt(piece.dataset.col);
    const pieceData = this.board[row][col];
    
    // 只能選擇當前玩家的棋子
    if (pieceData.player === this.currentPlayer) {
      this.selectedPiece = { row, col, piece: pieceData };
      // 高亮選中的棋子
      this.clearSelection();
      piece.classList.add("selected");
    }
  }

  // 點擊格子
  handleCellClick(cell) {
    if (!this.selectedPiece) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // 移動棋子
    this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
  }

  // 移動棋子
  movePiece(fromRow, fromCol, toRow, toCol) {
    // 檢查移動是否合法（這裡省略，只做簡單移動）
    const targetPiece = this.board[toRow][toCol];
    
    // 檢查是否為自己的棋子
    if (targetPiece && targetPiece.player === this.currentPlayer) {
      // 點擊自己的棋子，切換選擇
      this.selectedPiece = { row: toRow, col: toCol, piece: targetPiece };
      this.clearSelection();
      document.querySelector(`.chess-piece[data-row="${toRow}"][data-col="${toCol}"]`).classList.add("selected");
      return;
    }
    
    // 吃子邏輯
    if (targetPiece && targetPiece.player !== this.currentPlayer) {
      // 吃子
      this.board[toRow][toCol] = this.board[fromRow][fromCol];
      this.board[fromRow][fromCol] = null;
    } else {
      // 移動到空位
      this.board[toRow][toCol] = this.board[fromRow][fromCol];
      this.board[fromRow][fromCol] = null;
    }
    
    this.selectedPiece = null;
    this.clearSelection();
    
    // 切換玩家
    this.currentPlayer = this.currentPlayer === "red" ? "black" : "red";
    this.updatePlayerIndicator();
    this.updateBoard();
  }

  // 清除選中狀態
  clearSelection() {
    document.querySelectorAll('.chess-piece').forEach(p => {
      p.classList.remove("selected");
    });
  }

  // 更新玩家指示器
  updatePlayerIndicator() {
    document.querySelectorAll(".player").forEach(playerEl => {
      playerEl.classList.remove("active");
      if (playerEl.classList.contains(this.currentPlayer)) {
        playerEl.classList.add("active");
      }
    });
    document.getElementById("status").textContent = `${this.currentPlayer === "red" ? "紅方" : "黑方"}回合`;
  }

  // 重置遊戲
  reset() {
    this.selectedPiece = null;
    this.currentPlayer = "red";
    this.clearSelection();
    this.setupPieces();
    this.updatePlayerIndicator();
  }
  
  // 切換遊戲模式
  switchMode(mode) {
    this.mode = mode;
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.classList.remove("active");
      if (btn.dataset.mode === mode) {
        btn.classList.add("active");
      }
    });
    
    const connectionPanel = document.getElementById("connectionPanel");
    if (mode === "online") {
      connectionPanel.style.display = "block";
      this.resetConnectionUI();
      this.showChat();
    } else {
      connectionPanel.style.display = "none";
      this.hideChat();
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      this.connectionEstablished = false;
      this.updateConnectionStatus("未連接", "disconnected");
    }
    
    this.reset();
  }
  
  // 初始化WebSocket
  initWebSocket() {
    document.getElementById("createRoom").addEventListener("click", () => {
      this.createRoom();
    });
    
    document.getElementById("joinRoom").addEventListener("click", () => {
      this.joinRoom();
    });
  }
  
  // 創建房間
  createRoom() {
    this.isHost = true;
    this.playerRole = "red";
    this.resetConnectionUI();
    
    // 生成隨機房間號
    this.roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    document.getElementById("roomId").value = this.roomId;
    
    // 連接到 WebSocket 服務器
    const wsServer = "wss://hongyuwei.onrender.com";
    console.log("正在连接到:", wsServer);
    
    this.socket = new WebSocket(wsServer);
    
    this.socket.onopen = () => {
      console.log("WebSocket连接已建立");
      this.socket.send(JSON.stringify({ 
        type: "create", 
        roomId: this.roomId,
        game: "chess"
      }));
      this.updateConnectionStatus("等待玩家加入房間 " + this.roomId, "connecting");
    };
    
    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleSocketMessage(msg);
    };
    
    this.socket.onclose = () => {
      console.log("WebSocket连接已关闭");
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接關閉", "disconnected");
    };
    
    this.socket.onerror = (err) => {
      console.error("WebSocket錯誤:", err);
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接錯誤", "disconnected");
    };
  }
  
  // 加入房間
  joinRoom() {
    this.isHost = false;
    this.playerRole = "black";
    this.roomId = document.getElementById("roomId").value.trim();
    if (!this.roomId) {
      alert("請輸入房間號");
      return;
    }
    
    const wsServer = "wss://hongyuwei.onrender.com";
    console.log("正在连接到:", wsServer);
    
    this.socket = new WebSocket(wsServer);
    
    this.socket.onopen = () => {
      console.log("WebSocket连接已建立");
      this.socket.send(JSON.stringify({ 
        type: "join", 
        roomId: this.roomId,
        game: "chess"
      }));
      this.updateConnectionStatus("正在加入房間 " + this.roomId, "connecting");
    };
    
    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleSocketMessage(msg);
    };
    
    this.socket.onclose = () => {
      console.log("WebSocket连接已关闭");
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接關閉", "disconnected");
    };
    
    this.socket.onerror = (err) => {
      console.error("WebSocket錯誤:", err);
      this.connectionEstablished = false;
      this.updateConnectionStatus("服務器連接錯誤", "disconnected");
    };
  }
  
  // 處理WebSocket消息
  handleSocketMessage(msg) {
    console.log("收到服务器消息:", msg);
    
    switch (msg.type) {
      case "room_created":
        this.updateConnectionStatus("房間已創建，等待玩家加入", "connecting");
        break;
        
      case "room_joined":
        this.connectionEstablished = true;
        this.updateConnectionStatus("已加入房間，等待開始", "connected");
        this.playerRole = msg.role;
        this.updatePlayerIndicator();
        break;
        
      case "player_joined":
        this.connectionEstablished = true;
        this.updateConnectionStatus("對方玩家已加入", "connected");
        break;
        
      case "move":
        // 處理移動消息
        break;
        
      case "reset":
        // 處理重置消息
        break;
        
      case "chat":
        this.handleChatMessage(msg.sender, msg.message);
        break;
        
      case "error":
        alert("錯誤: " + msg.message);
        this.connectionEstablished = false;
        this.updateConnectionStatus("連接錯誤", "disconnected");
        break;
    }
  }
  
  // 更新連接狀態
  updateConnectionStatus(text, status) {
    document.getElementById("connectionStatus").textContent = text;
    const indicator = document.getElementById("statusIndicator");
    indicator.className = "status-indicator";
    
    if (status === "connecting") {
      indicator.classList.add("connecting");
    } else if (status === "connected") {
      indicator.classList.add("connected");
    }
  }
  
  // 重置連接UI
  resetConnectionUI() {
    document.getElementById("roomId").value = "";
    this.updateConnectionStatus("未連接", "disconnected");
  }
  
  // 聊天功能
  initChat() {
    this.chat.messages = [];
    this.chat.chatBox = document.getElementById("chatBox");
    this.chat.chatMessages = document.getElementById("chatMessages");
    this.chat.chatInput = document.getElementById("chatInput");
    this.chat.sendChatBtn = document.getElementById("sendChat");
    this.chat.charCount = document.getElementById("charCount");
    this.chat.chatStatusIndicator = document.getElementById("chatStatusIndicator");
    this.chat.chatConnectionStatus = document.getElementById("chatConnectionStatus");
    
    // 绑定事件
    this.chat.sendChatBtn.addEventListener("click", () => this.sendMessage());
    this.chat.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
    
    // 字符计数
    this.chat.chatInput.addEventListener("input", () => {
      const length = this.chat.chatInput.value.length;
      this.chat.charCount.textContent = `${length}/30`;
      this.chat.charCount.className = "char-count";
      
      if (length > 25) this.chat.charCount.classList.add("warning");
      if (length > 29) this.chat.charCount.classList.add("error");
    });
  }
  
  // 显示聊天框
  showChat() {
    this.chat.chatBox.style.display = "block";
  }
  
  // 隐藏聊天框
  hideChat() {
    this.chat.chatBox.style.display = "none";
  }
  
  // 发送消息
  sendMessage() {
    const message = this.chat.chatInput.value.trim();
    if (!message) return;
    
    if (message.length > 30) {
      alert("消息不能超过30个字符");
      return;
    }
    
    // 添加到本地消息列表
    this.addMessage("你", message, true);
    this.chat.chatInput.value = "";
    this.chat.charCount.textContent = "0/30";
    this.chat.charCount.className = "char-count";
    
    if (this.mode === "online" && this.connectionEstablished) {
      // 发送到游戏服务器
      this.socket.send(JSON.stringify({
        type: "chat",
        sender: this.playerRole,
        message: message
      }));
    } else {
      // 本地模式直接显示
      setTimeout(() => {
        this.addMessage("對手", "已收到消息", false);
      }, 1000);
    }
  }
  
  // 添加消息到聊天框
  addMessage(sender, message, isSelf) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${isSelf ? "self" : "opponent"}`;
    messageEl.textContent = `${sender}: ${message}`;
    this.chat.chatMessages.appendChild(messageEl);
    
    // 自动滚动到底部
    this.chat.chatMessages.scrollTop = this.chat.chatMessages.scrollHeight;
  }
  
  // 处理收到的消息
  handleChatMessage(sender, message) {
    const isSelf = sender === this.playerRole;
    this.addMessage(isSelf ? "你" : "對手", message, isSelf);
  }
}