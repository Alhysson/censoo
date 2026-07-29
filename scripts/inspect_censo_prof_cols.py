import pandas as pd
import json

path = r'c:\Users\Alhysson Saqueto\Desktop\censoo\RelacaoProfissionalEscola_24_7_2026.xlsx'

# Read raw bytes to fix mojibake or inspect with openpyxl/pandas
df = pd.read_excel(path, sheet_name=0, header=None)

row20 = df.iloc[20].values
row21 = df.iloc[21].values

print("=== ROW 20 (Group headers) ===")
for i, v in enumerate(row20):
    if pd.notna(v):
        print(f"Col {i}: {v}")

print("\n=== ROW 21 (Sub headers) ===")
for i, v in enumerate(row21):
    if pd.notna(v):
        print(f"Col {i}: {v}")

print("\n=== ROW 22 (Sample Data) ===")
row22 = df.iloc[22].values
for i, (h, v) in enumerate(zip(row21, row22)):
    print(f"Col {i} ({h}): {v}")
