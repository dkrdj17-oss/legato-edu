const askBtn = document.getElementById('askBtn');
const questionInput = document.getElementById('question');
const answerBox = document.getElementById('answerBox');

// 현재 선택된 학습 단계를 추적하는 전역 변수
let currentStepTitle = "그룹 생성";

// 초기 로딩 시 첫 번째 단계 데이터 수동 매핑
document.addEventListener("DOMContentLoaded", () => {
    const firstStepCard = document.getElementById('step-0');
    if (firstStepCard) {
        renderDiagramAndCheckpoints(firstStepCard);
    }
});

askBtn.addEventListener('click', async () => {
    const question = questionInput.value;
    if (!question) {
        alert('질문을 입력하세요');
        return;
    }

    answerBox.innerText = 'AI가 현재 단계의 컨텍스트를 바탕으로 답변을 생성 중입니다...';

    try {
        const response = await fetch('/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: question,
                current_step: currentStepTitle // 현재 단계를 함께 전송
            })
        });
        const data = await response.json();
        answerBox.innerText = data.answer;
    } catch (error) {
        answerBox.innerText = '답변을 가져오는 중 오류가 발생했습니다.';
    }
});

function askPresetQuestion(question) {
    questionInput.value = question;
}

function changeStep(id, title, content) {
    currentStepTitle = title;
    document.getElementById('contentTitle').innerText = title;
    document.getElementById('contentText').innerText = content;

    // 카드 활성화 클래스 토글
    document.querySelectorAll('.step-card').forEach(card => {
        card.classList.remove('active-step');
    });
    const activeCard = document.getElementById(`step-${id}`);
    activeCard.classList.add('active-step');

    // 상태 배지 업데이트 로직
    document.querySelectorAll('.status-badge').forEach(badge => {
        badge.innerText = "대기";
    });
    document.getElementById(`badge-${id}`).innerText = "진행중";

    // 진행률 바 동적 계산 (총 5개 단계 기준)
    const progressPercent = Math.min(((parseInt(id) + 1) / 5) * 100, 100);
    document.getElementById('progressText').innerText = `학습 진행률 ${progressPercent}%`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;

    // 다이어그램 및 체크포인트 동적 렌더링
    renderDiagramAndCheckpoints(activeCard);
}

function renderDiagramAndCheckpoints(cardElement) {
    const diagrams = JSON.parse(cardElement.getAttribute('data-diagram'));
    const checkpoints = JSON.parse(cardElement.getAttribute('data-checkpoints'));

    // 1. 다이어그램 그리기
    const diagramBox = document.getElementById('diagramBox');
    diagramBox.innerHTML = '';
    diagrams.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'diagram-item';
        itemDiv.innerText = item;
        diagramBox.appendChild(itemDiv);

        if (index < diagrams.length - 1) {
            const arrowDiv = document.createElement('div');
            arrowDiv.className = 'diagram-arrow';
            arrowDiv.innerText = '→';
            diagramBox.appendChild(arrowDiv);
        }
    });

    // 2. 체크포인트(퀴즈존) 그리기
    const checkpointList = document.getElementById('checkpointList');
    checkpointList.innerHTML = '';
    checkpoints.forEach((point, index) => {
        const li = document.createElement('li');
        li.style.marginBottom = '12px';
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '10px';
        
        li.innerHTML = `
            <input type="checkbox" id="chk-${index}" style="cursor:pointer; width:16px; height:16px;">
            <label for="chk-${index}" style="color:#cbd5e1; cursor:pointer; font-size:14px;">${point}</label>
        `;
        checkpointList.appendChild(li);
    });
}