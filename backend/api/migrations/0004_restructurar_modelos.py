# Generated manually for model restructuring

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


def migrar_datos_equipos(apps, schema_editor):
    """Migra datos de Equipo antiguo al nuevo modelo"""
    EquipoAntiguo = apps.get_model('api', 'Equipo')
    Profesor = apps.get_model('api', 'Profesor')
    Sesion = apps.get_model('api', 'Sesion')
    EquipoNuevo = apps.get_model('api', 'Equipo')
    
    # Crear profesor por defecto si no existe
    profesor, _ = Profesor.objects.get_or_create(
        email='default@udd.cl',
        defaults={'nombre': 'Profesor Default'}
    )
    
    # Migrar equipos existentes
    for equipo_antiguo in EquipoAntiguo.objects.all():
        # Crear o obtener sesión
        sesion, _ = Sesion.objects.get_or_create(
            codigo_acceso=equipo_antiguo.codigo_sesion,
            defaults={
                'profesor': profesor,
                'estado': 'EN_ESPERA'
            }
        )
        
        # Crear nuevo equipo (usar nombre después del rename)
        nombre_equipo = getattr(equipo_antiguo, 'nombre', getattr(equipo_antiguo, 'nombre_equipo', 'Equipo Sin Nombre'))
        EquipoNuevo.objects.create(
            sesion=sesion,
            nombre=nombre_equipo,
            puntaje_total=0
        )


def reverse_migrar_datos(apps, schema_editor):
    """Reversa la migración (no implementado completamente)"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_remove_equipo_nombre_alumno'),
    ]

    operations = [
        # 1. Crear nuevos modelos primero
        migrations.CreateModel(
            name='Profesor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=120)),
                ('email', models.EmailField(max_length=160, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Sesion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_acceso', models.CharField(db_index=True, max_length=16, unique=True)),
                ('estado', models.CharField(choices=[('EN_ESPERA', 'En Espera'), ('EN_CURSO', 'En Curso'), ('FINALIZADA', 'Finalizada')], default='EN_ESPERA', max_length=20)),
                ('fecha_inicio', models.DateTimeField(blank=True, null=True)),
                ('fecha_fin', models.DateTimeField(blank=True, null=True)),
                ('config_tiempos', models.JSONField(blank=True, null=True)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('profesor', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='sesiones', to='api.profesor')),
            ],
        ),
        migrations.AddField(
            model_name='alumno',
            name='carrera',
            field=models.CharField(default='Sin definir', max_length=120),
        ),
        migrations.AddField(
            model_name='alumno',
            name='email',
            field=models.EmailField(blank=True, max_length=160, null=True, unique=True),
        ),
        # 2. Renombrar campos de Equipo para preservar datos
        migrations.RenameField(
            model_name='equipo',
            old_name='nombre_equipo',
            new_name='nombre',
        ),
        migrations.AddField(
            model_name='equipo',
            name='puntaje_total',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='equipo',
            name='sesion',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='equipos', to='api.sesion'),
        ),
        # 3. Migrar datos ANTES de hacer sesion no-nullable
        migrations.RunPython(migrar_datos_equipos, reverse_migrar_datos),
        # 4. Ahora hacer sesion no-nullable (después de migrar datos)
        migrations.AlterField(
            model_name='equipo',
            name='sesion',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='equipos', to='api.sesion'),
        ),
        # 5. Eliminar campos antiguos (solo si existen)
        migrations.RemoveField(
            model_name='equipo',
            name='codigo_sesion',
        ),
        migrations.RemoveField(
            model_name='equipo',
            name='carrera',
        ),
        # integrantes ya fue eliminado en migración 0003
        # 6. Cambiar relación de Alumno
        migrations.RemoveField(
            model_name='alumno',
            name='equipo',
        ),
        # 7. Crear tabla intermedia EquipoAlumno
        migrations.CreateModel(
            name='EquipoAlumno',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alumno', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='equipos', to='api.alumno')),
                ('equipo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='miembros', to='api.equipo')),
                ('sesion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participantes', to='api.sesion')),
            ],
            options={
                'verbose_name_plural': 'Equipo Alumnos',
                'unique_together': {('equipo', 'alumno'), ('alumno', 'sesion')},
            },
        ),
        # 8. Crear otros modelos
        migrations.CreateModel(
            name='Token',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('origen', models.CharField(choices=[('ACTIVIDAD', 'Actividad'), ('EVALUACION', 'Evaluación'), ('BONUS', 'Bonus')], max_length=20)),
                ('valor', models.IntegerField()),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('descripcion', models.CharField(blank=True, max_length=200, null=True)),
                ('equipo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tokens_ganados', to='api.equipo')),
                ('sesion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tokens', to='api.sesion')),
            ],
            options={
                'verbose_name_plural': 'Tokens',
            },
        ),
        migrations.CreateModel(
            name='Desafio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tematica', models.CharField(choices=[('SALUD', 'Salud'), ('SUSTENTABILIDAD', 'Sustentabilidad'), ('EDUCACION', 'Educación'), ('ADULTOS_MAYORES', 'Adultos Mayores'), ('FASTFASHION_DESECHOS', 'Fast Fashion y Desechos'), ('SUSTENTABILIDAD_AGUA', 'Sustentabilidad del Agua')], max_length=30)),
                ('titulo', models.CharField(max_length=200)),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('personaje_id', models.IntegerField(blank=True, null=True)),
            ],
            options={
                'verbose_name_plural': 'Desafíos',
            },
        ),
        migrations.CreateModel(
            name='Pitch',
            fields=[
                ('equipo', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='pitch', serialize=False, to='api.equipo')),
                ('nombre_emprendimiento', models.CharField(max_length=150)),
                ('guion', models.TextField(blank=True, null=True)),
                ('media_url', models.URLField(blank=True, max_length=500, null=True)),
                ('duracion_seg', models.IntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(180)])),
                ('presentado_en', models.DateTimeField(blank=True, null=True)),
                ('estado', models.CharField(choices=[('PENDIENTE', 'Pendiente'), ('ENTREGADO', 'Entregado'), ('VALIDADO', 'Validado')], default='PENDIENTE', max_length=20)),
                ('sesion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pitches', to='api.sesion')),
            ],
            options={
                'verbose_name_plural': 'Pitches',
            },
        ),
        migrations.CreateModel(
            name='EquipoDesafio',
            fields=[
                ('equipo', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='desafio_elegido', serialize=False, to='api.equipo')),
                ('elegido_en', models.DateTimeField(auto_now_add=True)),
                ('desafio', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='equipos', to='api.desafio')),
                ('sesion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='desafios_elegidos', to='api.sesion')),
            ],
            options={
                'verbose_name_plural': 'Equipo Desafíos',
            },
        ),
        # 9. Agregar constraints
        migrations.AlterUniqueTogether(
            name='equipo',
            unique_together={('sesion', 'nombre')},
        ),
    ]

