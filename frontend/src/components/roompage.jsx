import React, { useCallback, useEffect,useState } from "react";
import { useSocket } from "../contextprovider/socketprovider";
import DuoIcon from '@mui/icons-material/Duo';
import ReactPlayer from "react-player";
import Draggable from 'react-draggable'
import peer from "../service/peer";
function Room(){
    const  socket= useSocket();
    const [myStream, setMyStream]= useState();
    const [calling,setcalling]= useState(false);
    const [caller,setcaller]= useState(null);
    const[remoteStream,setRemoteStream]= useState(null);
    const [remotesocketid, setremotesocketid]= useState();
    
    const handleUserJoined= useCallback(({contact, id})=>{
        console.log(`Email ${contact.email} joined room`);
        setremotesocketid(id);
    }, []);

    const handleCallUser= useCallback(async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
             video: true,
        });
        
        const offer= await peer.getOffer();
        socket.emit("user:call",{
            to: remotesocketid, offer
        })
        setMyStream(stream);
    },[remotesocketid, socket]);

    const handleIncomingCall= useCallback(async({from, offer})=>{
        setremotesocketid(from);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
             video: true,
        });
        setMyStream(stream);
        console.log(`Incoming Call`, from, offer);
        const ans= await peer.getAnswer(offer);
        socket.emit("call:accepted",{to: from,ans})
    },[socket]);

    const sendStreams = useCallback(() => {
        const senders = peer.peer.getSenders();
        console.log("mystream is", myStream);
        for (const track of myStream.getTracks()) {
            const senderExists = senders.some(sender => sender.track === track);
    
            if (!senderExists) {
                peer.peer.addTrack(track, myStream);
            }
        }
    }, [myStream]);
    

    const handleCallAccepted= useCallback(({from, ans})=>{
        peer.setLocalDescription(ans);
        console.log("Call Accepted");
        setcalling(true);
        sendStreams();
    },[sendStreams]);

    // const handleDisconnect = useCallback(() => {
    //     console.log("Disconnect initiated");
    
    //     // Stop local stream tracks
    //     if (myStream) {
    //         console.log("Stopping local stream tracks...");
    //         myStream.getTracks().forEach((track) => {
    //             console.log(`Stopping track: ${track.kind}`);
    //             track.stop();
    //         });
    //         setMyStream(null); // Reset state
    //         console.log("My stream set to null");
    //     } else {
    //         console.log("No local stream to stop");
    //     }
    
    //     // Close the peer connection
    //     if (peer.peer) {
    //         console.log("Closing peer connection...");
    //         peer.peer.close();
    //     } else {
    //         console.log("Peer connection already closed or undefined");
    //     }
    
    //     // Notify the remote user
    //     if (remotesocketid) {
    //         console.log(`Notifying remote user (socket ID: ${remotesocketid}) about disconnection...`);
    //         socket.emit("call:disconnect", { to: remotesocketid });
    //     } else {
    //         console.log("No remote user to notify");
    //     }
    
    //     // Reset state
    //     console.log("Resetting local state...");
    //     setRemoteStream(null);
    //     setcalling(false);
    //     setcaller(false);
    
    //     console.log("Disconnect process completed");
    // }, [myStream, remotesocketid, socket]);
    
    
    // const handleRemoteDisconnect = useCallback(() => {
    //     console.log("Remote user disconnected");
    
    //     // Stop local stream tracks
    //     if (myStream) {
    //         console.log("Stopping local stream tracks...");
    //         myStream.getTracks().forEach((track) => {
    //             console.log(`Stopping track: ${track.kind}`);
    //             track.stop();
    //         });
    //         setMyStream(null); // Reset state
    //         console.log("My stream set to null");
    //     } else {
    //         console.log("No local stream to stop");
    //     }
    
    //     // Close the peer connection
    //     if (peer.peer) {
    //         console.log("Closing peer connection...");
    //         peer.peer.close();
    //     } else {
    //         console.log("Peer connection already closed or undefined");
    //     }
    
    //     // Reset state
    //     console.log("Resetting local state...");
    //     setRemoteStream(null);
    //     setcalling(false);
    //     setcaller(false);
    
    //     console.log("Remote disconnect process completed");
    // }, [myStream]);
    
    
    const handleNegoNeeded= useCallback(async()=>{
        const offer= await peer.getOffer();
            socket.emit("peer:nego:needed",{ offer, to: remotesocketid})
    },[remotesocketid,socket]);

    useEffect(()=>{
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return ()=>{
            peer.peer.removeEventListener("negotiationneeded",handleNegoNeeded);
        };
    },[handleNegoNeeded]);

    const handleNegoNeededIncoming= useCallback(async({from, offer})=>{
        const ans= await peer.getAnswer(offer);
        socket.emit('peer:nego:done',{to: from,ans});
    },[socket]);
    
    const handleNegoNeededFinal= useCallback(async ({ans})=>{
        await peer.setLocalDescription(ans);
    },[]);

    useEffect(()=>{
        peer.peer.addEventListener("track", async (ev)=>{
            setcalling(true);
            setcaller(true);
            const remoteStream=  ev.streams;
            setRemoteStream(remoteStream[0]);
        });
    },[]);

    useEffect(()=>{
        socket.on('user:joined', handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted",handleCallAccepted);
        socket.on("peer:nego:needed",handleNegoNeededIncoming);
        socket.on("peer:nego:final",handleNegoNeededFinal);

        return()=>{
            socket.off("user:joined",handleUserJoined);
            socket.off("incoming:call", handleIncomingCall);
            socket.off("call:accepted",handleCallAccepted);
            socket.off("peer:nego:needed",handleNegoNeededIncoming);
            socket.off("peer:nego:final",handleNegoNeededFinal);
        }
    },[socket, handleUserJoined,handleIncomingCall,handleNegoNeededFinal,handleCallAccepted,handleNegoNeededIncoming]);
    return(
        <div className="roompage">
         {(!calling)?<>
         <h2 className="heading"> Room </h2>
         <h4 className="subheading">{remotesocketid? "Connected" : "Currently, None is present in the room "}</h4>
        {remotesocketid && <DuoIcon className="iconv" onClick={handleCallUser}/>}
        </>:<>
        {calling && <button className="roombtn" onClick={sendStreams}>Answer</button>}
        { myStream && (
            <>
             <Draggable>
               <ReactPlayer className="myvideo" playing url={myStream}/>
             </Draggable>
        </>)} 
        { remoteStream && (
            <>
            <div className="yourvideodiv">
            <ReactPlayer className="yourvideo" playing  url={remoteStream}/>
            </div>
       
        </>)}
        </>}
        </div>
    ); 
}
export default Room;