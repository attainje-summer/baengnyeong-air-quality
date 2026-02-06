// 에어코리아 API 설정
const API_CONFIG = {
    // API 키 (디코딩된 형태 - URLSearchParams가 자동으로 인코딩함)
    serviceKey: 'o7pLjsdMALo1AOiAR3G1WmgQlimAHYIELZJDTarHiBgLGLQmsVP5gvKNIw0ZXtUkX5efG7+7K7xshYIn9S/ejQ==',
    stationUrl: 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty',
    sidoUrl: 'https://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureLIst',
    stations: ['백령도', '연평도', 'SEOUL_AVG', '중구', '석모리'],
    stationLabels: ['백령도', '연평도', '서울(평균)', '인천(중구)', '인천(강화)'],
    colors: [
        'rgb(255, 99, 132)',   // 백령도 - 빨강
        'rgb(54, 162, 235)',   // 연평도 - 파랑
        'rgb(255, 206, 86)',   // 서울 - 노랑
        'rgb(75, 192, 192)',   // 인천(중구) - 청록
        'rgb(153, 102, 255)'   // 인천(강화) - 보라
    ],
    numOfRows: 48,
    returnType: 'json'
};

// 차트 인스턴스 저장
let pm25Chart = null;
let pm10Chart = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    fetchData();
    // 60분마다 자동 갱신
    setInterval(fetchData, 60 * 60 * 1000);
});

// 차트 초기화
function initCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: 15,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y} ㎍/㎥`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'hour',
                    displayFormats: {
                        hour: 'MM/dd HH:mm'
                    },
                    tooltipFormat: 'yyyy-MM-dd HH:mm'
                },
                title: {
                    display: true,
                    text: '시간',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '농도 (㎍/㎥)',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };

    // PM2.5 차트
    const pm25Ctx = document.getElementById('pm25Chart').getContext('2d');
    pm25Chart = new Chart(pm25Ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: commonOptions
    });

    // PM10 차트
    const pm10Ctx = document.getElementById('pm10Chart').getContext('2d');
    pm10Chart = new Chart(pm10Ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: commonOptions
    });
}

// 데이터 가져오기
async function fetchData() {
    try {
        const allData = await Promise.all(
            API_CONFIG.stations.map(station => fetchStationData(station))
        );

        const pm25Data = [];
        const pm10Data = [];

        allData.forEach((stationData, index) => {
            const stationName = API_CONFIG.stationLabels[index];
            const color = API_CONFIG.colors[index];

            if (stationData && stationData.length > 0) {
                // PM2.5 데이터셋
                pm25Data.push({
                    label: stationName,
                    data: stationData.map(item => ({
                        x: new Date(item.dataTime),
                        y: parseFloat(item.pm25Value) || null
                    })).reverse(),
                    borderColor: color,
                    backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 6
                });

                // PM10 데이터셋
                pm10Data.push({
                    label: stationName,
                    data: stationData.map(item => ({
                        x: new Date(item.dataTime),
                        y: parseFloat(item.pm10Value) || null
                    })).reverse(),
                    borderColor: color,
                    backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 6
                });
            }
        });

        // 차트 업데이트
        updateChart(pm25Chart, pm25Data, 'pm25Error');
        updateChart(pm10Chart, pm10Data, 'pm10Error');

        // 마지막 업데이트 시간 표시
        updateLastUpdateTime();

    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        showError('pm25Error', `데이터를 불러오지 못했습니다 (${new Date().toLocaleTimeString()})`);
        showError('pm10Error', `데이터를 불러오지 못했습니다 (${new Date().toLocaleTimeString()})`);
    }
}

// 측정소별 데이터 가져오기
async function fetchStationData(stationName) {
    // 서울 평균 처리
    if (stationName === 'SEOUL_AVG') {
        return await fetchSeoulAverage();
    }

    // 일반 측정소 데이터
    try {
        const params = new URLSearchParams({
            serviceKey: API_CONFIG.serviceKey,
            returnType: API_CONFIG.returnType,
            numOfRows: API_CONFIG.numOfRows,
            pageNo: 1,
            stationName: stationName,
            dataTerm: 'DAILY',
            ver: '1.0'
        });

        const url = `${API_CONFIG.stationUrl}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.response && data.response.body && data.response.body.items) {
            const items = data.response.body.items;
            // items가 배열이면 그대로 반환, 단일 객체면 배열로 변환
            return Array.isArray(items) ? items : [items];
        } else {
            console.error(`${stationName} 데이터 형식 오류:`, data);
            return [];
        }
    } catch (error) {
        console.error(`${stationName} 데이터 가져오기 오류:`, error);
        return [];
    }
}

// 서울 평균 데이터 가져오기 (ArpltnStatsSvc API - 이미 계산된 평균값)
async function fetchSeoulAverage() {
    try {
        // PM10과 PM2.5 데이터를 각각 가져오기
        const pm10Data = await fetchSeoulAverageByItem('PM10');
        const pm25Data = await fetchSeoulAverageByItem('PM25');

        if (pm10Data.length === 0 || pm25Data.length === 0) {
            console.error('서울 평균 데이터 없음');
            return [];
        }

        // 시간별로 병합
        const mergedData = pm10Data.map(pm10Item => {
            const pm25Item = pm25Data.find(item => item.dataTime === pm10Item.dataTime);
            return {
                dataTime: pm10Item.dataTime,
                pm10Value: pm10Item.pm10Value,
                pm25Value: pm25Item ? pm25Item.pm25Value : '-'
            };
        });

        console.log('서울 평균 데이터:', mergedData.length, '개');
        return mergedData;
    } catch (error) {
        console.error('서울 평균 데이터 가져오기 오류:', error);
        return [];
    }
}

// 항목별 서울 평균 데이터 가져오기
async function fetchSeoulAverageByItem(itemCode) {
    try {
        const params = new URLSearchParams({
            serviceKey: API_CONFIG.serviceKey,
            returnType: API_CONFIG.returnType,
            numOfRows: 50,
            pageNo: 1,
            itemCode: itemCode,
            dataGubun: 'HOUR',
            searchCondition: 'DAILY'
        });

        const url = `${API_CONFIG.sidoUrl}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.response && data.response.body && data.response.body.items) {
            const items = Array.isArray(data.response.body.items) ? data.response.body.items : [data.response.body.items];

            // 서울 평균값 추출 (이미 계산된 값)
            const seoulData = items
                .filter(item => item.seoul)  // seoul 필드가 있는 항목만
                .map(item => ({
                    dataTime: item.dataTime,
                    [itemCode === 'PM10' ? 'pm10Value' : 'pm25Value']: item.seoul
                }));

            console.log(`서울 ${itemCode} 데이터:`, seoulData.length, '개');
            return seoulData;
        } else {
            console.error(`서울 ${itemCode} 평균 데이터 형식 오류:`, data);
            return [];
        }
    } catch (error) {
        console.error(`서울 ${itemCode} 평균 데이터 가져오기 오류:`, error);
        return [];
    }
}

// 차트 업데이트
function updateChart(chart, datasets, errorElementId) {
    if (datasets.length > 0) {
        chart.data.datasets = datasets;
        chart.update();
        hideError(errorElementId);
    } else {
        showError(errorElementId, `데이터를 불러오지 못했습니다 (${new Date().toLocaleTimeString()})`);
    }
}

// 마지막 업데이트 시간 표시
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = `마지막 업데이트: ${timeString}`;
}

// 오류 메시지 표시
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// 오류 메시지 숨기기
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.classList.remove('show');
}
