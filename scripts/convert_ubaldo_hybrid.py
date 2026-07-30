import os
import json
import pandas as pd
import unicodedata

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def clean_val(x):
    if pd.isnull(x):
        return ""
    if isinstance(x, (int, float)):
        if x == int(x):
            return str(int(x))
        return str(x)
    val = str(x).strip()
    if val.endswith('.0'):
        val = val[:-2]
    if val in ['-', '--', '---', 'N/A', 'None', 'nan', 'NaN', 'NaT']:
        return ""
    return val

def normalize_text(text):
    if not isinstance(text, str):
        return ""
    text_clean = text.replace('º', '').replace('ª', '')
    text_norm = unicodedata.normalize('NFKD', text_clean).encode('ASCII', 'ignore').decode('ASCII')
    return " ".join(text_norm.upper().split())

def clean_cpf(val):
    if pd.isnull(val):
        return ""
    return "".join(c for c in str(val) if c.isdigit())

def format_cpf(val):
    digits = clean_cpf(val)
    if len(digits) == 11:
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
    return str(val)

def normalize_class_name(periodo, turma, turno):
    p = str(periodo).upper().replace('º','').replace('ª','').strip()
    t = str(turma).upper().strip()
    s = str(turno).upper().strip()
    if t and s:
        return f"{p} - {t} - {s}"
    elif t:
        return f"{p} - {t}"
    return p

def normalize_naturalidade(val):
    text = normalize_text(val)
    if not text:
        return ""
    states = {
        'ESPIRITO SANTO': 'ES',
        'ESPIRITO  SANTO': 'ES',
        'MINAS GERAIS': 'MG',
        'RIO DE JANEIRO': 'RJ',
        'SAO PAULO': 'SP',
        'BAHIA': 'BA',
        'CEARA': 'CE',
        'PERNAMBUCO': 'PE',
        'PARANA': 'PR',
        'RIO GRANDE DO SUL': 'RS',
        'SANTA CATARINA': 'SC',
    }
    for full, abbr in states.items():
        text = text.replace(full, abbr)
    text = text.replace(' -', '-').replace('- ', '-').replace('  ', ' ')
    return text.strip()

def normalize_etapa(val):
    text = normalize_text(val)
    if not text:
        return ""
    for num in range(1, 10):
        if f"{num} ANO" in text or f"{num}ANO" in text:
            return f"{num} ANO"
        if f"{num} PERIODO" in text or f"{num}PERIODO" in text:
            return f"{num} PERIODO"
    if "PRE-ESCOLA" in text or "PRE ESCOLA" in text:
        return "PRE-ESCOLA"
    if "CRECHE" in text:
        return "CRECHE"
    return text

def values_are_equivalent(field_name, val_school, val_censo):
    s_clean = clean_val(val_school)
    c_clean = clean_val(val_censo)
    
    if not s_clean and not c_clean:
        return True
    
    s_norm = normalize_text(str(s_clean))
    c_norm = normalize_text(str(c_clean))
    
    if field_name == 'CPF':
        return clean_cpf(s_clean) == clean_cpf(c_clean)
        
    if field_name == 'Data de Nascimento':
        s_date = str(s_clean).replace('-', '/')
        c_date = str(c_clean).replace('-', '/')
        return s_date == c_date
        
    if field_name == 'Município-UF de nascimento':
        return normalize_naturalidade(s_clean) == normalize_naturalidade(c_clean)
        
    if field_name == 'Localização/Zona de residência':
        if 'URBANA' in s_norm and 'URBANA' in c_norm:
            return True
        if 'RURAL' in s_norm and 'RURAL' in c_norm:
            return True
            
    if field_name == 'Atendimento hospitalar/domiciliar':
        if ('NAO RECEBE' in s_norm or s_norm == '') and ('NAO RECEBE' in c_norm or c_norm == ''):
            return True
            
    if field_name == 'Transporte escolar (Sim/Não)':
        s_bool = 'SIM' if 'SIM' in s_norm or s_norm == 'S' else 'NAO'
        c_bool = 'SIM' if 'SIM' in c_norm or c_norm == 'S' else 'NAO'
        return s_bool == c_bool
        
    if field_name == 'Localização diferenciada de residência':
        s_diff = 'SIM' if 'SIM' in s_norm or ('AREA' in s_norm and 'NAO ESTA' not in s_norm) else 'NAO'
        c_diff = 'SIM' if 'SIM' in c_norm or ('AREA' in c_norm and 'NAO ESTA' not in c_norm) else 'NAO'
        return s_diff == c_diff
        
    if field_name == 'Nome da Turma':
        return c_norm == s_norm
        
    if field_name == 'Etapa de ensino':
        return normalize_etapa(s_clean) == normalize_etapa(c_clean)
        
    if field_name == 'Tipo(s) de deficiência(s)...':
        s_has_def = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_def = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_def and not c_has_def:
            return True
        return s_norm == c_norm

    if field_name == 'Tipo(s) de transtorno(s)...':
        s_has_t = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_t = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_t and not c_has_t:
            return True
        return s_norm == c_norm

    if field_name == 'Recursos para avaliações':
        s_has_r = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_r = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_r and not c_has_r:
            return True
        return s_norm == c_norm

    if field_name == 'Atendimento especializado AEE':
        s_has_a = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_a = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_a and not c_has_a:
            return True
        return s_norm == c_norm

    return s_norm == c_norm

