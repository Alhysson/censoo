import os
import json
import pandas as pd
import numpy as np
import unicodedata

def clean_value(val):
    if pd.isnull(val):
        return ""
    if isinstance(val, (int, float)):
        if val == int(val):
            return int(val)
        return val
    val_str = str(val).strip()
    if val_str == "-" or val_str == "--" or val_str.lower() == "nan":
        return ""
    return val_str

def normalize_text(text):
    if not isinstance(text, str):
        return ""
    # Replace ordinal indicators before applying normalization (which converts them to 'o' / 'a')
    text_clean = text.replace('º', '').replace('ª', '')
    text_norm = unicodedata.normalize('NFKD', text_clean).encode('ASCII', 'ignore').decode('ASCII')
    return " ".join(text_norm.upper().split())

def clean_cpf(val):
    if pd.isnull(val):
        return ""
    return "".join(c for c in str(val) if c.isdigit())

def normalize_class_name(periodo, turma, turno):
    if not periodo:
        return ""
    p_norm = str(periodo).upper().replace('º', '').replace('ª', '').strip()
    t_norm = str(turma).upper().strip()
    shift_norm = str(turno).upper().strip()
    
    if t_norm and shift_norm:
        return f"{p_norm} - {t_norm} - {shift_norm}"
    elif t_norm:
        return f"{p_norm} - {t_norm}"
    return p_norm

def normalize_naturalidade(val):
    text = normalize_text(val)
    if not text:
        return ""
    # Map state names to abbreviations
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
    # remove double spaces or double dashes
    text = text.replace(' -', '-').replace('- ', '-').replace('  ', ' ')
    return text.strip()

def normalize_etapa(val):
    text = normalize_text(val)
    if not text:
        return ""
    # Extract structural parts: e.g. "9 ANO", "1 PERIODO", "PRE-ESCOLA", "CRECHE"
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
    s_clean = clean_value(val_school)
    c_clean = clean_value(val_censo)
    
    # If both are empty
    if not s_clean and not c_clean:
        return True
    
    s_norm = normalize_text(str(s_clean))
    c_norm = normalize_text(str(c_clean))
    
    # 1. CPF Comparison (compare digits only)
    if field_name == 'CPF':
        return clean_cpf(s_clean) == clean_cpf(c_clean)
        
    # 2. Date Comparison
    if field_name == 'Data de Nascimento':
        s_date = str(s_clean).replace('-', '/')
        c_date = str(c_clean).replace('-', '/')
        return s_date == c_date
        
    # 3. Naturalidade (Município-UF de nascimento)
    if field_name == 'Município-UF de nascimento':
        return normalize_naturalidade(s_clean) == normalize_naturalidade(c_clean)
        
    # 4. Zone comparison (Zona Urbana / Urbana)
    if field_name == 'Localização/Zona de residência':
        if 'URBANA' in s_norm and 'URBANA' in c_norm:
            return True
        if 'RURAL' in s_norm and 'RURAL' in c_norm:
            return True
            
    # 5. Atendimento hospitalar/domiciliar
    if field_name == 'Atendimento hospitalar/domiciliar':
        if ('NAO RECEBE' in s_norm or s_norm == '') and ('NAO RECEBE' in c_norm or c_norm == ''):
            return True
            
    # 6. Transporte (Sim/Não vs Utiliza)
    if field_name == 'Transporte escolar (Sim/Não)':
        s_bool = 'SIM' if 'SIM' in s_norm or s_norm == 'S' else 'NAO'
        c_bool = 'SIM' if 'SIM' in c_norm or c_norm == 'S' else 'NAO'
        return s_bool == c_bool
        
    # 7. Localização diferenciada
    if field_name == 'Localização diferenciada de residência':
        s_diff = 'SIM' if 'SIM' in s_norm or ('AREA' in s_norm and 'NAO ESTA' not in s_norm) else 'NAO'
        c_diff = 'SIM' if 'SIM' in c_norm or ('AREA' in c_norm and 'NAO ESTA' not in c_norm) else 'NAO'
        return s_diff == c_diff
        
    # 8. Turma comparison (e.g. 9º ANO C vs 9 ANO - C - VESPERTINO)
    if field_name == 'Nome da Turma':
        return c_norm == s_norm
        
    # 9. Etapa de ensino comparison (e.g. school Período vs censo Etapa)
    if field_name == 'Etapa de ensino':
        return normalize_etapa(s_clean) == normalize_etapa(c_clean)
        
    # 10. Deficiência comparison
    if field_name == 'Tipo(s) de deficiência(s)...':
        s_has_def = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_def = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_def and not c_has_def:
            return True
        return s_norm == c_norm

    # 11. Transtornos de aprendizagem
    if field_name == 'Tipo(s) de transtorno(s)...':
        s_has_t = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_t = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_t and not c_has_t:
            return True
        return s_norm == c_norm

    # 12. Recursos Sala
    if field_name == 'Recursos para avaliações':
        s_has_r = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_r = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_r and not c_has_r:
            return True
        return s_norm == c_norm

    # 13. AEE
    if field_name == 'Atendimento especializado AEE':
        s_has_a = s_norm != '' and s_norm != 'NAO' and s_norm != '-'
        c_has_a = c_norm != '' and c_norm != 'NAO' and c_norm != '--' and c_norm != '-'
        if not s_has_a and not c_has_a:
            return True
        return s_norm == c_norm

    # Default text comparison
    return s_norm == c_norm

