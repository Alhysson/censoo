"""
convert_ubaldo_pdf.py  (v3 - FINAL)
Extrai dados de alunos dos PDFs da EMEF Ubaldo Ramalhete e gera:
  - data/students_ubaldo.json   (lista de matrículas da escola)
  - data/comparison_ubaldo.json (comparação escola x censo)
"""

import os
import re
import json
import unicodedata
import pdfplumber

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PDF_SCHOOL = os.path.join(BASE_DIR, "listMatriculaAluno- Ubaldo Ramalhete.pdf")
PDF_CENSO  = os.path.join(BASE_DIR, "RelacaoAlunoEscola_28_7_2026.pdf")

OUT_STUDENTS   = os.path.join(BASE_DIR, "data", "students_ubaldo.json")
OUT_COMPARISON = os.path.join(BASE_DIR, "data", "comparison_ubaldo.json")

# ---------------------------------------------------------------------------
# UTILITY
# ---------------------------------------------------------------------------

def clean_cell(val):
    if val is None:
        return ""
    return " ".join(str(val).split()).strip()

def normalize_text(text):
    if not isinstance(text, str):
        return ""
    text = text.replace('º','').replace('ª','')
    text = unicodedata.normalize('NFKD', text).encode('ASCII','ignore').decode('ASCII')
    return " ".join(text.upper().split())

def clean_cpf(val):
    return "".join(c for c in str(val) if c.isdigit())

def format_cpf(val):
    digits = clean_cpf(val)
    if len(digits) == 11:
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
    return str(val)

def fix_fragmented_cpf(raw):
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) == 11:
        return format_cpf(digits)
    return digits

def fix_fragmented_date(raw):
    nums = re.findall(r'\d+', raw)
    if len(nums) >= 3:
        d, m, y = nums[0].zfill(2), nums[1].zfill(2), nums[2]
        if len(y) == 4:
            return f"{d}/{m}/{y}"
    return raw

def fix_fragmented_id(raw):
    return "".join(c for c in raw if c.isdigit())

def fix_fragmented_cep(raw):
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) == 8:
        return f"{digits[:5]}-{digits[5:]}"
    return raw

def fix_yes_no(raw):
    r = normalize_text(raw)
    if r.startswith('SI') or r == 'S':
        return 'Sim'
    return 'Não'

def normalize_etapa(val):
    text = normalize_text(val)
    for num in range(1, 10):
        if f"{num} ANO" in text:
            return f"{num} ANO"
        if f"{num} PERIODO" in text:
            return f"{num} PERIODO"
    if "PRE-ESCOLA" in text or "PRE ESCOLA" in text:
        return "PRE-ESCOLA"
    if "CRECHE" in text:
        return "CRECHE"
    return text

def normalize_class_name(periodo, turma, turno):
    p = str(periodo).upper().replace('º','').replace('ª','').strip()
    t = str(turma).upper().strip()
    s = str(turno).upper().strip()
    if t and s:
        return f"{p} - {t} - {s}"
    elif t:
        return f"{p} - {t}"
    return p

def values_equivalent(field, v_school, v_censo):
    s = normalize_text(str(v_school))
    c = normalize_text(str(v_censo))
    if not s and not c:
        return True
    if field == 'CPF':
        return clean_cpf(v_school) == clean_cpf(v_censo)
    if field == 'Data de Nascimento':
        return str(v_school).replace('-','/') == str(v_censo).replace('-','/')
    if field == 'Localização/Zona de residência':
        if 'URBANA' in s and 'URBANA' in c: return True
        if 'RURAL'  in s and 'RURAL'  in c: return True
    if field == 'Atendimento hospitalar/domiciliar':
        ne = lambda x: 'NAO RECEBE' in x or x == ''
        return ne(s) and ne(c)
    if field == 'Transporte escolar (Sim/Não)':
        return ('SIM' in s) == ('SIM' in c)
    if field == 'Localização diferenciada de residência':
        sd = 'NAO' if ('NAO ESTA' in s or s == '') else 'SIM'
        cd = 'NAO' if ('NAO ESTA' in c or c == '') else 'SIM'
        return sd == cd
    if field in ('Tipo(s) de deficiência(s)...','Tipo(s) de transtorno(s)...','Recursos para avaliações','Atendimento especializado AEE'):
        sh = s not in ('','NAO','-','--')
        ch = c not in ('','NAO','-','--')
        if not sh and not ch: return True
        return s == c
    if field == 'Etapa de ensino':
        return normalize_etapa(v_school) == normalize_etapa(v_censo)
    if field == 'Nome da Turma':
        return s == c
    return s == c

