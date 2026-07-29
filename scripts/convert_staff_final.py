"""
Converts school staff XLS files to clean UTF-8 JSON.
Uses pandas + manual column rename dict to handle mojibake.
"""
import pandas as pd
import json, re

# Definitive column rename map (broken -> correct)
RENAME = {
    # Funcionarios
    'Código': 'Código',
    'C\u00f3digo': 'Código',
    'C\ufffdigo': 'Código',
    'Funcion\u00e1rio': 'Funcionário',
    'Pa\u00eds de origem': 'País de origem',
    'S\u00e9rie': 'Série',
    'N\u00famero do PIS/PASEP/NIS': 'Número do PIS/PASEP/NIS',
    'Matr\u00edcula': 'Matrícula',
    'N\u00famero': 'Número',
    'Munic\u00edpio': 'Município',
    'Filia\u00e7\u00e3o 1': 'Filiação 1',
    'Filia\u00e7\u00e3o 2': 'Filiação 2',
    'Profiss\u00e3o': 'Profissão',
    'Cargo/Fun\u00e7\u00e3o': 'Cargo/Função',
    # Profissionais
    'Identifica\u00e7\u00e3o CENSO': 'Identificação CENSO',
    'Usu\u00e1rio': 'Usuário',
    'Tipo de institui\u00e7\u00e3o': 'Tipo de instituição',
    'Institui\u00e7\u00e3o': 'Instituição',
    'Tipo da p\u00f3s gradua\u00e7\u00e3o': 'Tipo da pós graduação',
    '\u00c1rea da p\u00f3s gradua\u00e7\u00e3o': 'Área da pós graduação',
    'Descri\u00e7\u00e3o/T\u00edtulo do curso': 'Descrição/Título do curso',
    # Values
    'Educa\u00e7\u00e3o Superior': 'Educação Superior',
    'Ensino M\u00e9dio': 'Ensino Médio',
    'PROFESSOR DT II - N\u00cdVEL 2': 'PROFESSOR DT II - NÍVEL 2',
    'N\u00c3O': 'NÃO',
}

def attempt_fix(s):
    """Try latin-1 -> utf-8 mojibake fix"""
    if not isinstance(s, str):
        return s
    try:
        fixed = s.encode('raw_unicode_escape').decode('cp1252')
        return RENAME.get(fixed, fixed)
    except:
        return RENAME.get(s, s)

def clean_val(v):
    if v is None:
        return None
    if isinstance(v, float):
        import math
        if math.isnan(v):
            return None
        if v == int(v):
            return str(int(v))
        return str(v)
    s = str(v).strip()
    return None if s in ('nan', 'NaN', '', 'None') else s

def convert(path, header_row, source_label, name_field):
    df = pd.read_excel(path, sheet_name=0, header=header_row, dtype=str)
    # Fix column names
    new_cols = {}
    for c in df.columns:
        fixed = attempt_fix(c)
        new_cols[c] = fixed
    df = df.rename(columns=new_cols)

    records = []
    for _, row in df.iterrows():
        rec = {}
        for col in df.columns:
            raw = row[col]
            val = clean_val(raw)
            if val is None:
                continue
            fixed_val = attempt_fix(val)
            # Skip garbage cargo value
            if fixed_val and fixed_val.startswith('[br.com.db.'):
                fixed_val = None
            if fixed_val and fixed_val != '-':
                rec[col] = fixed_val
        if len(rec) < 3:
            continue
        # Must have a name
        name = rec.get(name_field)
        if not name:
            continue
        rec['_source'] = source_label
        records.append(rec)
    return records

print("Converting funcionarios...")
funcionarios = convert(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listFuncionario.xls',
    8, 'funcionario', 'Funcionário'
)
# Normalize name field
for f in funcionarios:
    if 'Funcionário' in f:
        f['Nome'] = f.pop('Funcionário')

print(f"  {len(funcionarios)} registros")

print("Converting profissionais...")
profissionais = convert(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listProfissionalEscolar.xls',
    8, 'profissional_escolar', 'Nome'
)
print(f"  {len(profissionais)} registros")

all_staff = funcionarios + profissionais

# Verify
if funcionarios:
    print("\nAmostra Funcionario:")
    print(json.dumps(funcionarios[0], ensure_ascii=False, indent=2))
if profissionais:
    print("\nAmostra Profissional:")
    print(json.dumps(profissionais[0], ensure_ascii=False, indent=2))

# Save
for path, data in [
    ('data/staff.json', all_staff),
    ('data/funcionarios.json', funcionarios),
    ('data/profissionais.json', profissionais),
]:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {path}")

print("Pronto!")