def process_school_excel(excel_path):
    print(f"Lendo dados da escola do Excel: {excel_path}")
    df = pd.read_excel(excel_path, header=8)
    df.columns = [str(c).strip() for c in df.columns]
    
    students = []
    for _, row in df.iterrows():
        nome = clean_val(row.get('Nome'))
        if not nome or "Relatório gerado" in nome or "Usuário" in nome:
            continue
            
        student = {}
        for col in df.columns:
            col_clean = col.strip()
            if col_clean == 'Falecido.1':
                key = 'Falecido Filiação 2'
            elif col_clean == 'Falecido':
                key = 'Falecido Filiação 1'
            else:
                key = col_clean
            student[key] = clean_val(row[col])
            
        students.append(student)
        
    print(f"Total de alunos extraídos do Excel da escola: {len(students)}")
    return students

def is_valid_ordem(val):
    if pd.isnull(val):
        return False
    try:
        f = float(val)
        return f.is_integer()
    except ValueError:
        return False

def is_page_header(row):
    nome_val = str(row.get('Nome')).strip()
    cpf_val = str(row.get('CPF')).strip()
    ordem_val = str(row.get('Ordem')).strip()
    if nome_val == 'Nome' or cpf_val == 'CPF' or ordem_val == 'Ordem':
        return True
    return False

