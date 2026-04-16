from django.shortcuts import render

def home(request):
    # Esto busca 'index.html' en tu carpeta frontend/templates
    return render(request, 'main2.html')