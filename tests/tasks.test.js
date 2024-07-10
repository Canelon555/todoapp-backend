const supertest = require('supertest');
const app = require('../app');
const { describe, test, expect, beforeAll } = require('@jest/globals');
const db = require('../db');
// const { text } = require('express');
const api = supertest(app);
let user = undefined;

let tasks = [
  {
    text: 'Lavar la ropa',
    checked: 0,
  },
  {
    text: 'Hacer ejercicios',
    checked: 0,
  },
  {
    text: 'Mejorar constantemente',
    checked: 0,
  },
];

let users = [
  {
    username: 'canelon555',
    password: 'Secreto.123',
  },
  {
    username: 'moises123',
    password: 'Christopher.555',
  },
];

describe('test tasks endpoint /api/tasks', () => {
  // TESTS POST
  describe('post /api/tasks', () => {
    beforeAll(() => {
      // Borra todos los usuarios
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM tasks').run();

      // Crear un usuario
      user = db
        .prepare(
          `
        INSERT INTO users (username, password)
        VALUES (?, ?)
        RETURNING *
      `,
        )
        .get('canelon555', 'Secreto.123');
    });
    // Primer test
    test('crea una tarea cuando todo esta correcto', async () => {
      const tasksBefore = db.prepare('SELECT * FROM tasks').all();
      const newTask = {
        text: 'Practicar Programacion',
        checked: 0,
      };
      const response = await api
        .post('/api/tasks')
        .query({ userId: user.user_id })
        .send(newTask)
        .expect(201)
        .expect('Content-Type', /json/);
      const tasksAfter = db.prepare('SELECT * FROM tasks').all();
      expect(tasksAfter.length).toBe(tasksBefore.length + 1);
      expect(response.body).toStrictEqual({
        tasks_id: 1,
        text: 'Practicar Programacion',
        checked: 0,
        user_id: 1,
      });
    });
    // segundo test
    test('no crea una tarea cuando está vacía', async () => {
      const tasksBefore = db.prepare('SELECT * FROM tasks').all();
      const newTask = {
        text: ' ',
      };
      const response = await api
        .post('/api/tasks')
        .query({ userId: user.user_id })
        .send(newTask)
        .expect(400)
        .expect('Content-Type', /json/);
      const tasksAfter = db.prepare('SELECT * FROM tasks').all();
      expect(tasksAfter.length).toBe(tasksBefore.length);
      expect(response.body).toStrictEqual({
        error: 'La tarea esta vacia',
      });
    });
    // tercer test
    test('no crea una tarea cuando el usuario no inicio sesion', async () => {
      const tasksBefore = db.prepare('SELECT * FROM tasks').all();
      const newTask = {
        text: 'Hacer dieta',
        checked: 0,
      };
      await api.post('/api/tasks').query({ user_id: null }).send(newTask).expect(403);
      const tasksAfter = db.prepare('SELECT * FROM tasks').all();
      expect(tasksAfter.length).toBe(tasksBefore.length);
    });
  });
  // Aqui las pruebas de put
  describe('put /api/tasks', () => {
    beforeAll(() => {
      // Borra todos los usuarios
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM tasks').run();

      // Crear un usuario
      users = users.map((user) => {
        return db
          .prepare(
            `
      INSERT INTO users (username, password)
      VALUES (?, ?)
      RETURNING *
    `,
          )
          .get(user.username, user.password);
      });

      // Crear la tarea
      tasks = tasks.map((task) => {
        return db
          .prepare(
            `
          INSERT INTO tasks (text, checked, user_id)
          VALUES (?, ?, ?)
          RETURNING *
        `,
          )
          .get(task.text, task.checked, users[0].user_id);
      });
    });
    // Primer test
    test('actualiza la tarea cuando todo esta correcto', async () => {
      const updatedParams = {
        text: 'Lavar la ropa',
        checked: 1,
      };
      const response = await api
        .put(`/api/tasks/${tasks[0].tasks_id}`)
        .query({ userId: users[0].user_id })
        .send(updatedParams)
        .expect(200)
        .expect('Content-Type', /json/);
      expect(response.body).toStrictEqual({
        tasks_id: 1,
        text: 'Lavar la ropa',
        checked: 1,
        user_id: 1,
      });
    });
    test('no actualiza cuando no es el usuario', async () => {
      const tasksBefore = db.prepare('SELECT * FROM tasks').all();
      const newTask = {
        text: 'Lavar la ropa',
        checked: 0,
      };
      await api.put('/api/tasks').query({ user_id: null }).send(newTask).expect(403);
      const tasksAfter = db.prepare('SELECT * FROM tasks').all();
      expect(tasksAfter.length).toBe(tasksBefore.length);
    });
  });

  describe('delete /api/tasks', () => {
    beforeAll(() => {
      // Borra todos los usuarios y las tareas
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM tasks').run();

      // Crear un contacto
      users = users.map((user) => {
        return db
          .prepare(
            `
      INSERT INTO users (username, password)
      VALUES (?, ?)
      RETURNING *
    `,
          )
          .get(user.username, user.password);
      });

      // Crea la tarea
      tasks = tasks.map((task) => {
        return db
          .prepare(
            `
          INSERT INTO tasks (text, checked, user_id)
          VALUES (?, ?, ?)
          RETURNING *
        `,
          )
          .get(task.text, task.checked, users[0].user_id);
      });
    });
    // Primer test
    test('elimina una tarea', async () => {
      const task = tasks[0];

      const response = await api
        .delete(`/api/tasks/${task.tasks_id}`)
        .query({ userId: users[0].user_id })
        .expect(200)
        .expect('Content-Type', /json/);
      expect(response.body).toStrictEqual({
        message: 'La tarea ha sido eliminada con exito',
      });
    });
    // Segundo test
    test('no elimina una tarea cuando esta no existe', async () => {
      const response = await api
        .delete(`/api/tasks/1000`)
        .query({ userId: users[0].user_id })
        .expect(400)
        .expect('Content-Type', /json/);
      expect(response.body).toStrictEqual({
        message: 'La tarea no existe',
      });
    });
    // Tercer test
    test('no elimina una tarea cuando no es el usuario de correspondiente', async () => {
      const response = await api
        .delete(`/api/tasks/${tasks[1].tasks_id}`)
        .query({ userId: users[1].user_id })
        .expect(400)
        .expect('Content-Type', /json/);
      expect(response.body).toStrictEqual({
        message: 'La tarea no existe',
      });
    });
  });
});