def extract_censo_students_xlsx(xlsx_path):
    print(f"Lendo dados do CENSO do Excel: {xlsx_path}")
    df = pd.read_excel(xlsx_path, header=8)
    df.columns = [str(c).strip() for c in df.columns]
    
    standard_map = {
        'Ordem': 'Ordem',
        'Identificação única': 'Identificação única',
        'Nome': 'Nome',
        'Data de nascimento': 'Data de nascimento',
        'CPF': 'CPF',
        'Nacionalidade': 'Nacionalidade',
        'Município-UF de nascimento': 'Município-UF de nascimento',
        'Cor/Raça': 'Cor/Raça',
        'Povo indígena': 'Povo indígena',
        'Sexo': 'Sexo',
        'Tipo(s) de deficiência(s), transtorno(s) do espectro autista e altas habilidades ou superdotação': 'Tipo(s) de deficiência(s), transtorno(s) do espectro autista e altas habilidades ou superdotação',
        'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem': 'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem',
        'Recursos para o uso do(a) aluno(a) em sala de aula para a participação em avaliações do Inep (Saeb)': 'Recursos para o uso do(a) aluno(a) em sala de aula para a participação em avaliações do Inep (Saeb)',
        'Localização/Zona de residência': 'Localização/Zona de residência',
        'Localização diferenciada de residência': 'Localização diferenciada de residência',
        'Código da Matrícula': 'Código da Matrícula',
        'Código da turma': 'Código da turma',
        'Nome da turma': 'Nome da turma',
        'Etapa de ensino': 'Etapa de ensino',
        'Tipo de atendimento educacional especializado (AEE)': 'Tipo de atendimento educacional especializado (AEE)',
        'Recebe atendimento educacional em regime hospitalar ou domiciliar': 'Recebe atendimento educacional em regime hospitalar ou domiciliar',
        'Transporte escolar (Sim/Não)': 'Transporte escolar (Sim/Não)',
        'Poder Público responsável': 'Poder Público responsável',
        'Tipo de veículo utilizado no transporte escolar': 'Tipo de veículo utilizado no transporte escolar'
    }
    
    clean_cols = {}
    for col in df.columns:
        col_clean = "".join(col.split()).lower()
        col_clean = unicodedata.normalize('NFKD', col_clean).encode('ASCII', 'ignore').decode('ASCII')
        
        matched_key = None
        for std_key in standard_map.keys():
            std_clean = "".join(std_key.split()).lower()
            std_clean = unicodedata.normalize('NFKD', std_clean).encode('ASCII', 'ignore').decode('ASCII')
            if col_clean == std_clean:
                matched_key = std_key
                break
        if matched_key:
            clean_cols[col] = standard_map[matched_key]
            
    df = df.rename(columns=clean_cols)
    
    raw_students = []
    current_student = None
    
    def clean_str(val):
        if pd.isnull(val):
            return ""
        return str(val).strip()
        
    for _, row in df.iterrows():
        if is_page_header(row):
            continue
        ordem = row.get('Ordem')
        if is_valid_ordem(ordem):
            if current_student:
                raw_students.append(current_student)
            current_student = {}
            for col_name in standard_map.values():
                current_student[col_name] = clean_str(row.get(col_name))
            current_student['Ordem'] = int(float(ordem))
        else:
            if current_student:
                for col_name in standard_map.values():
                    val = clean_str(row.get(col_name))
                    if val:
                        if col_name in ['Nome', 'Nome da turma', 'Etapa de ensino', 'Localização/Zona de residência', 'Localização diferenciada de residência', 'Tipo de atendimento educacional especializado (AEE)', 'Recebe atendimento educacional em regime hospitalar ou domiciliar', 'Tipo(s) de deficiência(s), transtorno(s) do espectro autista e altas habilidades ou superdotação', 'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem', 'Recursos para o uso do(a) aluno(a) em sala de aula para a participação em avaliações do Inep (Saeb)']:
                            current_student[col_name] = (current_student[col_name] + " " + val).strip()
                        else:
                            if not current_student[col_name]:
                                current_student[col_name] = val
                                
    if current_student:
        raw_students.append(current_student)
        
    students = []
    for st in raw_students:
        nome = st.get('Nome', '').strip()
        if not nome or "Filtros" in nome or "Relatório" in nome:
            continue
            
        # Clean CPF
        cpf_num = clean_cpf(st.get('CPF', ''))
        st['CPF'] = format_cpf(cpf_num) if cpf_num else ''
        
        # Clean Date
        raw_date = st.get('Data de nascimento', '')
        if raw_date:
            if ' ' in raw_date:
                raw_date = raw_date.split(' ')[0]
            if '-' in raw_date:
                parts = raw_date.split('-')
                if len(parts) == 3 and len(parts[0]) == 4:
                    raw_date = f"{parts[2]}/{parts[1]}/{parts[0]}"
            st['Data de nascimento'] = raw_date
            
        # Clean ID
        st['Identificação única'] = clean_cpf(st.get('Identificação única', ''))
        
        students.append(st)
        
    print(f"Total de alunos extraídos do CENSO do Excel: {len(students)}")
    return students

