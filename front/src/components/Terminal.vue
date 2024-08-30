<template>
  <div id='div-client' class="client">
    <div id='div-editor' @drop="dropHandler" @dragover="dragOverHandler">
      <v-app-bar color="toolbar" id="v-toolbar" height="32px">
        <v-app-bar-nav-icon :dark="dark" @click="$emit('toggleMenu')"></v-app-bar-nav-icon>
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn ref='langList' width="120px" text x-small v-bind="attrs" v-on="on">
              <v-icon color="primary">{{languageIcon}}</v-icon>
              {{selectedLanguage}}
            </v-btn>
          </template>
          <v-list min-width="120px" max-height="calc(100vh - 60px)" class="overflow-y-auto" dense>
            <template v-for="(language, index) in Object.keys(languages)">
            <v-list-item
              @click="onChangeLanguage(language)"
              :key="index">
              <v-list-item-icon>
                <v-icon  :color="language === selectedLanguage ? 'error':'primary'">
                  {{languages[language].icon}}
                </v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ language }}</v-list-item-title>
            </v-list-item>
            </template>
          </v-list>
        </v-menu>
        <v-tooltip bottom>
          <span>{{$t('connect')}}</span>
          <template v-slot:activator="{ on, attrs }">
          <v-btn text x-small @click='connect' v-bind="attrs" v-on="on" :disabled="connected">
            <v-icon dense color="green">mdi-lan-connect</v-icon>
          </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip bottom>
          <span>{{$t('disconnect')}}</span>
          <template v-slot:activator="{ on, attrs }">
          <v-btn text x-small @click='disconnect' v-bind="attrs" v-on="on" :disabled="!connected">
            <v-icon dense color="error">mdi-lan-disconnect</v-icon>
          </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip bottom>
          <span>{{$t('run')}}</span>
          <template v-slot:activator="{ on, attrs }">
          <v-btn text x-small :disabled='!(!connected || termStr && termStr.match(/.*(\$|#) $/i))' @click='executeCheck()' v-bind="attrs" v-on="on">
            <v-icon dense color="green">mdi-play</v-icon>
          </v-btn>
          </template>
        </v-tooltip>
      </v-app-bar>
      <div id="monaco"></div>
    </div>

    <div class="resizer" id="resizer"></div>
    <div>
      <v-toolbar fixed color="toolbar" id='v-footer' height="24px">
        <v-tabs
          show-arrows
          @change="this.fitSize"
          v-model="terminalTab"
          height="24px"
        >
          <v-tab key="0" href="#tab-0">{{$t('terminal')}}{{connected && count ?` - ${count}`:""}}</v-tab>
          <v-tab key="1" href="#tab-1">{{$t('output')}}</v-tab>
        </v-tabs>
        <v-spacer></v-spacer>
        <v-layout justify-end>
        <v-tooltip bottom>
          <span>{{$t('clear')}}</span>
          <template v-slot:activator="{ on, attrs }">
          <v-btn icon small @click='removeImages()' v-bind="attrs" v-on="on" :disabled="terminalTab!=='tab-1'">
            <v-icon dense>mdi-image-off-outline</v-icon>
          </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip bottom>
          <span>{{$t('decreasePannel')}}</span>
          <template v-slot:activator="{ on, attrs }">
          <v-btn icon small @click='resizeTermScreen(true)' v-bind="attrs" v-on="on">
            <v-icon dense>mdi-chevron-down</v-icon>
          </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip bottom>
          <span>{{$t('increasePannel')}}</span>
          <template v-slot:activator="{ on, attrs }">
          <v-btn icon small @click='resizeTermScreen(false)' v-bind="attrs" v-on="on">
            <v-icon dense>mdi-chevron-up</v-icon>
          </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip bottom>
          <span>{{fullTerminal?$t('restorePannel'):$t('maximizePannel')}}</span>
          <template v-slot:activator="{ on, attrs }">
          <v-btn icon small @click='toggleTermScreen' v-bind="attrs" v-on="on">
            <v-icon dense v-if="fullTerminal">mdi-fullscreen-exit</v-icon>
            <v-icon dense v-else>mdi-fullscreen</v-icon></v-btn>
          </template>
        </v-tooltip>
        </v-layout>
      </v-toolbar>
      <v-tabs-items v-model="terminalTab" color="black">
      <v-tab-item key="0" value="tab-0">
        <div id="con-terminal" class='con-bottom'>
          <div id='terminal' @drop="onDrop" @dragover="onDragOver"></div>
        </div>
      </v-tab-item>
      <v-tab-item eager key="1" value="tab-1">
        <div id="con-html" class='con-html'>
        </div>
      </v-tab-item>
      </v-tabs-items>
    </div>
    <v-menu
      v-model="tabMenu"
      :position-x="x"
      :position-y="y"
      absolute
      offset-y
    >
      <v-list dense>
        <v-list-item
          v-for="(item, index) in tabMenus"
          :key="index"
          link
          @click="contextMenuClick(item.id)"
        >
          <v-list-item-title class="caption"><v-icon>{{item.icon}}</v-icon>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-snackbar
      v-model="snackbar"
      :timeout="4000"
    >
      {{snackbar_message}}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="blue"
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          {{$t('close')}}
        </v-btn>
      </template>
    </v-snackbar>
    <Settings
      ref="settingsDialog"
      @saveOptions="saveOptions"
    >
    </Settings>
  </div>
