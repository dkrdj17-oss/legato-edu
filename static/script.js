const askBtn = document.getElementById('askBtn');
const questionInput = document.getElementById('question');
const answerBox = document.getElementById('answerBox');

askBtn.addEventListener('click', async () => {

    const question = questionInput.value;

    if (!question) {
        alert('질문을 입력하세요');
        return;
    }

    answerBox.innerText = 'AI가 답변 생성 중입니다...';

    const response = await fetch('/ask-ai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
    });

    const data = await response.json();

    answerBox.innerText = data.answer;
});

function askPresetQuestion(question) {

    questionInput.value = question;
}

function changeStep(id, title, content) {

    document.getElementById('contentTitle').innerText = title;

    document.getElementById('contentText').innerText = content;

    document.querySelectorAll('.step-card').forEach(card => {
        card.classList.remove('active-step');
    });

    document.getElementById(`step-${id}`).classList.add('active-step');
}