# ---------------------------------------------------------------------------
# PART 1: EXTRACT SCHOOL STUDENTS FROM MATRICULA PDF
# ---------------------------------------------------------------------------

SKIP_NAMES = {
    'NOME', 'LISTAGEM DE MATRICULA', 'LISTAGEM DE MATR', 'LISTAGEM',
    'DADOS', 'ESCOLA', '', 'ESPIRITO SANTO',
}

def is_header_row(cells):
    if not cells:
        return True
    name_cell = normalize_text(cells[0])
    if name_cell in SKIP_NAMES:
        return True
    if any(kw in name_cell for kw in ('LISTAGEM','PREFEITURA','SECRETARIA','MUNICIPIO DE')):
        return True
    return False

def is_valid_name(name):
    if not name or len(name) < 3:
        return False
    words = name.split()
    if len(words) < 2:
        return False
    alpha_chars = sum(1 for c in name if c.isalpha())
    if alpha_chars < 4:
        return False
    return True

def extract_school_students(pdf_path):
    print(f"Extraindo alunos do PDF: {pdf_path}")
    students = []
    seen_names = set()
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"  Total de páginas: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            if not tables:
                continue
            
            for table in tables:
                for row in table:
                    if row is None:
                        continue
                    cells = [clean_cell(c) for c in row]
                    if not cells or len(cells) < 5:
                        continue
                    if is_header_row(cells):
                        continue
                    
                    name_raw = cells[0]
                    if not is_valid_name(name_raw):
                        continue
                    
                    name_key = normalize_text(name_raw)
                    if name_key in seen_names:
                        continue
                    seen_names.add(name_key)
                    
                    def get(i):
                        return cells[i] if i < len(cells) else ""
                    
                    periodo_raw = get(3)
                    turma_raw   = get(4)
                    turno_raw   = get(5)
                    
                    periodo = re.sub(r'[^\w\s]','', periodo_raw).strip()
                    turma   = re.sub(r'[^\w\s]','', turma_raw).strip()
                    if normalize_text(turma) in ('NICA','UNICA','NIC','NICA '):
                        turma = 'ÚNICA'
                    
                    turno = turno_raw.upper()
                    if 'INT' in turno:
                        turno = 'INTEGRAL'
                    elif 'MAT' in turno:
                        turno = 'MATUTINO'
                    elif 'VES' in turno:
                        turno = 'VESPERTINO'
                    elif 'NOT' in turno:
                        turno = 'NOTURNO'
                    
                    descricao = f"{periodo} {turma}".strip()
                    
                    student = {
                        'Nome':                    name_raw,
                        'Nome social':             '',
                        'Código':                  '',
                        'Código do estudante':     '',
                        'Data de Nascimento':      fix_fragmented_date(get(1)),
                        'Identificação CENSO':     fix_fragmented_id(get(2)),
                        'Período':                 periodo,
                        'Turma':                   turma,
                        'Turno':                   turno,
                        'Descrição':               descricao,
                        'Situação':                get(6).upper() or 'NORMAL',
                        'Data da movimentação':    get(7),
                        'Data da matrícula':       '',
                        'Sexo':                    get(8).capitalize(),
                        'Cor':                     get(9).capitalize(),
                        'CPF':                     fix_fragmented_cpf(get(10)),
                        'Número da certidão':      fix_fragmented_id(get(11)),
                        'Tipo Logradouro':         get(12),
                        'Logradouro':              get(13),
                        'Número':                  re.sub(r'\s+','',get(14)),
                        'Cep':                     fix_fragmented_cep(get(15)),
                        'Bairro':                  get(16),
                        'Município':               get(17),
                        'Estado':                  get(18),
                        'País de residência (CENSO)': get(19),
                        'Localização diferenciada (CENSO)': get(20),
                        'Localização da Residência (CENSO)': get(21),
                        'Estudante com deficiência': fix_yes_no(get(22)),
                        'Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação': get(23),
                        'Pessoa física com transtorno(s) que impacta(m) o desenvolvimento da aprendizagem': fix_yes_no(get(24)),
                        'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem': get(25),
                        'Recursos necessários para uso do estudante e para a participação em avaliações do Inep (Saeb)': get(26),
                        'Tipo de Atendimento Educacional Especializado': get(27),
                        'Utiliza transporte': fix_yes_no(get(28)),
                        'Autorização do Uso de Imagem': fix_yes_no(get(29)),
                        'Nacionalidade':            'Brasileira',
                        'Naturalidade':             '',
                        'Identidade':               '',
                        'Livro da certidão':        '',
                        'Folha da certidão':        '',
                        'Bolsa Família':            'Não',
                        'Número Bolsa Família':     '',
                        'Matrícula Nova':           'Não',
                        'Contato 1':                '',
                        'Contato 2':                '',
                        'Filiação 1':               '',
                        'Filiação 2':               '',
                        'Turma complementar':       '',
                        'Observação':               '',
                        'CID':                      '',
                        'Escola':                   'EMEF Ubaldo Ramalhete Mello',
                        'Confirmou rematrícula':    'Não',
                        'Recebe Escolarização em Outro Espaço (CENSO)': '',
                        'Poder Público Responsável': '',
                    }
                    students.append(student)
            
            if page_num % 10 == 0:
                print(f"  Processadas {page_num}/{total_pages} páginas... ({len(students)} alunos)")
    
    print(f"  Total de alunos extraídos: {len(students)}")
    return students

