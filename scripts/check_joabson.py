import pandas as pd
import json

path_censo = r'c:\Users\Alhysson Saqueto\Desktop\censoo\RelacaoProfissionalEscola_24_7_2026.xlsx'
df = pd.read_excel(path_censo, sheet_name=0, header=21)

for idx, r in df.iterrows():
    name = str(r.get('Nome'))
    if 'JOABSON' in name.upper():
        print("Name:", name)
        print("Raw CPF cell:", repr(r.get('CPF')))
        break
