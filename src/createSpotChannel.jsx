import { createConsumer } from "@rails/actioncable";

const createSpotChannel = function (spot_id, token, connection) {
  let url = "ws://localhost:3000/cable";
  const consumer = createConsumer(`${url}?token=${token}`);

  return consumer.subscriptions.create(
    { channel: "SpotChannel", spot_id: spot_id },
    {
      connected() {
        connection.channel = this;
        console.log(`${token} connected`);
      },

      disconnected() {
        console.log(`${token} disconnected`);
      },

      received(data) {
        console.log(`${token} received data: `, data);
        if (connection.identifier !== data.name) {
          switch (data.type) {
            case "OFFER":
              if (token === "surveillance") {
                let offer = JSON.parse(data.sdp);
                connection.createAnswer(offer);
              }
              break;
            case "ANSWER":
              console.log("TOKEN: ", token);
              if (token === "spot" || token === "spot2") {
                let answer = JSON.parse(data.sdp);
                connection.receiveAnswer(answer);
              }
              break;
            case "CANDIDATE":
              if (token !== "surveillance") {
                let candidate = JSON.parse(data.sdp);
                connection.addCandidate(candidate);
              }
              break;
            default:
              console.log(`Unknown data type: ${data.type}`);
          }
        }
      },
    }
  );
};

export default createSpotChannel;
