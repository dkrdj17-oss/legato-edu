const askBtn = document.getElementById('askBtn');
const questionInput = document.getElementById('question');
const answerBox = document.getElementById('answerBox');
const terminalInput = document.getElementById('terminalInput');
const terminalFeedback = document.getElementById('terminalFeedback');

// 핵심 전역 런타임 캐시 데이터 바인딩
let currentStepTitle = "그룹 생성";
let currentStepId = 0; 
let expectedCommand = ""; 
let completedSteps = new Set(); 
let typeWriterInterval = null; // 타자 효과 인터벌 초기화 변수

document.addEventListener("DOMContentLoaded", () => {
    const firstCard = document.getElementById('step-0');
    if (firstCard) {
        renderDynamicLab(firstCard);
        updateOverallProgress(); 
    }
});

// [1번 패치] 가독성을 높여주는 프로페셔널 고성능 타자 효과 함수
function typeWriterEffect(element, htmlText, speed = 8) {
    // 기존에 돌고 있던 타자 타이머가 있다면 즉시 강제 종료
    clearInterval(typeWriterInterval);
    
    // HTML 개행 코드 변환 처리
    const formattedText = htmlText.replace(/\n/g, "<br>");
    element.innerHTML = "";
    
    let index = 0;
    // 태그(<...>) 구조 안에 있는 문자들을 오작동 없이 한 번에 출력하기 위한 파싱 처리
    typeWriterInterval = setInterval(() => {
        if (formattedText[index] === '<') {
            // 태그가 끝나는 > 지점까지 한 번에 인덱스를 점프시킴
            let closingTagIndex = formattedText.indexOf('>', index);
            if (closingTagIndex !== -1) {
                index = closingTagIndex + 1;
            }
        } else {
            index++;
        }
        
        element.innerHTML = formattedText.substring(0, index);
        
        if (index >= formattedText.length) {
            clearInterval(typeWriterInterval);
        }
    }, speed);
}

// 상단 진행률과 완수 단계를 정합해주는 코어 상태 엔진 함수
function updateOverallProgress() {
    const completedCount = completedSteps.size;
    document.getElementById('progressStepCount').innerText = completedCount;

    const progressPercent = Math.min((completedCount / 5) * 100, 100);
    document.getElementById('progressPercentage').innerText = `${progressPercent}%`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
}

// 단계를 마우스로 클릭해 변경할 때 작동하는 메인 이벤트 바인딩
function changeStep(id, title, content) {
    currentStepId = parseInt(id);
    currentStepTitle = title;
    document.getElementById('contentTitle').innerText = title;
    
    // [1번 패치 적용] 정적으로 글자가 툭 나오는 대신 타자치는 효과 가동
    const contentTextElement = document.getElementById('contentText');
    typeWriterEffect(contentTextElement, content, 7);

    document.querySelectorAll('.step-card').forEach(c => c.classList.remove('active-step'));
    const activeCard = document.getElementById(`step-${id}`);
    activeCard.classList.add('active-step');

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

// 데이터 변경 시 가상 실습 서브 모듈 리렌더링
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
            updateOverallProgress(); 
        });
    });
}

// 가상 쉘 커맨드 인증 엔터 라우팅 처리
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

// AI Copilot 전용 지식 베이스 리퀘스트 처리
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
        
        // AI가 대답을 내놓을 때도 타자 효과를 입혀 더욱 현장감 있게 묘사
        typeWriterEffect(answerBox, data.answer, 4);
    } catch (e) {
        answerBox.innerText = '인프라 API 타임아웃 오류 발생. 회선 상태를 점검하십시오.';
    }
});

function askPresetQuestion(q) { questionInput.value = q; }