# ---------------------------------------------------------------------------
# PART 2: EXTRACT CENSO STUDENTS FROM RELACAO PDF
# ---------------------------------------------------------------------------
# Format per data line (each student appears on 1 main line + continuation lines):
# "112238607846ANA LIVIA 15/04/2010 21365186741Brasileira Pancas - ES Preta -- Feminino Deficiencia -- -- Urbana ..."
# = <row_order><unique_id_11digits><NOME> <DD/MM/YYYY> <CPF_11digits><Nacionalidade> <Municipio - UF> <Cor> ...

# We parse LINE BY LINE since each main data line has the date in it
# Continuation lines (name overflow) are on previous lines without date

def parse_censo_line(line, next_lines_text=""):
    """Parse a single census data line into a student record."""
    
    # Main line format: NNNN<11-digit-id><NAME> DD/MM/YYYY <11-digit-cpf>Nacionalidade <Mun - UF> <Cor> ...
    # The row starts with digits (order+id) concatenated with the name
    
    # Extract date first as anchor
    date_match = re.search(r'(\d{2}/\d{2}/\d{4})', line)
    if not date_match:
        return None
    
    data_nasc = date_match.group(1)
    date_pos  = date_match.start()
    
    # Name is everything before the date, after stripping leading digits
    before_date = line[:date_pos].strip()
    # Remove leading digits (row order + unique ID) - typically 12-14 chars of digits
    name_match = re.match(r'^\d+(.*)', before_date)
    if name_match:
        nome_raw = name_match.group(1).strip()
    else:
        nome_raw = before_date
    
    if not nome_raw or len(nome_raw) < 3:
        return None
    
    nome_raw = " ".join(nome_raw.split())
    
    # Text after date
    after_date = line[date_match.end():].strip()
    
    # Extract CPF (first 11-digit block after date)
    cpf_match = re.match(r'(\d{11})', after_date)
    cpf = format_cpf(cpf_match.group(1)) if cpf_match else ''
    rest = after_date[11:] if cpf_match else after_date
    
    # Combine with next lines for overflow fields
    full_context = line + " " + next_lines_text
    
    student = {
        'Nome':               nome_raw,
        'Data de nascimento': data_nasc,
        'CPF':                cpf,
    }
    
    # Unique ID: the digits before the name
    uid_match = re.match(r'^(\d+)', before_date)
    if uid_match:
        raw_digits = uid_match.group(1)
        # The unique ID is typically 11 digits; the first 1-2 digits are row order
        if len(raw_digits) >= 11:
            student['Identificação única'] = raw_digits[-11:]
        else:
            student['Identificação única'] = raw_digits
    else:
        student['Identificação única'] = ''
    
    # Nacionalidade
    nat = re.search(r'(Brasileira|Estrangeira)', full_context, re.I)
    student['Nacionalidade'] = nat.group(1) if nat else 'Brasileira'
    
    # Município-UF de nascimento (after Brasileira/Estrangeira)
    mun = re.search(r'(?:Brasileira|Estrangeira)\s+([^-\d\n]+?)\s+-\s+([A-Z]{2})\s', full_context)
    if mun:
        city = " ".join(mun.group(1).split())
        uf   = mun.group(2)
        student['Município-UF de nascimento'] = f"{city} - {uf}"
    else:
        student['Município-UF de nascimento'] = ''
    
    # Cor/Raça
    cor = re.search(r'\b(Branca|Preta|Parda|Amarela|Ind[íi]gena)\b', full_context, re.I)
    student['Cor/Raça'] = cor.group(1).capitalize() if cor else ''
    
    # Sexo
    sexo = re.search(r'\b(Masculino|Feminino)\b', full_context, re.I)
    student['Sexo'] = sexo.group(1) if sexo else ''
    
    # Deficiência
    def_m = re.search(r'(Defici.ncia\s+\w+(?:\s*\|\s*Transtorno\s+do\s+\w+(?:\s+\w+)*)?)', full_context, re.I)
    student['Tipo(s) de deficiência(s), transtorno(s) do espectro autista e altas habilidades ou superdotação'] = \
        def_m.group(1).strip() if def_m else '--'
    
    # Zona de residência
    zona = re.search(r'Zona\s+(Urbana|Rural)', full_context, re.I)
    if not zona:
        zona = re.search(r'\b(Urbana|Rural)\b', full_context, re.I)
    student['Localização/Zona de residência'] = ('Zona ' + zona.group(1)) if zona else ''
    
    # Localização diferenciada
    loc_dif = re.search(r'N.o est. em .rea de localiza..o diferenciada', full_context, re.I)
    student['Localização diferenciada de residência'] = \
        'Não está em área de localização diferenciada' if loc_dif else ''
    
    # Código da Matrícula (9 digits starting with 7)
    mat = re.search(r'\b(7\d{8})\b', full_context)
    student['Código da Matrícula'] = mat.group(1) if mat else ''
    
    # Código da turma (8 digits starting with 38)
    turma_cod = re.search(r'\b(38\d{6})\b', full_context)
    student['Código da turma'] = turma_cod.group(1) if turma_cod else ''
    
    # Nome da turma
    turma_name = re.search(r'(\d+\s*ANO\s*-\s*\w+\s*-\s*(?:MATUTINO|VESPERTINO|NOTURNO|INTEGRAL))', full_context, re.I)
    student['Nome da turma'] = turma_name.group(1).strip() if turma_name else ''
    
    # Etapa de ensino
    etapa = re.search(r'(Ensino fundamental(?:\s+de\s+\d+\s+anos)?)', full_context, re.I)
    student['Etapa de ensino'] = etapa.group(1).strip() if etapa else ''
    
    # AEE
    aee = re.search(r'(Sala de recursos multifuncionais|Atendimento individualizado)', full_context, re.I)
    student['Tipo de atendimento educacional especializado (AEE)'] = aee.group(1) if aee else ''
    
    # Atendimento hospitalar
    hosp = re.search(r'N.o\s+recebe\s+escolariza..o\s+fora\s+da\s+escola', full_context, re.I)
    student['Recebe atendimento educacional em regime hospitalar ou domiciliar'] = \
        'Não recebe escolarização fora da escola' if hosp else ''
    
    # Transporte — appears right after the hospitalar text
    # In the PDF: "Não recebe Sim Municipal Rodovi..." or "Não recebe Não -- --"
    after_hosp_idx = full_context.lower().find('recebe ')
    if after_hosp_idx >= 0:
        after_hosp = full_context[after_hosp_idx+7:]
    else:
        after_hosp = full_context
    transp = re.search(r'\b(Sim|N.o)\b', after_hosp, re.I)
    student['Transporte escolar (Sim/Não)'] = transp.group(1) if transp else ''
    
    # Poder Público
    poder = re.search(r'\b(Municipal|Estadual|Federal)\b', full_context, re.I)
    student['Poder Público responsável'] = poder.group(1) if poder else ''
    
    # Tipo de veículo
    veiculo = re.search(r'\b(Rodovi.rio|Hidroviário|Ferroviário|Outros)\b', full_context, re.I)
    student['Tipo de veículo utilizado no transporte escolar'] = veiculo.group(1) if veiculo else ''
    
    # Transtornos
    transt = re.search(r'(Transtorno\s+do[\w\s\|\.]+?)(?:\s*--|\s*Nenhum|\s*Urbana)', full_context, re.I)
    student['Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'] = \
        transt.group(1).strip() if transt else '--'
    
    # Recursos
    rec = re.search(r'\b(Nenhum|Tempo adicional|Prova em braille|Lupa)\b', full_context, re.I)
    student['Recursos para o uso do(a) aluno(a) em sala de aula para a participação em avaliações do Inep (Saeb)'] = \
        rec.group(1) if rec else '--'
    
    return student

