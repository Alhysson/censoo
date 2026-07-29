import json

with open(r'data/students_ubaldo.json', encoding='utf-8') as f:
    students = json.load(f)

print(f'Total de alunos: {len(students)}')
for s in students[:5]:
    nome = s.get('Nome', '')
    cpf  = s.get('CPF', '')
    per  = s.get('Periodo', s.get('Período', ''))
    tur  = s.get('Turma', '')
    turno = s.get('Turno', '')
    print(f'  {nome} | {per} {tur} {turno} | CPF:{cpf}')

situacoes = {}
periodos  = {}
for s in students:
    k = s.get('Situacao', s.get('Situação', ''))
    situacoes[k] = situacoes.get(k, 0) + 1
    p = s.get('Periodo', s.get('Período', ''))
    periodos[p] = periodos.get(p, 0) + 1

print('\nSituacoes:', dict(sorted(situacoes.items())))
print('\nPeriodos:', dict(sorted(periodos.items())))

# Check comparison
with open(r'data/comparison_ubaldo.json', encoding='utf-8') as f:
    comp = json.load(f)
concil = sum(1 for r in comp if r.get('status') == 'CONCILIADO')
escola = sum(1 for r in comp if r.get('status') == 'APENAS_ESCOLA')
censo  = sum(1 for r in comp if r.get('status') == 'APENAS_CENSO')
diverg = sum(1 for r in comp if r.get('has_divergences'))
print(f'\nComparacao: {len(comp)} total | {concil} conciliados | {escola} so escola | {censo} so censo | {diverg} com divergencias')