def build_comparison(school_students, censo_students):
    print("Construindo comparação escola x censo (com suporte a múltiplos vínculos)...")
    
    school_records = []
    school_by_cpf = {}
    school_by_censo_id = {}
    school_by_name = {}
    
    for student in school_students:
        name_norm = normalize_text(student.get('Nome', ''))
        cpf_clean = clean_cpf(student.get('CPF', ''))
        censo_id = str(student.get('Identificação CENSO', '')).strip()
        
        record_wrapper = {
            'school_student': student,
            'name_norm': name_norm,
            'cpf_clean': cpf_clean,
            'censo_id': censo_id,
            'matched_censo_rows': []
        }
        school_records.append(record_wrapper)
        
        if cpf_clean:
            school_by_cpf[cpf_clean] = record_wrapper
        if censo_id and censo_id != "0" and censo_id != "0.0":
            school_by_censo_id[censo_id] = record_wrapper
        school_by_name[name_norm] = record_wrapper

    unmatched_censo_records = []
    
    for censo_row in censo_students:
        c_name_norm = normalize_text(censo_row.get('Nome', ''))
        c_cpf_clean = clean_cpf(censo_row.get('CPF', ''))
        c_id = str(censo_row.get('Identificação única', '')).strip()
        
        matched_wrapper = None
        
        if c_cpf_clean and c_cpf_clean in school_by_cpf:
            matched_wrapper = school_by_cpf[c_cpf_clean]
        elif c_id and c_id in school_by_censo_id:
            matched_wrapper = school_by_censo_id[c_id]
        elif c_name_norm and c_name_norm in school_by_name:
            matched_wrapper = school_by_name[c_name_norm]
            
        if matched_wrapper:
            matched_wrapper['matched_censo_rows'].append(censo_row)
        else:
            unmatched_censo_records.append(censo_row)
            
    print(f"Reconciliação: CENSO sem correspondência na Escola = {len(unmatched_censo_records)}")

    fields_to_compare = [
        ('Nome', 'Nome', 'Nome'),
        ('CPF', 'CPF', 'CPF'),
        ('Data de Nascimento', 'Data de Nascimento', 'Data de nascimento'),
        ('Sexo', 'Sexo', 'Sexo'),
        ('Cor/Raça', 'Cor', 'Cor/Raça'),
        ('Nacionalidade', 'Nacionalidade', 'Nacionalidade'),
        ('Município-UF de nascimento', 'Naturalidade', 'Município-UF de nascimento'),
        ('Povo indígena', 'Povo indígena', 'Povo indígena'),
        ('Tipo(s) de deficiência(s)...', 'Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação', 'Tipo(s) de deficiência(s), transtorno(s) do espectro autista e altas habilidades ou superdotação'),
        ('Tipo(s) de transtorno(s)...', 'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem', 'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'),
        ('Recursos para avaliações', 'Recursos necessários para uso do estudante e para a participação em avaliações do Inep (Saeb)', 'Recursos para o uso do(a) aluno(a) em sala de aula para a participação em avaliações do Inep (Saeb)'),
        ('Localização/Zona de residência', 'Localização da Residência (CENSO)', 'Localização/Zona de residência'),
        ('Localização diferenciada de residência', 'Localização diferenciada (CENSO)', 'Localização diferenciada de residência'),
        ('Código da Matrícula', 'Código', 'Código da Matrícula'),
        ('Nome da Turma', 'Descrição', 'Nome da turma'),
        ('Etapa de ensino', 'Período', 'Etapa de ensino'),
        ('Atendimento especializado AEE', 'Tipo de Atendimento Educacional Especializado', 'Tipo de atendimento educacional especializado (AEE)'),
        ('Atendimento hospitalar/domiciliar', 'Recebe Escolarização em Outro Espaço (CENSO)', 'Recebe atendimento educacional em regime hospitalar ou domiciliar'),
        ('Transporte escolar (Sim/Não)', 'Utiliza transporte', 'Transporte escolar (Sim/Não)'),
        ('Poder Público responsável', 'Poder Público Responsável', 'Poder Público responsável'),
    ]

    comparison_output = []
    
    for wrapper in school_records:
        school_student = wrapper['school_student']
        censo_rows = wrapper['matched_censo_rows']
        
        comp_record = {
            'id': school_student.get('Código', '') or normalize_text(school_student.get('Nome', '')),
            'nome': school_student.get('Nome', ''),
            'cpf': format_cpf(school_student.get('CPF', '')),
            'status': 'CONCILIADO' if censo_rows else 'APENAS_ESCOLA',
            'has_divergences': False,
            'divergences_count': 0,
            'divergences': {},
            'school_data': school_student,
            'censo_rows': censo_rows
        }
        
        if censo_rows:
            for display_name, school_key, censo_key in fields_to_compare:
                val_school = school_student.get(school_key, '')
                
                if display_name == 'Nome da Turma':
                    val_school = normalize_class_name(
                        school_student.get('Período', ''), 
                        school_student.get('Turma', ''), 
                        school_student.get('Turno', '')
                    )
                
                censo_vals = [r.get(censo_key, '') for r in censo_rows]
                
                is_match = False
                for val_censo in censo_vals:
                    if values_are_equivalent(display_name, val_school, val_censo):
                        is_match = True
                        break
                
                if not is_match:
                    all_empty_censo = all(clean_val(v) == '' for v in censo_vals)
                    if all_empty_censo and clean_val(val_school) == '':
                        is_match = True
                        
                is_critical = (display_name != 'Código da Matrícula')
                
                display_school = clean_val(school_student.get(school_key, ''))
                if display_name == 'Nome da Turma':
                    display_school = f"{school_student.get('Período', '')} {school_student.get('Turma', '')} ({school_student.get('Turno', '')})"
                    
                display_censo = " / ".join(str(clean_val(v)) for v in censo_vals if clean_val(v) != '')
                if not display_censo:
                    display_censo = "-"

                comp_record['divergences'][display_name] = {
                    'school_val': display_school if display_school != '' else '-',
                    'censo_val': display_censo,
                    'match': is_match,
                    'is_critical': is_critical
                }
                
                if not is_match and is_critical:
                    comp_record['has_divergences'] = True
                    comp_record['divergences_count'] += 1
                    
        comparison_output.append(comp_record)

    # Process all unmatched CENSO students (APENAS_CENSO)
    for censo_rec in unmatched_censo_records:
        comp_record = {
            'id': censo_rec.get('Código da Matrícula', '') or censo_rec.get('Identificação única', ''),
            'nome': censo_rec.get('Nome', ''),
            'cpf': format_cpf(censo_rec.get('CPF', '')),
            'status': 'APENAS_CENSO',
            'has_divergences': False,
            'divergences_count': 0,
            'divergences': {},
            'school_data': {},
            'censo_rows': [censo_rec]
        }
        
        for display_name, school_key, censo_key in fields_to_compare:
            val_censo = censo_rec.get(censo_key, '')
            comp_record['divergences'][display_name] = {
                'school_val': '-',
                'censo_val': val_censo if clean_val(val_censo) != '' else '-',
                'match': False,
                'is_critical': True
            }
            
        comparison_output.append(comp_record)

    return comparison_output

