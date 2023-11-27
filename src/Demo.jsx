import React, { useEffect, useRef } from "react";
import Connection from "./Connection";
import createSpotChannel from "./createSpotChannel";

const Demo = () => {
  const localVideoRef = useRef(null);
  const localVideoRef2 = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteVideoRef2 = useRef(null);
  const spotConn = useRef(new Connection("spot"));
  const spotConn2 = useRef(new Connection("spot"));
  const surveillanceConn = useRef(new Connection("surveillance"));
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;

      // Initialize the peer connections
      spotConn.current.createPeerConnection();
      spotConn2.current.createPeerConnection();
      surveillanceConn.current.createPeerConnection();

      // Setup remote video elements for the surveillance connection
      surveillanceConn.current.remoteStreamTargets = [
        remoteVideoRef.current,
        remoteVideoRef2.current,
      ];

      console.log(surveillanceConn.current.remoteStreamTargets);
      // Create channels for both spot connections and surveillance
      createSpotChannel(1, "spot", spotConn.current);
      createSpotChannel(2, "spot2", spotConn2.current);
      createSpotChannel(1, "surveillance", surveillanceConn.current);

      // Get user media for the first spot
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          localVideoRef.current.srcObject = stream;
          spotConn.current.localStream = stream;
          spotConn.current.loadStream();
          spotConn.current.createOffer();
        })
        .catch((error) =>
          console.error("Error accessing media devices:", error)
        );

      // Get user media for the second spot
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          localVideoRef2.current.srcObject = stream;
          spotConn2.current.localStream = stream;
          spotConn2.current.loadStream();
          spotConn2.current.createOffer();
        })
        .catch((error) =>
          console.error("Error accessing media devices:", error)
        );
    }

    return () => {
      spotConn.current.close();
      spotConn2.current.close();
      surveillanceConn.current.close();
    };
  }, []);

  return (
    <div>
      <h2>Spot 1 (Webcam)</h2>
      <div>
        <video ref={localVideoRef} autoPlay playsInline width={"50%"}></video>
        <video ref={localVideoRef2} autoPlay playsInline width={"50%"}></video>
      </div>

      <h2>Spot 2 (Webcam)</h2>

      <h2>Surveillance 2 (Received Broadcast)</h2>
      <video ref={remoteVideoRef2} autoPlay playsInline></video>

      <h2>Surveillance 1 (Received Broadcast)</h2>
      <video ref={remoteVideoRef} autoPlay playsInline></video>
    </div>
  );
};

export default Demo;
