import Client from './client';

test('it throws without options provided', () => {
  expect(() => {
    new Client();
  }).toThrowError('Please provide configuration object');
});

test('it throws without a url provided', () => {
  expect(() => {
    new Client({});
  }).toThrowError('Please provide a URL for your GraphQL API');
});

test('it returns a client instance', () => {
  const client = new Client({
    url: 'test',
  });
  expect(client.url).toMatch('test');
});
