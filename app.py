from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# API Key 보안 관리 확인 필요
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

education_steps = [
    {
        "id": 0,
        "title": "그룹 생성",
        "description": "마이그레이션 대상 VM들을 그룹으로 관리합니다.",
        "diagram": ["원본 VM", "레가토 그룹", "이관 단위 지정"],
        "checkpoints": ["소스 vCenter 연결 상태 확인", "이관 대상 VM 전원 확인", "그룹 네이밍 규칙 준수"],
        "content": """그룹 생성 단계입니다.
        여러 VM을 하나의 작업 단위로 묶어 관리합니다.
        
        실무 포인트:
        - 업무별 그룹 분리
        - 서버 역할별 그룹 구성
        - 운영/개발 환경 구분"""
    },
    {
        "id": 1,
        "title": "플랜 생성",
        "description": "마이그레이션 절차와 순서를 정의합니다.",
        "diagram": ["그룹 선택", "타겟 테넌트 지정", "이관 플랜 확정"],
        "checkpoints": ["DB 서버 우선순위 고려", "서비스 영향도 분석 완료", "마이그레이션 창(Window) 시간 확보"],
        "content": """플랜 생성 단계입니다.
        마이그레이션 순서와 정책을 정의합니다.
        
        실무 포인트:
        - DB 서버 우선 고려
        - 서비스 영향도 분석
        - 작업 시간 계획"""
    },
    {
        "id": 2,
        "title": "볼륨 생성",
        "description": "OpenStack에 데이터 저장 공간을 준비합니다.",
        "diagram": ["타겟 스토리지", "Cinder 볼륨 할당", "복제 대기"],
        "checkpoints": ["타겟 스토리지 잔여 용량 확인", "Ceph/정적 스토리지 타입 매칭", "Volume Attach 권한 체크"],
        "content": """볼륨 생성 단계입니다.
        OpenStack Cinder 볼륨을 생성합니다.
        
        실무 포인트:
        - 용량 확인
        - 스토리지 타입 확인
        - attach 가능 여부 확인"""
    },
    {
        "id": 3,
        "title": "초기복제",
        "description": "원본 VM 데이터를 대상 환경으로 복제합니다.",
        "diagram": ["소스 데이터", "블록 단위 CDP 복제", "타겟 볼륨 동기화"],
        "checkpoints": ["복제 네트워크 대역폭 확인", "초기 동기화 진행률 모니터링", "데이터 정합성(체크섬) 검증"],
        "content": """초기복제 단계입니다.
        원본 VM 데이터를 대상 환경으로 복사합니다.
        
        실무 포인트:
        - 네트워크 속도 확인
        - 복제 시간 확인
        - 데이터 정합성 체크"""
    },
    {
        "id": 4,
        "title": "Cut-over",
        "description": "서비스를 최종 전환합니다.",
        "diagram": ["소스 서비스 정지", "최종 차분 복제", "타겟 가상머신 기동"],
        "checkpoints": ["GW 및 가상 네트워크 라우팅 전환", "보안그룹(Security Group) 규칙 적용", "Rollback 시나리오 최종 확인"],
        "content": """Cut-over 단계입니다.
        실제 서비스를 신규 환경으로 전환합니다.
        
        실무 포인트:
        - 서비스 중단 시간 최소화
        - 최종 점검 수행
        - Rollback 계획 준비"""
    }
]

@app.route('/')
def index():
    return render_template('index.html', steps=education_steps)

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    question = data.get('question')
    current_step = data.get('current_step', '일반 인프라 마이그레이션')

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # 모델명 오타 수정
            messages=[
                {
                    "role": "system",
                    "content": f"""너는 오케스트로의 Contrabass 및 Legato 마이그레이션 솔루션 교육 전문가다.
                    사용자는 현재 [{current_step}] 단계를 학습하는 중이다. 이 맥락을 고려하여 답변하라.
                    초급자 엔지니어 기준으로 쉽게 설명하고, 단계별 구성 및 실무 예시(네트워크, 스토리지 트러블슈팅 등)를 포함하라."""
                },
                {
                    "role": "user",
                    "content": question
                }
            ]
        )
        answer = response.choices[0].message.content
        return jsonify({'answer': answer})
    except Exception as e:
        return jsonify({'answer': f'오류 발생: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True)