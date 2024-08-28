<template>
    <v-app>
    <v-main>
      <left-menu :menu="menu" ref=leftMenu @click="showContents"></left-menu>
        <terminal
          :editorValue="editorValue"
          ref=terminal
          @navigate="navigate"
          @toggleMenu="toggleMenu"
          @onTerminalCount="onTerminalCount"
          :dark="$vuetify.theme.dark">
        </terminal>
    </v-main>
  </v-app>
</template>

<style src='./styles/github-markdown.css'></style>
<style src='./styles/xterm.css'></style>
<style src='./styles/vs2015.css'></style>
<script>
const pako = require('pako')
import Terminal from './components/Terminal'
import axios from 'axios'

export default {
  name: 'App',
  components: {
    Terminal,
  },
  data: () => ({
    contents: "",
    editorValue: "",
    tab: 'tab-0',
    menu: {},
    termCount: null,
  }),
  methods: {
    toggleMenu: function() {
      this.$refs.leftMenu.visible = !this.$refs.leftMenu.visible
    },
    showContents: function(path) {
      const source = path.split("/").pop()

      if (!(path.endsWith('.template') || path.endsWith('.md'))) {
        if (source.startsWith('source:')) {
          this.$refs.terminal.setEditorValue((new TextDecoder('utf-8')).decode(pako.inflate(Buffer.from(source.slice(7).replace(/_/g, "/"), 'base64'))))
        }
        return
      }

      axios.get(path, {headers: {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'}})
        .then((res) => {
          this.$refs.leftMenu.selected = path
          if (path.endsWith('.template')) {
            this.$refs.terminal.setEditorValue(res && res.data && res.data.toString())

            if (source === "Hello, World!.template") {
              this.$refs.terminal.openLastSource()
            }
          } else {
            this.contents = res.data
          }
        })
        .catch((err) => {
          console.log(err)
        })
    },
    onTerminalCount: function(count) {
      this.termCount = count
    },
    navigate: function(template) {
      let path_to = 'ide'
      const html = document.getElementsByTagName('html')[0]
      const event = new CustomEvent('scroll', {})
      html.pageYOffset = 0
      setTimeout(() => {
        html.scrollTop = 0
      })
      html.dispatchEvent(event)

      html.style.overflowY = 'hidden'

      path_to += `/${template}`
      
      const path = `/contents/${path_to}/`
      axios.get(path)
        .then((res) => {
          
          if (res.data) {
            this.menu = res.data
            if (!window.location.href.endsWith('.template') && 
                !window.location.href.split('/').pop().startsWith('source:')) {
              this.showContents(path + 'Hello, World!.template')
            }
          }
        })
        .catch((err) => {
          console.log(err)
          this.menu = err
        })
    },
  },
  mounted() {
    this.$i18n.locale = navigator.language.indexOf('ko') >= 0 ?  'ko':'en'
    const path = this.$route.params.app_path
    if (path) {
      const contents = path.split('/')[0]
      if (contents)
        setTimeout(() => {this.showContents(`/contents/${path}`)}, 500)
    }
  }
};
</script>
