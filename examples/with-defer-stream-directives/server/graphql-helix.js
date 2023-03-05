const polka = require('polka');
const { json } = require('@polka/parse');
const cors = require('cors')();
const { getGraphQLParameters, processRequest } = require('graphql-helix');
const { schema } = require('./schema');

polka()
  .use(cors, json())
  .use('/graphql', async (req, res) => {
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query,
    };

    let { operationName, query, variables } = getGraphQLParameters(request);

    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
    });

    if (result.type === 'RESPONSE') {
      result.headers.forEach(({ name, value }) => res.setHeader(name, value));
      res.writeHead(result.status, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(result.payload));
    } else if (result.type === 'MULTIPART_RESPONSE') {
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'multipart/mixed; boundary="-"',
        'Transfer-Encoding': 'chunked',
      });

      req.on('close', () => {
        result.unsubscribe();
      });

      res.write('---');

      await result.subscribe(result => {
        const chunk = Buffer.from(JSON.stringify(result), 'utf8');
        const data = [
          '',
          'Content-Type: application/json; charset=utf-8',
          '',
          chunk,
        ];

        if (result.hasNext) {
          data.push('---');
        }

        res.write(data.join('\r\n'));
      });

      res.write('\r\n-----\r\n');
      res.end();
    }
  })
  .listen(3004);
