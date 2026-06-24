from django.shortcuts import render

def home(request):
    # Esto busca 'index.html' en tu carpeta frontend/templates
    return render(request, 'main2.html')

def professor(request):
    return render(request, 'profesor.html')

def admin_panel(request):
    return render(request, 'admin.html')
