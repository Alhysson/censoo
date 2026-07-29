import pandas as pd
import json

path_censo = r'c:\Users\Alhysson Saqueto\Desktop\censoo\RelacaoProfissionalEscola_24_7_2026.xlsx'
df = pd.read_excel(path_censo, sheet_name=0, header=21)

def clean_val(v):
    if pd.isna(v): return None
    s = str(v).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return None if s in ('', 'nan', 'NaN', 'None', '-') else s

def clean_cpf(v):
    if v is None or pd.isna(v): return None
    if isinstance(v, (int, float)):
        try:
            s = str(int(v))
            return s.zfill(11)
        except:
            pass
    s = ''.join(filter(str.isdigit, str(v)))
    if s:
        return s.zfill(11)
    return None

def format_cpf_display(cpf_digits):
    if not cpf_digits or len(cpf_digits) != 11:
        return cpf_digits
    return f"{cpf_digits[:3]}.{cpf_digits[3:6]}.{cpf_digits[6:9]}-{cpf_digits[9:]}"

def clean_str_norm(s):
    if not s: return ''
    import unicodedata
    s = unicodedata.normalize('NFKD', str(s)).encode('ASCII', 'ignore').decode('utf-8')
    return s.strip().upper()

# Parse Censo records
censo_profs = {}
for idx, row in df.iterrows():
    name = clean_val(row.get('Nome'))
    if not name or name.startswith('Totais') or name == 'Nome':
        continue
    
    cpf_digits = clean_cpf(row.get('CPF'))
    inep = clean_val(row.get('Identifica\u00e7\u00e3o \u00fanica') or row.get('Identificação Única') or row.iloc[2])
    nasc = clean_val(row.get('Data de Nascimento'))
    sexo = clean_val(row.get('Sexo'))
    cor = clean_val(row.get('Cor/Ra\u00e7a') or row.get('Cor/Raça') or row.iloc[12])
    escolaridade = clean_val(row.get('Maior n\u00edvel de escolaridade conclu\u00eddo') or row.get('Maior nível de escolaridade concluído') or row.iloc[18])
    pos = clean_val(row.get('P\u00f3s-Gradua\u00e7\u00e3o conclu\u00edda') or row.get('Pós-Graduação concluída') or row.iloc[20])
    zona = clean_val(row.get('Localiza\u00e7\u00e3o/Zona de resid\u00eancia') or row.iloc[16])
    
    key = cpf_digits if cpf_digits else clean_str_norm(name)
    
    if key not in censo_profs:
        censo_profs[key] = {
            'inep': inep,
            'nome': name,
            'cpf_digits': cpf_digits,
            'cpf': format_cpf_display(cpf_digits) if cpf_digits else None,
            'nascimento': nasc,
            'sexo': sexo,
            'cor': cor,
            'escolaridade': escolaridade,
            'pos': pos,
            'zona': zona,
            'vinculos': []
        }
    
    turma_cod = clean_val(row.get('C\u00f3digo da turma') or row.iloc[23])
    turma_nome = clean_val(row.get('Nome da Turma') or row.iloc[24])
    etapa = clean_val(row.get('Etapa de ensino') or row.iloc[25])
    funcao = clean_val(row.get('Fun\u00e7\u00e3o que exerce na turma') or row.iloc[27])
    
    if turma_nome or funcao:
        censo_profs[key]['vinculos'].append({
            'turma_codigo': turma_cod,
            'turma_nome': turma_nome,
            'etapa': etapa,
            'funcao': funcao
        })

print(f"Total unique Censo professionals: {len(censo_profs)}")

# Load School Staff
with open('data/staff.json', 'r', encoding='utf-8') as f:
    school_staff = json.load(f)

staff_by_cpf = {}
staff_by_inep = {}
staff_by_name = {}

for s in school_staff:
    cpf = clean_cpf(s.get('CPF') or s.get('Usuário'))
    inep = clean_val(s.get('Identificação CENSO'))
    name = clean_val(s.get('Nome'))
    
    if cpf: staff_by_cpf[cpf] = s
    if inep: staff_by_inep[inep] = s
    if name: staff_by_name[clean_str_norm(name)] = s

