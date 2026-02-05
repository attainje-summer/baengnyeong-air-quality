// 에어코리아 API 설정
const API_CONFIG = {
    // API 키 (에어코리아 OpenAPI)
    serviceKey: 'o7pLjsdMALo1AOiAR3G1WmgQlimAHYIELZJDTarHiBgLGLQmsVP5gvKNIw0ZXtUkX5efG7%2B7K7xshYIn9S%2FejQ%3D%3D',
    baseUrl: 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty',
    stations: ['백령도', '연평도'],
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
            const stationName = API_CONFIG.stations[index];
            const color = index === 0 ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)';

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

        const url = `${API_CONFIG.baseUrl}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.response && data.response.body && data.response.body.items) {
            return data.response.body.items;
        } else {
            console.error(`${stationName} 데이터 형식 오류:`, data);
            return [];
        }
    } catch (error) {
        console.error(`${stationName} 데이터 가져오기 오류:`, error);
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
