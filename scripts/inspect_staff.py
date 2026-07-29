import pandas as pd
import json

files = [
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listFuncionario.xls',
    r'c:\Users\Alhysson Saqueto\Desktop\censoo\listProfissionalEscolar.xls',
]

for f in files:
    print(f'\n{"="*60}')
    print(f'ARQUIVO: {f}')
    print('='*60)
    try:
        xls = pd.ExcelFile(f)
        print(f'Abas: {xls.sheet_names}')
        for sheet in xls.sheet_names:
            df = pd.read_excel(f, sheet_name=sheet, header=None)
            print(f'\n--- Aba: {sheet} | Shape: {df.shape} ---')
            # Mostrar primeiras 10 linhas brutas para encontrar o cabeçalho
            for i, row in df.head(10).iterrows():
                print(f'  Linha {i}: {list(row)}')
    except Exception as e:
        print(f'ERRO: {e}')
