import xlrd
import json

def read_xls_with_encoding(path, header_row=8):
    """Read XLS file using xlrd and fix encoding manually"""
    book = xlrd.open_workbook(path, encoding_override='cp1252')
    sheet = book.sheets()[0]
    
    # Get headers from header_row
    headers = []
    for col_idx in range(sheet.ncols):
        cell = sheet.cell_value(header_row, col_idx)
        if cell:
            headers.append(str(cell).strip())
        else:
            headers.append(f'_col{col_idx}')
    
    records = []
    for row_idx in range(header_row + 1, sheet.nrows):
        record = {}
        has_content = False
        for col_idx, header in enumerate(headers):
            if col_idx >= sheet.ncols:
                break
            cell = sheet.cell(row_idx, col_idx)
            
            val = None
            if cell.ctype == xlrd.XL_CELL_TEXT:
                s = cell.value.strip()
                if s:
                    val = s
            elif cell.ctype == xlrd.XL_CELL_NUMBER:
                # Check if it's actually an integer
                if cell.value == int(cell.value):
                    val = str(int(cell.value))
                else:
                    val = str(cell.value)
            elif cell.ctype == xlrd.XL_CELL_DATE:
                try:
                    import datetime
                    dt = xlrd.xldate_as_datetime(cell.value, book.datemode)
                    val = dt.strftime('%d/%m/%Y')
                except:
                    val = str(cell.value)
            
            if val and header and not header.startswith('_col'):
                record[header] = val
                has_content = True
        
        if has_content and len(record) >= 3:
            records.append(record)
    
    return headers, records

print("=== Lendo listFuncionario.xls ===")
func_headers, funcionarios = read_xls_with_encoding(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listFuncionario.xls', 8
)
print(f"Colunas: {func_headers}")
print(f"Registros: {len(funcionarios)}")
if funcionarios:
    print("Amostra:", json.dumps(funcionarios[0], ensure_ascii=False, indent=2))

print("\n=== Lendo listProfissionalEscolar.xls ===")
prof_headers, profissionais = read_xls_with_encoding(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listProfissionalEscolar.xls', 8
)
print(f"Colunas: {prof_headers}")
print(f"Registros: {len(profissionais)}")
if profissionais:
    print("Amostra:", json.dumps(profissionais[0], ensure_ascii=False, indent=2))

# Add source markers
for f in funcionarios:
    f['_source'] = 'funcionario'
    # Normalize name field
    if 'Funcionário' in f:
        f['Nome'] = f.pop('Funcionário')

for p in profissionais:
    p['_source'] = 'profissional_escolar'

all_staff = funcionarios + profissionais

# Save
for path, data in [
    ('data/staff.json', all_staff),
    ('data/funcionarios.json', funcionarios),
    ('data/profissionais.json', profissionais),
]:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nSalvo: {path} ({len(data)} registros)")

print("\nColunas Funcionarios:")
print([k for k in funcionarios[0].keys() if not k.startswith('_')] if funcionarios else [])
print("\nColunas Profissionais:")
print([k for k in profissionais[0].keys() if not k.startswith('_')] if profissionais else [])

# Summary of key fields
print("\n=== Cargo/Funcao Funcionarios ===")
cargos = {}
for f in funcionarios:
    c = f.get('Cargo/Função', f.get('Profissão', 'N/A'))
    cargos[c] = cargos.get(c, 0) + 1
for k, v in sorted(cargos.items()):
    print(f"  {k}: {v}")

print("\n=== Profissao Profissionais Escolares ===")
profs = {}
for p in profissionais:
    c = p.get('Profissão', 'N/A')
    profs[c] = profs.get(c, 0) + 1
for k, v in sorted(profs.items()):
    print(f"  {k}: {v}")

print("\n=== Escolaridade Profissionais ===")
escs = {}
for p in profissionais:
    e = p.get('Escolaridade', 'N/A')
    escs[e] = escs.get(e, 0) + 1
for k, v in sorted(escs.items()):
    print(f"  {k}: {v}")

print("\nConversao concluida!")
