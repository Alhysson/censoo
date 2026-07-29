import pandas as pd
import json
import unicodedata

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
            return str(int(v)).zfill(11)
        except:
            pass
    s = ''.join(filter(str.isdigit, str(v)))
    return s.zfill(11) if s else None

def format_cpf(c):
    if not c or len(c) != 11: return c
    return f"{c[:3]}.{c[3:6]}.{c[6:9]}-{c[9:]}"

def norm(s):
    if not s: return ''
    s = unicodedata.normalize('NFKD', str(s)).encode('ASCII', 'ignore').decode('utf-8')
    return s.strip().upper()

censo_profs = {}
for idx, row in df.iterrows():
    name = clean_val(row.get('Nome'))
    if not name or name.startswith('Totais') or name == 'Nome':
        continue
    
    cpf_digits = clean_cpf(row.get('CPF'))
    inep = clean_val(row.get('Identifica\u00e7\u00e3o \u00fanica') or row.get('Identificação Única') or row.iloc[2])
    nasc = clean_val(row.get('Data de Nascimento'))
    nacionalidade = clean_val(row.get('Nacionalidade') or row.iloc[11])
    cor = clean_val(row.get('Cor/Ra\u00e7a') or row.get('Cor/Raça') or row.iloc[12])
    indigena = clean_val(row.get('Povo Ind\u00edgena') or row.iloc[13])
    sexo = clean_val(row.get('Sexo') or row.iloc[14])
    deficiencia = clean_val(row.get('Tipo(s) de defici\u00eancia(s)...') or row.iloc[15])
    zona = clean_val(row.get('Localiza\u00e7\u00e3o/Zona de resid\u00eancia') or row.iloc[16])
    escolaridade = clean_val(row.get('Maior n\u00edvel de escolaridade conclu\u00eddo') or row.iloc[18])
    ensino_medio = clean_val(row.get('Tipo de ensino m\u00e9dio cursado') or row.iloc[19])
    pos = clean_val(row.get('P\u00f3s-Gradua\u00e7\u00e3o conclu\u00edda') or row.iloc[20])
    formacao_ped = clean_val(row.get('Forma\u00e7\u00e3o/Complementa\u00e7\u00e3o Pedag\u00f3gica') or row.iloc[21])
    cursos_80h = clean_val(row.get('Outros cursos espec\u00edficos...') or row.iloc[22])
    
    key = cpf_digits if cpf_digits else norm(name)
    
    if key not in censo_profs:
        censo_profs[key] = {
            'inep': inep,
            'nome': name,
            'cpf': format_cpf(cpf_digits) if cpf_digits else None,
            'cpf_digits': cpf_digits,
            'nascimento': nasc,
            'nacionalidade': nacionalidade,
            'cor': cor,
            'indigena': indigena,
            'sexo': sexo,
            'deficiencia': deficiencia,
            'zona': zona,
            'escolaridade': escolaridade,
            'ensino_medio': ensino_medio,
            'pos': pos,
            'formacao_ped': formacao_ped,
            'cursos_80h': cursos_80h,
            'turmas': []
        }
    
    turma_nome = clean_val(row.get('Nome da Turma') or row.iloc[24])
    etapa = clean_val(row.get('Etapa de ensino') or row.iloc[25])
    funcao = clean_val(row.get('Fun\u00e7\u00e3o que exerce na turma') or row.iloc[27])
    componentes = clean_val(row.get('\u00c1reas do conhecimento...') or row.iloc[28])
    
    if turma_nome or funcao:
        censo_profs[key]['turmas'].append({
            'turma': turma_nome,
            'etapa': etapa,
            'funcao': funcao,
            'componentes': componentes
        })

print(f"Parsed {len(censo_profs)} unique professionals in Censo report.")

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
    if name: staff_by_name[norm(name)] = s

comparison_results = []
matched_staff_keys = set()

