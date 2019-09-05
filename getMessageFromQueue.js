'use strict';
var AWS = require("aws-sdk");
var http = require("http");
var sns = new AWS.SNS();
var sqs = new AWS.SQS({
    region: 'ap-southeast-1'
});

exports.handler = (event, context, callback) => {
    const queueUrl = 'https://sqs.ap-southeast-1.amazonaws.com/609880500672/LeadQueue';
    const crmApi   = 'http://5d6114f1c2ca490014b273cf.mockapi.io';
    const apiPath  = '/api/v1/user';
    var responseBody = {};

    var { body } = event;
    console.log(body);

    var options = {
        host: crmApi,
        path: apiPath,
        method: 'PUT',
        data: body
    };

    var req = http.request(options, (res) => {
      resolve('Success');
    });

    //on error
    req.on('error', (e) => {
      //reject(e.message);
      console.error(e.message);

      var params = {
        MessageBody: JSON.stringify(event),
        QueueUrl: queueUrl
      }

      //send back the item to the queue
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

          //callback
          callback(null, response);

          var firstname = JSON.stringify(event.firstname);
          var lastname = JSON.stringify(event.lastname);
          var phonenumber = JSON.stringify(event.phonenumber);
          var params = {
              Subject: 'Failed Attempt',
              Message: firstname + ' ' + lastname + ' with the phone number' + phonenumber + ' failed saving to CRM',
              TopicArn: 'arn:aws:sns:ap-southeast-1:609880500672:FailedQueue'
          };

          //publish
          sns.publish(params, function(err, data) {
              if (err) {
                  console.error("Unable to send message. Error JSON:", JSON.stringify(err, null, 2));
              } else {
                  console.log("Results from sending message: ", JSON.stringify(data, null, 2));
              }
          });
      });
    });

    // send the request
    req.write('');
    req.end();
};
