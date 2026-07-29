import pandas as pd

path = r'c:\Users\Alhysson Saqueto\Desktop\censoo\RelacaoProfissionalEscola_24_7_2026.xlsx'
df = pd.read_excel(path, sheet_name=0, header=None)

for idx, row in df.iloc[:30].iterrows():
    vals = [str(v).strip() for v in row.values if pd.notna(v) and str(v).strip() != '']
    if vals:
        print(f"Row {idx}: {vals[:5]}")