</template>

<style src='../styles/github-markdown.css'></style>
<style src='../styles/vs2015.css'></style>
<script>
import * as monaco from 'monaco-editor'
import {Terminal} from 'xterm'
import {FitAddon} from 'xterm-addon-fit'
import {languages} from './languages.js'
import axios from 'axios'
import Settings from './Settings'

export default {
  name: 'Terminal',

  components: {
    Settings,
  },
  props: {
    dark: Boolean,
  },
  data: () => ({
    filename: 'main',
    defaultFilename: 'main',
    renaming: false,
    tabMenu: false,
    x: 0,
    y:0,
    tabMenus: null,
    filter: '',
    dispose: null,
    befDecorations: [],
    decorations: [],
    befFileTab: null,
    fileTabIndex: null,
    fileTabs: [],
    langMenu: false,
    terminalTab: "tab-0",
    befHeight: 0,
    snackbar: false,
    snackbar_message: "",
    termStr: "",
    fullTerminal: false,
    contents: "",
    languageIcon: 'mdi-bash',
    selectedLanguage: 'Bash',
    options: {selectedLanguage: 'Bash', tabSize: 4, dark: true},
    languages: null,
    sharedHash: String,
    fitAddon: new FitAddon(),
    connected: false,
    count: null,
    ws: null,
    term: null,
    editor: null,
  }),
  watch: {
    dark: {
      immediate: true,
      handler (val) {
        monaco.editor.setTheme(val?'vs-dark':'vs')
        this.options.dark && this.options.dark !== this.$vuetify.theme.dark && this.optionControl('save')
      }
    },
    $route (to) {
      const path_to = encodeURIComponent(to.path).split('/')[3]
      if (path_to) {
        for (const l in this.languages) {
          if (this.languages[l].template === path_to) {
            this.onChangeLanguage(l)
            break
          }
        }
      }
    }
  },
  methods: {
    showSettingsDialog: function () {
      const options = {
        dark: this.$vuetify.theme.dark,
        selectedLanguage: this.selectedLanguage,
        tabSize: this.editor.getModel().getOptions()['tabSize'],
        fontSize: this.editor.getOption(monaco.editor.EditorOption.fontSize),
        args: this.options[`${this.languages[this.selectedLanguage].template}.args`] ?
          this.options[`${this.languages[this.selectedLanguage].template}.args`]:this.languages[this.selectedLanguage].args
      }

      this.$refs["settingsDialog"].show(options)
    },
    showSnackbar: function(msg) {
      this.snackbar_message = msg
      this.snackbar = true
    },
    tabContaxMenu: function (e) {
      e.preventDefault()
      this.tabMenu = false
      this.x = e.clientX
      this.y = e.clientY
      this.$nextTick(() => {
        this.tabMenu = true
      })
    },
    setEditorValue(value) {
      this.editor.setValue(value)
      this.editor.setScrollLeft(0)
      this.editor.setScrollTop(0)
      this.editor.focus()
    },
    optionControl: function(flag) {
      try {
        const db = window.openDatabase('bluecode', '1.0', 'bluecode DB', 16*1024*1024)

        db.transaction((tx) => {
            tx.executeSql('CREATE TABLE IF NOT EXISTS tab_options (option, value, PRIMARY KEY(option))')

            switch (flag) {
            case 'save':
              this.options['selectedLanguage'] = this.selectedLanguage
              this.options['dark'] = this.$vuetify.theme.dark ? "true":"false"
              if (this.editor.getModel())
                this.options['tabSize'] = this.editor.getModel().getOptions()['tabSize']
              this.options['fontSize'] = this.editor.getOption(monaco.editor.EditorOption.fontSize)

              for (const option in this.options) {
                  option && option !== 'undefined' && tx.executeSql('INSERT OR REPLACE INTO tab_options (option, value) VALUES(?, ?)', [option, this.options[option]], () => {
                }, (tx, result) => {
                  console.error('fail on save options', result)
                })
              }

              break
            case 'load':
              tx.executeSql("SELECT option, value FROM tab_options WHERE value <> 'undefined'", [], (tx, result) => {
                if (result.rows[0]) {
                  for (const row in result.rows) {
                    if (result.rows[row].value) {
                      if (result.rows[row].option)
                        this.options[result.rows[row].option] = result.rows[row].value
                    }
                  }
                  this.selectedLanguage = this.options['selectedLanguage']
                  this.$vuetify.theme.dark = this.options['dark'] === "true"
                  this.editor.updateOptions({fontSize:this.options['fontSize']})
                  this.editor.getModel().updateOptions({tabSize:this.options['tabSize']})
                }

                this.sourceControl('tabs', this.selectedLanguage)
                const path = this.$route.params.app_path?
                  this.$route.params.app_path:
                  `shared/${this.languages[this.selectedLanguage].template}`

                if (path) {
                  const contents = path.split('/')
                  if (contents && contents[1]) {
                    for (const l in this.languages) {
                      if (this.languages[l].template === contents[1]) {
                        if (!(path.endsWith('.template') || path.endsWith('.md'))) {
                          const source = path.split("/").pop()
                          if (source.startsWith('source:')) {
                            this.onChangeLanguage(l, true)
                            return
                          }
                        }

                        this.onChangeLanguage(l, window.location.pathname.startsWith('/pages/shared') || window.location.href.endsWith('.template'))
                        break
                      }
                    }
                  }
                }
              }, (tx, result) => {
                this.onChangeLanguage('Bash')
                this.options['dark'] = this.$vuetify.theme.dark ? "true":"false"
                console.error('fail on open options', result)
              })
              break
            }
        })
      }
      catch (e) {
        console.error(e)
      }
    },
    sourceControl: function(flag, language, newFileName) {
      try {
        const db = window.openDatabase('bluecode', '1.0', 'bluecode Database', 16*1024*1024)

        db.transaction((tx) => {
            tx.executeSql('CREATE TABLE IF NOT EXISTS tab_sources (language, filename, source, PRIMARY KEY(language, filename))')

            switch (flag) {
            case 'save': {
                const source = this.editor.getValue()

                tx.executeSql('INSERT OR REPLACE INTO tab_sources (language, filename, source) VALUES(?, ?, ?)', [language, this.filename, source], () => {
                  this.showSnackbar(`${language} - ${this.filename} ${this.$t('saved')}`)
                  this.fileTabs[this.fileTabIndex].saved = true
                }, (tx, result) => {
                  this.showSnackbar(this.$t('failedSave'))
                  console.error('fail on save', result)
                })
              }
              break
            case 'open':
              tx.executeSql('SELECT source FROM tab_sources WHERE language = ? AND filename = ?', [language, this.filename], (tx, result) => {
                if (result.rows[0]) {
                  this.setEditorValue(result.rows[0].source)
                  this.showSnackbar(`${language} - ${this.filename} ${this.$t('loaded')}`)
                } else {
                  if (this.filename !== this.defaultFilename)
                    this.showSnackbar(`${language} - ${this.filename} ${this.$t('noSaved')}`)
                }
              }, (tx, result) => {
                this.showSnackbar(this.$t('failedQuery'))
                console.error('fail on open', result)
              })
              break
            case 'close':
              tx.executeSql('DELETE FROM tab_sources WHERE language = ? AND filename = ?', [language, this.filename], (tx, result) => {
                const tab = this.fileTabIndex == this.fileTabs.length-1 ? this.fileTabs.length-1 : this.fileTabIndex

                this.befFileTab = null
                result.rowsAffected > 0 && this.showSnackbar(`${language} - ${this.filename} 소스가 삭제되었습니다`)
                if (this.fileTabs.length == 1) {
                  this.fileTabs[0].value = this.editor.getValue()
                }
                if (this.fileTabIndex > 0)
                  this.fileTabs.splice(this.fileTabIndex, 1)

                this.onChangeFileTab(tab)
              }, (tx, result) => {
                this.showSnackbar('소스 삭제에 실패했습니다')
                console.error('fail on close', result)
              })
              break
            case 'rename':
              tx.executeSql('UPDATE tab_sources set filename = ? WHERE language = ? AND filename = ?', [newFileName, language, this.filename], () => {
                this.fileTabs[this.fileTabIndex].filename = newFileName
                this.filename = newFileName
              }, (tx, result) => {
                this.showSnackbar('소스 이름 바꾸기에 실패했습니다')
                console.error('fail on rename', result)
              })
              break
            case 'tabs':
              this.fileTabs = [{filename: this.defaultFilename, saved: true, value: '', position: null, scrollPosition: {scrollLeft: 0, scrollTop: 0}}]

              tx.executeSql('SELECT filename FROM tab_sources WHERE language = ?', [language], (tx, result) => {
                if (result.rows[0]) {
                  for (let i=0; i<result.rows.length; i++) {
                    if (result.rows[i].filename === this.defaultFilename)
                      continue
                    this.fileTabs.push({
                      filename: result.rows[i].filename, saved: true, value: null, position: null, scrollPosition: {scrollLeft: 0, scrollTop: 0}
                    })
                  }
                }
              }, (tx, result) => {
                console.error('fail on tabs', result)
              })

              break
            }
        })
      }
      catch (e) {
        if (flag === 'save')
          this.showSnackbar('저장이 지원되지 않습니다')
        console.error(e)
      }
    },
    getFileContents: function(file) {

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = (e) => {
          this.addTab(e.target.filename, e.target.result)
          resolve(e.target.result)
        }
        reader.onerror = (e) => {
          reject(e)
        }
        reader.filename = file.name.replace(`.${this.languages[this.selectedLanguage].ext}`, '')
        reader.readAsText(file)
      })
    },
    dragOverHandler: function (ev) {
      ev.preventDefault()
    },
    onDrop: function (e) {
      if (!this.connected) {
        this.showSnackbar('')
        return
      }

      if (!(this.termStr && this.termStr.match(/.*(\$|#) $/i))) {

        this.showSnackbar("셸명령이 가능한 상태에서 파일 업로드가 가능합니다")
        return
      }
      e = e || window.event
      e.preventDefault()

      if (e.dataTransfer.items) {
        for (let index = 0; index < e.dataTransfer.items.length; index++) {
          if (e.dataTransfer.items[index].kind === 'file') {
            this.sendFile(e.dataTransfer.items[index].getAsFile())
          }
        }
      } else {
        for (let index = 0; index < e.dataTransfer.files.length; index++) {
          this.sendFile(e.dataTransfer.files[index])
        }
      }
    },
    onDragOver: (e) => {
      e.preventDefault()
    },
    getContents: function(path) {
      axios.get(path, {headers: {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'}})
        .then((res) => {
          this.contents = res.data
        })
        .catch((err) => {
          console.log(err)
          this.contents = err
        })
    },
    toggleTermScreen: function() {
      const monaco = document.getElementById('monaco')

      this.fullTerminal=!this.fullTerminal
      if (!this.fullTerminal) {
        monaco.style.height = this.befHeight
      }

      if (this.befHeight !== 0)
        this.befHeight = monaco.style.height
      this.fitSize()
    },
    openSite: function(site) {
      window.open(site, "_blank")
    },
    renderMarkdown: function(markdown) {
      const con_html = document.getElementById('con-html')

      const hljs = require('highlight.js')
          const md = require('markdown-it')({
              highlight: (str, lang) => {
              if (lang && hljs.getLanguage(lang)) {
                try {
                  return '<pre class="hljs">' +
                          hljs.highlight(str, {language: lang}, true).value +
                        '</pre>';
                } catch (e) {console.error(e.message)}
              }

              return '<pre class="hljs">' + md.utils.escapeHtml(str) + '</pre>';
            }
          })
          con_html.innerHTML = `<div class='markdown-body'>${md.render(markdown)}</div>`
          con_html.style.overflowY = 'auto'
    },
    resizeTermScreen: function(isUp) {
      const monaco = document.getElementById('monaco')
      if (!monaco)
        return
      let dy = monaco.clientHeight

      const px = parseInt(document.body.clientHeight*0.1)

      dy += isUp?px:-px
      monaco.style.height = `${dy}px`

      if (this.befHeight !== 0)
        this.befHeight = monaco.style.height
      this.fitSize()
    },
    messageBox: function(id, width) {
      if (id == 'help') {
        const path = `/contents/help.md`
        this.getContents(path)
      }
      this.$refs[id].show(width)
    },
    decoration: function(data) {
      const errorRegEx = this.languages[this.selectedLanguage].errorRegEx
      if (!errorRegEx)
        return

      const regexp = new RegExp(errorRegEx, "g")
      const ansi = "[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]"
      const ansiRegEx = new RegExp(ansi, "g")
      let match = null

      while ((match = regexp.exec(data)) !== null) {
        if (match.length >= 2) {
          const row = parseInt(match[1])
          const matched = match[0]
          this.decorations.push({
            range: new monaco.Range(row,1,row,1),
            options: {
              isWholeLine: true,
              className: this.$vuetify.theme.dark ? 'decorationErrorLineDark':'decorationErrorLine',
              glyphMarginClassName: 'decorationError',
              hoverMessage: {value: "```json\n" + matched.replace(ansiRegEx, "") + "\n```"},
              glyphMarginHoverMessage: {value: "```json\n" + matched.replace(ansiRegEx, "") + "\n```"},
              minimap:{ position:1 }
            }
          })

          this.befDecorations = this.editor.deltaDecorations(this.befDecorations, this.decorations)
          this.editor.revealLineInCenter(row)
          this.editor.setPosition({column: 0, lineNumber: row})
        }
      }
    },
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

      const BEL = '\x07'
      const HEREDOC_BEGIN = "cat << 'BC_EOF'"
      const regex = /BC_EOF(?!')/
      const esc1337 = '\x1b[1337';
      let isContImage = false
      let isHereDoc = false
      let imgData = '';

      ws.onmessage = (d) => {
        const data = d.data.substring(1)
        console.log('Received message:', d.data);
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
        } else if (isContImage) {
          imgData += data

          if (data.indexOf(BEL) !== -1) {
            isContImage = false
            const last = imgData.toString().split(BEL)
            imgData = ''
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
        } else if (data.substring(0, 6) === esc1337) {
          if (data.indexOf(BEL) === -1) {
            imgData = data
            isContImage = true
          }
          return
        }

        switch(d.data[0]) {
        case '1':
          vm.termStr = data.substr(-10)
          console.log(data);
          term.write(data)

          this.decoration(data)

          break
        case '2':
          console.log(data);
          vm.count = data
          break
        }
        console.log(data)
      }

      ws.onerror = function(ev) {
        console.log(ev)
        term.write(ev)
      }

      ws.onclose = () => {
        vm.term.write(`\r\n${this.$t('disconnected')}⚡\r\n\r\n`)
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
      console.log("command: " + command)
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

      this.decorations = []
      this.befDecorations = this.editor.deltaDecorations(this.befDecorations, [])

      console.log("execute_command: " + command)

      if (!this.connected) {
        this.connect(() => {this.execute(isAll, command)})
        return
      }
      const selected = this.editor.getSelection()
      const selectedText = command?command:this.editor.getModel().getValueInRange(selected)

      console.log("selected: " + selected)
      console.log("selectedText: " + selectedText)

      this.terminalTab = 'tab-0'
      if (!command) {
        if (isAll) {
          const ext = this.languages[this.selectedLanguage].ext
          let args = this.options[`${this.languages[this.selectedLanguage].template}.args`]

          if (!args)
            args = this.languages[this.selectedLanguage].args?this.languages[this.selectedLanguage].args:""

          command = ("cat << 'BC_EOF' > {FILENAME}.{EXT}\n{SOURCE}\nBC_EOF\nhistory -c\n" +
            this.languages[this.selectedLanguage].command)
            .replace(/{ARGS}/g, args)
            .replace(/{FILENAME}/g, this.filename.replace(`.${ext}`, ''))
            .replace(/{EXT}/g, ext)
            .replace('{SOURCE}', this.editor.getValue())
            .replace(/\t/g, '    ')
        }
        else if (selectedText) {
          command = selectedText
        }
        else {
          if (selected['startLineNumber']) {
            command = this.editor.getModel().getLineContent(selected['startLineNumber'])
            this.editor.setPosition({column: 0, lineNumber: selected['startLineNumber']+1})
          }
        }
      }

      if (this.connected) {
        console.log("connected")
        this.term.scrollToBottom()
        this.ws.send(`1${command}\r`)
      } else
        this.term.write(`${this.t('connectFirst')}.\r\n`)
    },
    fitSize: function() {
      const toolbar = document.getElementById('v-toolbar')
      const fileTabs = document.getElementById('file-tabs')
      const footer = document.getElementById('v-footer')
      const monaco = document.getElementById('monaco')
      const terminal = document.getElementById('terminal')
      const con_terminal = document.getElementById('con-terminal')
      const con_image = document.getElementById('con-html')
      const resizer = document.getElementById('resizer')
      const padding = con_terminal.clientHeight - terminal.clientHeight + resizer.clientHeight
      const height = window.innerHeight - toolbar.clientHeight - fileTabs.clientHeight - footer.clientHeight
      let monacoHeight = (!this.fullTerminal && monaco.style.height === '0px') || monaco.style.height === '' ?parseInt(window.innerHeight*0.6):monaco.clientHeight

      if (window.innerHeight*0.7 < monacoHeight) {
        monacoHeight = parseInt(window.innerHeight*0.7)
        this.befHeight = monaco.style.height
      } else if (!this.fullTerminal && monacoHeight < 80) {
        monacoHeight = 80
      }

      monaco.style.height = this.fullTerminal?'0px':`${monacoHeight}px`
      terminal.style.height = this.fullTerminal?`${height-padding}px`:`${height-monacoHeight-padding}px`
      if (con_image) con_image.style.height = this.fullTerminal?`${height}px`:`${height-monacoHeight-resizer.clientHeight}px`
      this.editor.layout()

      try {
        this.fitAddon.fit()
      } catch(e) {
        console.log(e)
      }
    },
    removeImages: function() {
      const con_image = document.getElementById('con-html')

      con_image.innerHTML = ""
    },
    onChangeLanguage: function(language, isFirst) {
      if (this.selectedLanguage != language)
        this.sourceControl('tabs', language)

      this.defaultFilename = this.languages[language].defaultFilename?this.languages[language].defaultFilename:"main"
      this.languageIcon = this.languages[language].icon
      this.selectedLanguage = language
      this.filename = this.defaultFilename
      this.befFileTab = this.defaultFilename
      document.title = `BlueCode - ${language}`
      document.querySelector('meta[name="description"]').setAttribute("content", `온라인 ${language} 실행 환경 (Online ${language} Test and Run with IDE)`);
      this.editor.setScrollLeft(0)
      this.editor.setScrollTop(0)
      this.removeImages()
      monaco.editor.setModelLanguage(this.editor.getModel(), this.languages[language].highlighting)
      this.editor.getModel().updateOptions({insertSpaces:this.languages[language].insertSpaces === false ? false:true})
      this.optionControl('save')
      const pathTo = '/pages/ide/' + this.languages[language].template

      if ((!window.location.pathname.endsWith('.template') &&
           !window.location.pathname.startsWith('/pages/shared') &&
            window.location.pathname.indexOf('source:') === -1) || !isFirst)
        pathTo !== window.location.pathname && this.$router.push(pathTo)

      this.$emit("navigate", this.languages[language].template)

    },
    saveAs: function() {
      const text = this.editor.getValue()

      const pom = document.createElement('a')
      pom.setAttribute('href', 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(text))
      pom.setAttribute('download', `${this.filename}.${this.languages[this.selectedLanguage].ext}`)
      pom.style.display = 'none'
      document.body.appendChild(pom)

      pom.click()

      document.body.removeChild(pom)
    },
  },
  mounted: function() {
    this.$i18n.locale = navigator.language === 'ko' ?  'ko':'en'
    this.tabMenu = [
      {id: 'close', icon: 'mdi-close', title: this.$t('closeTab')},
      {id: 'new', icon: 'mdi-plus', title: this.$t('newTab')},
      {id: 'rename', icon: 'mdi-square-edit-outline', title: this.$t('rename')},
    ]

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

    this.term.onSelectionChange(() => {
      document.execCommand('copy');
    })

    this.term.onData((data) => {
      if (this.connected) {
        console.log('Sending data:', data);
        this.ws.send('1' + data)
      }
    })

    this.term.onResize(e => {
      if (this.connected) {
        this.ws.send(`2 ${e.cols} ${e.rows}`)
      }
    })

    const banner = this.$t('banner').replaceAll('ANSI', '\x1b[')
    this.term.write(banner)

    window.addEventListener('resize', this.fitSize);
    const divMonaco = document.getElementById("monaco")
    divMonaco.style.height = `${parseInt(window.innerHeight * 0.6)}px`

    this.editor = monaco.editor.create(divMonaco, {
      value: "",
      tabSize: 4,
      language: "shell",
      quickSuggestions: {
        "other": false,
        "comments": false,
        "strings": false,
        "keywords": true,
      },
      lineNumbers: "on",
      automaticLayout: true,
      roundedSelection: false,
      scrollBeyondLastLine: true,
      readOnly: false,
      theme: "vs-dark",
      glyphMargin: true,
    })

    this.editor.addAction({
      id: 'sendToTerminal',
      label: this.$t('sendToTerminal'),
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      ],
      run: () => {
        this.execute()
      }
    })

    this.editor.addAction({
      id: 'execute',
      label: this.$t('run'),
      keybindings: [
        monaco.KeyCode.F9,
      ],
      run: () => {
        (!this.connected || this.termStr && this.termStr.match(/.*(\$|#) $/i)) && this.executeCheck()
      }
    })

    this.editor.addAction({
      id: 'connect',
      label: this.$t('connect'),
      run: () => {
        this.connect()
      }
    })

    this.editor.addAction({
      id: 'disconnect',
      label: this.$t('disconnect'),
      run: () => {
        this.disconnect()
      }
    })

    this.editor.addAction({
      id: 'selectLanguageList',
      label: this.$t('selectLanguageList'),
      run: () => {
        this.$refs.langList.$el.click()
      }
    })

    this.editor.addAction({
      id: 'options',
      label: this.$t('options'),
      run: () => {
        this.showSettingsDialog()
      }
    })

    for (const language in this.languages) {
      this.editor.addAction({
        id: `${this.languages[language].template}`,
        label: `${this.$t('selectLanguage')}: ${language} - ${this.languages[language].kor}`,
        run: () => {
          this.onChangeLanguage(language)
        },
        keybindings: [this.languages[language].keyBindings]
      })
    }

    this.editor.focus()

    const resizer = document.getElementById('resizer')
    const topSide = resizer.previousElementSibling
    const bottomSide = resizer.nextElementSibling

    const mouseUpHandler = () => {
      const resizer = document.getElementById('resizer')
      resizer.style.removeProperty('cursor');
      document.body.style.removeProperty('cursor');

      topSide.style.removeProperty('user-select');
      topSide.style.removeProperty('pointer-events');
      bottomSide.style.removeProperty('user-select');
      bottomSide.style.removeProperty('pointer-events');

      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      this.fitSize()
    }
    const mouseMoveHandler = (e) => {
      const toolbar = document.getElementById('v-toolbar')
      const fileTabs = document.getElementById('file-tabs')
      const resizer = document.getElementById('resizer')
      let dy = e.clientY - toolbar.clientHeight - fileTabs.clientHeight;
      const monaco = document.getElementById('monaco')

      if (document.body.clientHeight*0.8 < dy) {
        dy = parseInt(document.body.clientHeight*0.8)
      }
      monaco.style.height = `${dy}px`
      resizer.style.cursor = 'row-resize'
      document.body.style.cursor = 'row-resize'
      topSide.style.userSelect = 'none'
      topSide.style.pointerEvents = 'none'
      bottomSide.style.userSelect = 'none'
      bottomSide.style.pointerEvents = 'none'
      this.befHeight = monaco.style.height
    }
    const mouseDownHandler = function() {

      document.addEventListener('mousemove', mouseMoveHandler)
      document.addEventListener('mouseup', mouseUpHandler)
    }

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler)
    this.optionControl('load')

    window.onbeforeunload = () => {
      return "{{$t('terminate')}}"
    }

    window.onload = () => {this.fitSize()}
  },
  created: function() {
    this.languages = languages
  }
};
</script>

<style>
.client {
  width: 100%;
  top: 10px;
  bottom: 10px;
}

.parent {
   width: 42px; /* I took the width from your post and placed it in css */
   height: 42px;
}

.con-bottom {
  width:100%;
  top: 10px;
  bottom: 10px;
  padding:10px;
  background-color: #1e1e1e;
  overflow: auto;
  max-height: 100%;
}
.con-html {
  width:100%;
  top: 10px;
  bottom: 10px;
  padding:10px;
  background-color: grey darken-4;
  overflow: auto;
  max-height: 100%;
}
.con-html img {
  max-height: 100%;
}
.label {
  display: inline-block;
  width: 100px;
  margin-right: 20px;
  user-select: none;
  text-align: left;
}
.resizer {
  height: 3px;
  cursor: row-resize;
  background-color:dimgray
}
.resizer:hover {
  background-color:#0D47A1
}
.v-autocomplete__content .v-list__tile{
  height: 20px;
}
.decorationError {
	background: rgba(255, 0, 0, 0.5);
}
.decorationErrorLine {
	background: rgba(255, 220, 220, 0.2);
}
.decorationErrorLineDark {
	background: rgba(70, 40, 40, 0.2);
}
::-webkit-scrollbar {
    width: 8px;
}
::-webkit-scrollbar-button {
    width: 8px;
    height:5px;
}
::-webkit-scrollbar-track {
    background:#1e1e1e;
    border: thin solid #303030;
    border-radius:10px;
}
::-webkit-scrollbar-thumb {
    background:#999;
    border: thin solid gray;
    border-radius:10px;
}
::-webkit-scrollbar-thumb:hover {
    background:#7d7d7d;
}        
</style>