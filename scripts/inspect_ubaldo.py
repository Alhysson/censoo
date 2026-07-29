import pandas as pd
import json

try:
    print("Excel columns:")
    df = pd.read_excel('listMatriculaAluno- Ubaldo Ramalhete.xlsx')
    print(df.columns.tolist())
    print("First row:")
    print(df.head(1).to_dict('records'))
except Exception as e:
    print("Error reading Excel:", e)

print("\nJSON first item from students_ubaldo.json:")
try:
    with open('data/students_ubaldo.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        if isinstance(data, list) and len(data) > 0:
            print("Type: list")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
        elif isinstance(data, dict):
            k = list(data.keys())[0]
            print("Type: dict")
            print("Key:", k)
            print(json.dumps(data[k], indent=2, ensure_ascii=False))
except Exception as e:
    print("Error reading JSON:", e)

print("\nJSON first item from students.json:")
try:
    with open('data/students.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        if isinstance(data, list) and len(data) > 0:
            print("Type: list")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
        elif isinstance(data, dict):
            k = list(data.keys())[0]
            print("Type: dict")
            print("Key:", k)
            print(json.dumps(data[k], indent=2, ensure_ascii=False))
except Exception as e:
    print("Error reading JSON:", e)