def extract_censo_students(pdf_path):
    print(f"Extraindo dados do CENSO: {pdf_path}")
    
    all_lines = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"  Total de páginas: {total}")
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_lines.extend(text.split('\n'))
    
    students = []
    seen_names = set()
    
    # Each student's main data line contains a date (DD/MM/YYYY)
    # Find those lines and parse them
    
    for i, line in enumerate(all_lines):
        # Main data lines have a date
        if not re.search(r'\d{2}/\d{2}/\d{4}', line):
            continue
        
        # Skip header/title lines
        line_norm = normalize_text(line)
        if any(kw in line_norm for kw in ['FILTROS', 'INFORMACOES', 'ESCOLA', 'CODIGO ENTIDADE', 'ORDEM', 'VINCULO']):
            continue
        
        # Gather next 4 lines as continuation context
        next_lines = " ".join(all_lines[i+1:i+5])
        
        student = parse_censo_line(line, next_lines)
        if student is None:
            continue
        
        nome = student.get('Nome','')
        if not nome or len(nome) < 4:
            continue
        
        name_key = normalize_text(nome)
        if name_key in seen_names:
            continue
        # Skip noise
        if any(w in name_key for w in ['NOME', 'ORDEM', 'DATA', 'CODIGO', 'LOCALIZA']):
            continue
        seen_names.add(name_key)
        
        students.append(student)
    
    print(f"  Total CENSO alunos processados: {len(students)}")
    return students

