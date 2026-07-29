import pandas as pd
import json

def clean_val(v):
    if v is None or (isinstance(v, float) and str(v) == 'nan'):
        return None
    s = str(v).strip()
    if s in ('nan', 'NaN', 'None', ''):
        return None
    return s

# Map of broken encoding -> correct UTF-8 (cp1252 read as latin-1)
COLNAME_MAP = {
    'C\xf3digo': 'Código',
    'Funcion\xe1rio': 'Funcionário',
    'Pa\xeds de origem': 'País de origem',
    'S\xe9rie': 'Série',
    'Matr\xedcula': 'Matrícula',
    'N\xfamero do PIS/PASEP/NIS': 'Número do PIS/PASEP/NIS',
    'Filia\xe7\xe3o 1': 'Filiação 1',
    'Filia\xe7\xe3o 2': 'Filiação 2',
    'Profiss\xe3o': 'Profissão',
    'Cargo/Fun\xe7\xe3o': 'Cargo/Função',
    'N\xfamero': 'Número',
    'Munic\xedpio': 'Município',
    'Estado': 'Estado',
    'Identifica\xe7\xe3o CENSO': 'Identificação CENSO',
    'Usu\xe1rio': 'Usuário',
    'Institui\xe7\xe3o': 'Instituição',
    'Tipo de institui\xe7\xe3o': 'Tipo de instituição',
    'Tipo da p\xf3s gradua\xe7\xe3o': 'Tipo da pós graduação',
    '\xc1rea da p\xf3s gradua\xe7\xe3o': 'Área da pós graduação',
    'Descri\xe7\xe3o/T\xedtulo do curso': 'Descrição/Título do curso',
    'Escolaridade': 'Escolaridade',
    'Educa\xe7\xe3o Superior': 'Educação Superior',
}

VALUE_MAP = {
    'ESP\xcdRITO  SANTO': 'ESPÍRITO SANTO',
    'ESP\xcdRITO SANTO': 'ESPÍRITO SANTO',
    'Educa\xe7\xe3o Superior': 'Educação Superior',
    'Superior Completo': 'Superior Completo',
    'N\xe3o': 'Não',
}

def fix_col(c):
    return COLNAME_MAP.get(c, c)

def fix_val(v):
    if v is None:
        return None
    return VALUE_MAP.get(v, v)

def convert_file(path, header_row, file_type, name_col):
    df = pd.read_excel(path, sheet_name=0, header=header_row)
    df.columns = [fix_col(str(c).strip()) if str(c) != 'nan' else f'_col{i}'
                  for i, c in enumerate(df.columns)]

    records = []
    for _, row in df.iterrows():
        record = {}
        for col in df.columns:
            val = clean_val(row[col])
            if val is not None:
                record[col] = fix_val(val)
        if not record or len(record) < 3:
            continue
        # Skip rows where the name column looks like a header or is empty
        name = record.get(name_col, '')
        if not name or name.upper() in ('NOME', 'FUNCIONARIO', 'FUNCIONÁRIO'):
            continue
        record['_source'] = file_type
        records.append(record)
    return records

print("Converting listFuncionario.xls...")
funcionarios = convert_file(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listFuncionario.xls',
    8, 'funcionario', 'Funcionário'
)
print(f"  -> {len(funcionarios)} registros")

print("Converting listProfissionalEscolar.xls...")
profissionais = convert_file(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listProfissionalEscolar.xls',
    8, 'profissional_escolar', 'Nome'
)
print(f"  -> {len(profissionais)} registros")

all_staff = funcionarios + profissionais

# Save files
files_to_save = {
    r'data/staff.json': all_staff,
    r'data/funcionarios.json': funcionarios,
    r'data/profissionais.json': profissionais,
}

for path, data in files_to_save.items():
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} registros -> {path}")

# Print distinct values for key fields
print("\n=== Cargo/Funcao (Funcionarios) ===")
cargos = set(f.get('Cargo/Função') or f.get('Profissão') or '?' for f in funcionarios)
for c in sorted(cargos):
    print(f"  {c}")

print("\n=== Profissao (Profissionais Escolares) ===")
profs = set(p.get('Profissão') or '?' for p in profissionais)
for p in sorted(profs):
    print(f"  {p}")

print("\n=== Escolaridade (Profissionais) ===")
esc = set(p.get('Escolaridade') or '?' for p in profissionais)
for e in sorted(esc):
    print(f"  {e}")

print("\n=== Colunas Funcionarios ===")
if funcionarios:
    print([k for k in funcionarios[0].keys()])
print("\n=== Colunas Profissionais ===")
if profissionais:
    print([k for k in profissionais[0].keys()])

print("\nConversao concluida com sucesso!")