comparison_results = []
matched_staff_keys = set()
matched_censo_keys = set()

for c_key, c_data in censo_profs.items():
    cpf = c_data['cpf_digits']
    inep = c_data['inep']
    name = c_data['nome']
    
    matched_s = None
    if cpf and cpf in staff_by_cpf:
        matched_s = staff_by_cpf[cpf]
    elif inep and inep in staff_by_inep:
        matched_s = staff_by_inep[inep]
    elif name and clean_str_norm(name) in staff_by_name:
        matched_s = staff_by_name[clean_str_norm(name)]
    
    if matched_s:
        matched_censo_keys.add(c_key)
        s_code = matched_s.get('Código')
        matched_staff_keys.add(s_code)
        
        divergences = {}
        divergences_count = 0
        
        # 1. Nome
        s_nome = matched_s.get('Nome', '')
        if clean_str_norm(s_nome) != clean_str_norm(c_data['nome']):
            divergences['Nome'] = {'school': s_nome, 'censo': c_data['nome'], 'match': False, 'is_critical': True}
            divergences_count += 1
        else:
            divergences['Nome'] = {'school': s_nome, 'censo': c_data['nome'], 'match': True, 'is_critical': False}

        # 2. CPF
        s_cpf_digits = clean_cpf(matched_s.get('CPF') or matched_s.get('Usuário'))
        c_cpf_digits = c_data['cpf_digits']
        if s_cpf_digits and c_cpf_digits and s_cpf_digits != c_cpf_digits:
            divergences['CPF'] = {
                'school': matched_s.get('CPF') or format_cpf_display(s_cpf_digits),
                'censo': c_data['cpf'],
                'match': False,
                'is_critical': True
            }
            divergences_count += 1
        else:
            divergences['CPF'] = {
                'school': matched_s.get('CPF') or format_cpf_display(s_cpf_digits),
                'censo': c_data['cpf'],
                'match': True,
                'is_critical': False
            }

        # 3. Data de Nascimento
        s_nasc = matched_s.get('Data de Nascimento')
        c_nasc = c_data['nascimento']
        if s_nasc and c_nasc and s_nasc.strip() != c_nasc.strip():
            divergences['Data de Nascimento'] = {'school': s_nasc, 'censo': c_nasc, 'match': False, 'is_critical': True}
            divergences_count += 1
        else:
            divergences['Data de Nascimento'] = {'school': s_nasc, 'censo': c_nasc, 'match': True, 'is_critical': False}

        # 4. Sexo
        s_sexo = matched_s.get('Sexo')
        c_sexo = c_data['sexo']
        if s_sexo and c_sexo and clean_str_norm(s_sexo) != clean_str_norm(c_sexo):
            divergences['Sexo'] = {'school': s_sexo, 'censo': c_sexo, 'match': False, 'is_critical': False}
            divergences_count += 1
        else:
            divergences['Sexo'] = {'school': s_sexo, 'censo': c_sexo, 'match': True, 'is_critical': False}

        # 5. Cor/Raça
        s_cor = clean_str_norm(matched_s.get('Cor'))
        c_cor = clean_str_norm(c_data['cor'])
        if s_cor and c_cor and s_cor != c_cor:
            divergences['Cor/Raça'] = {'school': matched_s.get('Cor'), 'censo': c_data['cor'], 'match': False, 'is_critical': False}
            divergences_count += 1
        else:
            divergences['Cor/Raça'] = {'school': matched_s.get('Cor'), 'censo': c_data['cor'], 'match': True, 'is_critical': False}

        # 6. Escolaridade
        s_esc = clean_str_norm(matched_s.get('Escolaridade'))
        c_esc = clean_str_norm(c_data['escolaridade'])
        esc_match = True
        if s_esc and c_esc:
            if 'SUPERIOR' in s_esc and 'SUPERIOR' in c_esc:
                esc_match = True
            elif 'MEDIO' in s_esc and 'MEDIO' in c_esc:
                esc_match = True
            elif s_esc == c_esc:
                esc_match = True
            else:
                esc_match = False
        
        if not esc_match:
            divergences['Escolaridade'] = {'school': matched_s.get('Escolaridade'), 'censo': c_data['escolaridade'], 'match': False, 'is_critical': True}
            divergences_count += 1
        else:
            divergences['Escolaridade'] = {'school': matched_s.get('Escolaridade'), 'censo': c_data['escolaridade'], 'match': True, 'is_critical': False}

        # 7. Identificação CENSO / INEP
        s_inep = clean_val(matched_s.get('Identificação CENSO'))
        c_inep = clean_val(c_data['inep'])
        if s_inep and c_inep and s_inep != c_inep:
            divergences['Identificação CENSO'] = {'school': s_inep, 'censo': c_inep, 'match': False, 'is_critical': True}
            divergences_count += 1
        else:
            divergences['Identificação CENSO'] = {'school': s_inep, 'censo': c_inep, 'match': True, 'is_critical': False}

        has_divergences = divergences_count > 0

        comparison_results.append({
            'id': s_code or c_inep,
            'nome': matched_s.get('Nome') or c_data['nome'],
            'cpf': matched_s.get('CPF') or c_data['cpf'],
            'status': 'CONCILIADO',
            'has_divergences': has_divergences,
            'divergences_count': divergences_count,
            'divergences': divergences,
            'school_data': matched_s,
            'censo_data': c_data
        })
    else:
        # Present in Censo, missing in School DB
        comparison_results.append({
            'id': c_inep or f"CENSO_{len(comparison_results)+1}",
            'nome': c_data['nome'],
            'cpf': c_data['cpf'],
            'status': 'APENAS_CENSO',
            'has_divergences': True,
            'divergences_count': 1,
            'divergences': {},
            'school_data': None,
            'censo_data': c_data
        })

