from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

# OpenAI API 클라이언트 초기화 (오타 수정 및 환경 변수 처리)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

education_steps = [
    {
        "id": 0,
        "title": "그룹 생성",
        "badge_icon": "📦",
        "description": "마이그레이션 대상 VM들을 업무 단위별 그룹으로 묶어 관리합니다.",
        "diagram_source": "VMware vCenter",
        "diagram_target": "Legato Group Container",
        "mission_hint": "legato-cli group create --name enterprise-web",
        "checkpoints": ["소스 vCenter API 연동 및 자원 인벤토리 로드 확인", "이관 대상 VM의 에이전트(CDP) 통신 포트 오픈 확인", "운영/개발/스테이징 환경별 이관 그룹 분리 가이드 준수"],
        "content": """### 💡 실무 엔지니어 핵심 포인트
        마이그레이션의 첫 단추는 '영향도 기반 그룹핑'입니다. 단일 VM 단위로 이관하면 웹-WAS-DB 간의 의존성 때문에 컷오버 시 서비스가 깨질 수 있습니다. 3-Tier 아키텍처는 반드시 하나의 복제 그룹으로 묶어야 합니다."""
    },
    {
        "id": 1,
        "title": "플랜 생성",
        "badge_icon": "🗂",
        "description": "마이그레이션 시나리오, 우선순위 및 네트워크 매핑 정책을 수립합니다.",
        "diagram_source": "Legato Group",
        "diagram_target": "Migration Plan",
        "mission_hint": "legato-cli plan generate --source-group enterprise-web",
        "checkpoints": ["DB 서버의 데이터 차분 복제 유예 시간 계산", "타겟 오케스트로 콘트라베이스 테넌트(네트워크/보안그룹) 매핑", "Target 가상머신 기동 우선순위(BOOT ORDER) 설정"],
        "content": """### 💡 실무 엔지니어 핵심 포인트
        플랜 생성 단계에서는 '네트워크 토폴로지 전환 정책'이 핵심입니다. 원본 환경의 VLAN 대역이 콘트라베이스(OpenStack) 상의 어떤 가상 네트워크(Neutron Network)와 보안그룹(Security Group)으로 매핑될지 명확한 룰셋을 정의해야 이관 후 통신 두절을 막을 수 있습니다."""
    },
    {
        "id": 2,
        "title": "볼륨 생성",
        "badge_icon": "💾",
        "description": "OpenStack 타겟 환경에 데이터가 동기화될 저장 공간을 사전 프로비저닝합니다.",
        "diagram_source": "VMware VMDK vDisk",
        "diagram_target": "OpenStack Cinder Volume",
        "mission_hint": "legato-cli volume provisioning --plan-id PLAN-002",
        "checkpoints": ["타겟 스토리지(Ceph RBD / SAN) 프리 풀 잔여 용량 체크 (1.2배 권장)", "원본 디스크 타입(Thin/Thick)에 따른 Cinder 볼륨 타입 매칭", "초기 블록 디바이스 매핑 상태 무결성 검증"],
        "content": """### 💡 실무 엔지니어 핵심 포인트
        원본 디스크 용량만 보고 타겟 볼륨을 잡으면 낭패를 볼 수 있습니다. 가상화 환경 특성상 **Thin Provisioning** 공간 분배율을 고려해야 하며, 마이그레이션 도중 발생하는 스냅샷 및 차분 데이터를 받기 위해 타겟 스토리지는 최소 20%의 마진을 확보해야 안전합니다."""
    },
    {
        "id": 3,
        "title": "초기복제",
        "badge_icon": "🔄",
        "description": "블록 레벨 실시간 CDP 엔진을 기동하여 백그라운드 데이터 동기화를 수행합니다.",
        "diagram_source": "Source Storage Data",
        "diagram_target": "Target Storage Sync (CDP)",
        "mission_hint": "legato-cli replication start --all",
        "checkpoints": ["이관 전용 가속 네트워크 대역폭(QoS) 및 회선 점유율 모니터링", "초기 풀 데이터 동기화 진행률 및 I/O 병목 상태 디버깅", "블록 정합성(Checksum) 실시간 대조 상태 가시성 확인"],
        "content": """### 💡 실무 엔지니어 핵심 포인트
        초기 복제 시에는 운영 중인 서비스 가동률에 영향을 주지 않도록 네트워크 대역폭 제한(Throttling)을 적절히 제어해야 합니다. 레가토의 CDP 엔진이 블록 단위 실시간 변경분(Dirty Block)을 추적하기 시작하는 시점이므로, 가급적 I/O가 적은 야간 시간대에 메인 동기화를 타는 것이 정석입니다."""
    },
    {
        "id": 4,
        "title": "Cut-over",
        "badge_icon": "🚀",
        "description": "소스 가상머신을 정지하고 최종 차분 데이터를 마이크로초 단위로 복제 후 최종 전환합니다.",
        "diagram_source": "Source VM Stop",
        "diagram_target": "Target Cloud Instance Run",
        "mission_hint": "legato-cli cutover execute --force",
        "checkpoints": ["소스 인프라 최종 서비스 가동 정지(Downtime Window 진입)", "최종 미동기화 차분 블록 복제 완료 확인", "타겟 인프라 인스턴스 기동 후 가상 IP 및 라우팅 테이블 스위칭 검증", "유사시 원복을 위한 롤백(Rollback) 가동 프로세스 상시 대기"],
        "content": """### 💡 실무 엔지니어 핵심 포인트
        마이그레이션의 꽃이자 가장 장애가 많이 나는 마의 구간입니다. 컷오버(Cut-over) 스위치를 누르기 전 최종 게이트웨이 아웃바운드 핑 테스트와 가상 하이퍼바이저 내 드라이버 정합성(VirtIO 드라이버 변환 여부 등)을 완벽히 점검해야 무중단에 가까운 탈 VMware 이관이 완성됩니다."""
    }
]

@app.route('/')
def index():
    return render_template('index.html', steps=education_steps)

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    question = data.get('question')
    current_step = data.get('current_step', '오케스트로 인프라 마이그레이션 개론')

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # 가성비 및 성능 최적화 모델 적용
            messages=[
                {
                    "role": "system",
                    "content": f"""너는 대한민국 최고 권위의 클라우드 마이그레이션 솔루션(오케스트로 Contrabass 및 Legato) 아키텍처 교육 전문가이다.
                    학습자는 현재 [{current_step}] 고난도 실무 트랙을 밟고 있다.
                    답변 시 마이그레이션 트러블슈팅, 네트워크 브리지 구성, 오픈스택 Cinder/Neutron 연계 등 실제 시니어 엔지니어들이 겪는 장애 사례와 해결책을 엮어서 전문가답고 명료하게 마크다운 형식으로 가독성 있게 설명하라."""
                },
                {"role": "user", "content": question}
            ]
        )
        return jsonify({'answer': response.choices[0].message.content})
    except Exception as e:
        return jsonify({'answer': f'⚠️ **AI Engine Timeout/Error**: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True)