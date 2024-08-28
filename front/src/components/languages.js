import * as monaco from 'monaco-editor'

export const languages =
{
    'Bash':{
      highlighting:"shell",
      ext: 'sh',
      kor: '리눅스 셸',
      template:"bash",
      icon:'mdi-bash',
      command:"chmod 755 {FILENAME}.{EXT} && bash {ARGS} ./{FILENAME}.{EXT}",
      cli: null,
      errorRegEx: ".*\\.sh: .+? (\\d+): (.*)",
      keyBindings: monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_L)
    },
    'Python3':{
      highlighting:"python",
      ext: 'py',
      kor: '파이썬3',
      template:"python",
      icon:'mdi-language-python',
      command:"python3 {ARGS} {FILENAME}.{EXT}",
      cli: 'python3 {ARGS}',
      errorRegEx: ".+?\\.py\", line (\\d+)(?:.*?\r\n)+?(.*?Error: .*)",
      keyBindings: monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P)
    },
    
    'TypeScript':{
      highlighting:"typescript1",
      ext: 'ts',
      kor: '타입스크립트',
      template:"typescript",
      icon:'mdi-language-typescript',
      args: "--pretty false --target es2015",
      command:"tsc {ARGS} {FILENAME}.{EXT} && node {FILENAME}.js",
      cli: 'ts-node',
      errorRegEx: ".+?\\((\\d+),\\d+\\): (.+)",
      keyBindings: monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_T)
    },
    
    'JS - Node.js':{
      highlighting:"javascript1",
      ext: 'js',
      kor: '노드.js (Javascript, 자바스크립트)',
      template:"javascript",
      icon:'mdi-nodejs',
      command:"node {ARGS} {FILENAME}.{EXT}",
      cli: 'node {ARGS}',
      errorRegEx: ".+:(\\d+)\r\n.+\r\n.+\r\n\r\n(.+)\r\n",
      keyBindings: monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_J)
    },
    
    'java':{
      highlighting:"java",
      ext: 'java',
      kor: '자바',
      template:"java",
      icon:'mdi-language-java',
      command:"javac {ARGS} {FILENAME}.{EXT} && java {FILENAME}",
      cli: 'jshell',
      defaultFilename: 'Main',
      errorRegEx: ".+?:(\\d+): (\\w+: .+)",
      keyBindings: monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_V)
    },
    
    'C':{
      highlighting:"c",
      ext: 'c',
      kor: 'C언어 - gcc',
      template:"c",
      icon:'mdi-language-c',
      args: '-Wall -lm',
      command:"gcc -fdiagnostics-color=never -o {FILENAME} {FILENAME}.{EXT} {ARGS} && ./{FILENAME}",
      cli: null,
      errorRegEx: ".+?\\.c:(\\d+):\\d+: error: (.*)",
      keyBindings: monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_C)
    },
    
    'C++':{
      highlighting:"cpp",
      ext: 'cc',
      kor: 'C++ - g++',
      template:"cc",
      icon:'mdi-language-cpp',
      args: '-Wall -lboost_system -lboost_thread -pthread -ltbb',
      command:"g++ -fdiagnostics-color=never -o {FILENAME} {FILENAME}.{EXT} {ARGS} && ./{FILENAME}",
      cli: null,
      errorRegEx: ".+?\\.cc:(\\d+):\\d+: error: (.*)",
      keyBindings: null
    },
    'Kotlin':{
      highlighting:"kotlin",
      ext: 'kt',
      kor: '코틀린',
      template:"kotlin",
      icon:'mdi-language-kotlin',
      args: '-include-runtime',
      command:"kotlinc {FILENAME}.{EXT} {ARGS} -d {FILENAME}.jar && java -jar {FILENAME}.jar",
      cli: "kotlin",
      errorRegEx: ".+?:(\\d+):\\d+: .+: (.*)",
      keyBindings: monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K)
    },
    'MySQL(mariadb)':{
      highlighting:"mysql",
      ext: 'sql',
      kor: '마이SQL - mariadb',
      template:"mysql",
      icon:'mdi-database-search',
      args: '-D bluecode',
      command:"ps -ef | grep mysqld | grep -v grep > /dev/null || sudo service mysql start\nmysql {ARGS} -H < {FILENAME}.{EXT} > {FILENAME}.html && imshow {FILENAME}.html",
      cli: "ps -ef | grep mysqld | grep -v grep > /dev/null || sudo service mysql start\nmysql {ARGS}",
      errorRegEx: ".+? at line (\\d+): (.+)",
      keyBindings: null
    }
};