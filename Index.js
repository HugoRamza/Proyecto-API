const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');
const swaggerUI = require('swagger-ui-express');
const swaggerjsDoc = require('swagger-jsdoc');
const multer = require('multer');
const bodyParser = require('body-parser');

app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const folder = path.join(__dirname + '/archivos/');
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, folder) },
    filename: function (req, file, cb) { cb(null, file.originalname) }
});
const upload = multer({ storage: storage });
app.use(upload.single('archivo'));

const PORT = process.env.PORT || 3001;
const PORTE = process.env.MYSQLPORT || 3306;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '';
const DATABASE = process.env.MYSQL_DATABASE || 'alumnos';

const MySqlConnection = { host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORTE };

const data = fs.readFileSync(path.join(__dirname, './Options.json'), { encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data);

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname, "./Index.js")}`],
};

const swaggerDocs = swaggerjsDoc(swaggerOptions);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.get("/options", (req, res) => {
    res.json(data);
});

app.use("/api-docs-json", (req, res) => {
    res.json(swaggerDocs);
});

/**
 * @swagger
 * tags:
 *   name: DALUMN
 *   description: Operaciones relacionadas con DALUMN
 *
 * components:
 *   schemas:
 *     DALUMN:
 *       type: object
 *       required:
 *         - aluctr
 *         - aluapp
 *         - aluapm
 *         - alunom
 *         - alusex
 *         - alunac
 *         - alulna
 *         - alurfc
 *         - alucur
 *         - aluesc
 *         - alumai
 *       properties:
 *         aluctr:
 *           type: string
 *           description: ID del alumno
 *         aluapp:
 *           type: string
 *           description: Apellido paterno del alumno
 *         aluapm:
 *           type: string
 *           description: Apellido materno del alumno
 *         alunom:
 *           type: string
 *           description: Nombre del alumno
 *         alusex:
 *           type: string
 *           description: Sexo del alumno
 *         alunac:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento del alumno
 *         alulna:
 *           type: string
 *           description: Lugar de nacimiento del alumno
 *         alurfc:
 *           type: string
 *           description: RFC del alumno
 *         alucur:
 *           type: string
 *           description: CURP del alumno
 *         aluesc:
 *           type: integer
 *           description: ID de la escuela
 *         alumai:
 *           type: string
 *           description: Email del alumno
 */

/**
 * @swagger
 * /dalumn:
 *   get:
 *     summary: Obtiene la lista de alumnos.
 *     description: Retorna la lista completa de alumnos almacenados en la base de datos.
 *     tags: [DALUMN]
 *     responses:
 *       200:
 *         description: Éxito. Retorna la lista de alumnos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DALUMN'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: Error en la base de datos.
 */
app.get('/dalumn', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows] = await conn.query('SELECT * FROM DALUMN');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.sqlMessage });
    }
});

/**
 * @swagger
 * /dalumn/{id}:
 *   get:
 *     summary: Obtiene un alumno por ID.
 *     description: Retorna los detalles de un alumno específico según el ID proporcionado.
 *     tags: [DALUMN]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del alumno a consultar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito. Retorna los detalles del alumno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DALUMN'
 *       404:
 *         description: No encontrado. El alumno con el ID proporcionado no existe.
 *         content:
 *           application/json:
 *             example:
 *               message: Alumno no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: Error en la base de datos.
 */
app.get('/dalumn/:id', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows] = await conn.query('SELECT * FROM DALUMN WHERE aluctr = ?', [req.params.id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Alumno no encontrado' });
        } else {
            res.json(rows[0]);
        }
    } catch (err) {
        res.status(500).json({ message: err.sqlMessage });
    }
});

/**
 * @swagger
 * /dalumn:
 *   post:
 *     summary: Inserta un nuevo alumno.
 *     description: Inserta un nuevo alumno en la base de datos con la información proporcionada.
 *     tags: [DALUMN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DALUMN'
 *     responses:
 *       200:
 *         description: Éxito. Datos insertados correctamente.
 *         content:
 *           application/json:
 *             example:
 *               message: Datos insertados correctamente.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: Error al insertar datos.
 */
app.post('/dalumn', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { aluctr, aluapp, aluapm, alunom, alusex, alunac, alulna, alurfc, alucur, aluesc, alumai } = req.body;
        const sql = 'INSERT INTO DALUMN (aluctr, aluapp, aluapm, alunom, alusex, alunac, alulna, alurfc, alucur, aluesc, alumai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conn.execute(sql, [aluctr, aluapp, aluapm, alunom, alusex, alunac, alulna, alurfc, alucur, aluesc, alumai]);
        res.json({ message: 'Datos insertados correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.sqlMessage });
    }
});

/**
 * @swagger
 * /dalumn/{id}:
 *   put:
 *     summary: Actualiza un alumno por ID.
 *     description: Actualiza la información de un alumno específico según el ID proporcionado.
 *     tags: [DALUMN]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del alumno a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DALUMN'
 *     responses:
 *       200:
 *         description: Éxito. Alumno actualizado correctamente.
 *         content:
 *           application/json:
 *             example:
 *               message: Alumno actualizado correctamente.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: Error al actualizar datos.
 */
app.put('/dalumn/:id', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { aluapp, aluapm, alunom, alusex, alunac, alulna, alurfc, alucur, aluesc, alumai } = req.body;
        const sql = 'UPDATE DALUMN SET aluapp = ?, aluapm = ?, alunom = ?, alusex = ?, alunac = ?, alulna = ?, alurfc = ?, alucur = ?, aluesc = ?, alumai = ? WHERE aluctr = ?';
        await conn.execute(sql, [aluapp, aluapm, alunom, alusex, alunac, alulna, alurfc, alucur, aluesc, alumai, req.params.id]);
        res.json({ message: 'Alumno actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.sqlMessage });
    }
});

/**
 * @swagger
 * /dalumn/{id}:
 *   delete:
 *     summary: Elimina un alumno por ID.
 *     description: Elimina un alumno específico según el ID proporcionado.
 *     tags: [DALUMN]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del alumno a eliminar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito. Alumno eliminado correctamente.
 *         content:
 *           application/json:
 *             example:
 *               message: Alumno eliminado correctamente.
 *       404:
 *         description: No encontrado. El alumno con el ID proporcionado no existe.
 *         content:
 *           application/json:
 *             example:
 *               message: Alumno no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: Error al eliminar datos.
 */
app.delete('/dalumn/:id', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [result] = await conn.query('DELETE FROM DALUMN WHERE aluctr = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Alumno no encontrado' });
        } else {
            res.json({ message: 'Alumno eliminado correctamente' });
        }
    } catch (err) {
        res.status(500).json({ message: err.sqlMessage });
    }
});

app.listen(PORT, () => {
    console.log("Servidor express escuchando en el puerto " + PORT);
});