def run_conversion_and_comparison(excel_school_path, excel_censo_path, output_students_json, output_comparison_json):
    print("=" * 60)
    print("STARTING DATA PARSING & COMPARISON PROCESS")
    print("=" * 60)
    
    # 1. LOAD SCHOOL DATABASE
    print(f"Loading school database from: {excel_school_path}")
    df_school = pd.read_excel(excel_school_path, header=8)
    df_school.columns = [str(c).strip() for c in df_school.columns]
    
    # 2. LOAD CENSO REPORT
    print(f"Loading CENSO report from: {excel_censo_path}")
    df_censo = pd.read_excel(excel_censo_path, header=0)
    if any(str(c).startswith('Unnamed') for c in df_censo.columns[:5]):
        new_header = df_censo.iloc[0]
        df_censo = df_censo[1:]
        df_censo.columns = new_header
        df_censo = df_censo.reset_index(drop=True)
    df_censo.columns = [str(c).strip() for c in df_censo.columns]
    
    # Clean rows by skipping empty names
    df_school = df_school[df_school['Nome'].notnull() & (df_school['Nome'].str.strip() != '')]
    df_censo = df_censo[df_censo['Nome'].notnull() & (df_censo['Nome'].str.strip() != '')]
    
    print(f"Cleaned records: School = {len(df_school)} | CENSO = {len(df_censo)}")
    
    # Create main students database list for the normal views
    students_list = []
    for idx, row in df_school.iterrows():
        student_data = {}
        for col in df_school.columns:
            col_clean = col.strip()
            if col_clean == 'Falecido.1':
                key = 'Falecido Filiação 2'
            elif col_clean == 'Falecido':
                key = 'Falecido Filiação 1'
            else:
                key = col_clean
            student_data[key] = clean_value(row[col])
        students_list.append(student_data)
        
    # Save standard students database (backward compatibility)
    os.makedirs(os.path.dirname(output_students_json), exist_ok=True)
    with open(output_students_json, 'w', encoding='utf-8') as f:
        json.dump(students_list, f, ensure_ascii=False, indent=2)
    print(f"Standard database students.json written ({len(students_list)} records)")

    # 3. BUILD INDEXES FOR CROSS-COMPARISON
    school_records = []
    school_by_cpf = {}
    school_by_censo_id = {}
    school_by_name = {}
    
    for student in students_list:
        name_norm = normalize_text(student['Nome'])
        cpf_clean = clean_cpf(student['CPF'])
        censo_id = str(student['Identificação CENSO']).strip() if student['Identificação CENSO'] else ""
        
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

    # 4. MATCH CENSO RECORDS
    unmatched_censo_records = []
    
    for idx, row in df_censo.iterrows():
        censo_row = {str(k).strip(): clean_value(v) for k, v in row.to_dict().items()}
        
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
            
    print(f"Matching stats: CENSO Unmatched = {len(unmatched_censo_records)}")

    # 5. COMPARE SHARED FIELDS FOR MATCHED RECORDS & BUILD OUTPUT
    comparison_output = []
    
    # Field mapping configuration: (Display name, School key, CENSO key)
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
        ('Etapa de ensino', 'Período', 'Etapa de ensino'), # Compare school Período to censo Etapa
        ('Atendimento especializado AEE', 'Tipo de Atendimento Educacional Especializado', 'Tipo de atendimento educacional especializado (AEE)'),
        ('Atendimento hospitalar/domiciliar', 'Recebe Escolarização em Outro Espaço (CENSO)', 'Recebe atendimento educacional em regime hospitalar ou domiciliar'),
        ('Transporte escolar (Sim/Não)', 'Utiliza transporte', 'Transporte escolar (Sim/Não)'),
        ('Poder Público responsável', 'Poder Público Responsável', 'Poder Público responsável'),
        ('Tipo de veículo transporte', 'Transporte escolar', 'Tipo de veículo utilizado no transporte escolar'),
    ]

    for wrapper in school_records:
        school_student = wrapper['school_student']
        censo_rows = wrapper['matched_censo_rows']
        
        comp_record = {
            'id': school_student['Código'],
            'nome': school_student['Nome'],
            'cpf': format_cpf_helper(school_student['CPF']),
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
                
                # Special school value constructions
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
                    all_empty_censo = all(clean_value(v) == '' for v in censo_vals)
                    if all_empty_censo and clean_value(val_school) == '':
                        is_match = True
                        
                is_critical = (display_name != 'Código da Matrícula')
                
                display_school = clean_value(school_student.get(school_key, ''))
                if display_name == 'Nome da Turma':
                    display_school = f"{school_student.get('Período', '')} {school_student.get('Turma', '')} ({school_student.get('Turno', '')})"
                    
                display_censo = " / ".join(str(clean_value(v)) for v in censo_vals if clean_value(v) != '')
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
            'id': censo_rec.get('Código da Matrícula', ''),
            'nome': censo_rec.get('Nome', ''),
            'cpf': format_cpf_helper(censo_rec.get('CPF', '')),
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
                'censo_val': val_censo if clean_value(val_censo) != '' else '-',
                'match': False,
                'is_critical': True
            }
            
        comparison_output.append(comp_record)

    # Write output to comparison.json
    os.makedirs(os.path.dirname(output_comparison_json), exist_ok=True)
    with open(output_comparison_json, 'w', encoding='utf-8') as f:
        json.dump(comparison_output, f, ensure_ascii=False, indent=2)
        
    print(f"Comparison report comparison.json written successfully.")
    print(f"Total compared records: {len(comparison_output)}")
    print(f"  CONCILIADO: {sum(1 for r in comparison_output if r['status'] == 'CONCILIADO')}")
    print(f"  APENAS_ESCOLA: {sum(1 for r in comparison_output if r['status'] == 'APENAS_ESCOLA')}")
    print(f"  APENAS_CENSO: {sum(1 for r in comparison_output if r['status'] == 'APENAS_CENSO')}")
    print(f"  COM DIVERGÊNCIAS CRÍTICAS: {sum(1 for r in comparison_output if r['has_divergences'])}")

