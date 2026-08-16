### Para jugar en una sesión normal como estudiante (y profesor)
- Entrar a https://mision-emprende-frontend-695835257252.s3.us-east-1.amazonaws.com/index.html
- Presionar "¡Quiero jugar!" y "¡Comenzar aventura!". 
	Obs: Pedirá un "Código del juego" que aún no tiene, es normal.
- Repetir los pasos anteriores en otra pestaña u otro dispositivo. La idea es simular varios grupos de estudiantes queriendo jugar en la misma sesión.
- En una pestaña aparte, de preferencia una ventana en incógnito, entrar a https://mision-emprende-frontend-695835257252.s3.us-east-1.amazonaws.com/index.html
- Bajar hasta encontrar "Accesos especiales", presionar "Profesor".
- Coloque su nombre y facultad. La modalidad de grupos hay que dejarla por defecto (Conteo manual). Una vez revisado todo, presionar "Crear sesión".
- Una vez dentro verá "Código de acceso". Ese es el código que debe de pegar en las pestañas de los grupos de estudiantes en el campo "Código del juego". Puede copiarlo en el portapapeles solo con clickear sobre este.
- Una vez copiado el código de acceso, en la ventana de estudiantes, presionar "Conectar".
- En la siguiente sección deberá crear un nombre de equipo e incluir los integrantes que conformarán el equipo. Al terminar, presionar "Iniciar".
	Obs: Si todo está correcto, debería ver un mensaje de "¡Conectado!" con Helpi sentado sobre las letras. De lo contrario, debe leer el Toaster con el error. Si aparece "Ya existe un equipo o integrante con esos datos en esta sesión" es porque otro equipo está inscrito con ese mismo nombre en la sesión actual del profesor. Cambiar nombre del equipo y volver a presionar "Iniciar".
- Repetir los últimos dos pasos para cada equipo de estudiantes simulados.
- Los equipos (estudiantes) estarán esperando que el profesor inicie el juego. En la pestaña del profesor puede visualizar los equipos que se conectaron. Para iniciar, presione "Iniciar juego".
- Por parte de los estudiantes, deberán seguir las instrucciones del juego. Es importante que ninguno se desconecte pues esto haría que la fase 5 "Negociación" no tenga sentido. Aquel equipo que se desconectó no podría evaluar al que sí lo está.

### Para revisar métricas en administrador
- Entrar a https://mision-emprende-frontend-695835257252.s3.us-east-1.amazonaws.com/index.html
- Bajar hasta encontrar "Accesos especiales", presionar "Administrador".
- En el acceso Admin, el usuario es "shlam" y contraseña "1234" (tuvimos que hacer un pool de Cognito aislado, un flujo de autenticación personalizado,  para que no requiera volver a inicializar al prender el laboratorio. Este código funciona como un desafío personalizado, no como una contraseña estándar de Cognito).
- Una vez dentro, esperar unos segundos a que carguen todas las métricas. Si después de unos segundos no se actualizan, puede refrescar la página.


## Observaciones generales, limitaciones y restricciones impuestas por la clienta
- El cronómetro no se inicia sino justo después de elegir entre "Sí, nos conocemos" o "No, no nos conocemos". Laura quería que fuese así para que los estudiantes pudiesen elegir sin apurarse. El desfase que podría suceder entre equipos se soluciona varias fases después. En la sala de clases habrían profesores o asistentes los cuales ayudarían a los grupos, por lo que no representaba un problema real (y lo más importante, así lo quería la clienta por lo que le hicimos caso).
- En la sección de "Profesor" existe la opción de proyectar el grupo. Era una funcionalidad que estamos trabajando para algo fuera del ramo, por lo que aún no podemos mostrarlo funcionando acá.
- En la sección de "Administrador" se pueden crear nuevos accesos para administradores. Si es que dejamos activado la excepción dentro de Cognito, puede dar un error tipo "No se pudo crear el administrador". 
