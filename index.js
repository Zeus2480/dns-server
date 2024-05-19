// // const dgram = require("node:dgram");
// // const dnsPacket = require("dns-packet");
// // const server = dgram.createSocket("udp4");

// // const db = {
// //   "faizan.dev": "1.1.1.1",
// // };
// // server.on("message", (msg, rinfo) => {
// //   const incomingRequest = dnsPacket.decode(msg);
// //   const ipFromDb = db[incomingRequest.questions[0].name];
// //   const ans = dnsPacket.encode({
// //     type: incomingRequest.type,
// //     id: incomingRequest.id,
// //     flags: dnsPacket.AUTHORITATIVE_ANSWER,
// //     questions: incomingRequest.questions,
// //     answers: [
// //       {
// //         type: incomingRequest.questions[0].type,
// //         class: incomingRequest.questions[0].class,
// //         name: incomingRequest.questions[0].name,
// //         data: ipFromDb,
// //       },
// //     ],
// //   });

// //   server.send(ans, rinfo.port, rinfo.address);
// //   console.log(incomingRequest);
// //   console.log(rinfo);
// // });
// // console.log("lss");
// // server.bind(5353, () => console.log("DNS server is running"));
// const dgram = require('node:dgram');
// const dnsPacket = require('dns-packet');
// const mongoose = require('mongoose');
// const Record = require('./models/Record');

// const server = dgram.createSocket('udp4');

// mongoose.connect('mongodb+srv://dns-server:Treehouse2480@cluster0.njfyil0.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('Could not connect to MongoDB', err));

// server.on('message', async (msg, rinfo) => {
//   try {
//     const incomingRequest = dnsPacket.decode(msg);
//     const domain = incomingRequest.questions[0].name;
//     console.log(incomingRequest)
//     const records = await Record.find({ domain });
//     const answers = records.map(record => ({
//       type: incomingRequest.questions[0].type,
//       class: incomingRequest.questions[0].class,
//       name: record.domain,
//       data: record.value,
//     }));
//     console.log(answers)
//     const response = dnsPacket.encode({
//       type: 'response',
//       id: incomingRequest.id,
//       flags: dnsPacket.AUTHORITATIVE_ANSWER,
//       questions: incomingRequest.questions,
//       answers,
//     });

//     server.send(response, rinfo.port, rinfo.address);
//   } catch (error) {
//     console.error('Error processing request:', error);
//   }
// });

// server.on('error', (err) => {
//   console.error(`Server error:\n${err.stack}`);
//   server.close();
// });

// server.bind(5351, () => console.log('DNS server is running on port 5351'));
const dgram = require('node:dgram');
const dnsPacket = require('dns-packet');
const mongoose = require('mongoose');
const Record = require('./models/Record');

const server = dgram.createSocket('udp4');
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
mongoose.connect('mongodb+srv://dns-server:Treehouse2480@cluster0.njfyil0.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

server.on('message', async (msg, rinfo) => {
  try {
    const incomingRequest = dnsPacket.decode(msg);
    const domain = incomingRequest.questions[0].name;
    console.log(incomingRequest);
    const queryType = typeToQType[incomingRequest.questions[0].type];

    // Find records for the requested domain
    const records = await Record.find({ domain, type: queryType });
    console.log('Records from DB:', records);

    // Map the database records to DNS packet answers
    const answers = records.map(record => ({
      type: typeToQType[record.type], // Correctly map the record type
      class: incomingRequest.questions[0].class,
      name: record.domain,
      data: record.value,
    }));
    console.log('DNS Answers:', answers);

    // Encode the DNS response
    const response = dnsPacket.encode({
      type: 'response',
      id: incomingRequest.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: incomingRequest.questions,
      answers,
    });

    // Send the response
    server.send(response, rinfo.port, rinfo.address);
  } catch (error) {
    console.error('Error processing request:', error);
  }
});

server.on('error', (err) => {
  console.error(`Server error:\n${err.stack}`);
  server.close();
});

server.bind(5351, () => console.log('DNS server is running on port 5351'))