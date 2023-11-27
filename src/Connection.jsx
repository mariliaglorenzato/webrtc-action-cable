import { nanoid } from "nanoid";

class Connection {
  peerConnection;
  localStream;
  remoteStreamTargets;
  channel;
  role;

  constructor(role) {
    this.identifier = nanoid();
    this.localICECandidates = [];
    this.connected = false;
    this.role = role;
    this.remoteStreamTargets = [];
  }

  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      this.peerConnection.ontrack = ({ track, streams }) => {
        if (streams.length > 0) {
          this.assignStreamToVideoElement(streams[0]);
        } else {
          this.assginStreamToVideoElement(new MediaStream([track]));
        }

        console.log("received track: ", track);
      };

      this.peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          console.log(
            `<<< Received local ICE candidate from STUN/TURN server (${candidate.address})`
          );
          if (this.connected) {
            console.log(
              `>>> Sending local ICE candidate (${candidate.address})`
            );
            this.channel.send({
              type: "CANDIDATE",
              name: this.identifier,
              sdp: JSON.stringify(candidate),
            });
          } else {
            console.log(`>>> Buffer local candidate (${candidate.address})`);
            this.localICECandidates.push(candidate);
          }
        }
      };
    } catch (error) {
      console.error("Failed to create peer connection:", error);
    }
  }

  assignStreamToVideoElement(stream) {
    const unassignedElement = this.remoteStreamTargets.find(
      (ve) => !ve.srcObject
    );
    if (unassignedElement) {
      unassignedElement.srcObject = stream;
    }
  }

  loadStream() {
    if (this.role === "spot" && this.localStream) {
      for (const track of this.localStream.getTracks()) {
        this.peerConnection.addTrack(track, this.localStream);
        console.log(">>>> tracks being added");
      }
    } else {
      console.log("é da role: ", this.role);
    }
  }

  createOffer() {
    if (this.role === "surveillance") return;

    this.peerConnection
      .createOffer()
      .then((offer) => {
        this.peerConnection
          .setLocalDescription(offer)
          .then(() => {
            this.channel.send({
              type: "OFFER",
              name: this.identifier,
              sdp: JSON.stringify(offer),
            });
          })
          .catch((error) =>
            console.error("Error setting local description: ", error)
          );
      })
      .catch((error) => console.error("Error creating offer: ", error));
  }

  createAnswer(offer) {
    console.log("this.role: ", this.role);
    if (this.role == "spot") return;

    this.connected = true;
    let rtcOffer = new RTCSessionDescription(offer);
    this.peerConnection.setRemoteDescription(rtcOffer).then(() => {
      this.peerConnection
        .createAnswer()
        .then((answer) => {
          this.peerConnection.setLocalDescription(answer);
          this.channel.send({
            type: "ANSWER",
            name: this.identifier,
            sdp: JSON.stringify(answer),
          });
        })
        .catch((err) => console.log(err));
    });
  }

  receiveAnswer(answer) {
    let rtcAnswer = new RTCSessionDescription(answer);
    this.peerConnection.setRemoteDescription(rtcAnswer).then(() => {
      this.connected = true;
      this.localICECandidates.forEach((candidate) => {
        console.log(`>>> Sending local ICE candidate (${candidate.address})`);
        this.channel.send({
          type: "CANDIDATE",
          name: this.identifier,
          sdp: JSON.stringify(candidate),
        });
      });
      this.localICECandidates = [];
    });
  }

  addCandidate(candidate) {
    let rtcCandidate = new RTCIceCandidate(candidate);
    console.log(
      `<<< Adding ICE candidate (${rtcCandidate.address} - ${rtcCandidate.relatedAddress})`
    );
    this.peerConnection.addIceCandidate(rtcCandidate);
  }
}

export default Connection;
