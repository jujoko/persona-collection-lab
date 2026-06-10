import json, sys
sys.stdout.reconfigure(encoding='utf-8')

data = [json.loads(l) for l in open('ml/synthetic_training_data.jsonl', encoding='utf-8')]
me002 = [d for d in data if d['event_id'] == 'ME002']

illegal = [d for d in me002 if d['action_id'] == 'uses_illegal_loan']
legal   = [d for d in me002 if d['action_id'] == 'refuses_illegal'][:3]

print('=== uses_illegal_loan 선택 ===')
for d in illegal:
    print(f"나이: {d['persona_meta'].get('age')}  직업: {d['persona_meta'].get('occupation')}")
    print(f"텍스트: {d['persona_text'][:300]}")
    print(f"reason: {d['reason']}")
    print()

print('=== refuses_illegal 선택 (3개) ===')
for d in legal:
    print(f"나이: {d['persona_meta'].get('age')}  직업: {d['persona_meta'].get('occupation')}")
    print(f"텍스트: {d['persona_text'][:300]}")
    print(f"reason: {d['reason']}")
    print()
