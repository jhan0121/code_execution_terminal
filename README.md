# code_execution_terminal
웹 터미널 라이브러리(xterm.js &amp; node.pty)를 활용한 웹 터미널 기반 코드 실행 환경 구성하기

# 프론트엔드
초기 라이브러리 설치
```
cd front
npm install
```
실행
```
npm start
```


# 백엔드
* 리눅스 환경 추천(윈도우에서는 node-pty 설치 까다로움)


초기 라이브러리 설치

```
npm install
```

컨테이너 생성을 위한 docker image build

(이미지 태그는 반드시 ubuntu:bluecode로 설정해야 함.)
```
cd back
docker build -t ubuntu:bluecode .
```

실행
```
node app.js
```