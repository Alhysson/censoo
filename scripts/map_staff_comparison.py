import pandas as pd
import json

# 1. Read Censo Professionals Excel
path_censo = r'c:\Users\Alhysson Saqueto\Desktop\censoo\RelacaoProfissionalEscola_24_7_2026.xlsx'
df_censo = pd.read_excel(path_censo, sheet_name=0, header=21)

print("Censo raw rows:", len(df_censo))
print("Censo columns:", list(df_censo.columns))

# Clean Censo data
censo_records = []
for idx, row in df_censo.iterrows():
    name = row.get('Nome')
    if pd.isna(name) or str(name).strip() == '' or str(name).strip().startswith('Totais') or str(name).strip() == 'Nome':
        continue
    
    rec = {}
    for col in df_censo.columns:
        val = row[col]
        if pd.notna(val) and str(val).strip() not in ('', 'nan', 'NaN', 'None'):
            rec[str(col).strip()] = str(val).strip()
    
    if len(rec) >= 3:
        censo_records.append(rec)

print(f"Total Censo raw entries (vínculos): {len(censo_records)}")

# Group Censo records by CPF or Identificação Única or Name
censo_by_cpf = {}
censo_by_inep = {}
censo_by_name = {}

for r in censo_records:
    cpf = r.get('CPF', '').replace('.', '').replace('-', '').zfill(11) if r.get('CPF') else None
    inep = r.get('Identifica\u00e7\u00e3o \u00fanica') or r.get('Identificação Única') or r.get(df_censo.columns[1])
    name = r.get('Nome', '').strip().upper()
    
    key = cpf if (cpf and len(cpf) == 11 and cpf != '00000000000') else name
    
    if key not in censo_by_name:
        censo_by_name[key] = {
            'Identificação CENSO': inep,
            'Nome': r.get('Nome'),
            'CPF': r.get('CPF'),
            'Data de Nascimento': r.get('Data de Nascimento'),
            'Sexo': r.get('Sexo'),
            'Cor/Raça': r.get('Cor/Ra\u00e7a') or r.get('Cor/Raça'),
            'Nacionalidade': r.get('Nacionalidade'),
            'Maior nível de escolaridade concluído': r.get('Maior n\u00edvel de escolaridade conclu\u00eddo') or r.get('Maior nível de escolaridade concluído'),
            'Pós-Graduação concluída': r.get('P\u00f3s-Gradua\u00e7\u00e3o conclu\u00edda') or r.get('Pós-Graduação concluída'),
            'Localização/Zona de residência': r.get('Localiza\u00e7\u00e3o/Zona de resid\u00eancia') or r.get('Localização/Zona de residência'),
            'Turmas/Vínculos': []
        }
    
    turma_info = {
        'Código da turma': r.get('C\u00f3digo da turma') or r.get('Código da turma'),
        'Nome da Turma': r.get('Nome da Turma'),
        'Etapa de ensino': r.get('Etapa de ensino'),
        'Função que exerce na turma': r.get('Fun\u00e7\u00e3o que exerce na turma') or r.get('Função que exerce na turma'),
        'Situação Funcional / Regime de contratação': r.get('Situa\u00e7\u00e3o Funcional / Regime de contrata\u00e7\u00e3o / Tipo de v\u00ednculo') or r.get('Situação Funcional / Regime de contratação / Tipo de vínculo')
    }
    censo_by_name[key]['Turmas/Vínculos'].append(turma_info)

print(f"Unique Censo professionals: {len(censo_by_name)}")

# 2. Read School Staff JSON
with open('data/staff.json', 'r', encoding='utf-8') as f:
    school_staff = json.load(f)

print(f"School Staff total records: {len(school_staff)}")

