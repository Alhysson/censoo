import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SafeHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Remove query parameters and anchors
        clean_path = path.split('?')[0].split('#')[0]
        # Route requests starting with /data/ or /scripts/ to the root directory
        if clean_path.startswith('/data/') or clean_path.startswith('/scripts/'):
            return os.path.join(DIRECTORY, clean_path.lstrip('/'))
        # Route all other frontend requests (like assets, index.html) to the dist/ build directory
        else:
            return os.path.join(DIRECTORY, 'dist', clean_path.lstrip('/'))

def start_server():
    # Muda para o diretório deste arquivo
    os.chdir(DIRECTORY)
    
    # Configura socket reutilizável para evitar erro de endereço em uso
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), SafeHandler) as httpd:
            print("============================================================")
            print(f" Plataforma Escolar Matilde Guerra rodando com sucesso!")
            print(f" Endereço local: http://localhost:{PORT}")
            print("============================================================")
            print(" O navegador abrirá automaticamente em alguns segundos...")
            print(" Para encerrar a execução, pressione Ctrl+C no terminal.")
            print("============================================================")
            
            # Abre o navegador
            webbrowser.open(f'http://localhost:{PORT}')
            
            httpd.serve_forever()
    except Exception as e:
        print(f"Erro ao iniciar o servidor: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_server()
