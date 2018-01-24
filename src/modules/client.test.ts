import Client from './client';

test('it can be instantiated', () => {
  const client = new Client();
  expect(client).toBeTruthy();
});

test('it returns a client instance', () => {
  const client = new Client({
    url: 'test',
  });
  expect(client.url).toMatch('test');
});
