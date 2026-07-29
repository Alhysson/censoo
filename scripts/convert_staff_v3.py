import xlrd
import json

def read_cell(cell, datemode):
    import datetime
    if cell.ctype == xlrd.XL_CELL_TEXT:
        return cell.value.strip() or None
    elif cell.ctype == xlrd.XL_CELL_NUMBER:
        n = cell.value
        if n == int(n):
            return str(int(n))
        return str(n)
    elif cell.ctype == xlrd.XL_CELL_DATE:
        try:
            dt = xlrd.xldate_as_datetime(n, datemode)
            return dt.strftime('%d/%m/%Y')
        except:
            return None
    return None

def decode_bytes(s):
    """Try to fix mojibake: string was encoded in cp1252 but read as latin-1"""
    if not isinstance(s, str):
        return s
    try:
        return s.encode('latin-1').decode('cp1252')
    except:
        return s

def read_xls(path, header_row=8):
    # Open without encoding_override so we get raw bytes → latin-1 strings
    book = xlrd.open_workbook(path)
    sheet = book.sheets()[0]

    # Read and decode headers
    raw_headers = []
    for col_idx in range(sheet.ncols):
        raw = sheet.cell_value(header_row, col_idx)
        h = decode_bytes(str(raw).strip()) if raw else f'_col{col_idx}'
        raw_headers.append(h)

    records = []
    for row_idx in range(header_row + 1, sheet.nrows):
        record = {}
        for col_idx, header in enumerate(raw_headers):
            if col_idx >= sheet.ncols or header.startswith('_col'):
                continue
            cell = sheet.cell(row_idx, col_idx)
            val = None
            if cell.ctype == xlrd.XL_CELL_TEXT:
                v = decode_bytes(cell.value.strip())
                val = v if v else None
            elif cell.ctype == xlrd.XL_CELL_NUMBER:
                n = cell.value
                val = str(int(n)) if n == int(n) else str(n)
            elif cell.ctype == xlrd.XL_CELL_DATE:
                try:
                    import datetime
                    dt = xlrd.xldate_as_datetime(cell.value, book.datemode)
                    val = dt.strftime('%d/%m/%Y')
                except:
                    pass
            if val:
                record[header] = val

        if len(record) >= 3:
            records.append(record)

    return raw_headers, records

print("=== Lendo listFuncionario.xls ===")
func_headers, funcionarios = read_xls(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listFuncionario.xls', 8
)
print(f"Colunas: {func_headers}")
print(f"Registros: {len(funcionarios)}")
if funcionarios:
    print("Amostra:", json.dumps(funcionarios[0], ensure_ascii=False, indent=2))

print("\n=== Lendo listProfissionalEscolar.xls ===")
prof_headers, profissionais = read_xls(
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listProfissionalEscolar.xls', 8
)
print(f"Colunas: {prof_headers}")
print(f"Registros: {len(profissionais)}")
if profissionais:
    print("Amostra:", json.dumps(profissionais[0], ensure_ascii=False, indent=2))

# Normalize
for f in funcionarios:
    f['_source'] = 'funcionario'
    if 'Funcionário' in f:
        f['Nome'] = f.pop('Funcionário')
    # Clean cargo weird value
    cargo = f.get('Cargo/Função', '')
    if cargo and cargo.startswith('[br.com'):
        f['Cargo/Função'] = None

for p in profissionais:
    p['_source'] = 'profissional_escolar'

all_staff = funcionarios + profissionais

for path, data in [
    ('data/staff.json', all_staff),
    ('data/funcionarios.json', funcionarios),
    ('data/profissionais.json', profissionais),
]:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nSalvo: {path} ({len(data)} registros)")

print("\n=== Colunas Funcionarios ===")
print(func_headers)
print("\n=== Colunas Profissionais ===")
print(prof_headers)
print("\n=== Cargos Funcionarios ===")
cargos = {}
for f in funcionarios:
    c = f.get('Cargo/Função') or '-'
    cargos[c] = cargos.get(c, 0) + 1
for k, v in sorted(cargos.items()):
    print(f"  {k}: {v}")

print("\n=== Profissao Profissionais ===")
profs = {}
for p in profissionais:
    c = p.get('Profissão') or '-'
    profs[c] = profs.get(c, 0) + 1
for k, v in sorted(profs.items()):
    print(f"  {k}: {v}")

print("\nConversao concluida!")
