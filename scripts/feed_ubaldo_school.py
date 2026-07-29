import os
import json
import pandas as pd
import math
from convert_ubaldo_pdf import BASE_DIR

def clean_val(x):
    if pd.isnull(x):
        return ""
    val = str(x).strip()
    # Corrige números inteiros que o pandas transforma em float (ex: 123.0 -> 123)
    if val.endswith('.0'):
        val = val[:-2]
    
    # Valores nulos/vazios comuns em relatórios
    if val in ['-', '--', '---', 'N/A', 'Não', 'None', 'nan', 'NaN', 'NaT']:
        return ""
    return val

def process_school_excel(excel_path):
    print(f"Lendo dados da escola do Excel: {excel_path}")
    df = pd.read_excel(excel_path, header=8)
    
    df.columns = [str(c).strip() for c in df.columns]
    
    students = []
    for _, row in df.iterrows():
        nome = clean_val(row.get('Nome'))
        if not nome or "Relatório gerado" in nome or "Usuário" in nome:
            continue
            
        student = {
            'Nome': nome,
            'Código': clean_val(row.get('Código', '')),
            'CPF': clean_val(row.get('CPF', '')),
            'Data de Nascimento': clean_val(row.get('Data de Nascimento', '')),
            'Sexo': clean_val(row.get('Sexo', '')),
            'Cor': clean_val(row.get('Cor', '')),
            'Nacionalidade': clean_val(row.get('Nacionalidade', 'Brasileira')),
            'Naturalidade': clean_val(row.get('Naturalidade', '')),
            
            'Identificação CENSO': clean_val(row.get('Identificação CENSO', '')),
            'Período': clean_val(row.get('Período', '')),
            'Turma': clean_val(row.get('Turma', '')),
            'Turno': clean_val(row.get('Turno', '')),
            'Situação': clean_val(row.get('Situação', '')),
            
            'Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação': clean_val(row.get('Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação', '')),
            'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem': clean_val(row.get('Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem', '')),
            'Recursos necessários para uso do estudante e para a participação em avaliações do Inep (Saeb)': clean_val(row.get('Recursos necessários para uso do estudante e para a participação em avaliações do Inep (Saeb)', '')),
            
            'Localização da Residência (CENSO)': clean_val(row.get('Localização da Residência (CENSO)', '')),
            'Localização diferenciada (CENSO)': clean_val(row.get('Localização diferenciada (CENSO)', '')),
            
            'Tipo de Atendimento Educacional Especializado': clean_val(row.get('Tipo de Atendimento Educacional Especializado', '')),
            'Recebe Escolarização em Outro Espaço (CENSO)': clean_val(row.get('Recebe Escolarização em Outro Espaço (CENSO)', '')),
            'Utiliza transporte': clean_val(row.get('Utiliza transporte', '')),
            'Poder Público Responsável': clean_val(row.get('Poder Público Responsável', ''))
        }
        students.append(student)
        
    print(f"Total de alunos extraídos do Excel da escola: {len(students)}")
    return students

def build_dummy_comparison(school_students):
    comparison = []
    for st in school_students:
        comp_record = {
            'id': st['Identificação CENSO'] or st['Nome'],
            'nome': st['Nome'],
            'status': 'APENAS_ESCOLA',
            'escola': {
                'cpf': st['CPF'],
                'data_nascimento': st['Data de Nascimento'],
                'turma': f"{st['Período']} {st['Turma']}".strip(),
                'turno': st['Turno']
            },
            'censo': None,
            'divergencias': []
        }
        comparison.append(comp_record)
    return comparison

def main():
    print("============================================================")
    print("ALIMENTANDO DADOS DA ESCOLA UBALDO (Apenas Escola)")
    print("============================================================")
    
    excel_school = os.path.join(BASE_DIR, "listMatriculaAluno.xls")
    
    out_students = os.path.join(BASE_DIR, "data", "students_ubaldo.json")
    out_comparison = os.path.join(BASE_DIR, "data", "comparison_ubaldo.json")
    
    school_students = process_school_excel(excel_school)
    
    with open(out_students, 'w', encoding='utf-8') as f:
        json.dump(school_students, f, ensure_ascii=False, indent=2)
    print(f"Alunos salvos em {out_students}")
    
    comparison = build_dummy_comparison(school_students)
    with open(out_comparison, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
    print(f"Comparação vazia (Apenas Escola) salva em {out_comparison}")

    public_students = os.path.join(BASE_DIR, "public", "data", "students_ubaldo.json")
    public_comp = os.path.join(BASE_DIR, "public", "data", "comparison_ubaldo.json")
    os.makedirs(os.path.dirname(public_students), exist_ok=True)
    
    with open(public_students, 'w', encoding='utf-8') as f:
        json.dump(school_students, f, ensure_ascii=False, indent=2)
    with open(public_comp, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