# ---------------------------------------------------------------------------
# PART 3: BUILD COMPARISON
# ---------------------------------------------------------------------------

FIELDS_TO_COMPARE = [
    ('Nome',                         'Nome',                 'Nome'),
    ('CPF',                          'CPF',                  'CPF'),
    ('Data de Nascimento',           'Data de Nascimento',   'Data de nascimento'),
    ('Sexo',                         'Sexo',                 'Sexo'),
    ('Cor/Raça',                     'Cor',                  'Cor/Raça'),
    ('Nacionalidade',                'Nacionalidade',        'Nacionalidade'),
    ('Município-UF de nascimento',   'Naturalidade',         'Município-UF de nascimento'),
    ('Tipo(s) de deficiência(s)...',
        'Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação',
        'Tipo(s) de deficiência(s), transtorno(s) do espectro autista e altas habilidades ou superdotação'),
    ('Tipo(s) de transtorno(s)...',
        'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem',
        'Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'),
    ('Recursos para avaliações',
        'Recursos necessários para uso do estudante e para a participação em avaliações do Inep (Saeb)',
        'Recursos para o uso do(a) aluno(a) em sala de aula para a participação em avaliações do Inep (Saeb)'),
    ('Localização/Zona de residência','Localização da Residência (CENSO)','Localização/Zona de residência'),
    ('Localização diferenciada de residência','Localização diferenciada (CENSO)','Localização diferenciada de residência'),
    ('Código da Matrícula',          'Código',               'Código da Matrícula'),
    ('Nome da Turma',                'Descrição',            'Nome da turma'),
    ('Etapa de ensino',              'Período',              'Etapa de ensino'),
    ('Atendimento especializado AEE','Tipo de Atendimento Educacional Especializado','Tipo de atendimento educacional especializado (AEE)'),
    ('Atendimento hospitalar/domiciliar','Recebe Escolarização em Outro Espaço (CENSO)','Recebe atendimento educacional em regime hospitalar ou domiciliar'),
    ('Transporte escolar (Sim/Não)', 'Utiliza transporte',   'Transporte escolar (Sim/Não)'),
    ('Poder Público responsável',    'Poder Público Responsável','Poder Público responsável'),
]

