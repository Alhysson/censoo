import json

with open('data/students.json', encoding='utf-8') as f:
    students = json.load(f)

# Verificar todos os valores distintos do campo Cor
cor_values = {}
for s in students:
    val = s.get('Cor', '__MISSING__')
    if val is None:
        val = '__NULL__'
    if val == '':
        val = '__EMPTY__'
    cor_values[val] = cor_values.get(val, 0) + 1

print('=== Valores do campo Cor ===')
for k, v in sorted(cor_values.items(), key=lambda x: -x[1]):
    print(f'  repr={repr(k)} => {v} aluno(s)')

print()
print('=== Alunos com Cor problematica (vazia/nula/missing) ===')
for s in students:
    val = s.get('Cor', '__MISSING__')
    if not val or str(val).strip() == '':
        codigo = s.get('Codigo') or s.get('Código') or '?'
        nome = s.get('Nome', '?')
        print(f'  ID={codigo}, Nome={nome}, Cor raw={repr(val)}')
