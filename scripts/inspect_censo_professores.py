import pandas as pd
import json

path = r'c:\Users\Alhysson Saqueto\Desktop\censoo\RelacaoProfissionalEscola_24_7_2026.xlsx'

excel = pd.ExcelFile(path)
print("Sheet names:", excel.sheet_names)

df = pd.read_excel(path, sheet_name=0)
print("Shape:", df.shape)
print("\nFirst 15 rows preview:")
print(df.head(15))

print("\nAll columns:")
for i, col in enumerate(df.columns):
    print(f"{i}: {col}")
