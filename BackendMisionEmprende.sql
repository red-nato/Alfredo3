-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: backend_mision_emprende
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alumnos`
--

DROP TABLE IF EXISTS `alumnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumnos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `carrera` varchar(120) NOT NULL,
  `email` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumnos`
--

LOCK TABLES `alumnos` WRITE;
/*!40000 ALTER TABLE `alumnos` DISABLE KEYS */;
/*!40000 ALTER TABLE `alumnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cronometros`
--

DROP TABLE IF EXISTS `cronometros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cronometros` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `etapa_id` bigint NOT NULL,
  `inicio` datetime DEFAULT NULL,
  `fin` datetime DEFAULT NULL,
  `restante_s` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `etapa_id` (`etapa_id`),
  CONSTRAINT `fk_crn_etapa` FOREIGN KEY (`etapa_id`) REFERENCES `etapas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cronometros`
--

LOCK TABLES `cronometros` WRITE;
/*!40000 ALTER TABLE `cronometros` DISABLE KEYS */;
/*!40000 ALTER TABLE `cronometros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `desafios`
--

DROP TABLE IF EXISTS `desafios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `desafios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tematica` enum('SALUD','SUSTENTABILIDAD','EDUCACION') NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text,
  `personaje_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_des_personaje` (`personaje_id`),
  CONSTRAINT `fk_des_personaje` FOREIGN KEY (`personaje_id`) REFERENCES `personajes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `desafios`
--

