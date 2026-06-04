from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

education_steps = [
    {
        "id": 0,
        "title": "그룹 생성",
        "description": "마이그레이션 대상 VM들을 그룹으로 관리합니다.",
        "content": """
        그룹 생성 단계입니다.

        여러 VM을 하나의 작업 단위로 묶어 관리합니다.

        실무 포인트:
        - 업무별 그룹 분리
        - 서버 역할별 그룹 구성
        - 운영/개발 환경 구분
        """
    },
    {
        "id": 1,
        "title": "플랜 생성",
        "description": "마이그레이션 절차와 순서를 정의합니다.",
        "content": """
        플랜 생성 단계입니다.

        마이그레이션 순서와 정책을 정의합니다.

        실무 포인트:
        - DB 서버 우선 고려
        - 서비스 영향도 분석
        - 작업 시간 계획
        """
    },
    {
        "id": 2,
        "title": "볼륨 생성",
        "description": "OpenStack에 데이터 저장 공간을 준비합니다.",
        "content": """
        볼륨 생성 단계입니다.

        OpenStack Cinder 볼륨을 생성합니다.

        실무 포인트:
        - 용량 확인
        - 스토리지 타입 확인
        - attach 가능 여부 확인
        """
    },
    {
        "id": 3,
        "title": "초기복제",
        "description": "원본 VM 데이터를 대상 환경으로 복제합니다.",
        "content": """
        초기복제 단계입니다.

        원본 VM 데이터를 대상 환경으로 복사합니다.

        실무 포인트:
        - 네트워크 속도 확인
        - 복제 시간 확인
        - 데이터 정합성 체크
        """
    },
    {
        "id": 4,
        "title": "Cut-over",
        "description": "서비스를 최종 전환합니다.",
        "content": """
        Cut-over 단계입니다.

        실제 서비스를 신규 환경으로 전환합니다.

        실무 포인트:
        - 서비스 중단 시간 최소화
        - 최종 점검 수행
        - Rollback 계획 준비
        """
    }
]

@app.route('/')
def index():
    return render_template('index.html', steps=education_steps)

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    question = data.get('question')

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": """
                    너는 Legato/OpenStack 마이그레이션 교육 전문가다.

                    초급자 기준으로 쉽게 설명하라.
                    단계별로 설명하라.
                    실무 예시를 포함하라.
                    너무 어려운 용어는 쉽게 풀어서 설명하라.
                    """
                },
                {
                    "role": "user",
                    "content": question
                }
            ]
        )

        answer = response.choices[0].message.content

        return jsonify({
            'answer': answer
        })

    except Exception as e:
        return jsonify({
            'answer': f'오류 발생: {str(e)}'
        })

if __name__ == '__main__':
    app.run(debug=True)