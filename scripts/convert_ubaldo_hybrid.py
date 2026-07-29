import os
import json
import pandas as pd
from convert_ubaldo_pdf import extract_censo_students, build_comparison, PDF_CENSO, BASE_DIR

def clean_val(x):
    if pd.isnull(x):
        return ""
    val = str(x).strip()
    if val.endswith('.0'):
        val = val[:-2]
    if val in ['-', '--', '---', 'N/A', 'Não', 'None', 'nan', 'NaN', 'NaT']:
        return ""
    return val

def process_school_excel(excel_path):
    print(f"Lendo dados da escola do Excel: {excel_path}")
    df = pd.read_excel(excel_path, header=8)
    
    # Strip column names
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

def main():
    print("============================================================")
    print("CONVERSÃO HÍBRIDA - EMEF UBALDO RAMALHETE (Excel Escola + PDF Censo)")
    print("============================================================")
    
    excel_school = os.path.join(BASE_DIR, "listMatriculaAluno.xls")
    
    out_students = os.path.join(BASE_DIR, "data", "students_ubaldo.json")
    out_comparison = os.path.join(BASE_DIR, "data", "comparison_ubaldo.json")
    
    school_students = process_school_excel(excel_school)
    
    with open(out_students, 'w', encoding='utf-8') as f:
        json.dump(school_students, f, ensure_ascii=False, indent=2)
        
    censo_students = extract_censo_students(PDF_CENSO)
    
    comparison = build_comparison(school_students, censo_students)
    
    with open(out_comparison, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
        
    print(f"Comparação salva em {out_comparison}")
    print("CONCLUÍDO!")

if __name__ == '__main__':
    main()
