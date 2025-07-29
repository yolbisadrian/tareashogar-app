
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

const corsOptions = {
  origin: 'https://tareashogarapp.netlify.app/' 
};
app.use(cors(corsOptions));
app.use(express.json());

interface AuthRequest extends Request { user?: { id: number; username: string }; }

const authenticateToken = (req: AuthRequest, res: Response, next: Function) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "Secreto del servidor no configurado." });
    jwt.verify(token, secret, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, password, secret_q, secret_a } = req.body;
  if (!username || !password || !secret_q || !secret_a) return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const secretAnswerHash = await bcrypt.hash(secret_a, saltRounds);
    const q = `INSERT INTO users (username, password_hash, secret_question, secret_answer_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, created_at;`;
    const result = await pool.query(q, [username, passwordHash, secret_q, secretAnswerHash]);
    res.status(201).json({ message: 'Usuario registrado con éxito', user: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
    console.error('Error en registro:', error); res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña obligatorios.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    const user = result.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) return res.status(401).json({ message: 'Contraseña incorrecta.' });
    const payload = { id: user.id, username: user.username };
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login exitoso', token, user: { id: user.id, username: user.username } });
  } catch (error: any) { console.error('Error en login:', error); res.status(500).json({ message: 'Error interno del servidor.' }); }
});

app.post('/api/auth/recover-step1', async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'El nombre de usuario es obligatorio.' });
  try {
    const result = await pool.query('SELECT secret_question FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.status(200).json({ secret_question: result.rows[0].secret_question });
  } catch (error) { console.error('Error en recover-step1:', error); res.status(500).json({ message: 'Error interno.' }); }
});

app.post('/api/auth/recover-step2', async (req: Request, res: Response) => {
  const { username, secret_a, new_password } = req.body;
  if (!username || !secret_a || !new_password) return res.status(400).json({ message: 'Todos los campos obligatorios.' });
  try {
    const userResult = await pool.query('SELECT secret_answer_hash FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    const isAnswerCorrect = await bcrypt.compare(secret_a, userResult.rows[0].secret_answer_hash);
    if (!isAnswerCorrect) return res.status(401).json({ message: 'Respuesta secreta incorrecta.' });
    const newPasswordHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [newPasswordHash, username]);
    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) { console.error('Error en recover-step2:', error); res.status(500).json({ message: 'Error interno.' }); }
});

// --- RUTAS DE TAREAS ---
app.get('/api/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    try { const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC', [userId]); res.status(200).json(result.rows); }
    catch (error) { console.error('Error al obtener tareas:', error); res.status(500).json({ message: 'Error interno.' }); }
});

app.post('/api/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { text, assigned_to, due_date } = req.body;
    if (!text) return res.status(400).json({ message: 'El texto es obligatorio.' });
    try {
        const query = `INSERT INTO tasks (text, assigned_to, due_date, user_id) VALUES ($1, $2, $3, $4) RETURNING *;`;
        const result = await pool.query(query, [text, assigned_to || null, due_date || null, userId]);
        res.status(201).json(result.rows[0]);
    } catch (error) { console.error('Error al crear tarea:', error); res.status(500).json({ message: 'Error interno.' }); }
});

app.post('/api/tasks/batch', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const tasks = req.body.tasks;
    if (!Array.isArray(tasks) || tasks.length === 0) return res.status(400).json({ message: 'Se requiere un array de tareas.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const createdTasks = [];
        for (const task of tasks) {
            const { text, assigned_to, due_date } = task;
            if (!text) throw new Error('Todas las tareas deben tener texto.');
            const query = `INSERT INTO tasks (text, assigned_to, due_date, user_id) VALUES ($1, $2, $3, $4) RETURNING *;`;
            const result = await client.query(query, [text, assigned_to || null, due_date || null, userId]);
            createdTasks.push(result.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json(createdTasks);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear tareas en lote:', error); res.status(500).json({ message: 'Error interno al crear tareas.' });
    } finally {
        client.release();
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id);
    const { text, status, assigned_to, due_date } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const checkQuery = await client.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
        if (checkQuery.rows.length === 0) {
            await client.query('ROLLBACK'); return res.status(404).json({ message: 'Tarea no encontrada o sin permiso.' });
        }
        const currentTask = checkQuery.rows[0];
        const q = `UPDATE tasks SET text = $1, status = $2, assigned_to = $3, due_date = $4 WHERE id = $5 RETURNING *;`;
        const values = [ text || currentTask.text, status || currentTask.status, assigned_to || currentTask.assigned_to, due_date || currentTask.due_date, taskId ];
        const result = await client.query(q, values);

        if (status && status !== currentTask.status && result.rows[0].assigned_to) {
            const userToUpdateQuery = await client.query('SELECT id, points FROM users WHERE username = $1', [result.rows[0].assigned_to]);
            if (userToUpdateQuery.rows.length > 0) {
                const userToUpdate = userToUpdateQuery.rows[0];
                const pointsChange = (status === 'Completada') ? 10 : -10;
                const newPoints = Math.max(0, (userToUpdate.points || 0) + pointsChange);
                await client.query('UPDATE users SET points = $1 WHERE id = $2', [newPoints, userToUpdate.id]);
            }
        }
        await client.query('COMMIT');
        res.status(200).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar tarea:', error); res.status(500).json({ message: 'Error interno.' });
    } finally {
        client.release();
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Tarea no encontrada o sin permiso.' });
        res.status(204).send();
    } catch (error) { console.error('Error al eliminar tarea:', error); res.status(500).json({ message: 'Error interno.' }); }
});

app.delete('/api/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    try { await pool.query('DELETE FROM tasks WHERE user_id = $1', [userId]); res.status(204).send(); }
    catch (error) { console.error('Error al limpiar tareas:', error); res.status(500).json({ message: 'Error interno.' }); }
});

app.get('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query('SELECT username, points FROM users ORDER BY points DESC, username ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/history', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    try {
        const result = await pool.query(
            'SELECT description, created_at FROM history_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', // Limitamos a las 50 más recientes
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener el historial:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// AÑADIR UNA NUEVA ENTRADA AL HISTORIAL
app.post('/api/history', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { action_type, description } = req.body;

    if (!action_type || !description) {
        return res.status(400).json({ message: 'El tipo de acción y la descripción son obligatorios.' });
    }

    try {
        const query = `INSERT INTO history_logs (action_type, description, user_id) VALUES ($1, $2, $3) RETURNING *;`;
        const result = await pool.query(query, [action_type, description, userId]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al registrar en el historial:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.listen(PORT, () => console.log(`🚀 Servidor backend listo en http://localhost:${PORT}`));