for c_key, c_data in censo_profs.items():
    cpf = c_data['cpf_digits']
    inep = c_data['inep']
    name = c_data['nome']
    
    matched_s = None
    if cpf and cpf in staff_by_cpf:
        matched_s = staff_by_cpf[cpf]
    elif inep and inep in staff_by_inep:
        matched_s = staff_by_inep[inep]
    elif name and norm(name) in staff_by_name:
        matched_s = staff_by_name[norm(name)]
    
    if matched_s:
        s_code = matched_s.get('Código')
        matched_staff_keys.add(s_code)
        
        divergences = {}
        divergences_count = 0
        
        # 1. Identificação Única / CENSO
        s_inep = clean_val(matched_s.get('Identificação CENSO'))
        c_inep = clean_val(c_data['inep'])
        if s_inep and c_inep and s_inep != c_inep:
            divergences_count += 1
            divergences['Identificação CENSO'] = {'school': s_inep, 'censo': c_inep, 'match': False, 'is_critical': True}
        else:
            divergences['Identificação CENSO'] = {'school': s_inep or '-', 'censo': c_inep or '-', 'match': True, 'is_critical': False}

        # 2. Nome Completo
        s_nome = matched_s.get('Nome')
        c_nome = c_data['nome']
        if norm(s_nome) != norm(c_nome):
            divergences_count += 1
            divergences['Nome Completo'] = {'school': s_nome or '-', 'censo': c_nome or '-', 'match': False, 'is_critical': True}
        else:
            divergences['Nome Completo'] = {'school': s_nome, 'censo': c_nome, 'match': True, 'is_critical': False}

        # 3. CPF
        s_cpf_fmt = format_cpf(clean_cpf(matched_s.get('CPF') or matched_s.get('Usuário')))
        c_cpf_fmt = c_data['cpf']
        if clean_cpf(s_cpf_fmt) != clean_cpf(c_cpf_fmt):
            divergences_count += 1
            divergences['CPF'] = {'school': s_cpf_fmt or '-', 'censo': c_cpf_fmt or '-', 'match': False, 'is_critical': True}
        else:
            divergences['CPF'] = {'school': s_cpf_fmt or '-', 'censo': c_cpf_fmt or '-', 'match': True, 'is_critical': False}

        # 4. Data de Nascimento
        s_nasc = matched_s.get('Data de Nascimento')
        c_nasc = c_data['nascimento']
        if s_nasc and c_nasc and s_nasc.strip() != c_nasc.strip():
            divergences_count += 1
            divergences['Data de Nascimento'] = {'school': s_nasc, 'censo': c_nasc, 'match': False, 'is_critical': True}
        else:
            divergences['Data de Nascimento'] = {'school': s_nasc or '-', 'censo': c_nasc or '-', 'match': True, 'is_critical': False}

        # 5. Sexo
        s_sexo = matched_s.get('Sexo')
        c_sexo = c_data['sexo']
        if s_sexo and c_sexo and norm(s_sexo) != norm(c_sexo):
            divergences_count += 1
            divergences['Sexo'] = {'school': s_sexo, 'censo': c_sexo, 'match': False, 'is_critical': False}
        else:
            divergences['Sexo'] = {'school': s_sexo or '-', 'censo': c_sexo or '-', 'match': True, 'is_critical': False}

        # 6. Cor / Raça
        s_cor = matched_s.get('Cor')
        c_cor = c_data['cor']
        if s_cor and c_cor and norm(s_cor) != norm(c_cor):
            divergences_count += 1
            divergences['Cor / Raça'] = {'school': s_cor, 'censo': c_cor, 'match': False, 'is_critical': False}
        else:
            divergences['Cor / Raça'] = {'school': s_cor or '-', 'censo': c_cor or '-', 'match': True, 'is_critical': False}

        # 7. Nacionalidade
        s_nac = matched_s.get('Nacionalidade')
        c_nac = c_data['nacionalidade']
        if s_nac and c_nac and norm(s_nac) != norm(c_nac):
            divergences_count += 1
            divergences['Nacionalidade'] = {'school': s_nac, 'censo': c_nac, 'match': False, 'is_critical': False}
        else:
            divergences['Nacionalidade'] = {'school': s_nac or '-', 'censo': c_nac or '-', 'match': True, 'is_critical': False}

        # 8. Escolaridade
        s_esc = matched_s.get('Escolaridade')
        c_esc = c_data['escolaridade']
        def norm_esc(v):
            if not v: return ''
            nv = norm(v)
            if 'SUPERIOR' in nv: return 'SUPERIOR'
            if 'MEDIO' in nv: return 'MEDIO'
            return nv
        if s_esc and c_esc and norm_esc(s_esc) != norm_esc(c_esc):
            divergences_count += 1
            divergences['Escolaridade'] = {'school': s_esc, 'censo': c_esc, 'match': False, 'is_critical': True}
        else:
            divergences['Escolaridade'] = {'school': s_esc or '-', 'censo': c_esc or '-', 'match': True, 'is_critical': False}

        # 9. Pós-Graduação
        s_pos = matched_s.get('Tipo da pós graduação')
        if not s_pos or s_pos == '-': s_pos = matched_s.get('Área da pós graduação')
        c_pos = c_data['pos']
        if s_pos and c_pos and norm(s_pos) != norm(c_pos):
            divergences_count += 1
            divergences['Pós-Graduação'] = {'school': s_pos, 'censo': c_pos, 'match': False, 'is_critical': False}
        else:
            divergences['Pós-Graduação'] = {'school': s_pos or '-', 'censo': c_pos or '-', 'match': True, 'is_critical': False}

        # 10. Endereço / Município
        s_mun = matched_s.get('Município')
        s_uf = matched_s.get('Estado')
        s_loc = f"{s_mun}/{s_uf}" if s_mun else None
        c_zona = c_data['zona']
        divergences['Zona de Residência (Censo)'] = {'school': s_loc or '-', 'censo': c_zona or '-', 'match': True, 'is_critical': False}

        # 11. Turmas e Atuação no Censo
        turmas_str = ', '.join([t['turma'] for t in c_data['turmas'] if t.get('turma')]) or 'Sem turma'
        funcao_str = ', '.join(set([t['funcao'] for t in c_data['turmas'] if t.get('funcao')])) or '-'
        divergences['Turmas no Censo'] = {'school': matched_s.get('Cargo/Função') or matched_s.get('Profissão') or '-', 'censo': f"{funcao_str} ({turmas_str})", 'match': True, 'is_critical': False}

        has_divergences = any(not d['match'] for d in divergences.values())

        comparison_results.append({
            'id': s_code or c_inep,
            'nome': matched_s.get('Nome') or c_data['nome'],
            'cpf': s_cpf_fmt or c_data['cpf'],
            'status': 'CONCILIADO',
            'has_divergences': has_divergences,
            'divergences_count': sum(1 for d in divergences.values() if not d['match']),
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
            'cpf': format_cpf(clean_cpf(s.get('CPF') or s.get('Usuário'))),
            'status': 'APENAS_ESCOLA',
            'has_divergences': True,
            'divergences_count': 1,
            'divergences': {},
            'school_data': s,
            'censo_data': None
        })

print(f"Total Comparison Records: {len(comparison_results)}")

with open('data/staff_comparison.json', 'w', encoding='utf-8') as f:
    json.dump(comparison_results, f, ensure_ascii=False, indent=2)

print("Saved data/staff_comparison.json successfully!")