def main():
    print("============================================================")
    print("CONVERSÃO HÍBRIDA v4 - EMEF UBALDO RAMALHETE (Excel Escola + Excel Censo)")
    print("============================================================")
    
    excel_school = os.path.join(BASE_DIR, "listMatriculaAluno (1).xls")
    excel_censo = os.path.join(BASE_DIR, "RelacaoAlunoEscola_28_7_2026 (1).xlsx")
    
    out_students = os.path.join(BASE_DIR, "data", "students_ubaldo.json")
    out_comparison = os.path.join(BASE_DIR, "data", "comparison_ubaldo.json")
    
    public_students = os.path.join(BASE_DIR, "public", "data", "students_ubaldo.json")
    public_comparison = os.path.join(BASE_DIR, "public", "data", "comparison_ubaldo.json")
    
    school_students = process_school_excel(excel_school)
    
    # Save standard students database to both folders
    with open(out_students, 'w', encoding='utf-8') as f:
        json.dump(school_students, f, ensure_ascii=False, indent=2)
    os.makedirs(os.path.dirname(public_students), exist_ok=True)
    with open(public_students, 'w', encoding='utf-8') as f:
        json.dump(school_students, f, ensure_ascii=False, indent=2)
    print(f"Alunos salvos em {out_students} e {public_students}")
        
    censo_students = extract_censo_students_xlsx(excel_censo)
    
    comparison = build_comparison(school_students, censo_students)
    
    # Save comparison database to both folders
    with open(out_comparison, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
    with open(public_comparison, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
        
    concil = sum(1 for r in comparison if r['status']=='CONCILIADO')
    escola = sum(1 for r in comparison if r['status']=='APENAS_ESCOLA')
    censo  = sum(1 for r in comparison if r['status']=='APENAS_CENSO')
    diverg = sum(1 for r in comparison if r['has_divergences'])
    
    print(f"Reconciliação: Total: {len(comparison)} | CONCILIADO: {concil} | APENAS_ESCOLA: {escola} | APENAS_CENSO: {censo} | DIVERGÊNCIAS: {diverg}")
    print("CONCLUÍDO!")

if __name__ == '__main__':
    main()