# Check staff present in School DB but missing in Censo
for s in school_staff:
    code = s.get('Código')
    if code not in matched_staff_keys:
        comparison_results.append({
            'id': code or f"ESCOLA_{len(comparison_results)+1}",
            'nome': s.get('Nome'),
            'cpf': s.get('CPF') or s.get('Usuário'),
            'status': 'APENAS_ESCOLA',
            'has_divergences': True,
            'divergences_count': 1,
            'divergences': {},
            'school_data': s,
            'censo_data': None
        })

print(f"\nTotal Comparison Records: {len(comparison_results)}")

conciliados = [r for r in comparison_results if r['status'] == 'CONCILIADO']
apenas_escola = [r for r in comparison_results if r['status'] == 'APENAS_ESCOLA']
apenas_censo = [r for r in comparison_results if r['status'] == 'APENAS_CENSO']
com_divergencia = [r for r in conciliados if r['has_divergences']]
sem_divergencia = [r for r in conciliados if not r['has_divergences']]

print(f"  -> Conciliados: {len(conciliados)}")
print(f"     -- 100% OK (Sem divergência): {len(sem_divergencia)}")
print(f"     -- Com divergência: {len(com_divergencia)}")
print(f"  -> Apenas na Escola (Ausentes no Censo): {len(apenas_escola)}")
print(f"  -> Apenas no Censo (Ausentes na Escola): {len(apenas_censo)}")

if com_divergencia:
    print("\nExemplo de Divergência real:")
    for d in com_divergencia[:5]:
        print(f"  Prof: {d['nome']}")
        for k, v in d['divergences'].items():
            if not v['match']:
                print(f"    - {k}: Escola='{v['school']}' vs Censo='{v['censo']}'")

# Save to data/staff_comparison.json
with open('data/staff_comparison.json', 'w', encoding='utf-8') as f:
    json.dump(comparison_results, f, ensure_ascii=False, indent=2)

print("\nSalvo em data/staff_comparison.json com sucesso!")