def format_cpf_helper(cpf):
    if pd.isnull(cpf):
        return ""
    cleaned = "".join(c for c in str(cpf) if c.isdigit())
    if len(cleaned) != 11:
        return str(cpf)
    return f"{cleaned[:3]}.{cleaned[3:6]}.{cleaned[6:9]}-{cleaned[9:]}"

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    excel_school = os.path.join(base_dir, "listMatriculaAluno (68).xls")
    excel_censo = os.path.join(base_dir, "RelacaoAlunoEscola_24_7_2026.xlsx")
    
    out_students = os.path.join(base_dir, "data", "students.json")
    out_comparison = os.path.join(base_dir, "data", "comparison.json")
    
    if not os.path.exists(excel_school):
        excel_school = r"c:\Users\Alhysson Saqueto\Desktop\censoo\listMatriculaAluno (68).xls"
        excel_censo = r"c:\Users\Alhysson Saqueto\Desktop\censoo\RelacaoAlunoEscola_24_7_2026.xlsx"
        out_students = r"c:\Users\Alhysson Saqueto\Desktop\censoo\data\students.json"
        out_comparison = r"c:\Users\Alhysson Saqueto\Desktop\censoo\data\comparison.json"
        
    run_conversion_and_comparison(excel_school, excel_censo, out_students, out_comparison)
