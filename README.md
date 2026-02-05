# 백령도·연평도 미세먼지 모니터링 웹 페이지

## 📋 프로젝트 개요
에어코리아 OpenAPI를 사용하여 백령도와 연평도 측정소의 PM10 및 PM2.5 최근 48시간 데이터를 시계열 그래프로 표시하는 정적 웹 페이지입니다.

## 🚀 시작하기

### 1. API 키 설정
`script.js` 파일을 열고 API 키를 입력하세요:

```javascript
const API_CONFIG = {
    serviceKey: 'YOUR_API_KEY_HERE',  // 여기에 발급받은 API 키를 입력
    // ...
};
```

### 2. 로컬 서버 실행
Python을 사용하여 로컬 서버를 실행합니다:

```bash
# baengnyeong_air_quality 디렉토리로 이동
cd baengnyeong_air_quality

# Python 3 HTTP 서버 실행
python -m http.server 8000
```

### 3. 브라우저에서 접속
브라우저를 열고 다음 주소로 접속합니다:
```
http://localhost:8000
```

## 📱 모바일에서 접속하기

### 같은 Wi-Fi 네트워크에 연결된 경우:
1. PC의 IP 주소 확인:
   ```bash
   ipconfig
   ```
   (IPv4 주소를 확인하세요, 예: 192.168.0.10)

2. 모바일 브라우저에서 접속:
   ```
   http://[PC의_IP주소]:8000
   ```
   예: `http://192.168.0.10:8000`

## 🌐 GitHub Pages 배포

### 1. GitHub 저장소 생성
1. GitHub에서 새 저장소 생성
2. 저장소 이름 입력 (예: `baengnyeong-air-quality`)

### 2. 코드 업로드
```bash
cd baengnyeong_air_quality
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[사용자명]/[저장소명].git
git push -u origin main
```

### 3. GitHub Pages 활성화
1. 저장소 Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, 폴더: / (root)
4. Save 클릭

5분 후 다음 주소로 접속 가능:
```
https://[사용자명].github.io/[저장소명]/
```

## 📊 기능

- ✅ 백령도, 연평도 측정소 PM10/PM2.5 데이터 시각화
- ✅ 최근 48시간 시계열 그래프
- ✅ 60분마다 자동 갱신
- ✅ 반응형 디자인 (PC/모바일)
- ✅ 오류 처리 및 사용자 피드백

## 📁 파일 구조

```
baengnyeong_air_quality/
├── index.html      # 메인 HTML 페이지
├── style.css       # 스타일시트
├── script.js       # JavaScript 로직
└── README.md       # 이 파일
```

## ⚠️ 참고 사항

- 본 서비스는 개인 확인용이며 대외 공개용이 아닙니다
- API 키가 코드에 직접 포함되어 있으므로 공개 저장소 사용 시 주의하세요
- API 쿼터 초과 시 데이터 조회가 제한될 수 있습니다
