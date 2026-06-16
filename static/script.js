const askBtn = document.getElementById('askBtn');
const questionInput = document.getElementById('question');
const answerBox = document.getElementById('answerBox');
const terminalInput = document.getElementById('terminalInput');
const terminalFeedback = document.getElementById('terminalFeedback');

// 핵심 전역 런타임 캐시 데이터 바인딩
let currentStepTitle = "그룹 생성";
let currentStepId = 0; 
let expectedCommand = ""; 
let completedSteps = new Set(); // 중복 없이 완료 트랙 번호를 저장할 Set 오브젝트

document.addEventListener("DOMContentLoaded", () => {
    const firstCard = document.getElementById('step-0');
    if (firstCard) {
        renderDynamicLab(firstCard);
        updateOverallProgress(); // 초기 0/5 카운터 스캔 렌더링
    }
});

// 상단 진행률과 X / 5 Steps COMPLETED 를 완벽 연동해주는 핵심 엔진 함수
function updateOverallProgress() {
    const completedCount = completedSteps.size;
    
    // 1. 헤더 마일스톤 텍스트 카운터 실시간 교체
    document.getElementById('progressStepCount').innerText = completedCount;

    // 2. 전체 5개 모듈 데이터 비례식 게이지 변환 연동
    const progressPercent = Math.min((completedCount / 5) * 100, 100);
    document.getElementById('progressPercentage').innerText = `${progressPercent}%`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
}

// 왼쪽 카드 메뉴를 클릭했을 때 대시보드를 전환해주는 메인 스위칭 함수
function changeStep(id, title, content) {
    currentStepId = parseInt(id);
    currentStepTitle = title;
    document.getElementById('contentTitle').innerText = title;
    document.getElementById('contentText').innerHTML = content.replace(/\n/g, "<br>");

    document.querySelectorAll('.step-card').forEach(c => c.classList.remove('active-step'));
    const activeCard = document.getElementById(`step-${id}`);
    activeCard.classList.add('active-step');

    // UI 상태 배지 업데이트 (완료/실행중/대기) 유기적 스위칭
    document.querySelectorAll('.status-badge').forEach((b, idx) => {
        if (completedSteps.has(idx)) {
            b.innerText = "COMPLETED";
            b.style.color = "#10b981";
            b.style.background = "rgba(16,185,129,0.1)";
        } else if (idx === currentStepId) {
            b.innerText = "RUNNING";
            b.style.color = "#60a5fa";
            b.style.background = "rgba(96,165,250,0.1)";
        } else {
            b.innerText = "PENDING";
            b.style.color = "#64748b";
            b.style.background = "rgba(255,255,255,0.05)";
        }
    });

    renderDynamicLab(activeCard);
}

// 데이터 노드 맵 레이어 및 체크박스 이벤트 인스턴스 동적 빌드 함수
function renderDynamicLab(card) {
    document.getElementById('srcNodeName').innerText = card.getAttribute('data-source');
    document.getElementById('tgtNodeName').innerText = card.getAttribute('data-target');

    expectedCommand = card.getAttribute('data-hint');
    document.getElementById('terminalHint').innerText = expectedCommand;
    terminalInput.value = "";
    terminalFeedback.innerText = "";

    const checkpoints = JSON.parse(card.getAttribute('data-checkpoints'));
    const checkpointList = document.getElementById('checkpointList');
    checkpointList.innerHTML = '';
    
    checkpoints.forEach((point, i) => {
        const li = document.createElement('li');
        li.className = 'checkpoint-item';
        li.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" id="chk-${i}" ${completedSteps.has(currentStepId) ? 'checked' : ''}>
                <span class="checkmark"></span>
                <p class="chk-text">${point}</p>
            </label>
        `;
        checkpointList.appendChild(li);

        // 상용 교육 사이트처럼 유저가 리스트를 직접 체크할 때 발생하는 로직 제어
        const chkBox = li.querySelector('input[type="checkbox"]');
        chkBox.addEventListener('change', () => {
            const allBoxes = checkpointList.querySelectorAll('input[type="checkbox"]');
            const checkedBoxes = checkpointList.querySelectorAll('input[type="checkbox"]:checked');
            
            if (allBoxes.length === checkedBoxes.length) {
                completedSteps.add(currentStepId);
                document.getElementById(`badge-${currentStepId}`).innerText = "COMPLETED";
                document.getElementById(`badge-${currentStepId}`).style.color = "#10b981";
            } else {
                completedSteps.delete(currentStepId);
                document.getElementById(`badge-${currentStepId}`).innerText = "RUNNING";
                document.getElementById(`badge-${currentStepId}`).style.color = "#60a5fa";
            }
            updateOverallProgress(); // 체크 상태 변경 반영하여 전체 카운터 실시간 동기화
        });
    });
}

// 가상 쉘 커맨드라인 엔터 인터랙션 검증 가동
terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim();
        if (cmd === expectedCommand) {
            terminalFeedback.className = "term-feedback success";
            terminalFeedback.innerText = "✔ [SUCCESS] 가상 레가토 자동화 커맨드가 실행되었습니다. 전용 검증 리스트가 동시 패스 처리됩니다.";
            
            document.querySelectorAll('#checkpointList input[type="checkbox"]').forEach(c => c.checked = true);
            
            completedSteps.add(currentStepId);
            document.getElementById(`badge-${currentStepId}`).innerText = "COMPLETED";
            document.getElementById(`badge-${currentStepId}`).style.color = "#10b981";
            updateOverallProgress();
        } else {
            terminalFeedback.className = "term-feedback error";
            terminalFeedback.innerText = "❌ [FAILED] Invalid core architecture parameter. 명령어를 다시 검증하십시오.";
        }
    }
});

// AI Copilot 요청 API 컨텍스트 라우팅 연동 단
askBtn.addEventListener('click', async () => {
    const question = questionInput.value;
    if (!question) { return alert('질문을 입력하세요.'); }

    answerBox.innerHTML = '<div class="loading-pulse">🔍 AI가 현재 학습 단계의 실무 장애 내역 컨텍스트를 스캔하고 있습니다...</div>';

    try {
        const response = await fetch('/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, current_step: currentStepTitle })
        });
        const data = await response.json();
        answerBox.innerHTML = data.answer.replace(/\n/g, "<br>");
    } catch (e) {
        answerBox.innerText = '인프라 API 타임아웃 오류 발생. 회선 상태를 점검하십시오.';
    }
});

function askPresetQuestion(q) { questionInput.value = q; }