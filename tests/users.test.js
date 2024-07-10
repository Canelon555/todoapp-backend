const supertest = require('supertest');
const app = require('../app');
const { describe, test, expect, beforeAll } = require('@jest/globals');
const db = require('../db');
const api = supertest(app);

describe('test users endpoint /api/users', () => {
  beforeAll(() => {
    // Borra todos los usuarios
    db.prepare('DELETE FROM users').run();
  });
  // Primer test
  test('post, crea un nuevo usuario cuando todo esta correcto', async () => {
    const usersBefore = db.prepare('SELECT * FROM users').all();
    const newUser = {
      username: 'canelon55',
      password: 'Secreto.123',
    };
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /json/);
    const usersAfter = db.prepare('SELECT * FROM users').all();
    expect(usersAfter.length).toBe(usersBefore.length + 1);
    expect(response.body).toStrictEqual({
      message: 'El usuario se ha creado con exito',
    });
  });
  // Segundo test
  test('post, no crea un usuario cuando el nombre es incorrecto', async () => {
    const usersBefore = db.prepare('SELECT * FROM users').all();
    const newUser = {
      username: 'Kamelon',
      password: 'Secreto.123',
    };
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /json/);
    const usersAfter = db.prepare('SELECT * FROM users').all();
    expect(usersAfter.length).toBe(usersBefore.length);
    expect(response.body).toStrictEqual({
      error: 'El usuario es invalido',
    });
  });
  // Tercer test
  test('post, no crea un usuario cuando la contraseña es incorrecta', async () => {
    const usersBefore = db.prepare('SELECT * FROM users').all();
    const newUser = {
      username: 'canelon55',
      password: 'Secre556',
    };
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /json/);
    const usersAfter = db.prepare('SELECT * FROM users').all();
    expect(usersAfter.length).toBe(usersBefore.length);
    expect(response.body).toStrictEqual({
      error: 'La contraseña es invalida',
    });
  });
  // Cuarto test
  test('post, no crea un usuario cuando el nombre de usuario ya existe', async () => {
    const usersBefore = db.prepare('SELECT * FROM users').all();
    const newUser = {
      username: 'canelon55',
      password: 'Secreto.123',
    };
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(409)
      .expect('Content-Type', /json/);
    const usersAfter = db.prepare('SELECT * FROM users').all();
    expect(usersAfter.length).toBe(usersBefore.length);
    expect(response.body).toStrictEqual({
      error: 'El usuario ya esta registrado',
    });
  });
});
