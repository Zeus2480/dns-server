require('dotenv').config();
const dgram = require('node:dgram');
const dnsPacket = require('dns-packet');
const mongoose = require('mongoose');
const Record = require('./models/Record');
const server = dgram.createSocket('udp4');

const DB_URL = process.env.DATABASE_URL;
const typeToQType = {
  'A': 'A',
  'NS': 'NS',
  'CNAME': 'CNAME',
  'SOA': 'SOA',
  'PTR': 'PTR',
  'MX': 'MX',
  'TXT': 'TXT',
  'AAAA': 'AAAA',
};
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

server.on('message', async (msg, rinfo) => {
  try {
    const incomingRequest = dnsPacket.decode(msg);
    const domain = incomingRequest.questions[0].name;
    console.log(incomingRequest);
    const queryType = typeToQType[incomingRequest.questions[0].type];

    const records = await Record.find({ domain, type: queryType });
    console.log('Records from DB:', records);

    const answers = records.map(record => ({
      type: typeToQType[record.type],
      class: incomingRequest.questions[0].class,
      name: record.domain,
      data: record.value,
    }));
    const response = dnsPacket.encode({
      type: 'response',
      id: incomingRequest.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: incomingRequest.questions,
      answers,
    });
    server.send(response, rinfo.port, rinfo.address);
  } catch (error) {
    console.error('Error processing request:', error);
  }
});

server.on('error', (err) => {
  console.error(`Server error:\n${err.stack}`);
  server.close();
});

server.bind(53, () => console.log('DNS server is running on port 53'))