'use strict';
var AWS = require("aws-sdk");
var sns = new AWS.SNS();
var sqs = new AWS.SQS({
    region: 'ap-southeast-1'
});


exports.handler = (event, context, callback) => {
    const queueUrl = 'https://sqs.ap-southeast-1.amazonaws.com/040109847816/LeadQueue';
    var responseCode = 200;
    var responseBody = {};
    event.Records.forEach((record) => {
        const { body } = record;
        console.log('Stream record: ', JSON.stringify(record, null, 2));
        console.log(body);

        if (record.eventName == 'INSERT') {
            var firstname = JSON.stringify(record.dynamodb.NewImage.FirstName.S);
            var lastname = JSON.stringify(record.dynamodb.NewImage.LastName.S);
            var phonenumber = JSON.stringify(record.dynamodb.NewImage.PhoneNumber.S);

            var message = {
              firstname:   firstname,
              lastname:    lastname,
              phonenumber: phonenumber
            }

            var params = {
              MessageBody: JSON.stringify(message),
              QueueUrl: queueUrl
            }

            sqs.sendMessage(params, function(err, data) {
              if (err) {
                  console.log('error:', "failed to send message" + err);
                  var responseCode = 500;
              } else {
                  console.log('data:', data.MessageId);
                  responseBody.message = 'Sent to ' + queueUrl;
                  responseBody.messageId = data.MessageId;
              }
              var response = {
                  statusCode: responseCode,
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(responseBody)
              };

              callback(null, response);
          });
        }
    });
    callback(null, `Successfully processed ${event.Records.length} records.`);
};
