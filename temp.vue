<script>
import {Terminal} from 'xterm'
import {FitAddon} from 'xterm-addon-fit'
import {languages} from './languages.js'

export default {
  name: 'Terminal',
  props: {
    dark: Boolean,
  },
  data: () => ({
    filename: 'main',
    defaultFilename: 'main',
    terminalTab: "tab-0",
    termStr: "",
    selectedLanguage: 'Python3', // 실행할 언어 설정
    languages: null,
    fitAddon: new FitAddon(),
    connected: false,
    count: null,
    ws: null,
    term: null
  }),
  methods: {
    connect: function(callback) {
      const vm = this

      if (vm.connected) {
        return
      }

      this.terminalTab = "tab-0"

      const term = vm.term

      term.clear()
      term.write(this.$t('connectToServer'))
      const ws = new WebSocket(`ws://localhost:5000/terminal`)

      ws.onopen = () => {
        term.write(this.$t('connected'))
        term.write(this.$t('pleaseWait'))
        vm.ws = ws
        vm.connected = true
        ws.send(`2 ${term.cols} ${term.rows}`)

        if (typeof callback === 'function')
          callback()
      }

      const HEREDOC_BEGIN = "cat << 'BC_EOF'"
      const regex = /BC_EOF(?!')/
      let isHereDoc = false

      ws.onmessage = (d) => {
        const data = d.data.substring(1)
        if (isHereDoc) {
          if (regex.exec(data) !== null) {
            isHereDoc = false
            const last = data.toString().split(regex)
            if (last[1]) {
              vm.termStr = last[1]
              term.write(last[1])
            }
          }
          return
        }

        if (data.indexOf(HEREDOC_BEGIN) !== -1) {
          if (regex.exec(data) === null) {            
            isHereDoc = true
            term.write(this.$t('uploadingFile'))
          }
          return
        }

        switch(d.data[0]) {
        case '1':
          vm.termStr = data.substr(-10)
          term.write(data)

          break
        case '2':
          vm.count = data
          break
        }
      }
      
      ws.onerror = function(ev) {
        term.write(ev)
      }

      ws.onclose = () => {
        vm.term.write(`\r\n${this.$t('disconnected')}\r\n\r\n`)
        vm.ws = null
        vm.connected = false
        this.count = null
      }
    },
    disconnect: function() {
      if (this.ws) {
        this.ws.close()
      }
      this.connected = false
    },
    executeCheck: function(command) {
      if (command) {
        this.execute(this, command)
      }

      if (!this.languages[this.selectedLanguage].comand) {
        this.execute(this)
        return
      }
      if (!this.connected) {
        this.connect(() => {this.executeCheck()})
        return
      }
      this.execute(this, command)
    },
    execute: function(isAll, command) {
      if (!this.connected) {
        // ws 연결이 안되어있을 경우, 연결을 우선 진행 후, 함수를 다시 실행
        this.connect(() => {this.execute(isAll, command)})
        return
      }

      this.terminalTab = 'tab-0'
      if (!command) {
        if (isAll) {
          const ext = this.languages[this.selectedLanguage].ext
          let args = this.options[`${this.languages[this.selectedLanguage].template}.args`]
          // let testcommand = "print('hello world!!!')"; // 코드 전달 형태 예시

          if (!args)
            args = this.languages[this.selectedLanguage].args?this.languages[this.selectedLanguage].args:""

          command = ("cat << 'BC_EOF' > {FILENAME}.{EXT}\n{SOURCE}\nBC_EOF\nhistory -c\n" +
            this.languages[this.selectedLanguage].command)
            .replace(/{ARGS}/g, args)
            .replace(/{FILENAME}/g, this.filename.replace(`.${ext}`, ''))
            .replace(/{EXT}/g, ext)
            // .replace('{SOURCE}', "사용자가 작성한 코드 텍스트 삽입") // 사용자가 작성한 코드를 여기에 삽입함
            .replace('{SOURCE}', testcommand) // 파이썬 코드 삽입 예시
            .replace(/\t/g, '    ')

            // 생성되는 파이썬 커맨드 예시
            // command: cat << 'BC_EOF' > main.py --> 파일 생성 커맨드(BC_EOF를 입력할 때까지 main.py에 작성하라)
            // print("hello") --> 파일에 작성할 내용
            // BC_EOF--> 파일에 작성할 내용(종료 시점)
            // history -c --> 위에서 작성한 커맨드 이력을 터미널 출력에서 삭제
            // python3  main.py --> 파이썬 실행 커맨드
        }
      }

      if (this.connected) {
        this.term.scrollToBottom()
        this.ws.send(`1${command}\r`) // 생성한 command를 ws을 이용하여 back에 전송
      } else
        this.term.write(`${this.t('connectFirst')}.\r\n`)
    },
  },
  mounted: function() {
    this.$i18n.locale = 'ko'
    const terminalContainer = document.getElementById('terminal')

    this.term = new Terminal({
      cursorBlink: true,
      rows: 15,
      theme: {
        background: '#1e1e1e'
      },
    })

    this.term.loadAddon(this.fitAddon)
    this.term.open(terminalContainer)

    this.term.onData((data) => {
      if (this.connected) {
        this.ws.send('1' + data)
      }
    })

    this.term.onResize(e => {
      if (this.connected) {
        this.ws.send(`2 ${e.cols} ${e.rows}`)
      }
    })
  },
  created: function() {
    this.languages = languages
  }
};
</script>