def build_comparison(school_students, censo_students):
    print("Construindo comparação escola x censo...")
    
    censo_by_cpf  = {}
    censo_by_id   = {}
    censo_by_name = {}
    
    for c in censo_students:
        cpf  = clean_cpf(c.get('CPF',''))
        uid  = str(c.get('Identificação única','')).strip()
        name = normalize_text(c.get('Nome',''))
        if cpf:  censo_by_cpf[cpf]   = c
        if uid:  censo_by_id[uid]    = c
        if name: censo_by_name[name] = c
    
    comparison = []
    matched_ids = set()
    
    for st in school_students:
        cpf      = clean_cpf(st.get('CPF',''))
        name     = normalize_text(st.get('Nome',''))
        censo_id = fix_fragmented_id(str(st.get('Identificação CENSO','')))
        
        matched_censo = None
        if cpf and cpf in censo_by_cpf:
            matched_censo = censo_by_cpf[cpf]
        elif censo_id and censo_id in censo_by_id:
            matched_censo = censo_by_id[censo_id]
        elif name and name in censo_by_name:
            matched_censo = censo_by_name[name]
        
        if matched_censo:
            uid = matched_censo.get('Identificação única','')
            matched_ids.add(uid)
        
        comp = {
            'id':   st.get('Código','') or name,
            'nome': st.get('Nome',''),
            'cpf':  format_cpf(st.get('CPF','')),
            'status': 'CONCILIADO' if matched_censo else 'APENAS_ESCOLA',
            'has_divergences': False,
            'divergences_count': 0,
            'divergences': {},
            'school_data': st,
            'censo_rows': [matched_censo] if matched_censo else [],
        }
        
        if matched_censo:
            for display, sk, ck in FIELDS_TO_COMPARE:
                vs = st.get(sk,'')
                if display == 'Nome da Turma':
                    vs = normalize_class_name(st.get('Período',''), st.get('Turma',''), st.get('Turno',''))
                vc = matched_censo.get(ck,'')
                is_match = values_equivalent(display, vs, vc)
                is_crit  = (display != 'Código da Matrícula')
                comp['divergences'][display] = {
                    'school_val': vs or '-',
                    'censo_val':  vc or '-',
                    'match': is_match,
                    'is_critical': is_crit,
                }
                if not is_match and is_crit:
                    comp['has_divergences'] = True
                    comp['divergences_count'] += 1
        
        comparison.append(comp)
    
    # Unmatched CENSO records
    for c in censo_students:
        uid = c.get('Identificação única','')
        if uid not in matched_ids:
            comp = {
                'id':   c.get('Código da Matrícula',''),
                'nome': c.get('Nome',''),
                'cpf':  format_cpf(c.get('CPF','')),
                'status': 'APENAS_CENSO',
                'has_divergences': False,
                'divergences_count': 0,
                'divergences': {},
                'school_data': {},
                'censo_rows': [c],
            }
            for display, sk, ck in FIELDS_TO_COMPARE:
                vc = c.get(ck,'')
                comp['divergences'][display] = {
                    'school_val': '-',
                    'censo_val':  vc or '-',
                    'match': False,
                    'is_critical': True,
                }
            comparison.append(comp)
    
    concil = sum(1 for r in comparison if r['status']=='CONCILIADO')
    escola = sum(1 for r in comparison if r['status']=='APENAS_ESCOLA')
    censo  = sum(1 for r in comparison if r['status']=='APENAS_CENSO')
    diverg = sum(1 for r in comparison if r['has_divergences'])
    
    print(f"  Total: {len(comparison)} | CONCILIADO: {concil} | APENAS_ESCOLA: {escola} | APENAS_CENSO: {censo} | COM DIVERGÊNCIAS: {diverg}")
    return comparison

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("CONVERSÃO DE DADOS - EMEF UBALDO RAMALHETE  (v3)")
    print("=" * 60)
    
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    
    school_students = extract_school_students(PDF_SCHOOL)
    with open(OUT_STUDENTS, 'w', encoding='utf-8') as f:
        json.dump(school_students, f, ensure_ascii=False, indent=2)
    print(f"\nSalvo: {OUT_STUDENTS} ({len(school_students)} alunos)")
    
    if school_students:
        s = school_students[0]
        print(f"  Amostra: {s.get('Nome')} | {s.get('Período')} {s.get('Turma')} | CPF: {s.get('CPF')}")
    
    censo_students = extract_censo_students(PDF_CENSO)
    
    comparison = build_comparison(school_students, censo_students)
    with open(OUT_COMPARISON, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
    print(f"Salvo: {OUT_COMPARISON} ({len(comparison)} registros)\n")
    print("=" * 60)
    print("CONCLUÍDO!")
    print("=" * 60)

if __name__ == '__main__':
    main()
