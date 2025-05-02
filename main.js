// main.js

const { createApp } = Vue;

createApp({
  data() {
    return {
      ws: null,
      stage: 'nick',        // 'nick' → lobby → challenge → game
      nickname: '',
      nickError: '',
      users: [],            // other nicknames in the lobby
      incoming: null,       // { from } when someone challenges you
      symbol: null,         // 'X' or 'O' assigned by server
      board: Array(9).fill(null),
      turn: null,           // whose turn it is
      finished: false,
      winner: null          // 'X', 'O', or 'draw'
    };
  },
  mounted() {
    this.ws = new WebSocket(`ws://${location.host}`);
    this.ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      switch (msg.type) {
        case 'nick_ok':
          this.stage = 'lobby';
          break;
        case 'nick_error':
          this.nickError = msg.error;
          break;
        case 'user_list':
          this.users = msg.users.filter(n => n !== this.nickname);
          break;
        case 'challenge_request':
          this.incoming = { from: msg.from };
          this.stage = 'challenge';
          break;
        case 'challenge_declined':
          alert(`${msg.from} declined your request.`);
          break;
        case 'init':
          this.stage = 'game';
          this.symbol = msg.symbol;
          break;
        case 'state':
          Object.assign(this, {
            board:    msg.board,
            turn:     msg.turn,
            finished: msg.finished,
            winner:   msg.winner
          });
          break;
        case 'opponent_left':
          alert('Opponent disconnected.');
          window.location.reload();
          break;
      }
    };
  },
  methods: {
    setNick() {
      if (!this.nickname.trim()) {
        this.nickError = 'Enter a nickname';
        return;
      }
      this.ws.send(JSON.stringify({
        type:     'set_nick',
        nickname: this.nickname
      }));
    },
    sendChallenge(to) {
      this.ws.send(JSON.stringify({ type: 'challenge', to }));
      alert(`Challenge sent to ${to}`);
    },
    respondChallenge(accept) {
      this.ws.send(JSON.stringify({
        type:   'challenge_response',
        from:   this.incoming.from,
        accept
      }));
      if (!accept) {
        this.stage    = 'lobby';
        this.incoming = null;
      }
    },
    play(i) {
      this.ws.send(JSON.stringify({ type: 'move', index: i }));
    },
    reset() {
      this.ws.send(JSON.stringify({ type: 'reset_game' }));
    }
  },
  template: `
    <div>
      <div v-if="stage==='nick'" class="join">
        <input v-model="nickname" class="nickname-input" placeholder="Pick a nickname" />
        <button @click="setNick" class="enter-button">Enter Lobby</button>
        <p v-if="nickError" style="color:red;margin-top:.5rem">{{ nickError }}</p>
      </div>

      <div v-else-if="stage==='lobby'" class="lobby">
        <h2>Lobby</h2>
        <ul class="user-list">
          <li v-for="u in users" :key="u" class="user-item">
            <span>{{ u }}</span>
            <button class="challenge-button" @click="sendChallenge(u)">Challenge</button>
          </li>
        </ul>
      </div>

      <div v-else-if="stage==='challenge'" class="challenge">
        <p><strong>{{ incoming.from }}</strong> wants to play!</p>
        <button @click="respondChallenge(true)" class="enter-button">Accept</button>
        <button @click="respondChallenge(false)" 
                class="enter-button" 
                style="background:#ccc;color:#333;margin-top:.5rem">
          Decline
        </button>
      </div>

      <div v-else-if="stage==='game'" class="game">
        <div class="header">
          <div class="title">Tic‑Tac‑Toe</div>
          <div class="symbol">You: {{ symbol }}</div>
        </div>
        <div class="board-container">
          <div class="board">
            <button
              v-for="(cell,i) in board" 
              :key="i"
              class="cell-button"
              :disabled="!!cell || finished || turn !== symbol"
              @click="play(i)"
            >
              <span>{{ cell }}</span>
            </button>
          </div>
        </div>
        <div class="status">
          <p v-if="!finished">Turn: {{ turn }}</p>
          <p v-else-if="winner==='draw'">It's a draw!</p>
          <p v-else-if="winner===symbol">You win! 🎉</p>
          <p v-else>You lose…</p>
        </div>
        <button v-if="finished" class="reset-button" @click="reset">Play Again</button>
      </div>
    </div>
  `
}).mount('#app');