LOCK TABLES `desafios` WRITE;
/*!40000 ALTER TABLE `desafios` DISABLE KEYS */;
/*!40000 ALTER TABLE `desafios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipo_alumno`
--

DROP TABLE IF EXISTS `equipo_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipo_alumno` (
  `equipo_id` bigint NOT NULL,
  `sesion_id` bigint NOT NULL,
  `alumno_id` bigint NOT NULL,
  PRIMARY KEY (`equipo_id`,`alumno_id`),
  UNIQUE KEY `uq_alumno_por_sesion` (`alumno_id`,`sesion_id`),
  KEY `fk_eqa_equipo` (`equipo_id`,`sesion_id`),
  KEY `fk_eqa_sesion` (`sesion_id`),
  CONSTRAINT `fk_eqa_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumnos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_eqa_equipo` FOREIGN KEY (`equipo_id`, `sesion_id`) REFERENCES `equipos` (`id`, `sesion_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eqa_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipo_alumno`
--

LOCK TABLES `equipo_alumno` WRITE;
/*!40000 ALTER TABLE `equipo_alumno` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipo_alumno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipo_desafio`
--

DROP TABLE IF EXISTS `equipo_desafio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipo_desafio` (
  `equipo_id` bigint NOT NULL,
  `sesion_id` bigint NOT NULL,
  `desafio_id` bigint NOT NULL,
  `elegido_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`equipo_id`),
  KEY `fk_eqd_equipo` (`equipo_id`,`sesion_id`),
  KEY `fk_eqd_desafio` (`desafio_id`),
  KEY `fk_eqd_sesion` (`sesion_id`),
  CONSTRAINT `fk_eqd_desafio` FOREIGN KEY (`desafio_id`) REFERENCES `desafios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_eqd_equipo` FOREIGN KEY (`equipo_id`, `sesion_id`) REFERENCES `equipos` (`id`, `sesion_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eqd_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipo_desafio`
--

LOCK TABLES `equipo_desafio` WRITE;
/*!40000 ALTER TABLE `equipo_desafio` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipo_desafio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipos`
--

DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sesion_id` bigint NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `puntaje_total` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_equipo_nombre_sesion` (`sesion_id`,`nombre`),
  UNIQUE KEY `uq_equipo_id_sesion` (`id`,`sesion_id`),
  CONSTRAINT `fk_equ_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipos`
--

LOCK TABLES `equipos` WRITE;
/*!40000 ALTER TABLE `equipos` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etapas`
--

DROP TABLE IF EXISTS `etapas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etapas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sesion_id` bigint NOT NULL,
  `tipo` enum('EQUIPO','DESAFIO_EMP','CREATIVIDAD','COMUNICACION','EVALUACION','CIERRE') NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `duracion_min` int NOT NULL,
  `estado` enum('PENDIENTE','EN_CURSO','CERRADA') NOT NULL DEFAULT 'PENDIENTE',
  `inicio_real` datetime DEFAULT NULL,
  `fin_real` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_etp_sesion` (`sesion_id`,`tipo`,`estado`),
  CONSTRAINT `fk_etp_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etapas`
--

LOCK TABLES `etapas` WRITE;
/*!40000 ALTER TABLE `etapas` DISABLE KEYS */;
/*!40000 ALTER TABLE `etapas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluacion_puntajes`
--

DROP TABLE IF EXISTS `evaluacion_puntajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion_puntajes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `evaluacion_id` bigint NOT NULL,
  `criterio_id` bigint NOT NULL,
  `valor` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eval_criterio` (`evaluacion_id`,`criterio_id`),
  KEY `fk_ep_criterio` (`criterio_id`),
  CONSTRAINT `fk_ep_criterio` FOREIGN KEY (`criterio_id`) REFERENCES `rubrica_criterios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ep_evaluacion` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluacion_puntajes`
--

LOCK TABLES `evaluacion_puntajes` WRITE;
/*!40000 ALTER TABLE `evaluacion_puntajes` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluacion_puntajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluaciones`
--

DROP TABLE IF EXISTS `evaluaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sesion_id` bigint NOT NULL,
  `rubrica_id` bigint NOT NULL,
  `equipo_evaluador_id` bigint NOT NULL,
  `equipo_evaluado_id` bigint NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `comentario` text,
  PRIMARY KEY (`id`),
  KEY `fk_eval_rubrica` (`rubrica_id`),
  KEY `fk_eval_evaluador` (`equipo_evaluador_id`,`sesion_id`),
  KEY `fk_eval_evaluado` (`equipo_evaluado_id`,`sesion_id`),
  KEY `fk_eval_sesion` (`sesion_id`),
  CONSTRAINT `fk_eval_evaluado` FOREIGN KEY (`equipo_evaluado_id`, `sesion_id`) REFERENCES `equipos` (`id`, `sesion_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eval_evaluador` FOREIGN KEY (`equipo_evaluador_id`, `sesion_id`) REFERENCES `equipos` (`id`, `sesion_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eval_rubrica` FOREIGN KEY (`rubrica_id`) REFERENCES `rubricas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_eval_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluaciones`
--

LOCK TABLES `evaluaciones` WRITE;
/*!40000 ALTER TABLE `evaluaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluaciones` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eval_no_autoeval_bi` BEFORE INSERT ON `evaluaciones` FOR EACH ROW BEGIN
  IF NEW.equipo_evaluador_id = NEW.equipo_evaluado_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'No se permite autoevaluación (equipo evaluador = evaluado).';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eval_no_autoeval_bu` BEFORE UPDATE ON `evaluaciones` FOR EACH ROW BEGIN
  IF NEW.equipo_evaluador_id = NEW.equipo_evaluado_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'No se permite autoevaluación (equipo evaluador = evaluado).';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sesion_id` bigint NOT NULL,
  `mensaje` varchar(500) NOT NULL,
  `canal` enum('IN_APP','SONORA','EMAIL') NOT NULL DEFAULT 'IN_APP',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_not_sesion` (`sesion_id`),
  CONSTRAINT `fk_not_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personajes`
--

DROP TABLE IF EXISTS `personajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personajes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `edad` int DEFAULT NULL,
  `contexto` text,
  `necesidades` text,
  `emociones` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personajes`
--

LOCK TABLES `personajes` WRITE;
/*!40000 ALTER TABLE `personajes` DISABLE KEYS */;
/*!40000 ALTER TABLE `personajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pitches`
--

DROP TABLE IF EXISTS `pitches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pitches` (
  `equipo_id` bigint NOT NULL,
  `sesion_id` bigint NOT NULL,
  `nombre_emprendimiento` varchar(150) NOT NULL,
  `guion` text,
  `media_url` varchar(500) DEFAULT NULL,
  `duracion_seg` int DEFAULT NULL,
  `presentado_en` datetime DEFAULT NULL,
  `estado` enum('PENDIENTE','ENTREGADO','VALIDADO') NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`equipo_id`),
  KEY `fk_pitch_equipo` (`equipo_id`,`sesion_id`),
  KEY `fk_pitch_sesion` (`sesion_id`),
  CONSTRAINT `fk_pitch_equipo` FOREIGN KEY (`equipo_id`, `sesion_id`) REFERENCES `equipos` (`id`, `sesion_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pitch_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_pitch_duracion` CHECK (((`duracion_seg` is null) or (`duracion_seg` between 1 and 180)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pitches`
--

LOCK TABLES `pitches` WRITE;
/*!40000 ALTER TABLE `pitches` DISABLE KEYS */;
/*!40000 ALTER TABLE `pitches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profesores`
--

DROP TABLE IF EXISTS `profesores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profesores` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profesores`
--

LOCK TABLES `profesores` WRITE;
/*!40000 ALTER TABLE `profesores` DISABLE KEYS */;
/*!40000 ALTER TABLE `profesores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ranking_posiciones`
--

DROP TABLE IF EXISTS `ranking_posiciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ranking_posiciones` (
  `ranking_id` bigint NOT NULL,
  `equipo_id` bigint NOT NULL,
  `posicion` int NOT NULL,
  `puntaje` int NOT NULL,
  PRIMARY KEY (`ranking_id`,`equipo_id`),
  KEY `fk_rnp_equipo` (`equipo_id`),
  CONSTRAINT `fk_rnp_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rnp_ranking` FOREIGN KEY (`ranking_id`) REFERENCES `rankings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ranking_posiciones`
--

LOCK TABLES `ranking_posiciones` WRITE;
/*!40000 ALTER TABLE `ranking_posiciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `ranking_posiciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rankings`
--

DROP TABLE IF EXISTS `rankings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rankings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sesion_id` bigint NOT NULL,
  `generado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sesion_id` (`sesion_id`),
  CONSTRAINT `fk_rnk_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rankings`
--

LOCK TABLES `rankings` WRITE;
/*!40000 ALTER TABLE `rankings` DISABLE KEYS */;
/*!40000 ALTER TABLE `rankings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rubrica_criterios`
--

DROP TABLE IF EXISTS `rubrica_criterios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rubrica_criterios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rubrica_id` bigint NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `peso` decimal(5,2) NOT NULL DEFAULT '25.00',
  PRIMARY KEY (`id`),
  KEY `fk_rc_rubrica` (`rubrica_id`),
  CONSTRAINT `fk_rc_rubrica` FOREIGN KEY (`rubrica_id`) REFERENCES `rubricas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rubrica_criterios`
--

LOCK TABLES `rubrica_criterios` WRITE;
/*!40000 ALTER TABLE `rubrica_criterios` DISABLE KEYS */;
/*!40000 ALTER TABLE `rubrica_criterios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rubricas`
--

DROP TABLE IF EXISTS `rubricas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rubricas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `escala_min` int NOT NULL DEFAULT '1',
  `escala_max` int NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rubricas`
--

LOCK TABLES `rubricas` WRITE;
/*!40000 ALTER TABLE `rubricas` DISABLE KEYS */;
/*!40000 ALTER TABLE `rubricas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesiones`
--

DROP TABLE IF EXISTS `sesiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `profesor_id` bigint NOT NULL,
  `codigo_acceso` varchar(16) NOT NULL,
  `estado` enum('EN_ESPERA','EN_CURSO','FINALIZADA') NOT NULL DEFAULT 'EN_ESPERA',
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `config_tiempos` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_acceso` (`codigo_acceso`),
  KEY `fk_ses_profesor` (`profesor_id`),
  CONSTRAINT `fk_ses_profesor` FOREIGN KEY (`profesor_id`) REFERENCES `profesores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones`
--

LOCK TABLES `sesiones` WRITE;
/*!40000 ALTER TABLE `sesiones` DISABLE KEYS */;
/*!40000 ALTER TABLE `sesiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `equipo_id` bigint NOT NULL,
  `sesion_id` bigint NOT NULL,
  `origen` enum('ACTIVIDAD','EVALUACION','BONUS') NOT NULL,
  `valor` int NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tok_equipo` (`equipo_id`,`sesion_id`),
  CONSTRAINT `fk_tok_equipo` FOREIGN KEY (`equipo_id`, `sesion_id`) REFERENCES `equipos` (`id`, `sesion_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens`
--

LOCK TABLES `tokens` WRITE;
/*!40000 ALTER TABLE `tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_pitches_por_sesion`
--

DROP TABLE IF EXISTS `vw_pitches_por_sesion`;
/*!50001 DROP VIEW IF EXISTS `vw_pitches_por_sesion`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_pitches_por_sesion` AS SELECT 
 1 AS `sesion_id`,
 1 AS `equipo_id`,
 1 AS `equipo`,
 1 AS `estado`,
 1 AS `nombre_emprendimiento`,
 1 AS `presentado_en`,
 1 AS `duracion_seg`,
 1 AS `media_url`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_puntaje_evaluaciones`
--

DROP TABLE IF EXISTS `vw_puntaje_evaluaciones`;
/*!50001 DROP VIEW IF EXISTS `vw_puntaje_evaluaciones`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_puntaje_evaluaciones` AS SELECT 
 1 AS `equipo_id`,
 1 AS `sesion_id`,
 1 AS `puntaje_eval`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_puntaje_tokens`
--

DROP TABLE IF EXISTS `vw_puntaje_tokens`;
/*!50001 DROP VIEW IF EXISTS `vw_puntaje_tokens`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_puntaje_tokens` AS SELECT 
 1 AS `equipo_id`,
 1 AS `sesion_id`,
 1 AS `tokens`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'backend_mision_emprende'
--

--
-- Dumping routines for database 'backend_mision_emprende'
--

--
-- Final view structure for view `vw_pitches_por_sesion`
--

/*!50001 DROP VIEW IF EXISTS `vw_pitches_por_sesion`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_pitches_por_sesion` AS select `e`.`sesion_id` AS `sesion_id`,`e`.`id` AS `equipo_id`,`e`.`nombre` AS `equipo`,`p`.`estado` AS `estado`,`p`.`nombre_emprendimiento` AS `nombre_emprendimiento`,`p`.`presentado_en` AS `presentado_en`,`p`.`duracion_seg` AS `duracion_seg`,`p`.`media_url` AS `media_url` from (`equipos` `e` left join `pitches` `p` on(((`p`.`equipo_id` = `e`.`id`) and (`p`.`sesion_id` = `e`.`sesion_id`)))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_puntaje_evaluaciones`
--

/*!50001 DROP VIEW IF EXISTS `vw_puntaje_evaluaciones`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_puntaje_evaluaciones` AS select `ev`.`equipo_evaluado_id` AS `equipo_id`,`ev`.`sesion_id` AS `sesion_id`,round(sum(((`ep`.`valor` * `rc`.`peso`) / 100)),2) AS `puntaje_eval` from ((`evaluaciones` `ev` join `evaluacion_puntajes` `ep` on((`ep`.`evaluacion_id` = `ev`.`id`))) join `rubrica_criterios` `rc` on((`rc`.`id` = `ep`.`criterio_id`))) group by `ev`.`equipo_evaluado_id`,`ev`.`sesion_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_puntaje_tokens`
--

/*!50001 DROP VIEW IF EXISTS `vw_puntaje_tokens`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_puntaje_tokens` AS select `e`.`id` AS `equipo_id`,`e`.`sesion_id` AS `sesion_id`,coalesce(sum(`t`.`valor`),0) AS `tokens` from (`equipos` `e` left join `tokens` `t` on(((`t`.`equipo_id` = `e`.`id`) and (`t`.`sesion_id` = `e`.`sesion_id`)))) group by `e`.`id`,`e`.`sesion_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-04 10:13:10
